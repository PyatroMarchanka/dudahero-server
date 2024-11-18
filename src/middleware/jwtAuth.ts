import jwt from "jsonwebtoken";
import { Request } from "express";
import { ENV } from "../../config";
import { userApi } from "../mongo/api/user";

export const jwtAuth = (req: Request) => {
  const jwtToken = req.cookies.jwtToken;
  if (!jwtToken) {
    throw new Error("Authorization token is missing");
  }

  try {
    const decoded = jwt.verify(jwtToken, ENV.JWT_SECRET || "");
    req.user = decoded;
  } catch (err) {
    throw new Error("Invalid token");
  }
};

export const adminJwtAuth = async (req: Request) => {
  jwtAuth(req)
  const userId = req.cookies.userId;
  const user = await userApi.getUserById(userId!);

  if (!user?.isAdmin) {
    throw new Error("Unauthorized for admin actions");
  }
};
