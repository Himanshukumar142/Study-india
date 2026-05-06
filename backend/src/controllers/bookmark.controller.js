const Bookmark = require('../models/Bookmark.model');
const User = require('../models/User.model');
const { calculateXP, getLevelFromXP } = require('../utils/xpEngine');

// POST /api/bookmarks/:type/:itemId
const addBookmark = async (req, res) => {
  const { type, itemId } = req.params;
  const { note } = req.body;

  if (!['content', 'question'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid bookmark type' });
  }

  const itemModel = type === 'content' ? 'Content' : 'Question';

  const existing = await Bookmark.findOne({ userId: req.user._id, type, itemId });
  if (existing) return res.status(409).json({ success: false, message: 'Already bookmarked' });

  const bookmark = await Bookmark.create({
    userId: req.user._id,
    type,
    itemId,
    itemModel,
    note: note || '',
  });

  // Award XP
  const xpGained = calculateXP('BOOKMARK_ITEM');
  const user = await User.findById(req.user._id);
  user.xp += xpGained;
  user.level = getLevelFromXP(user.xp);
  await user.save();

  res.status(201).json({ success: true, data: bookmark, xpGained });
};

// DELETE /api/bookmarks/:type/:itemId
const removeBookmark = async (req, res) => {
  const { type, itemId } = req.params;
  const result = await Bookmark.findOneAndDelete({ userId: req.user._id, type, itemId });
  if (!result) return res.status(404).json({ success: false, message: 'Bookmark not found' });
  res.json({ success: true, message: 'Bookmark removed' });
};

// GET /api/bookmarks
const getBookmarks = async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user._id })
    .populate('itemId')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookmarks });
};

module.exports = { addBookmark, removeBookmark, getBookmarks };
