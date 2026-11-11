/**
 * fileController — serves files stored with the LOCAL storage driver.
 * (With the S3 driver, the browser hits presigned S3 URLs directly and never
 * touches this route.) Content-Type is inferred from the extension so PDFs and
 * images render inline; `?download=1` forces a download.
 */
import path from 'node:path';
import fs from 'node:fs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { localFilePath } from '../services/storageService.js';

const MIME = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
};

// GET /api/files/:key
export const serveFile = asyncHandler(async (req, res) => {
  const key = decodeURIComponent(req.params.key);

  let full;
  try {
    full = localFilePath(key);
  } catch {
    throw ApiError.badRequest('Invalid file key');
  }
  if (!fs.existsSync(full)) throw ApiError.notFound('File not found');

  const ext = path.extname(full).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (req.query.download) {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(full)}"`);
  }
  fs.createReadStream(full).pipe(res);
});

export default { serveFile };
