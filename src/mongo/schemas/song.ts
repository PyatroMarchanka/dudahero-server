import { model, Schema } from "mongoose";
import { ISong, IStats, LinkTypes } from "../../interfaces/song";

const linkSchema = new Schema<LinkTypes>({
  type: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
});

const statsSchema = new Schema<IStats>({
  views: { type: Number, required: true },
  likes: { type: Number, required: false },
  lastViewed: { type: Date, required: false },
});

const versionSchema = new Schema({
  label: { type: String, required: true },
  author: { type: String, required: false },
  level: { type: String, enum: ["basic", "intermediate", "advanced"], required: false },
  pathName: { type: String, required: true },
  source: { type: String, enum: ["file", "melody"], required: false },
  sourceMelodyId: { type: String, required: false },
  // { format, abc } or { format, roll }, checked by the admin router before saving
  melody: { type: Schema.Types.Mixed, required: false },
  timeSignature: { type: String, required: true },
  originalTempo: { type: Number, required: true },
  transcribedBy: { type: String, required: false },
  links: { type: [linkSchema], required: false },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const songSchema: Schema = new Schema<ISong>({
  labels: { type: [String], required: true },
  timeSignature: { type: String, required: true },
  originalTempo: { type: Number, required: true },
  name: { type: String, required: false },
  pathName: { type: String, required: true },
  bagpipesToPlay: { type: [String], required: true },
  type: { type: String, required: true },
  links: { type: [linkSchema], required: false },
  about: { type: String, required: false },
  id: { type: String, required: true },
  transcribedBy: { type: String, required: false },
  lyrycs: { type: String, required: false },
  stats: { type: statsSchema, required: false },
  source: { type: String, enum: ["file", "melody"], required: false },
  sourceMelodyId: { type: String, required: false },
  // { format, abc } or { format, roll }, checked by the admin router before saving
  melody: { type: Schema.Types.Mixed, required: false },
  // The song's own notes are its default version; these describe it
  versionLabel: { type: String, required: false },
  versionAuthor: { type: String, required: false },
  versionLevel: { type: String, enum: ["basic", "intermediate", "advanced"], required: false },
  // Other versions; absent on songs that have only their default version
  versions: { type: [versionSchema], required: false, default: undefined },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

// Notes left out of song lists: they are loaded one song at a time
export const SONG_LIST_PROJECTION = {
  "melody.roll": 0,
  "melody.abc": 0,
  "versions.melody.roll": 0,
  "versions.melody.abc": 0,
};

export const SongModel = model("songs", songSchema, "songs");
