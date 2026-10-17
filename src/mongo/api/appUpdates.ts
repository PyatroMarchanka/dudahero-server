import { IAppUpdate } from "../../interfaces/appUpdate";
import setupMongooseConnection from "../connect";
import { AppUpdateModel } from "../schemas/appUpdate";
import { cacheGet, cacheInvalidate } from "../../utils/cache";
import { appUpdatesSeed } from "../seeds/appUpdates";
import { logger } from "../../utils/logger";

const MAX_LIMIT = 50;

const getLatestUpdates = async (limit: number = 20) => {
  await setupMongooseConnection();
  const safeLimit = Math.min(Math.max(limit || 20, 1), MAX_LIMIT);

  return cacheGet(`updates:latest:${safeLimit}`, async () => {
    return await AppUpdateModel.find({}).sort({ date: -1 }).limit(safeLimit);
  });
};

const upsertUpdate = async (update: IAppUpdate) => {
  await setupMongooseConnection();

  const result = await AppUpdateModel.findOneAndUpdate(
    { key: update.key },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  await cacheInvalidate("updates:*");

  return result;
};

const deleteUpdate = async (key: string) => {
  await setupMongooseConnection();

  const result = await AppUpdateModel.findOneAndDelete({ key });
  await cacheInvalidate("updates:*");

  return result;
};

// Writes the entries from seeds/appUpdates.ts into the database on startup.
// Entries are matched by key, so re-running only updates their wording.
const seedUpdates = async () => {
  await setupMongooseConnection();

  await AppUpdateModel.bulkWrite(
    appUpdatesSeed.map((update) => ({
      updateOne: {
        filter: { key: update.key },
        update: { $set: update },
        upsert: true,
      },
    }))
  );
  await cacheInvalidate("updates:*");
  logger.info(`Seeded ${appUpdatesSeed.length} app updates`);
};

export const appUpdatesApi = {
  getLatestUpdates,
  upsertUpdate,
  deleteUpdate,
  seedUpdates,
};
