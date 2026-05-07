const Doubt = require('../models/Doubt.model');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GET /api/doubts
const getDoubts = async (req, res) => {
  const { subject, status, page = 1, limit = 20, sort = 'recent' } = req.query;
  const filter = {};
  if (subject && subject !== 'all') filter.subject = subject;
  if (status && status !== 'all') filter.status = status;

  const sortMap = { recent: { createdAt: -1 }, popular: { upvotes: -1 }, unanswered: { 'answers.0': { $exists: false } } };
  const sortObj = sortMap[sort] || sortMap.recent;

  const doubts = await Doubt.find(filter)
    .populate('userId', 'name level')
    .populate('answers.userId', 'name level')
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Doubt.countDocuments(filter);
  res.json({ success: true, data: doubts, total, pages: Math.ceil(total / limit) });
};

// GET /api/doubts/:id
const getDoubt = async (req, res) => {
  const doubt = await Doubt.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
    .populate('userId', 'name level xp')
    .populate('answers.userId', 'name level xp');
  if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });
  res.json({ success: true, data: doubt });
};

// POST /api/doubts
const createDoubt = async (req, res) => {
  const { title, body, subject, chapter, tags } = req.body;
  if (!title || !body || !subject) return res.status(400).json({ success: false, message: 'Title, body, and subject required' });

  const doubt = await Doubt.create({ userId: req.user._id, title, body, subject, chapter, tags: tags || [] });
  const populated = await Doubt.findById(doubt._id).populate('userId', 'name level');
  res.status(201).json({ success: true, data: populated });
};

// POST /api/doubts/:id/answer
const addAnswer = async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ success: false, message: 'Answer body required' });

  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });

  doubt.answers.push({ userId: req.user._id, body });
  if (doubt.status === 'open') doubt.status = 'answered';
  await doubt.save();

  const populated = await Doubt.findById(doubt._id)
    .populate('userId', 'name level')
    .populate('answers.userId', 'name level');
  res.json({ success: true, data: populated });
};

// POST /api/doubts/:id/ai-answer
const getAIAnswer = async (req, res) => {
  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a JEE/NEET mentor. A student asked: "${doubt.title}"\n\nDetails: ${doubt.body}\nSubject: ${doubt.subject}\n\nGive a clear, concise, point-by-point answer. Use simple language.`;
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    doubt.answers.push({ userId: req.user._id, body: aiText, isAI: true });
    if (doubt.status === 'open') doubt.status = 'answered';
    await doubt.save();

    res.json({ success: true, data: { answer: aiText } });
  } catch (err) {
    res.status(503).json({ success: false, message: 'AI unavailable' });
  }
};

// POST /api/doubts/:id/upvote
const toggleUpvote = async (req, res) => {
  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });

  const idx = doubt.upvotes.indexOf(req.user._id);
  if (idx > -1) doubt.upvotes.splice(idx, 1);
  else doubt.upvotes.push(req.user._id);
  await doubt.save();

  res.json({ success: true, data: { upvotes: doubt.upvotes.length } });
};

// POST /api/doubts/:id/answers/:answerId/upvote
const toggleAnswerUpvote = async (req, res) => {
  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });

  const answer = doubt.answers.id(req.params.answerId);
  if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

  const idx = answer.upvotes.indexOf(req.user._id);
  if (idx > -1) answer.upvotes.splice(idx, 1);
  else answer.upvotes.push(req.user._id);
  await doubt.save();

  res.json({ success: true, data: { upvotes: answer.upvotes.length } });
};

module.exports = { getDoubts, getDoubt, createDoubt, addAnswer, getAIAnswer, toggleUpvote, toggleAnswerUpvote };
