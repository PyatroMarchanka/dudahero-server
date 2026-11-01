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
    reviewStatus: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
    submittedAt: { type: Date },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewComment: { type: String },
    lastEditedBy: { type: String },
    catalogSongId: { type: String },
  },
  { timestamps: true }
);

// The admin review lists
userMelodySchema.index({ reviewStatus: 1, submittedAt: 1 });

export const UserMelodyModel = model<IUserMelody>("user_melodies", userMelodySchema, "user_melodies");
