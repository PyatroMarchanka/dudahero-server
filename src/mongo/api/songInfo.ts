import setupMongooseConnection from "../connect";
import { SongModel } from "../schemas/song";
import { ISong } from "../../interfaces/song";
import { songInfoSeed } from "../seeds/songInfo";
import { cacheInvalidate } from "../../utils/cache";
import { logger } from "../../utils/logger";

// Placeholders such as "yy" count as no text
const isBlank = (value?: string | null) => !value || value.trim().length < 3;

// Fills the about text, lyrics and links of catalog songs from seeds/songInfo.ts.
// Only empty fields are filled and only missing links are added, so running it on every
// startup changes nothing once the data is in, and admin edits always win.
const seedSongInfo = async () => {
  await setupMongooseConnection();

  let changed = 0;
  for (const entry of songInfoSeed) {
    const songs = await SongModel.find({ pathName: { $in: entry.pathNames } }).lean<ISong[]>();
    for (const song of songs) {
      const set: Record<string, unknown> = {};
      if (entry.about && isBlank(song.about)) {
        set.about = entry.about;
      }
      if (entry.lyrycs && isBlank(song.lyrycs)) {
        set.lyrycs = entry.lyrycs;
      }
      const links = song.links || [];
      const newLinks = (entry.links || []).filter((link) => !links.some((existing) => existing.url === link.url));
      if (!Object.keys(set).length && !newLinks.length) {
        continue;
      }
      await SongModel.updateOne(
        { _id: (song as ISong & { _id: unknown })._id },
        {
          ...(Object.keys(set).length && { $set: set }),
          ...(newLinks.length && { $push: { links: { $each: newLinks } } }),
        }
      );
      changed++;
    }
  }

  if (changed) {
    await cacheInvalidate("songs:*");
  }
  logger.info(`Seeded song info: ${changed} songs updated`);
};

export const songInfoApi = { seedSongInfo };
