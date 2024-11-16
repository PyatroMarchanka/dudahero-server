import { model, Schema } from "mongoose";
import { ISong, LinkTypes } from "../../interfaces/song";

const linkSchema = new Schema<LinkTypes>({
  type: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
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
});


export const SongModel = model("songs", songSchema, "songs");
