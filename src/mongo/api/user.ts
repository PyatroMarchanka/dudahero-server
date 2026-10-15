import mongoose from "mongoose";
import { User, UserSettings } from "../../interfaces/user";
import setupMongooseConnection from "../connect";
import { UserModel } from "../schemas/user";

const getAllUsers = async () => {
  await setupMongooseConnection();

  return await UserModel.find({});
};

const getUserByEmail = async (email: string) => {
  await setupMongooseConnection();

  return (await UserModel.findOne({ email })) as User;
};

const getUserById = async (id: string) => {
  await setupMongooseConnection();

  return (await UserModel.findById(id)) as User;
};

const addUser = async (user: User) => {
  await setupMongooseConnection();
  await UserModel.create(user);
  const userFromDb = await UserModel.findOne({ email: user.email });
  return userFromDb as User;
};

const updateUserSettinsById = async (id: string, data: UserSettings) => {
  await setupMongooseConnection();
  const entries = Object.entries(data);

  const updateData = entries.reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[`settings.${key}`] = value;
    }
    return acc;
  }, {} as any);

  await UserModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: updateData }
  );
};

const MAX_FAVORITE_SONGS = 5000;

const getFavoriteSongs = async (id: string) => {
  await setupMongooseConnection();
  const user = await UserModel.findById(id).select("favoriteSongs");
  if (!user) {
    throw new Error("User not found");
  }
  return (user.favoriteSongs as string[] | undefined) ?? [];
};

// $addToSet keeps the list unique, so adding a song twice is a no-op
const addFavoriteSong = async (id: string, songId: string) => {
  await setupMongooseConnection();
  const user = await UserModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(id),
      [`favoriteSongs.${MAX_FAVORITE_SONGS - 1}`]: { $exists: false },
    },
    { $addToSet: { favoriteSongs: songId } },
    { new: true }
  ).select("favoriteSongs");
  if (!user) {
    throw new Error("User not found or favorites limit reached");
  }
  return (user.favoriteSongs as string[] | undefined) ?? [];
};

const removeFavoriteSong = async (id: string, songId: string) => {
  await setupMongooseConnection();
  const user = await UserModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $pull: { favoriteSongs: songId } },
    { new: true }
  ).select("favoriteSongs");
  if (!user) {
    throw new Error("User not found");
  }
  return (user.favoriteSongs as string[] | undefined) ?? [];
};

export const userApi = {
  getAllUsers,
  getUserByEmail,
  addUser,
  getUserById,
  updateUserSettinsById,
  getFavoriteSongs,
  addFavoriteSong,
  removeFavoriteSong,
};
