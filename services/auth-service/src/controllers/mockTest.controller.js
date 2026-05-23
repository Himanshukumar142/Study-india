const MockTest = require('../models/MockTest.model');
const Question = require('../models/Question.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const User = require('../models/User.model');

// POST /api/mock-tests (Admin)
const createMockTest = async (req, res) => {
  try {
    const { title, exam, startTime, duration, questions: manualQuestions } = req.body;

    // Strict field validation
    if (!title) return res.status(400).json({ success: false, message: 'Test Title is required' });
    if (!exam) return res.status(400).json({ success: false, message: 'Exam Type (JEE/NEET) is required' });
    if (!startTime) return res.status(400).json({ success: false, message: 'Start Time is required' });
    if (!duration) return res.status(400).json({ success: false, message: 'Duration is required' });

    let questionIds = [];

    // Question Selection Logic
    if (Array.isArray(manualQuestions) && manualQuestions.length > 0) {
      questionIds = manualQuestions;
    } else {
      // Fallback: Random questions if none selected
      const matchFilter = exam === 'BOTH' ? {} : { exam: { $in: [exam, 'BOTH'] } };
      const randomQuestions = await Question.aggregate([
        { $match: matchFilter },
        { $sample: { size: 90 } }
      ]);
      
      if (randomQuestions.length === 0) {
        return res.status(400).json({ success: false, message: 'Intelligence Error: Not enough questions found in the database to auto-generate this test.' });
      }
      questionIds = randomQuestions.map(q => q._id);
    }

    // Date Calculation
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid Start Time format provided.' });
    }

    const end = new Date(start.getTime() + parseInt(duration) * 60000);

    // Save to Database
    const mockTest = await MockTest.create({
      title,
      description: req.body.description || `Full Syllabus ${exam} Mock Test`,
      exam: exam.toUpperCase(),
      startTime: start,
      endTime: end,
      duration: parseInt(duration),
      questions: questionIds,
      createdBy: req.user._id,
      status: 'upcoming'
    });

    res.status(201).json({ success: true, data: mockTest, message: 'Mock Test deployed successfully!' });
  } catch (err) {
    console.error('MockTest Creation Error:', err);
    res.status(500).json({ success: false, message: 'Deployment Engine Error: ' + err.message });
  }
};

// GET /api/mock-tests
const getMockTests = async (req, res) => {
  const tests = await MockTest.find().sort({ startTime: 1 });
  
  // Dynamically update status based on current time
  const now = new Date();
  const updatedTests = await Promise.all(tests.map(async (test) => {
    let newStatus = test.status;
    if (now >= test.endTime && test.status !== 'completed') newStatus = 'completed';
    else if (now >= test.startTime && now < test.endTime && test.status !== 'active') newStatus = 'active';

    if (newStatus !== test.status) {
      test.status = newStatus;
      await test.save();
    }
    
    // Check if the user has already attempted it
    const attempt = req.user ? await QuizAttempt.findOne({ userId: req.user._id, mockTestId: test._id }) : null;
    
    return {
      ...test.toObject(),
      userAttempted: !!attempt,
      attemptStatus: attempt ? attempt.status : null
    };
  }));

  res.json({ success: true, data: updatedTests });
};

// POST /api/mock-tests/:id/start
const startMockTest = async (req, res) => {
  const mockTestId = req.params.id;
  const mockTest = await MockTest.findById(mockTestId).populate('questions');

  if (!mockTest) return res.status(404).json({ success: false, message: 'Mock Test not found' });
  
  if (!mockTest.questions || mockTest.questions.length === 0) {
    return res.status(400).json({ success: false, message: 'This Mock Test has no questions assigned yet.' });
  }

  const now = new Date();
  if (now < mockTest.startTime) return res.status(403).json({ success: false, message: 'Mock Test has not started yet' });
  if (now > mockTest.endTime) return res.status(403).json({ success: false, message: 'Mock Test has ended' });

  // Check existing attempt
  let attempt = await QuizAttempt.findOne({ userId: req.user._id, mockTestId });

  if (attempt && attempt.status === 'completed') {
    return res.status(403).json({ success: false, message: 'You have already completed this test' });
  }

  if (!attempt) {
    const questionIds = mockTest.questions.map(q => q._id);
    attempt = await QuizAttempt.create({
      userId: req.user._id,
      mockTestId,
      subject: 'Mock Test',
      chapter: mockTest.title,
      questions: questionIds,
      answers: questionIds.map(qid => ({ questionId: qid })),
      mode: 'exam',
      status: 'in-progress',
      startTime: new Date()
    });
  }

  // Strip answers
  const safeQuestions = mockTest.questions.map(q => {
    const qObj = q.toObject();
    delete qObj.correct;
    delete qObj.explanation;
    return qObj;
  });

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      questions: safeQuestions,
      startTime: attempt.startTime,
      duration: mockTest.duration
    }
  });
};

// GET /api/mock-tests/:id/leaderboard
const getMockTestLeaderboard = async (req, res) => {
  const attempts = await QuizAttempt.find({ mockTestId: req.params.id, status: 'completed' })
    .populate('userId', 'name xp level')
    .sort({ obtainedMarks: -1, timeTakenSeconds: 1 })
    .limit(50);

  res.json({ success: true, data: attempts });
};

module.exports = { createMockTest, getMockTests, startMockTest, getMockTestLeaderboard };
