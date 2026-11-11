/**
 * MongoDB connection helper (Mongoose).
 *
 * Kept tiny on purpose: one connect function, sensible options, and clear
 * log lines so that during a demo you can see exactly when the DB is ready.
 */
import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri = config.mongoUri) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

export default connectDB;
