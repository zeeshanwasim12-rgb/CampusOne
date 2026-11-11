/**
 * storageService — a single abstraction over file storage with two drivers:
 *
 *   - 's3'    : Amazon S3 (AWS SDK v3). View/download uses presigned URLs so
 *               the bucket can stay private.
 *   - 'local' : disk under ./uploads, served back through the API. Used as an
 *               automatic fallback whenever S3 isn't configured, so the app
 *               runs end-to-end with zero cloud setup during development.
 *
 * The rest of the app never checks which driver is active — it just calls
 * putObject / getViewUrl / deleteObject.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config, effectiveStorageDriver } from '../config/env.js';
import { logger } from '../utils/logger.js';

// S3 SDK is imported lazily so the app doesn't require AWS creds just to boot.
let s3Client = null;
let s3Mod = null;
let presignerMod = null;

async function getS3() {
  if (!s3Client) {
    s3Mod = await import('@aws-sdk/client-s3');
    presignerMod = await import('@aws-sdk/s3-request-presigner');
    s3Client = new s3Mod.S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }
  return { client: s3Client, ...s3Mod, getSignedUrl: presignerMod.getSignedUrl };
}

const uploadRoot = path.resolve(config.uploadDir);

/** Build a collision-resistant, path-safe object key. */
export function buildKey(folder, originalName) {
  const safe = String(originalName || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80);
  return `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safe}`;
}

/**
 * Store a file buffer. Returns metadata to persist on the owning document.
 */
export async function putObject({ buffer, key, mimeType, size }) {
  const driver = effectiveStorageDriver();

  if (driver === 's3') {
    const s3 = await getS3();
    await s3.client.send(
      new s3.PutObjectCommand({
        Bucket: config.aws.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const url = config.aws.s3.publicBaseUrl
      ? `${config.aws.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : '';
    return { key, driver: 's3', url, size };
  }

  // local
  const full = path.join(uploadRoot, key);
  await fsp.mkdir(path.dirname(full), { recursive: true });
  await fsp.writeFile(full, buffer);
  return { key, driver: 'local', url: `/api/files/${encodeURIComponent(key)}`, size };
}

/**
 * Get a URL the browser can use to view or download the object.
 * For S3 this is a short-lived presigned URL; for local it's an API route.
 */
export async function getViewUrl(fileMeta, { download = false } = {}) {
  if (!fileMeta || !fileMeta.key) return '';

  if (fileMeta.driver === 's3') {
    const s3 = await getS3();
    const command = new s3.GetObjectCommand({
      Bucket: config.aws.s3.bucket,
      Key: fileMeta.key,
      ...(download && fileMeta.originalName
        ? { ResponseContentDisposition: `attachment; filename="${fileMeta.originalName}"` }
        : {}),
    });
    return s3.getSignedUrl(s3.client, command, { expiresIn: 300 });
  }

  // local
  const base = `/api/files/${encodeURIComponent(fileMeta.key)}`;
  return download ? `${base}?download=1` : base;
}

/** Delete an object (best-effort — logs but never throws on cleanup). */
export async function deleteObject(fileMeta) {
  if (!fileMeta || !fileMeta.key) return;
  try {
    if (fileMeta.driver === 's3') {
      const s3 = await getS3();
      await s3.client.send(
        new s3.DeleteObjectCommand({ Bucket: config.aws.s3.bucket, Key: fileMeta.key })
      );
    } else {
      await fsp.unlink(path.join(uploadRoot, fileMeta.key)).catch(() => {});
    }
  } catch (err) {
    logger.warn(`Failed to delete object ${fileMeta.key}: ${err.message}`);
  }
}

/** For the local driver only: absolute path + read stream for the download route. */
export function localFilePath(key) {
  const full = path.join(uploadRoot, key);
  // Prevent path traversal outside the upload root.
  if (!full.startsWith(uploadRoot)) throw new Error('Invalid file key');
  return full;
}

export function localReadStream(key) {
  return fs.createReadStream(localFilePath(key));
}

export default { buildKey, putObject, getViewUrl, deleteObject, localFilePath, localReadStream };
