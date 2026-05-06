const B2 = require('backblaze-b2');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

let b2Authorized = false;

const authorizeB2 = async () => {
  if (!b2Authorized) {
    await b2.authorize();
    b2Authorized = true;
  }
};

/**
 * Upload a file buffer to Backblaze B2
 * @param {Buffer} fileBuffer - The file data
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of the file
 * @param {string} folder - Folder prefix (e.g. 'pdfs', 'images')
 * @returns {{ fileUrl: string, fileName: string, fileSize: number }}
 */
const uploadToB2 = async (fileBuffer, originalName, mimeType, folder = 'uploads') => {
  await authorizeB2();

  // Compress images with sharp
  let processedBuffer = fileBuffer;
  let processedMime = mimeType;

  if (mimeType.startsWith('image/')) {
    processedBuffer = await sharp(fileBuffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    processedMime = 'image/webp';
  }

  const ext = mimeType.startsWith('image/') ? '.webp' : path.extname(originalName);
  const uniqueFileName = `${folder}/${uuidv4()}${ext}`;

  // Get upload URL
  const { data: uploadUrlData } = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID,
  });

  // Upload file
  const { data: uploadedFile } = await b2.uploadFile({
    uploadUrl: uploadUrlData.uploadUrl,
    uploadAuthToken: uploadUrlData.authorizationToken,
    fileName: uniqueFileName,
    data: processedBuffer,
    mime: processedMime,
    contentLength: processedBuffer.length,
  });

  const downloadBase = process.env.B2_DOWNLOAD_URL || 'https://f004.backblazeb2.com';
  const fileUrl = `${downloadBase}/file/${process.env.B2_BUCKET_NAME}/${uniqueFileName}`;

  return {
    fileUrl,
    fileName: uniqueFileName,
    fileSize: processedBuffer.length,
    fileId: uploadedFile.fileId,
  };
};

/**
 * Delete a file from Backblaze B2
 */
const deleteFromB2 = async (fileId, fileName) => {
  await authorizeB2();
  await b2.deleteFileVersion({ fileId, fileName });
};

module.exports = { uploadToB2, deleteFromB2, authorizeB2, b2 };
