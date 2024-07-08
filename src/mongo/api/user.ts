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

  const user = await UserModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { settings: { ...data } }
  );

  return;
};

export const userApi = {
  getAllUsers,
  getUserByEmail,
  addUser,
  getUserById,
  updateUserSettinsById,
};
