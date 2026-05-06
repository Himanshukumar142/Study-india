const mongoose = require('mongoose');
const { b2, authorizeB2 } = require('../utils/b2Upload');

// ─── helpers ─────────────────────────────────────────────────────────────────

const bytesToMB = (b) => parseFloat((b / 1024 / 1024).toFixed(2));
const bytesToGB = (b) => parseFloat((b / 1024 / 1024 / 1024).toFixed(3));

const getHealthLevel = (pct) => {
  if (pct >= 95) return 'CRITICAL';      // almost full
  if (pct >= 85) return 'HIGH';          // critical warning
  if (pct >= 70) return 'WARNING';       // caution
  return 'NORMAL';
};

// ─── GET /api/admin/system/mongodb-usage ────────────────────────────────────

const getMongoDBUsage = async (req, res) => {
  const db = mongoose.connection.db;

  if (!db) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not established',
    });
  }

  // db.stats() returns sizes in bytes
  const stats = await db.stats({ scale: 1 });

  // Free-tier cap (env: MONGODB_FREE_LIMIT_MB, default 512 MB)
  const maxLimitMB = parseFloat(process.env.MONGODB_FREE_LIMIT_MB) || 512;
  const maxLimitBytes = maxLimitMB * 1024 * 1024;

  // storageSize is the real on-disk usage
  const storageSize = stats.storageSize || 0;
  const dataSize    = stats.dataSize    || 0;
  const indexSize   = stats.indexSize   || 0;
  const usedBytes   = storageSize;

  const usedPercentage  = parseFloat(((usedBytes / maxLimitBytes) * 100).toFixed(2));
  const remainingBytes  = Math.max(0, maxLimitBytes - usedBytes);

  // Per-collection breakdown
  const collections = await db.listCollections().toArray();
  const collectionStats = await Promise.all(
    collections.map(async (col) => {
      try {
        const cs = await db.collection(col.name).stats({ scale: 1 });
        return {
          name: col.name,
          documentCount: cs.count || 0,
          storageSize:   cs.storageSize || 0,
          indexSize:     cs.totalIndexSize || 0,
          avgDocumentSize: cs.avgObjSize || 0,
        };
      } catch {
        return { name: col.name, documentCount: 0, storageSize: 0, indexSize: 0 };
      }
    })
  );

  // Sort by storage descending
  collectionStats.sort((a, b) => b.storageSize - a.storageSize);

  return res.json({
    success: true,
    data: {
      databaseName:      stats.db || 'unknown',
      // Raw bytes
      storageSize,
      dataSize,
      indexSize,
      // Human-readable
      storageSizeMB:     bytesToMB(storageSize),
      dataSizeMB:        bytesToMB(dataSize),
      indexSizeMB:       bytesToMB(indexSize),
      // Counts
      collections:       stats.collections || 0,
      objects:           stats.objects      || 0,
      // Limits & usage
      maxLimitMB,
      maxLimitBytes,
      usedBytes,
      usedMB:            bytesToMB(usedBytes),
      usedPercentage,
      remainingBytes,
      remainingMB:       bytesToMB(remainingBytes),
      healthLevel:       getHealthLevel(usedPercentage),
      // Breakdown
      collectionBreakdown: collectionStats,
      fetchedAt: new Date().toISOString(),
    },
  });
};

// ─── GET /api/admin/system/b2-usage ─────────────────────────────────────────

const getB2Usage = async (req, res) => {
  // Verify B2 credentials exist
  const bucketId   = process.env.B2_BUCKET_ID;
  const bucketName = process.env.B2_BUCKET_NAME;

  if (!bucketId || !bucketName || !process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY) {
    return res.status(503).json({
      success: false,
      message: 'B2 credentials not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_ID, B2_BUCKET_NAME in environment.',
    });
  }

  // Authorize
  await authorizeB2();

  // Free tier cap (env: B2_FREE_LIMIT_GB, default 10 GB)
  const maxLimitGB    = parseFloat(process.env.B2_FREE_LIMIT_GB) || 10;
  const maxLimitBytes = maxLimitGB * 1024 * 1024 * 1024;

  // Page through all files (B2 returns max 1000 per request)
  let allFiles   = [];
  let startFileName = null;
  let startFileId   = null;

  // Limit to 5000 files for safety (avoids runaway loops on huge buckets)
  const MAX_FILES = 5000;

  while (allFiles.length < MAX_FILES) {
    const params = {
      bucketId,
      maxFileCount: 1000,
    };
    if (startFileName) params.startFileName = startFileName;
    if (startFileId)   params.startFileId   = startFileId;

    const { data } = await b2.listFileNames(params);
    const files = data.files || [];

    allFiles = allFiles.concat(files);

    // No more pages
    if (!data.nextFileName) break;

    startFileName = data.nextFileName;
    startFileId   = data.nextFileId;
  }

  // Calculate aggregates
  let totalSizeBytes = 0;
  const fileTypeMap  = {};

  allFiles.forEach((f) => {
    totalSizeBytes += f.contentLength || 0;

    // Extension-based grouping
    const ext = (f.fileName || '').split('.').pop().toLowerCase();
    const group =
      ext === 'pdf'                              ? 'PDF'   :
      ['jpg','jpeg','png','webp','gif'].includes(ext) ? 'Image' :
      ['mp4','webm','mov'].includes(ext)         ? 'Video' : 'Other';

    if (!fileTypeMap[group]) fileTypeMap[group] = { count: 0, sizeBytes: 0 };
    fileTypeMap[group].count++;
    fileTypeMap[group].sizeBytes += f.contentLength || 0;
  });

  const usedPercentage = parseFloat(((totalSizeBytes / maxLimitBytes) * 100).toFixed(2));
  const remainingBytes = Math.max(0, maxLimitBytes - totalSizeBytes);

  // Largest files (top 10)
  const largestFiles = [...allFiles]
    .sort((a, b) => (b.contentLength || 0) - (a.contentLength || 0))
    .slice(0, 10)
    .map((f) => ({
      name:       f.fileName,
      fileId:     f.fileId,
      sizeBytes:  f.contentLength || 0,
      sizeMB:     bytesToMB(f.contentLength || 0),
      uploadedAt: f.uploadTimestamp ? new Date(f.uploadTimestamp).toISOString() : null,
      contentType: f.contentType || 'unknown',
    }));

  // Recent files (top 10 by upload timestamp)
  const recentFiles = [...allFiles]
    .filter((f) => f.uploadTimestamp)
    .sort((a, b) => b.uploadTimestamp - a.uploadTimestamp)
    .slice(0, 10)
    .map((f) => ({
      name:       f.fileName,
      fileId:     f.fileId,
      sizeBytes:  f.contentLength || 0,
      sizeMB:     bytesToMB(f.contentLength || 0),
      uploadedAt: new Date(f.uploadTimestamp).toISOString(),
      contentType: f.contentType || 'unknown',
    }));

  // File type distribution array for frontend charts
  const fileTypes = Object.entries(fileTypeMap).map(([type, info]) => ({
    type,
    count:       info.count,
    sizeBytes:   info.sizeBytes,
    sizeMB:      bytesToMB(info.sizeBytes),
    percentage:  parseFloat(((info.sizeBytes / totalSizeBytes) * 100).toFixed(1)) || 0,
  }));

  return res.json({
    success: true,
    data: {
      bucketName,
      bucketId,
      // Counts
      totalFiles:     allFiles.length,
      // Sizes
      totalSizeBytes,
      totalSizeMB:    bytesToMB(totalSizeBytes),
      totalSizeGB:    bytesToGB(totalSizeBytes),
      // Limits
      maxLimitGB,
      maxLimitBytes,
      // Usage
      usedPercentage,
      remainingBytes,
      remainingGB:    bytesToGB(remainingBytes),
      healthLevel:    getHealthLevel(usedPercentage),
      // File details
      largestFiles,
      recentFiles,
      fileTypes,
      fetchedAt: new Date().toISOString(),
    },
  });
};

// ─── GET /api/admin/system/combined ─────────────────────────────────────────
// Lightweight summary combining both — returns quickly even if one source is slow

const getCombinedUsage = async (req, res) => {
  // Run both queries in parallel; if one fails, gracefully degrade
  const [mongoResult, b2Result] = await Promise.allSettled([
    (async () => {
      const db = mongoose.connection.db;
      const stats = await db.stats({ scale: 1 });
      const maxLimitMB    = parseFloat(process.env.MONGODB_FREE_LIMIT_MB) || 512;
      const maxLimitBytes = maxLimitMB * 1024 * 1024;
      const storageSize   = stats.storageSize || 0;
      return {
        ok: true,
        storageSizeMB:  bytesToMB(storageSize),
        maxLimitMB,
        usedPercentage: parseFloat(((storageSize / maxLimitBytes) * 100).toFixed(2)),
        remainingMB:    bytesToMB(Math.max(0, maxLimitBytes - storageSize)),
        objects:        stats.objects || 0,
        collections:    stats.collections || 0,
        healthLevel:    getHealthLevel(parseFloat(((storageSize / maxLimitBytes) * 100).toFixed(2))),
      };
    })(),
    (async () => {
      const bucketId = process.env.B2_BUCKET_ID;
      if (!bucketId || !process.env.B2_KEY_ID) return { ok: false, reason: 'Not configured' };
      await authorizeB2();
      const maxLimitGB    = parseFloat(process.env.B2_FREE_LIMIT_GB) || 10;
      const maxLimitBytes = maxLimitGB * 1024 * 1024 * 1024;
      // Only fetch first page for speed
      const { data } = await b2.listFileNames({ bucketId, maxFileCount: 1000 });
      const files = data.files || [];
      const totalSizeBytes = files.reduce((s, f) => s + (f.contentLength || 0), 0);
      const est = data.nextFileName ? '1000+' : files.length;
      return {
        ok: true,
        totalFiles:     est,
        totalSizeGB:    bytesToGB(totalSizeBytes),
        maxLimitGB,
        usedPercentage: parseFloat(((totalSizeBytes / maxLimitBytes) * 100).toFixed(2)),
        remainingGB:    bytesToGB(Math.max(0, maxLimitBytes - totalSizeBytes)),
        healthLevel:    getHealthLevel(parseFloat(((totalSizeBytes / maxLimitBytes) * 100).toFixed(2))),
        note:           data.nextFileName ? 'Partial — showing first 1000 files only. Use full report for accuracy.' : null,
      };
    })(),
  ]);

  res.json({
    success: true,
    data: {
      mongodb: mongoResult.status === 'fulfilled' ? mongoResult.value : { ok: false, reason: mongoResult.reason?.message },
      b2:      b2Result.status      === 'fulfilled' ? b2Result.value      : { ok: false, reason: b2Result.reason?.message },
      fetchedAt: new Date().toISOString(),
    },
  });
};

module.exports = { getMongoDBUsage, getB2Usage, getCombinedUsage };
