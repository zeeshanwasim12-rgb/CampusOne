/**
 * File upload middleware built on multer (in-memory storage). The buffer is
 * then handed to storageService, which decides S3 vs local. Enforces max file
 * size and an allow-list of document/image mime types.
 */
import multer from 'multer';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
  },
});

// Convert multer's own errors (e.g. file too large) into our ApiError shape.
export const handleUploadErrors = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`File too large (max ${config.maxFileSizeMb}MB)`));
    }
    return next(ApiError.badRequest(err.message));
  }
  return next(err);
};

export default upload;
