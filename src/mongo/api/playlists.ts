import setupMongooseConnection from "../connect";
import { PlaylistModel } from "../schemas/playlist";
import { PlaylistSongsModel } from "../schemas/playlistSong";
import { IPlaylist } from "../../interfaces/playlist";
import { IPlaylistSong } from "../../interfaces/playlistSong";
import { ISongTags } from "../../interfaces/songTag";
import { PlaylistSongTagsModel } from "../schemas/playlistSongTags";

// Playlist API
const getAllPlaylists = async (userId: string): Promise<IPlaylist[]> => {
  await setupMongooseConnection();
  return PlaylistModel.find({ userId });
};

const createPlaylist = async (playlistData: IPlaylist) => {
  await setupMongooseConnection();
  const newPlaylist = new PlaylistModel(playlistData);
  return newPlaylist.save();
};

const deletePlaylist = async (playlistId: string) => {
  await setupMongooseConnection();
  return PlaylistModel.findByIdAndDelete(playlistId);
};

const updatePlaylist = async (playlistId: string, updateData: IPlaylist) => {
  await setupMongooseConnection();
  return PlaylistModel.findByIdAndUpdate(playlistId, updateData, { new: true });
};

// Playlist Songs API
const getAllPlaylistSongs = async (
  userId: string
): Promise<IPlaylistSong[]> => {
  await setupMongooseConnection();
  return PlaylistSongsModel.find({ userId });
};

const createPlaylistSong = async (playlistSongData: IPlaylistSong) => {
  await setupMongooseConnection();
  const newPlaylistSong = new PlaylistSongsModel(playlistSongData);
  return newPlaylistSong.save();
};

const deletePlaylistSong = async (playlistSongId: string) => {
  await setupMongooseConnection();
  return PlaylistSongsModel.findByIdAndDelete(playlistSongId);
};

const updatePlaylistSong = async (
  playlistSongId: string,
  updateData: IPlaylistSong
) => {
  await setupMongooseConnection();
  return PlaylistSongsModel.findByIdAndUpdate(playlistSongId, updateData, {
    new: true,
  });
};

// Playlist Song Tags API
const createPlaylistSongTag = async (playlistSongTagData: ISongTags) => {
  await setupMongooseConnection();
  const newPlaylistSongTag = new PlaylistSongTagsModel(playlistSongTagData);
  return newPlaylistSongTag.save();
};

const updatePlaylistSongTag = async (userId: string, tags: string[]) => {
  await setupMongooseConnection();
  const updatedDoc = await PlaylistSongTagsModel.findOneAndUpdate(
    { userId },
    { tags },
    { new: true }
  );

  if (!updatedDoc) {
    return createPlaylistSongTag({ userId, tags });
  }

  return updatedDoc;
};

const getPlaylistSongTags = async (userId: string): Promise<ISongTags[]> => {
  await setupMongooseConnection();
  return PlaylistSongTagsModel.find({ userId });
};

// Export APIs
export const playlistApi = {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
};

export const playlistSongApi = {
  getAllPlaylistSongs,
  createPlaylistSong,
  deletePlaylistSong,
  updatePlaylistSong,
};

export const playlistSongTagApi = {
  createPlaylistSongTag,
  updatePlaylistSongTag,
  getPlaylistSongTags,
};
