import dotenv from "dotenv";

dotenv.config();

// DECLARE ALL VARIABLES

export const ENV = {
  MONGO_DB_URL: process.env.MONGO_DB_URL || "",
  NODE_ENV: process.env.NODE_ENV || "",
  MONGO_DB_USER: process.env.MONGO_DB_USER,
  MONGO_DB_PASS: process.env.MONGO_DB_PASS,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
};
