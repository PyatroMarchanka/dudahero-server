import express from "express";
import { SongModel } from "../mongo/schemas/song";
import mongoose from "mongoose";
import { adminJwtAuth } from "../middleware/jwtAuth";
import { cacheInvalidate } from "../utils/cache";
import { appUpdatesApi } from "../mongo/api/appUpdates";
import { UserMelodyModel } from "../mongo/schemas/userMelody";
import { validateSongMelody } from "../utils/melodyValidation";

// The song list and the top lists are cached; clear them after a change
const invalidateSongLists = async () => {
  await cacheInvalidate("songs:all");
  await cacheInvalidate("songs:top:*");
  await cacheInvalidate("songs:shortnames");
};

export const adminRouter = express.Router();

// Create a new song
adminRouter.post("/song", async (req, res) => {
  try {
    await adminJwtAuth(req);
    const song = new SongModel(req.body);
    await song.save();
    res.status(201).send(song);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// The song list as stored, without the caches, so the admin list is right after an edit or a delete
adminRouter.get("/song", async (req, res) => {
  try {
    await adminJwtAuth(req);
    res.status(200).send(await SongModel.find({}).select("-melody.roll -melody.abc"));
  } catch (error) {
    console.log(error);
    res.status(403).send({ error: (error as Error).message || "Admins only" });
  }
});

// A song as stored, with its notes, never from the caches: the admin editors read it before changing it
adminRouter.get("/song/:id", async (req, res) => {
  try {
    await adminJwtAuth(req);
    const song = mongoose.Types.ObjectId.isValid(req.params.id) ? await SongModel.findById(req.params.id) : null;
    if (!song) {
      return res.status(404).send({ error: `Song not found: id =  ${req.params.id}` });
    }
    res.status(200).send(song);
  } catch (error) {
    console.log(error);
    res.status(403).send({ error: (error as Error).message || "Admins only" });
  }
});

// Update a song by ID
adminRouter.put("/song/:id", async (req, res) => {
  try {
    await adminJwtAuth(req);
    const allowedUpdates = [
      "_id",
      "labels",
      "timeSignature",
      "name",
      "type",
      "pathName",
      "id",
      "about",
      "originalTempo",
      "transcribedBy",
      "bagpipesToPlay",
      "links",
      "lyrycs",
      "stats",
      "source",
      "sourceMelodyId",
      "melody",
      "createdAt",
      "updatedAt",
      "__v",
    ];
    const updates = Object.keys(req.body);
    const unvalidUpdates = updates.filter((update) => !allowedUpdates.includes(update));

    if (unvalidUpdates.length !== 0) {
      return res.status(400).send({
        error: `Invalid updates!, valid are: ` + allowedUpdates.join(", "),
      });
    }
    const changes = { ...req.body };
    if (changes.melody !== undefined) {
      // Notes edited in the notes editor: a song with notes in the database is played from them, not from a file
      const melody = validateSongMelody(changes.melody);
      if (typeof melody === "string") {
        return res.status(400).send({ error: melody });
      }
      changes.melody = melody;
      changes.source = "melody";
    }
    // The frontend keeps a song's notes under a URL with this date, so every edit moves it
    changes.updatedAt = new Date();
    const song = await SongModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: changes },
      { new: true, runValidators: true },
    );

    if (!song) {
      return res.status(404).send({ error: `Song not found: id =  ${req.params.id}` });
    }
    await cacheInvalidate(`songs:${req.params.id}`);
    await invalidateSongLists();
    res.status(200).send(song);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Delete a song by ID
adminRouter.delete("/song/:id", async (req, res) => {
  try {
    await adminJwtAuth(req);
    const song = await SongModel.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).send({ error: `Song not found: id =  ${req.params.id}` });
    }
    await cacheInvalidate(`songs:${req.params.id}`);
    await invalidateSongLists();

    // A song made from a user's melody: give the melody back to its owner, so it doesn't claim to be in the list
    const melodyId = String(song.sourceMelodyId ?? "");
    if (melodyId && mongoose.Types.ObjectId.isValid(melodyId)) {
      await UserMelodyModel.updateOne(
        { _id: new mongoose.Types.ObjectId(melodyId), catalogSongId: String(song._id) },
        {
          $set: {
            reviewStatus: "rejected",
            reviewComment: "Removed from the song list",
            reviewedAt: new Date(),
          },
          $unset: { catalogSongId: 1 },
        }
      );
    }
    res.status(200).send(song);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Create or update an app update (matched by key)
adminRouter.post("/update", async (req, res) => {
  try {
    await adminJwtAuth(req);
    const { key, date, prNumbers, translations } = req.body;
    if (!key || !date || !translations) {
      return res.status(400).send({ error: "key, date and translations are required" });
    }
    const update = await appUpdatesApi.upsertUpdate({ key, date, prNumbers, translations });
    res.status(201).send(update);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Delete an app update by key
adminRouter.delete("/update/:key", async (req, res) => {
  try {
    await adminJwtAuth(req);
    const update = await appUpdatesApi.deleteUpdate(req.params.key);
    if (!update) {
      return res.status(404).send({ error: `Update not found: key = ${req.params.key}` });
    }
    res.status(200).send(update);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
