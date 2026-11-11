/**
 * Central environment configuration.
 *
 * Every configurable value in the backend is read here exactly once and
 * exported as a plain object. Nothing else in the codebase should call
 * `process.env` directly — that keeps credential handling in one auditable
 * place and makes it obvious (in a viva or a code review) what the app needs.
 *
 * No secret has a real default. Where a default exists it is a safe,
 * non-sensitive local-development value.
 */
import dotenv from 'dotenv';

dotenv.config();

const bool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: num(process.env.PORT, 5000),

  // Comma-separated list of allowed browser origins (CORS).
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // ---- Database ----
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone',

  // ---- Local JWT auth (default provider) ----
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-only-insecure-refresh-change-me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // ---- Auth provider selection ----
  // 'local'   -> email/password + JWT issued by this server (works out of the box)
  // 'cognito' -> access tokens issued by AWS Cognito, verified via JWKS
  authProvider: (process.env.AUTH_PROVIDER || 'local').toLowerCase(),

  // ---- AWS ----
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID || '',
      clientId: process.env.COGNITO_CLIENT_ID || '',
    },
    s3: {
      bucket: process.env.S3_BUCKET || '',
      // Public base URL (e.g. a CloudFront distribution) used to build view URLs.
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '',
    },
  },

  // ---- File storage ----
  // 'local' stores uploads on disk under ./uploads (dev fallback).
  // 's3' stores uploads in Amazon S3. Auto-falls back to 'local' if the
  // bucket/credentials are missing, so the app never crashes on startup.
  storageDriver: (process.env.STORAGE_DRIVER || 'local').toLowerCase(),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: num(process.env.MAX_FILE_SIZE_MB, 15),

  // ---- Misc ----
  seedOnStart: bool(process.env.SEED_ON_START, false),
};

/** True when real S3 credentials + bucket are present. */
export const isS3Configured = () =>
  Boolean(config.aws.s3.bucket && config.aws.accessKeyId && config.aws.secretAccessKey);

/** True when Cognito is fully configured. */
export const isCognitoConfigured = () =>
  Boolean(config.aws.cognito.userPoolId && config.aws.cognito.clientId);

/** The storage driver actually in effect after checking credentials. */
export const effectiveStorageDriver = () =>
  config.storageDriver === 's3' && isS3Configured() ? 's3' : 'local';

/** The auth provider actually in effect after checking credentials. */
export const effectiveAuthProvider = () =>
  config.authProvider === 'cognito' && isCognitoConfigured() ? 'cognito' : 'local';

export default config;
