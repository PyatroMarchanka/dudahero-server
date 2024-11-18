import express from "express";
import { SongModel } from "../mongo/schemas/song";
import setupMongooseConnection from "../mongo/connect";
import mongoose from "mongoose";
import { ISong } from "../interfaces/song";

export const songRouter = express.Router();

// Setup mongoose connection
setupMongooseConnection();

// Create a new song
songRouter.post("/", async (req, res) => {
  try {
    const song = new SongModel(req.body);
    await song.save();
    res.status(201).send(song);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all songs
songRouter.get("/", async (req, res) => {
  try {
    const songs = await SongModel.find({});
    res.status(200).send(songs);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get a song by ID
songRouter.get("/:id", async (req, res) => {
  try {
    const song = await SongModel.findById(req.params.id);
    if (!song) {
      return res
        .status(404)
        .send({ error: `Song not found: id =  ${req.params.id}` });
    }
    res.status(200).send(song);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a song by ID
songRouter.put("/:id", async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "lyrycs",
      "bagpipesToPlay",
      "timeSignature",
      "pathName",
      "labels",
      "about",
      "transcribedBy",
      "originalTempo",
      "links",
      "_id",
      "type",
      "id",
    ];
    const updates = Object.keys(req.body);
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
    res.status(400).send(error);
  }
});

// Delete a song by ID
songRouter.delete("/:id", async (req, res) => {
  try {
    const song = await SongModel.findByIdAndDelete(req.params.id);
    if (!song) {
      return res
        .status(404)
        .send({ error: `Song not found: id =  ${req.params.id}` });
    }
    res.status(200).send(song);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Find songs by substring in song name
songRouter.get("/search/:substring", async (req, res) => {
  try {
    const substring = req.params.substring;
    const songs = await SongModel.find({
      name: { $regex: substring, $options: "i" },
    });
    res.status(200).send(songs);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all song names and URLs
songRouter.get("/short/names", async (req, res) => {
  try {
    const songs = await SongModel.find(
      {},
      "name type bagpipesToPlay id timeSignature labels"
    );
    res.status(200).send(songs);
  } catch (error) {
    res.status(500).send(error);
  }
});
