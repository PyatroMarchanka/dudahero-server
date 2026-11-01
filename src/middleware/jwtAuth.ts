import jwt from "jsonwebtoken";
import { Request } from "express";
import { ENV } from "../../config";
import { userApi } from "../mongo/api/user";

// The user _id a token was issued for. Tokens from before it was signed in on
// every login route carry no id.
const tokenUserId = (decoded: any): string | undefined => {
  const id = decoded?.user?._id;
  return id ? String(id) : undefined;
};

export const jwtAuth = (req: Request) => {
  const jwtToken = req.cookies.jwtToken;
  if (!jwtToken) {
    throw new Error("Authorization token is missing");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(jwtToken, ENV.JWT_SECRET || "");
    req.user = decoded;
  } catch (err) {
    throw new Error("Invalid token");
  }

  // The userId cookie isn't signed: when the token names its user, the cookie must match it
  const idFromToken = tokenUserId(decoded);
  if (idFromToken && idFromToken !== req.cookies.userId) {
    throw new Error("Invalid token");
  }
};

// Admin actions trust only the id inside the signed token, never the userId
// cookie alone. An admin with an old token (no id in it) logs in again once.
export const adminJwtAuth = async (req: Request) => {
  jwtAuth(req);
  const userId = tokenUserId(req.user);
  if (!userId) {
    throw new Error("Unauthorized for admin actions: log in again");
  }
  const user = await userApi.getUserById(userId);

  if (!user?.isAdmin) {
    throw new Error("Unauthorized for admin actions");
  }
};

// _id of the logged-in user. Call after jwtAuth / adminJwtAuth succeeded.
export const getAuthUserId = (req: Request): string => tokenUserId(req.user) || req.cookies.userId;
