const DailyChallenge = require('../models/DailyChallenge.model');
const Question = require('../models/Question.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const User = require('../models/User.model');
const { calculateXP, getLevelFromXP } = require('../utils/xpEngine');

const getToday = () => new Date().toISOString().split('T')[0];

// GET /api/daily-challenge
const getTodayChallenge = async (req, res) => {
  const today = getToday();
  let challenge = await DailyChallenge.findOne({ date: today }).populate('questions');

  if (!challenge) {
    // Auto-generate today's challenge
    const questions = await Question.aggregate([{ $sample: { size: 5 } }]);
    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: 'No questions in bank to create challenge' });
    }
    challenge = await DailyChallenge.create({
      date: today,
      questions: questions.map(q => q._id),
      subject: 'Mixed',
      bonusXP: 50,
      difficulty: 'mixed',
    });
    challenge = await DailyChallenge.findById(challenge._id).populate('questions');
  }

  // Check if user already attempted
  const attempt = await QuizAttempt.findOne({
    userId: req.user._id,
    subject: 'Daily Challenge',
    chapter: today,
    status: 'completed',
  });

  // Strip correct answers for unattempted
  const safeQuestions = attempt ? challenge.questions : challenge.questions.map(q => {
    const obj = q.toObject();
    delete obj.correct;
    delete obj.explanation;
    return obj;
  });

  res.json({
    success: true,
    data: {
      _id: challenge._id,
      date: challenge.date,
      questions: safeQuestions,
      bonusXP: challenge.bonusXP,
      difficulty: challenge.difficulty,
      participantCount: challenge.participants.length,
      userAttempted: !!attempt,
      userResult: attempt ? {
        obtainedMarks: attempt.obtainedMarks,
        totalMarks: attempt.totalMarks,
        correct: attempt.correct,
        xpAwarded: attempt.xpAwarded,
      } : null,
    },
  });
};

// POST /api/daily-challenge/submit
const submitDailyChallenge = async (req, res) => {
  const today = getToday();
  const { answers } = req.body; // [{ questionId, selectedOption }]

  const challenge = await DailyChallenge.findOne({ date: today }).populate('questions');
  if (!challenge) return res.status(404).json({ success: false, message: 'No challenge today' });

  // Check duplicate
  const existing = await QuizAttempt.findOne({
    userId: req.user._id,
    subject: 'Daily Challenge',
    chapter: today,
    status: 'completed',
  });
  if (existing) return res.status(403).json({ success: false, message: 'Already completed today\'s challenge' });

  // Grade
  let correct = 0, wrong = 0, skipped = 0, obtainedMarks = 0;
  const gradedAnswers = challenge.questions.map(q => {
    const ans = answers?.find(a => a.questionId === q._id.toString());
    const isCorrect = ans && ans.selectedOption?.toUpperCase() === q.correct?.toUpperCase();
    if (!ans || !ans.selectedOption) { skipped++; }
    else if (isCorrect) { correct++; obtainedMarks += (q.marks || 4); }
    else { wrong++; obtainedMarks += (q.negativeMarking || -1); }
    return {
      questionId: q._id,
      selectedOption: ans?.selectedOption || null,
      isCorrect: !!isCorrect,
    };
  });

  const totalMarks = challenge.questions.reduce((s, q) => s + (q.marks || 4), 0);
  const accuracy = challenge.questions.length > 0 ? Math.round((correct / challenge.questions.length) * 100) : 0;
  const xp = challenge.bonusXP + correct * 10;

  // Save attempt
  await QuizAttempt.create({
    userId: req.user._id,
    subject: 'Daily Challenge',
    chapter: today,
    questions: challenge.questions.map(q => q._id),
    answers: gradedAnswers,
    mode: 'challenge',
    status: 'completed',
    obtainedMarks: Math.max(obtainedMarks, 0),
    totalMarks,
    correct,
    wrong,
    skipped,
    accuracy,
    xpAwarded: xp,
    submittedAt: new Date(),
  });

  // Award XP
  await User.findByIdAndUpdate(req.user._id, { $inc: { xp } });

  // Add to participants
  if (!challenge.participants.includes(req.user._id)) {
    challenge.participants.push(req.user._id);
    await challenge.save();
  }

  res.json({
    success: true,
    data: { correct, wrong, skipped, obtainedMarks: Math.max(obtainedMarks, 0), totalMarks, accuracy, xpAwarded: xp },
    message: `Challenge complete! +${xp} XP`,
  });
};

// GET /api/daily-challenge/history
const getChallengeHistory = async (req, res) => {
  const attempts = await QuizAttempt.find({
    userId: req.user._id,
    subject: 'Daily Challenge',
    status: 'completed',
  }).sort({ createdAt: -1 }).limit(30).select('chapter obtainedMarks totalMarks correct accuracy xpAwarded createdAt');

  res.json({ success: true, data: attempts });
};

module.exports = { getTodayChallenge, submitDailyChallenge, getChallengeHistory };
