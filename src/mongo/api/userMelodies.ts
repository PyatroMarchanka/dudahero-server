import mongoose from "mongoose";
import setupMongooseConnection from "../connect";
import { UserMelodyModel } from "../schemas/userMelody";
import { IMelodyRoll, MelodyFormat } from "../../interfaces/userMelody";

// Melodies a single user may keep, so one account can't fill the database
export const MAX_MELODIES_PER_USER = 100;

const toPublicMelody = (melody: any) => ({
  id: melody._id.toString(),
  title: melody.title,
  format: melody.format || "abc",
  abc: melody.abc,
  roll: melody.roll,
  createdAt: melody.createdAt,
  updatedAt: melody.updatedAt,
});

const getUserMelodies = async (ownerId: string) => {
  await setupMongooseConnection();
  const melodies = await UserMelodyModel.find({ ownerId }).sort({ createdAt: -1 });
  return melodies.map(toPublicMelody);
};

const getMelodyById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const melody = await UserMelodyModel.findById(id);
  return melody ? toPublicMelody(melody) : null;
};

const countUserMelodies = async (ownerId: string) => {
  await setupMongooseConnection();
  return UserMelodyModel.countDocuments({ ownerId });
};

// What a melody holds besides its owner: either ABC text or piano-roll notes
export type MelodyContent =
  | { title: string; format: "abc"; abc: string }
  | { title: string; format: "roll"; roll: IMelodyRoll };

const toFields = (content: MelodyContent): { title: string; format: MelodyFormat; abc?: string; roll?: IMelodyRoll } =>
  content.format === "roll"
    ? { title: content.title, format: "roll", roll: content.roll }
    : { title: content.title, format: "abc", abc: content.abc };

// Field of the other format, removed on update so a melody never holds both
const otherFormatField = (content: MelodyContent) => (content.format === "roll" ? "abc" : "roll");

const addMelody = async (ownerId: string, content: MelodyContent) => {
  await setupMongooseConnection();
  const melody = await UserMelodyModel.create({ ownerId, ...toFields(content) });
  return toPublicMelody(melody);
};

// Returns null when the melody doesn't exist or belongs to someone else
const updateMelody = async (ownerId: string, id: string, content: MelodyContent) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const melody = await UserMelodyModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), ownerId },
    { $set: toFields(content), $unset: { [otherFormatField(content)]: 1 } },
    { new: true }
  );
  return melody ? toPublicMelody(melody) : null;
};

const removeMelody = async (ownerId: string, id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  await setupMongooseConnection();
  const result = await UserMelodyModel.deleteOne({ _id: new mongoose.Types.ObjectId(id), ownerId });
  return result.deletedCount > 0;
};

export const userMelodiesApi = {
  getUserMelodies,
  getMelodyById,
  countUserMelodies,
  addMelody,
  updateMelody,
  removeMelody,
};
