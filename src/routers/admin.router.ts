import express from "express";
import { SongModel } from "../mongo/schemas/song";
import mongoose from "mongoose";
import { adminJwtAuth } from "../middleware/jwtAuth";
import { cacheInvalidate } from "../utils/cache";
import { appUpdatesApi } from "../mongo/api/appUpdates";

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
    console.log('req.body', req.body);
    const song = await SongModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!song) {
      return res.status(404).send({ error: `Song not found: id =  ${req.params.id}` });
    }
    cacheInvalidate(`songs:${req.params.id}`);
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
    cacheInvalidate(`songs:${req.params.id}`);
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
