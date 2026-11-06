import mongoose from 'mongoose';
import { ENV } from '../../config';
import { logger } from '../utils/logger';

let listenersAdded = false;

// Called before every query; connects once and is a no-op afterwards
export default async function setupMongooseConnection() {
  if (!ENV.MONGO_DB_URL) {
    throw new Error('No db url provided');
  }
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (listenersAdded) {
    await mongoose.connect(ENV.MONGO_DB_URL, { dbName: ENV.MONGO_DB_NAME });
    return;
  }
  // Added once: each call used to add another pair, which piled up listeners on every request
  listenersAdded = true;

  mongoose.connection.once('open', async () => {
    logger.info('Connected to MongoDB');
  });
  // logger.info<string>(`connectionString ${mong}`);
  mongoose.connection.on('error', async (err: Error) => {
    logger.info(`Error connecting to MongoDB. Reason: ${err.message}`);
    process.exit(1);
  });

  await mongoose.connect(ENV.MONGO_DB_URL, {
    dbName: ENV.MONGO_DB_NAME,
    // user: ENV.MONGO_DB_USER,
    // pass: ENV.MONGO_DB_PASS,
  });
}
