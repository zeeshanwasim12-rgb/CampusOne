/**
 * Minimal logger. Wraps console so we have a single place to later swap in
 * Winston/pino without touching call sites. Timestamps every line.
 */
const stamp = () => new Date().toISOString();

const isTest = process.env.NODE_ENV === 'test';

export const logger = {
  info: (...args) => !isTest && console.log(`[${stamp()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${stamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${stamp()}] [ERROR]`, ...args),
  debug: (...args) => process.env.DEBUG && console.debug(`[${stamp()}] [DEBUG]`, ...args),
};

export default logger;
