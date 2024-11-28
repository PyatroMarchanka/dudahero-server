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

const songSchema: Schema = new Schema<ISong>({
  labels: { type: [String], required: true },
  timeSignature: { type: String, required: true },
  name: { type: String, required: false },
  pathName: { type: String, required: true },
  bagpipesToPlay: { type: [String], required: true },
  type: { type: String, required: true },
  links: { type: [linkSchema], required: false },
  about: { type: String, required: false },
  id: { type: String, required: true },
  trinscribedBy: { type: String, required: false },
  lyrycs: { type: String, required: false },
  stats: { type: statsSchema, required: false },
});

export const SongModel = model("songs", songSchema, "songs");
