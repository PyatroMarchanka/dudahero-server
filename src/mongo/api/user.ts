import { User } from "../../interfaces/user";
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

const addUser = async (user: User) => {
  await setupMongooseConnection();

  await UserModel.create(user);
  const userFromDb = await UserModel.findOne({ email: user.email });
  return userFromDb as User;
};

export const userApi = { getAllUsers, getUserByEmail, addUser };
