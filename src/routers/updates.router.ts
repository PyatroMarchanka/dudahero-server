import express from "express";
import { appUpdatesApi } from "../mongo/api/appUpdates";

export const updatesRouter = express.Router();

// Get the latest app updates, newest first
updatesRouter.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const updates = await appUpdatesApi.getLatestUpdates(limit);
    res.status(200).send(updates);
  } catch (error) {
    console.error("Error fetching app updates:", error);
    res.status(500).send(error);
  }
});
