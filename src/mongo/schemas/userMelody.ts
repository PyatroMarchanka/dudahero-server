import { model, Schema } from "mongoose";
import { IUserMelody } from "../../interfaces/userMelody";

const userMelodySchema = new Schema<IUserMelody>(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    format: { type: String, enum: ["abc", "roll"], default: "abc" },
    abc: { type: String },
    // Validated in the router before saving
    roll: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const UserMelodyModel = model<IUserMelody>("user_melodies", userMelodySchema, "user_melodies");
