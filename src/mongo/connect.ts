import mongoose from 'mongoose';
import { ENV } from '../../config';

export default async function setupMongooseConnection() {
  if (!ENV.MONGO_DB_URL) {
    throw new Error('No db url provided');
  }

  mongoose.connection.once('open', async () => {
    logger.info('Connected to MongoDB');
  });
  // logger.info<string>(`connectionString ${mong}`);
  mongoose.connection.on('error', async (err: Error) => {
    logger.info('Error connecting to MongoDB. Reason: ${err.message}');
    process.exit(1);
  });

  await mongoose.connect(ENV.MONGO_DB_URL, {
    dbName: ENV.MONGO_DB_NAME,
    user: ENV.MONGO_DB_USER,
    pass: ENV.MONGO_DB_PASS,
  });
}
