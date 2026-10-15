import express from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { userApi } from "../mongo/api/user";
import { logger } from "../utils/logger";

export const favoritesRouter = express.Router();

const isValidSongId = (songId: unknown): songId is string =>
  typeof songId === "string" && songId.length > 0 && songId.length <= 200;

// Favorite song ids of the logged-in user
favoritesRouter.get("/", async (req, res) => {
  try {
    jwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: "Login required" });
  }

  try {
    const favoriteSongs = await userApi.getFavoriteSongs(req.cookies.userId);
    res.status(200).send({ favoriteSongs });
  } catch (error) {
    logger.info("Error fetching favorite songs:", error);
    res.status(400).send({ error: "Could not load favorite songs" });
  }
});

// Mark a song as favorite; adding it again changes nothing
favoritesRouter.put("/:songId", async (req, res) => {
  try {
    jwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: "Login required" });
  }

  const { songId } = req.params;
  if (!isValidSongId(songId)) {
    return res.status(400).send({ error: "Invalid song id" });
  }

  try {
    const favoriteSongs = await userApi.addFavoriteSong(
      req.cookies.userId,
      songId
    );
    res.status(200).send({ favoriteSongs });
  } catch (error) {
    logger.info("Error adding favorite song:", error);
    res.status(400).send({ error: "Could not add favorite song" });
  }
});

// Unmark a song; removing a song that is not a favorite changes nothing
favoritesRouter.delete("/:songId", async (req, res) => {
  try {
    jwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: "Login required" });
  }

  const { songId } = req.params;
  if (!isValidSongId(songId)) {
    return res.status(400).send({ error: "Invalid song id" });
  }

  try {
    const favoriteSongs = await userApi.removeFavoriteSong(
      req.cookies.userId,
      songId
    );
    res.status(200).send({ favoriteSongs });
  } catch (error) {
    logger.info("Error removing favorite song:", error);
    res.status(400).send({ error: "Could not remove favorite song" });
  }
});
