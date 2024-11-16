import jwt from "jsonwebtoken";
import { Request } from "express";
import { ENV } from "../../config";

export const jwtAuth = (req: Request) => {
  const jwtToken = req.cookies.jwtToken;
  console.log("cookies", req.cookies.jwtToken);
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
