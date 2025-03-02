import { model, Schema } from "mongoose";
import { IPlaylistSong } from "../../interfaces/playlistSong";

const playlistSongSchemas: Schema = new Schema<IPlaylistSong>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  tags: { type: [String], required: true },
});

export const PlaylistSongsModel = model(
  "playlistSong",
  playlistSongSchemas,
  "playlistSong"
);
