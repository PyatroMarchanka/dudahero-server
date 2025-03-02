import { model, Schema } from "mongoose";
import { ISongTags } from "../../interfaces/songTag";

const playlistSongTagsSchema: Schema = new Schema<ISongTags>({
  userId: { type: String, required: true, index: true },
  tags: { type: [String], required: true },
});

export const PlaylistSongTagsModel = model(
  "playlistsSongTags",
  playlistSongTagsSchema,
  "playlistsSongTags"
);
