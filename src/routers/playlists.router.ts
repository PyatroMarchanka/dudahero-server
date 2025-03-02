import express from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  playlistApi,
  playlistSongApi,
  playlistSongTagApi,
} from "../mongo/api/playlists";

export const playlistRouter = express.Router();

// Create a new song
playlistRouter.get("/", async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.cookies.userId;
    const playlistsPromise = playlistApi.getAllPlaylists(userId);
    const playlistSongsPromise = playlistSongApi.getAllPlaylistSongs(userId);
    const tagsPromise =
      playlistSongTagApi.getPlaylistSongTags(userId);

    const [playlists, songs, tags] = await Promise.all([
      playlistsPromise,
      playlistSongsPromise,
      tagsPromise,
    ]);
    res
      .status(201)
      .send({
        playlists: playlists?.map((p) => ({ name: p.name, songsIds: p.songsIds, _id: p._id })) ?? [],
        songs: songs?.map((s) => ({ name: s.name, tags: s.tags, _id: s._id })) ?? [],
        tags: tags[0]?.tags ?? [],
      });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

playlistRouter.post("/", async (req, res) => {
  try {
    jwtAuth(req);
    const playlistData = req.body;
    const newPlaylist = await playlistApi.createPlaylist({
      ...playlistData,
      userId: req.cookies.userId,
    });
    res.status(201).send(newPlaylist);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

playlistRouter.delete("/:id", async (req, res) => {
  try {
    jwtAuth(req);
    const playlistId = req.params.id;
    await playlistApi.deletePlaylist(playlistId);
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

playlistRouter.put("/:id", async (req, res) => {
  try {
    jwtAuth(req);
    const playlistId = req.params.id;
    const updateData = req.body;
    const updatedPlaylist = await playlistApi.updatePlaylist(playlistId, {
      ...updateData,
      userId: req.cookies.userId,
    });
    res.status(200).send(updatedPlaylist);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Add a new song to a playlist
playlistRouter.post("/songs", async (req, res) => {
  try {
    jwtAuth(req);
    const playlistSongData = req.body;
    const newPlaylistSong = await playlistSongApi.createPlaylistSong({
      ...playlistSongData,
      userId: req.cookies.userId,
    });
    res.status(201).send(newPlaylistSong);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Delete a song from a playlist
playlistRouter.delete("/songs/:id", async (req, res) => {
  try {
    jwtAuth(req);
    const playlistSongId = req.params.id;
    await playlistSongApi.deletePlaylistSong(playlistSongId);
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Update a song in a playlist
playlistRouter.post("/songs/:id", async (req, res) => {
  try {
    jwtAuth(req);
    const playlistSongId = req.params.id;
    const updateData = req.body;
    const updatedPlaylistSong = await playlistSongApi.updatePlaylistSong(
      playlistSongId,
      {
        ...updateData,
        userId: req.cookies.userId,
      }
    );
    res.status(200).send(updatedPlaylistSong);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

playlistRouter.post("/tags", async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.cookies.userId;
    const tags = req.body;
    await playlistSongTagApi.updatePlaylistSongTag(userId, tags);
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
