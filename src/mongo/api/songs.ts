import { ISong } from "../../interfaces/song";
import setupMongooseConnection from "../connect";
import { SongModel } from "../schemas/song";

const getAllSongs = async () => {
  await setupMongooseConnection();

  return await SongModel.find({});
};

const getSongById = async (id: string) => {
  await setupMongooseConnection();

  return await SongModel.find({ type: "belarusian" });
};

const addSong = async (song: ISong) => {
  await setupMongooseConnection();

  return await SongModel.create(song);
};

const updateSong = async (id: string, song: ISong) => {
  await setupMongooseConnection();

  return await SongModel.updateOne({ _id: id }, song);
}

export const songApi = { getAllSongs, getSongById, addSong, updateSong };
