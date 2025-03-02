import { model, Schema } from "mongoose";
import { IPlaylist } from "../../interfaces/playlist";

const playlistSchema: Schema = new Schema<IPlaylist>({
  name: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  songsIds: { type: [String], required: true },
});

export const PlaylistModel = model("playlists", playlistSchema, "playlists");
