const Content = require('../models/Content.model');
const User = require('../models/User.model');
const { uploadToB2, deleteFromB2, authorizeB2, b2 } = require('../utils/b2Upload');
const { calculateXP, getLevelFromXP } = require('../utils/xpEngine');

// POST /api/content/upload
const uploadContent = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { title, subject, chapter, topic, description, visibility, tags } = req.body;
  if (!title || !subject || !chapter) {
    return res.status(422).json({ success: false, message: 'Title, subject, and chapter are required' });
  }

  const isPDF = req.file.mimetype === 'application/pdf';
  const folder = isPDF ? 'pdfs' : 'images';

  const { fileUrl, fileName, fileSize, fileId } = await uploadToB2(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder
  );

  const content = await Content.create({
    title,
    subject,
    chapter,
    topic: topic || '',
    description: description || '',
    uploadedBy: req.user._id,
    fileUrl,
    fileId,
    fileName,
    fileSize,
    fileType: isPDF ? 'pdf' : 'image',
    visibility: visibility || 'public',
    tags: tags ? tags.split(',').map((t) => t.trim()) : [],
  });

  const xpGained = calculateXP('UPLOAD_CONTENT');
  const user = await User.findById(req.user._id);
  user.xp += xpGained;
  user.level = getLevelFromXP(user.xp);
  await user.save();

  res.status(201).json({ success: true, message: 'Content uploaded successfully', data: content, xpGained });
};

// GET /api/content  — list with filters
const listContent = async (req, res) => {
  const { subject, chapter, topic, search, page = 1, limit = 12, fileType } = req.query;
  const filter = {};

  if (req.user?.role !== 'admin') {
    filter.$or = [
      { visibility: 'public', status: 'approved' },
      { uploadedBy: req.user?._id },
    ];
  }

  if (subject)  filter.subject = new RegExp(subject, 'i');
  if (chapter)  filter.chapter = new RegExp(chapter, 'i');
  if (topic)    filter.topic   = new RegExp(topic,   'i');
  if (fileType) filter.fileType = fileType;
  if (search)   filter.$text   = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [contents, total] = await Promise.all([
    Content.find(filter)
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Content.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: contents,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  });
};

// GET /api/content/:id
const getContent = async (req, res) => {
  const content = await Content.findById(req.params.id).populate('uploadedBy', 'name avatar');
  if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

  content.viewCount += 1;
  await content.save();

  res.json({ success: true, data: content });
};

// ─── Shared B2 file server (used by both stream and download) ─────────────────
const b2Serve = async (req, res, disposition) => {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
  if (!content.fileName) return res.status(404).json({ success: false, message: 'No file stored' });

  const mimeType = content.fileType === 'pdf' ? 'application/pdf' : 'image/webp';
  const ext      = content.fileType === 'pdf' ? '.pdf' : '.webp';
  const title    = (content.title || 'file').replace(/[^a-zA-Z0-9_\-. ]/g, '_').trim();
  const dlName   = disposition === 'attachment' ? `${title}${ext}` : content.fileName;

  try {
    // authorizeB2 caches the token; re-authorizes only when needed
    await authorizeB2();

    // b2.downloadFileByName sends the correct B2 Authorization header automatically
    const response = await b2.downloadFileByName({
      bucketName:   process.env.B2_BUCKET_NAME,
      fileName:     content.fileName,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${dlName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (response.headers?.['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    // response.data is a Node.js Readable stream (axios responseType:'stream')
    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('B2 pipe error:', err.message);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Stream error' });
    });

  } catch (err) {
    console.error('b2Serve error:', err.response?.status, err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to serve file from storage' });
    }
  }
};

// GET /api/content/:id/stream   — inline (react-pdf / img viewer)
const streamFile = (req, res) => b2Serve(req, res, 'inline');

// GET /api/content/:id/download — attachment (browser Save dialog)
const downloadFile = (req, res) => b2Serve(req, res, 'attachment');

// DELETE /api/content/:id
const deleteContent = async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

  if (content.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await deleteFromB2(content.fileId, content.fileName);
  await content.deleteOne();

  res.json({ success: true, message: 'Content deleted' });
};

// PATCH /api/content/:id/status  — admin approve/reject
const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(422).json({ success: false, message: 'Invalid status' });
  }
  const content = await Content.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
  res.json({ success: true, data: content });
};

module.exports = { uploadContent, listContent, getContent, streamFile, downloadFile, deleteContent, updateStatus };
