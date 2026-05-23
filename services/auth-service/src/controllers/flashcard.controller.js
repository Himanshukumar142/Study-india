const Flashcard = require('../models/Flashcard.model');

// GET /api/flashcards
const getFlashcards = async (req, res) => {
  const { subject, due } = req.query;
  const filter = { userId: req.user._id };
  if (subject && subject !== 'all') filter.subject = subject;
  if (due === 'true') filter.nextReview = { $lte: new Date() };

  const cards = await Flashcard.find(filter).sort({ nextReview: 1 });
  res.json({ success: true, data: cards });
};

// GET /api/flashcards/stats
const getStats = async (req, res) => {
  const total = await Flashcard.countDocuments({ userId: req.user._id });
  const due = await Flashcard.countDocuments({ userId: req.user._id, nextReview: { $lte: new Date() } });
  const bySubject = await Flashcard.aggregate([
    { $match: { userId: req.user._id } },
    { $group: { _id: '$subject', count: { $sum: 1 }, dueCount: { $sum: { $cond: [{ $lte: ['$nextReview', new Date()] }, 1, 0] } } } },
  ]);
  res.json({ success: true, data: { total, due, bySubject } });
};

// POST /api/flashcards
const createFlashcard = async (req, res) => {
  const { subject, chapter, front, back, difficulty, tags } = req.body;
  if (!subject || !front || !back) return res.status(400).json({ success: false, message: 'Subject, front, and back required' });

  const card = await Flashcard.create({ userId: req.user._id, subject, chapter, front, back, difficulty, tags });
  res.status(201).json({ success: true, data: card });
};

// POST /api/flashcards/bulk
const createBulk = async (req, res) => {
  const { cards } = req.body;
  if (!Array.isArray(cards)) return res.status(400).json({ success: false, message: 'Cards array required' });

  const toInsert = cards.map(c => ({ ...c, userId: req.user._id }));
  const inserted = await Flashcard.insertMany(toInsert);
  res.status(201).json({ success: true, data: inserted, message: `${inserted.length} flashcards created` });
};

// POST /api/flashcards/:id/review
const reviewFlashcard = async (req, res) => {
  const { quality } = req.body; // 0-5 (0=forgot, 5=perfect)
  const card = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
  if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

  // SM-2 spaced repetition algorithm
  const q = Math.max(0, Math.min(5, parseInt(quality) || 3));
  let { easeFactor, interval, reviewCount } = card;

  if (q >= 3) {
    if (reviewCount === 0) interval = 1;
    else if (reviewCount === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    reviewCount++;
  } else {
    interval = 1;
    reviewCount = 0;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  card.interval = interval;
  card.easeFactor = easeFactor;
  card.reviewCount = reviewCount;
  card.nextReview = nextReview;
  await card.save();

  res.json({ success: true, data: card });
};

// PUT /api/flashcards/:id
const updateFlashcard = async (req, res) => {
  const card = await Flashcard.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: req.body },
    { new: true }
  );
  if (!card) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: card });
};

// DELETE /api/flashcards/:id
const deleteFlashcard = async (req, res) => {
  await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, message: 'Deleted' });
};

module.exports = { getFlashcards, getStats, createFlashcard, createBulk, reviewFlashcard, updateFlashcard, deleteFlashcard };
