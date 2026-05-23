const axios = require('axios');
const Resource = require('../models/Resource.model');

// ── Helper: Detect content type from URL ──────────────────────
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIDEO_EXTS = /\.(mp4|mkv|avi|mov|webm|flv|wmv|3gp)(\?|$)/i;
const PDF_EXT = /\.pdf(\?|$)/i;
const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i;
const AUDIO_EXTS = /\.(mp3|wav|ogg|aac|flac|m4a)(\?|$)/i;
const DOC_EXTS = /\.(doc|docx|ppt|pptx|xls|xlsx|csv|txt|zip|rar)(\?|$)/i;

function detectTypeFromUrl(url) {
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  if (VIDEO_EXTS.test(url)) return 'video';
  if (PDF_EXT.test(url)) return 'pdf';
  if (IMAGE_EXTS.test(url)) return 'image';
  if (AUDIO_EXTS.test(url)) return 'audio';
  if (DOC_EXTS.test(url)) return 'document';
  return 'link';
}

function extractYoutubeId(url) {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function detectTypeFromMime(mime) {
  if (!mime) return null;
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('document') || mime.includes('spreadsheet') || mime.includes('presentation')) return 'document';
  return null;
}

// ── POST /api/resources/analyze ───────────────────────────────
const analyzeUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

  try {
    let type = detectTypeFromUrl(url);
    let title = '';
    let thumbnail = '';
    let fileSize = 0;
    let mimeType = '';

    // YouTube → use oEmbed API
    if (type === 'youtube') {
      const videoId = extractYoutubeId(url);
      try {
        const { data } = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { timeout: 8000 });
        title = data.title || 'YouTube Video';
        thumbnail = data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } catch {
        title = 'YouTube Video';
        thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
      }
    } else {
      // HEAD request to get metadata
      try {
        const headRes = await axios.head(url, { timeout: 10000, maxRedirects: 5 });
        mimeType = headRes.headers['content-type'] || '';
        fileSize = parseInt(headRes.headers['content-length'] || '0', 10);

        // Override type from MIME if we only guessed 'link'
        const mimeDetected = detectTypeFromMime(mimeType);
        if (type === 'link' && mimeDetected) type = mimeDetected;
      } catch {
        // HEAD failed, try GET with range
        try {
          const getRes = await axios.get(url, { timeout: 10000, maxRedirects: 5, headers: { Range: 'bytes=0-0' }, responseType: 'arraybuffer' });
          mimeType = getRes.headers['content-type'] || '';
          const contentRange = getRes.headers['content-range'];
          if (contentRange) fileSize = parseInt(contentRange.split('/')[1] || '0', 10);
          const mimeDetected = detectTypeFromMime(mimeType);
          if (type === 'link' && mimeDetected) type = mimeDetected;
        } catch {}
      }

      // Extract title from URL
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1] || '';
        title = decodeURIComponent(lastPart.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')) || urlObj.hostname;
      } catch {
        title = 'Resource';
      }
    }

    return res.json({
      success: true,
      data: {
        url,
        type,
        title: title.substring(0, 200),
        thumbnail,
        fileSize,
        mimeType,
        downloadable: ['pdf', 'video', 'image', 'audio', 'document'].includes(type),
        embeddable: type === 'youtube' || type === 'image',
        youtubeId: type === 'youtube' ? extractYoutubeId(url) : null,
        fileSizeFormatted: fileSize > 0 ? formatBytes(fileSize) : 'Unknown',
      },
    });
  } catch (err) {
    return res.status(422).json({ success: false, message: 'Could not analyze URL: ' + err.message });
  }
};

// ── GET /api/resources/download?url=... ───────────────────────
const proxyDownload = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, message: 'URL required' });

  try {
    // Get filename from URL
    let filename = 'download';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      filename = decodeURIComponent(pathParts[pathParts.length - 1] || 'download');
    } catch {}

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 120000,
      maxRedirects: 5,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StudyQuest/1.0)' },
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    response.data.pipe(res);

    // Update download count if saved
    Resource.findOneAndUpdate({ url, userId: req.user._id }, { $inc: { downloads: 1 } }).catch(() => {});
  } catch (err) {
    res.status(502).json({ success: false, message: 'Download failed: ' + err.message });
  }
};

// ── POST /api/resources ──────────────────────────────────────
const saveResource = async (req, res) => {
  const { url, title, type, thumbnail, fileSize, mimeType, subject, chapter, tags, isPublic, description } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL required' });

  const resource = await Resource.create({
    userId: req.user._id, url, title, type, thumbnail, fileSize, mimeType,
    subject, chapter, tags: tags || [], isPublic: isPublic || false, description,
  });
  res.status(201).json({ success: true, data: resource });
};

// ── GET /api/resources ────────────────────────────────────────
const getResources = async (req, res) => {
  const { type, subject, mine } = req.query;
  const filter = {};

  if (mine === 'true') {
    filter.userId = req.user._id;
  } else {
    filter.$or = [{ userId: req.user._id }, { isPublic: true }];
  }

  if (type && type !== 'all') filter.type = type;
  if (subject && subject !== 'all') filter.subject = subject;

  const resources = await Resource.find(filter)
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ success: true, data: resources });
};

// ── DELETE /api/resources/:id ─────────────────────────────────
const deleteResource = async (req, res) => {
  await Resource.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, message: 'Deleted' });
};

// ── GET /api/resources/public ─────────────────────────────────
const getPublicResources = async (req, res) => {
  const { type, subject } = req.query;
  const filter = { isPublic: true };
  if (type && type !== 'all') filter.type = type;
  if (subject && subject !== 'all') filter.subject = subject;

  const resources = await Resource.find(filter)
    .populate('userId', 'name level')
    .sort({ downloads: -1, createdAt: -1 })
    .limit(50);

  res.json({ success: true, data: resources });
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = { analyzeUrl, proxyDownload, saveResource, getResources, deleteResource, getPublicResources };
