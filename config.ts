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
  FRONTEND_URL: process.env.FRONTEND_URL!,
  IS_DEV: process.env.IS_DEV,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379"
};

const splitList = (value?: string) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// FRONTEND_URL may list several origins, e.g. "https://dudahero.org,https://release.dudahero.org".
// The first one is the main site, used for redirects.
export const FRONTEND_URLS = splitList(ENV.FRONTEND_URL);
export const MAIN_FRONTEND_URL = FRONTEND_URLS[0] || "";

// GOOGLE_CLIENT_ID may list several OAuth client IDs whose ID tokens we accept.
// The first one (with GOOGLE_CLIENT_SECRET) is used by the passport redirect flow.
export const GOOGLE_CLIENT_IDS = splitList(ENV.GOOGLE_CLIENT_ID);
