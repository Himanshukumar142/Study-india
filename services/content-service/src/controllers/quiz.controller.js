const Question = require('../models/Question.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const Mistake = require('../models/Mistake.model');
const User = require('../models/User.model');
const ViolationLog = require('../models/ViolationLog.model');
const { calculateXP, getLevelFromXP } = require('../utils/xpEngine');

// Keep for backwards compatibility / admin use
const getQuestions = async (req, res) => {
  const { subject, chapter, exam, difficulty, limit = 10 } = req.query;
  const filter = {};
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (chapter) filter.chapter = new RegExp(chapter, 'i');
  if (exam) filter.exam = { $in: [exam, 'BOTH'] };
  if (difficulty) filter.difficulty = difficulty;

  const questions = await Question.find(filter)
    .select('-correct -explanation')
    .limit(parseInt(limit));

  res.json({ success: true, data: questions });
};

// POST /api/quizzes/start
const startQuiz = async (req, res) => {
  const { subject, chapter, mode = 'practice', limit = 10, questionIds } = req.body;
  
  let questions;
  if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
    const qList = await Question.find({ _id: { $in: questionIds } });
    questions = qList.map(q => q.toObject());
  } else {
    if (!subject || !chapter) {
      return res.status(422).json({ success: false, message: 'Subject and chapter are required' });
    }

    const filter = {
      subject: new RegExp(subject, 'i'),
      chapter: new RegExp(chapter, 'i')
    };

    // Fetch random questions
    questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(limit) } }
    ]);
  }

  if (questions.length === 0) {
    return res.status(404).json({ success: false, message: 'No questions found for the given criteria' });
  }

  const actualQuestionIds = questions.map(q => q._id);
  
  // Create an in-progress attempt
  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    subject: subject || (questions[0] && questions[0].subject) || 'AI PDF Quiz',
    chapter: chapter || (questions[0] && questions[0].chapter) || 'Multiple',
    questions: actualQuestionIds,
    answers: actualQuestionIds.map(qid => ({ questionId: qid })),
    mode,
    status: 'in-progress',
    startTime: new Date()
  });

  // Strip correct answers and explanations before sending to client
  const safeQuestions = questions.map(q => {
    const cleanQ = { ...q };
    delete cleanQ.correct;
    delete cleanQ.explanation;
    return cleanQ;
  });

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id,
      questions: safeQuestions,
      startTime: attempt.startTime,
      answers: attempt.answers
    }
  });
};

// POST /api/quizzes/answer
const saveAnswer = async (req, res) => {
  const { attemptId, questionId, selectedOption, timeTakenSeconds = 0 } = req.body;

  if (!attemptId || !questionId) {
    return res.status(422).json({ success: false, message: 'attemptId and questionId are required' });
  }

  const attempt = await QuizAttempt.findOne({ _id: attemptId, userId: req.user._id });
  
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Attempt not found' });
  }

  if (attempt.status === 'completed') {
    return res.status(403).json({ success: false, message: 'Cannot modify a completed quiz' });
  }

  // Find the answer object and update it
  const answerIndex = attempt.answers.findIndex(a => a.questionId.toString() === questionId);
  if (answerIndex > -1) {
    attempt.answers[answerIndex].selectedOption = selectedOption;
    attempt.answers[answerIndex].timeTakenSeconds += timeTakenSeconds; // Cumulative time
  } else {
    // Failsafe, though initialized in startQuiz
    attempt.answers.push({
      questionId,
      selectedOption,
      timeTakenSeconds
    });
  }

  await attempt.save();

  res.json({ success: true, message: 'Answer saved' });
};

// POST /api/quizzes/submit
const submitQuiz = async (req, res) => {
  const { attemptId } = req.body;

  const attempt = await QuizAttempt.findOne({ _id: attemptId, userId: req.user._id });
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status === 'completed') {
    return res.json({
      success: true,
      message: 'Quiz already submitted',
      data: {
        attemptId: attempt._id,
        score: attempt.obtainedMarks,
        accuracy: attempt.accuracy,
        xpGained: attempt.xpAwarded
      }
    });
  }

  attempt.endTime = new Date();
  attempt.timeTakenSeconds = Math.round((attempt.endTime - attempt.startTime) / 1000);

  const questions = await Question.find({ _id: { $in: attempt.questions } });
  const qMap = {};
  questions.forEach(q => { qMap[q._id.toString()] = q; });

  let totalMarks = 0;
  let obtainedMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  
  const mistakesToSave = [];

  for (const ans of attempt.answers) {
    const q = qMap[ans.questionId.toString()];
    if (!q) continue;

    totalMarks += q.marks;

    if (!ans.selectedOption || ans.selectedOption === '') {
      skippedCount++;
      ans.isCorrect = false;
      continue;
    }

    const isCorrect = String(ans.selectedOption).trim().toLowerCase() === String(q.correct).trim().toLowerCase();
    ans.isCorrect = isCorrect;

    if (isCorrect) {
      obtainedMarks += q.marks;
      correctCount++;
    } else {
      obtainedMarks += q.negativeMarking; // Usually negative value, e.g. -1
      wrongCount++;

      mistakesToSave.push({
        userId: req.user._id,
        questionId: q._id,
        subject: q.subject,
        chapter: q.chapter,
        selectedOption: ans.selectedOption,
      });
    }
  }

  attempt.totalMarks = totalMarks;
  attempt.obtainedMarks = Math.max(0, obtainedMarks); // Prevent negative total score if needed, or allow it depending on rules. Standard is allow negative, but we'll floor at 0 for gamification unless platform specifies otherwise. Let's stick to calculated for now. Wait, original logic Math.max(0, obtainedMarks). I'll keep it.
  attempt.correct = correctCount;
  attempt.wrong = wrongCount;
  attempt.skipped = skippedCount;
  attempt.accuracy = attempt.questions.length > 0 ? Math.round((correctCount / attempt.questions.length) * 100) : 0;
  attempt.status = 'completed';

  // Save mistakes
  for (const m of mistakesToSave) {
    await Mistake.findOneAndUpdate(
      { userId: m.userId, questionId: m.questionId },
      { $set: { subject: m.subject, chapter: m.chapter, selectedOption: m.selectedOption, revisited: false }, $inc: { attemptCount: 1 } },
      { upsert: true }
    );
  }

  // Award XP
  const xpGained = calculateXP('QUIZ_CORRECT', { count: correctCount }) + calculateXP('QUIZ_ATTEMPT');
  attempt.xpAwarded = xpGained;
  
  const user = await User.findById(req.user._id);
  user.xp += xpGained;
  user.level = getLevelFromXP(user.xp);
  await user.save();

  await attempt.save();

  res.json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      attemptId: attempt._id,
      score: attempt.obtainedMarks,
      accuracy: attempt.accuracy,
      xpGained
    }
  });
};

// GET /api/quizzes/result/:id
const getQuizResult = async (req, res) => {
  const attempt = await QuizAttempt.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('questions'); // Populate to get actual questions including correct answers

  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status !== 'completed') return res.status(400).json({ success: false, message: 'Quiz not yet completed' });

  // Topic-wise analysis aggregation
  const topicStats = {};
  
  attempt.answers.forEach(ans => {
    const q = attempt.questions.find(q => q._id.toString() === ans.questionId.toString());
    if (!q) return;

    const topicName = q.topic || q.chapter || 'General';
    if (!topicStats[topicName]) {
      topicStats[topicName] = { topic: topicName, correct: 0, wrong: 0, total: 0 };
    }

    topicStats[topicName].total++;
    if (ans.selectedOption) {
      if (ans.isCorrect) {
        topicStats[topicName].correct++;
      } else {
        topicStats[topicName].wrong++;
      }
    }
  });

  const topicAnalysis = Object.values(topicStats);

  res.json({ 
    success: true, 
    data: {
      ...attempt.toObject(),
      topicAnalysis
    } 
  });
};

// POST /api/quizzes/violation
const reportViolation = async (req, res) => {
  const { attemptId, violationType, details } = req.body;
  const attempt = await QuizAttempt.findOne({ _id: attemptId, userId: req.user._id });
  
  if (!attempt || attempt.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Invalid attempt' });
  }

  attempt.violations += 1;
  await attempt.save();

  // Log audit trail
  await ViolationLog.create({
    userId: req.user._id,
    attemptId,
    violationType: violationType || 'other',
    details: details || 'Manual violation log',
    timestamp: new Date()
  });

  res.json({ success: true, violations: attempt.violations });
};

// GET /api/quizzes/attempts
const getAttempts = async (req, res) => {
  const attempts = await QuizAttempt.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ success: true, data: attempts });
};

// POST /api/quizzes/questions — admin create question
const createQuestion = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.difficulty) data.difficulty = data.difficulty.toLowerCase();
    const q = await Question.create({ ...data, createdBy: req.user._id });
    res.status(201).json({ success: true, data: q });
  } catch (err) {
    res.status(422).json({ success: false, message: err.message });
  }
};

// POST /api/quizzes/questions/bulk — admin create multiple questions
const createQuestionsBulk = async (req, res) => {
  try {
    const questions = req.body.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty questions array' });
    }

    // Sanitize and Inject createdBy
    const sanitizedQuestions = questions.map(q => ({
      ...q,
      difficulty: q.difficulty ? q.difficulty.toLowerCase() : 'medium',
      exam: q.exam ? q.exam.toUpperCase() : 'BOTH',
      createdBy: req.user._id
    }));

    const inserted = await Question.insertMany(sanitizedQuestions);
    res.status(201).json({ success: true, data: inserted, message: `${inserted.length} questions added successfully` });
  } catch (err) {
    res.status(422).json({ success: false, message: 'Ingestion failed: ' + err.message });
  }
};

// POST /api/quizzes/auto-submit
const autoSubmitQuiz = async (req, res) => {
  const { attemptId, answers, violationType, details } = req.body;

  if (!attemptId) {
    return res.status(422).json({ success: false, message: 'attemptId is required' });
  }

  const attempt = await QuizAttempt.findOne({ _id: attemptId, userId: req.user._id });
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  
  if (attempt.status === 'completed') {
    return res.json({
      success: true,
      message: 'Quiz already submitted',
      data: {
        attemptId: attempt._id,
        score: attempt.obtainedMarks,
        accuracy: attempt.accuracy,
        xpGained: attempt.xpAwarded
      }
    });
  }

  // 1. Log violation if provided
  if (violationType) {
    attempt.violations += 1;
    await ViolationLog.create({
      userId: req.user._id,
      attemptId,
      violationType,
      details: details || 'Auto-submit trigger',
      timestamp: new Date()
    });
  }

  // 2. If client passed final answers to be synchronized, save them first
  if (Array.isArray(answers) && answers.length > 0) {
    for (const ans of answers) {
      const idx = attempt.answers.findIndex(a => a.questionId.toString() === ans.questionId);
      if (idx > -1) {
        attempt.answers[idx].selectedOption = ans.selectedOption;
        if (ans.timeTakenSeconds) attempt.answers[idx].timeTakenSeconds += ans.timeTakenSeconds;
      }
    }
  }

  attempt.endTime = new Date();
  attempt.timeTakenSeconds = Math.round((attempt.endTime - attempt.startTime) / 1000);

  const questions = await Question.find({ _id: { $in: attempt.questions } });
  const qMap = {};
  questions.forEach(q => { qMap[q._id.toString()] = q; });

  let totalMarks = 0;
  let obtainedMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  const mistakesToSave = [];

  for (const ans of attempt.answers) {
    const q = qMap[ans.questionId.toString()];
    if (!q) continue;

    totalMarks += q.marks;

    if (!ans.selectedOption || ans.selectedOption === '') {
      skippedCount++;
      ans.isCorrect = false;
      continue;
    }

    const isCorrect = String(ans.selectedOption).trim().toLowerCase() === String(q.correct).trim().toLowerCase();
    ans.isCorrect = isCorrect;

    if (isCorrect) {
      obtainedMarks += q.marks;
      correctCount++;
    } else {
      obtainedMarks += q.negativeMarking;
      wrongCount++;

      mistakesToSave.push({
        userId: req.user._id,
        questionId: q._id,
        subject: q.subject,
        chapter: q.chapter,
        selectedOption: ans.selectedOption,
      });
    }
  }

  attempt.totalMarks = totalMarks;
  attempt.obtainedMarks = Math.max(0, obtainedMarks);
  attempt.correct = correctCount;
  attempt.wrong = wrongCount;
  attempt.skipped = skippedCount;
  attempt.accuracy = attempt.questions.length > 0 ? Math.round((correctCount / attempt.questions.length) * 100) : 0;
  attempt.status = 'completed';

  // Save mistakes
  for (const m of mistakesToSave) {
    await Mistake.findOneAndUpdate(
      { userId: m.userId, questionId: m.questionId },
      { $set: { subject: m.subject, chapter: m.chapter, selectedOption: m.selectedOption, revisited: false }, $inc: { attemptCount: 1 } },
      { upsert: true }
    );
  }

  // Award XP
  const xpGained = calculateXP('QUIZ_CORRECT', { count: correctCount }) + calculateXP('QUIZ_ATTEMPT');
  attempt.xpAwarded = xpGained;

  const user = await User.findById(req.user._id);
  if (user) {
    user.xp += xpGained;
    user.level = getLevelFromXP(user.xp);
    await user.save();
  }

  await attempt.save();

  res.json({
    success: true,
    message: 'Quiz auto-submitted successfully due to integrity action',
    data: {
      attemptId: attempt._id,
      score: attempt.obtainedMarks,
      accuracy: attempt.accuracy,
      xpGained
    }
  });
};

// PATCH /api/quizzes/questions/:id — admin update question
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.difficulty) data.difficulty = data.difficulty.toLowerCase();
    
    const q = await Question.findByIdAndUpdate(id, data, { new: true });
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, data: q, message: 'Question updated successfully' });
  } catch (err) {
    res.status(422).json({ success: false, message: err.message });
  }
};

// DELETE /api/quizzes/questions/:id — admin delete question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await Question.findByIdAndDelete(id);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, data: q, message: 'Question deleted successfully' });
  } catch (err) {
    res.status(422).json({ success: false, message: err.message });
  }
};

module.exports = {
  getQuestions,
  startQuiz,
  saveAnswer,
  submitQuiz,
  autoSubmitQuiz,
  getQuizResult,
  reportViolation,
  getAttempts,
  createQuestion,
  createQuestionsBulk,
  updateQuestion,
  deleteQuestion
};
