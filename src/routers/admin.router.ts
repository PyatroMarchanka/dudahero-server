import express from "express";
import { SongModel } from "../mongo/schemas/song";
import mongoose from "mongoose";
import { adminJwtAuth } from "../middleware/jwtAuth";

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
    ];
    const updates = Object.keys(req.body);
    console.log("updates", updates);
    const unvalidUpdates = updates.filter(
      (update) => !allowedUpdates.includes(update)
    );

    if (unvalidUpdates.length !== 0) {
      return res.status(400).send({
        error: `Invalid updates!, valid are: ` + allowedUpdates.join(", "),
      });
    }

    const song = await SongModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!song) {
      return res
        .status(404)
        .send({ error: `Song not found: id =  ${req.params.id}` });
    }
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
      return res
        .status(404)
        .send({ error: `Song not found: id =  ${req.params.id}` });
    }
    res.status(200).send(song);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
