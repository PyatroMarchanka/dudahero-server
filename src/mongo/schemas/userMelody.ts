import { model, Schema } from "mongoose";
import { IUserMelody } from "../../interfaces/userMelody";

const userMelodySchema = new Schema<IUserMelody>(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    abc: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserMelodyModel = model<IUserMelody>("user_melodies", userMelodySchema, "user_melodies");
