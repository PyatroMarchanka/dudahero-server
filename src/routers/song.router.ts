import express from "express";
import { SongModel } from "../mongo/schemas/song";
import setupMongooseConnection from "../mongo/connect";
import mongoose from "mongoose";

export const songRouter = express.Router();

// Setup mongoose connection
setupMongooseConnection();

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

songRouter.put("/plays/:id", async (req, res) => {
  try {
    console.log("song", req.params.id);
    const song = await SongModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $inc: { "stats.views": 1 } },
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

songRouter.put("/test/test", async (req, res) => {
  // for tests only
});
