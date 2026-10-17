import { model, Schema } from "mongoose";
import { IAppUpdate } from "../../interfaces/appUpdate";

const appUpdateSchema = new Schema<IAppUpdate>(
  {
    key: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    prNumbers: { type: [Number], required: false },
    translations: { type: Object, required: true },
  },
  { timestamps: true }
);

export const AppUpdateModel = model<IAppUpdate>("app_updates", appUpdateSchema, "app_updates");
