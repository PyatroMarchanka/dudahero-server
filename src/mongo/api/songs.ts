import { ISong } from "../../interfaces/song";
import setupMongooseConnection from "../connect";
import { SongModel } from "../schemas/song";
import { cacheGet, cacheInvalidate } from "../../utils/cache";

const getAllSongs = async () => {
  await setupMongooseConnection();

  return cacheGet("songs:all", async () => {
    return await SongModel.find({});
  });
};

const getSongById = async (id: string) => {
  await setupMongooseConnection();

  return cacheGet(`songs:${id}`, async () => {
    return await SongModel.findById(id);
  });
};

const getSongShortNames = async () => {
  await setupMongooseConnection();

  return cacheGet("songs:shortnames", async () => {
    return await SongModel.find({}).select("_id name");
  });
};

const getTopByPlays = async (limit: number = 10) => {
  await setupMongooseConnection();

  return cacheGet(`songs:top:plays`, async () => {
    return await SongModel.find({})
      .sort({ "stats.views": -1 })
      .limit(limit);
  });
};

const getTopRecent = async (limit: number = 10) => {
  await setupMongooseConnection();

  return cacheGet(`songs:top:recent`, async () => {
    return await SongModel.find({})
      .sort({ createdAt: -1 })
      .limit(limit);
  });
};

const addSong = async (song: ISong) => {
  await setupMongooseConnection();

  const result = await SongModel.create(song);
  
  // Invalidate relevant caches
  await cacheInvalidate("songs:all");
  await cacheInvalidate("songs:shortnames");

  return result;
};

const updateSong = async (id: string, song: ISong) => {
  await setupMongooseConnection();

  const result = await SongModel.updateOne({ _id: id }, song);
  
  // Invalidate relevant caches
  await cacheInvalidate(`songs:${id}`);
  await cacheInvalidate("songs:all");
  await cacheInvalidate("songs:top:*");

  return result;
};

export const songApi = {
  getAllSongs,
  getSongById,
  getSongShortNames,
  getTopByPlays,
  getTopRecent,
  addSong,
  updateSong
};
