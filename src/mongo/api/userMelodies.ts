import mongoose from "mongoose";
import setupMongooseConnection from "../connect";
import { UserMelodyModel } from "../schemas/userMelody";

// Melodies a single user may keep, so one account can't fill the database
export const MAX_MELODIES_PER_USER = 100;

const toPublicMelody = (melody: any) => ({
  id: melody._id.toString(),
  title: melody.title,
  abc: melody.abc,
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

const addMelody = async (ownerId: string, title: string, abc: string) => {
  await setupMongooseConnection();
  const melody = await UserMelodyModel.create({ ownerId, title, abc });
  return toPublicMelody(melody);
};

// Returns null when the melody doesn't exist or belongs to someone else
const updateMelody = async (ownerId: string, id: string, title: string, abc: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const melody = await UserMelodyModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), ownerId },
    { $set: { title, abc } },
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
