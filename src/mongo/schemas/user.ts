import { model, Schema } from "mongoose";
import { User, UserSettings } from "../../interfaces/user";

const userSettingsSchema: Schema = new Schema<UserSettings>({
  bagpipe: { type: String, required: true },
  tempo: { type: Number, required: true },
  userPreclick: { type: Boolean, required: true },
  language: { type: String, required: true },
  transpose: { type: Number, required: true },
});

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  picture: { type: String, required: true },
  settings: { type: userSettingsSchema, required: true },
});

export const UserModel = model("users", userSchema, "users");
