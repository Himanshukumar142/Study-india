const Note = require('../models/Note.model');

// GET /api/notes
const getNotes = async (req, res) => {
  const { subject, archived, search } = req.query;
  const filter = { userId: req.user._id };
  if (archived === 'true') filter.isArchived = true;
  else filter.isArchived = { $ne: true };
  if (subject && subject !== 'all') filter.subject = subject;
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { content: { $regex: search, $options: 'i' } },
  ];

  const notes = await Note.find(filter).sort({ isPinned: -1, updatedAt: -1 });
  res.json({ success: true, data: notes });
};

// POST /api/notes
const createNote = async (req, res) => {
  const { title, content, subject, chapter, tags, color } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title required' });
  const note = await Note.create({ userId: req.user._id, title, content, subject, chapter, tags: tags || [], color: color || '#ffffff' });
  res.status(201).json({ success: true, data: note });
};

// PUT /api/notes/:id
const updateNote = async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: req.body },
    { new: true }
  );
  if (!note) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: note });
};

// DELETE /api/notes/:id
const deleteNote = async (req, res) => {
  await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, message: 'Deleted' });
};

// PATCH /api/notes/:id/pin
const togglePin = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Not found' });
  note.isPinned = !note.isPinned;
  await note.save();
  res.json({ success: true, data: note });
};

// PATCH /api/notes/:id/archive
const toggleArchive = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Not found' });
  note.isArchived = !note.isArchived;
  await note.save();
  res.json({ success: true, data: note });
};

module.exports = { getNotes, createNote, updateNote, deleteNote, togglePin, toggleArchive };
