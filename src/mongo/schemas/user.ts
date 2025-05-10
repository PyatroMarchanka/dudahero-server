import { model, Schema } from "mongoose";
import { User, UserSettings } from "../../interfaces/user";

const userSettingsSchema: Schema = new Schema<UserSettings>({
  bagpipeType: { type: String, required: true },
  tempo: { type: Number, required: true },
  isPreclick: { type: Boolean, required: true },
  language: { type: String, required: true },
  transpose: { type: Number, required: true },
  lastSongUrl: { type: String, required: false },
  view: { type: String, required: true },
});

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  picture: { type: String, required: true },
  settings: { type: userSettingsSchema, required: true },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, required: false },
});

export const UserModel = model("users", userSchema, "users");
