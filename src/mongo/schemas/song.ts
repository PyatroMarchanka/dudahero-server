import { model, Schema } from 'mongoose';
import { ISong } from '../../interfaces/song';

const songSchema: Schema = new Schema<ISong>(
  {
    labels: { type: [String], required: true },
    timeSignature: { type: String, required: true },
    name: { type: String, required: false },
    pathName: { type: String, required: true },
    bagpipesToPlay: { type: [String], required: true },
    type: {type: String, required: true}
  },
);

export const SongModel = model('songs', songSchema, 'songs');

