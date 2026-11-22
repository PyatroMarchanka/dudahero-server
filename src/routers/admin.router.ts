import express from "express";
import { SONG_LIST_PROJECTION, SongModel } from "../mongo/schemas/song";
import mongoose from "mongoose";
import { adminJwtAuth } from "../middleware/jwtAuth";
import { cacheInvalidate } from "../utils/cache";
import { appUpdatesApi } from "../mongo/api/appUpdates";
import { UserMelodyModel } from "../mongo/schemas/userMelody";
import { validateSongMelody } from "../utils/melodyValidation";
import { validateVersion, validateVersionInfo } from "../utils/versionValidation";
import { VERSION_MUSIC_FIELDS } from "../interfaces/song";

// The song list and the top lists are cached; clear them after a change
const invalidateSongLists = async () => {
  await cacheInvalidate("songs:all");
  await cacheInvalidate("songs:top:*");
  await cacheInvalidate("songs:shortnames");
};

export const adminRouter = express.Router();

// Users' melodies approved into a song (or into one of its versions) go back to
// their owners when it is removed from the catalog
const releaseMelodies = async (songId: string, versionId?: string) => {
  await UserMelodyModel.updateMany(
    versionId ? { catalogSongId: songId, catalogVersionId: versionId } : { catalogSongId: songId },
    {
      $set: {
        reviewStatus: "rejected",
        reviewComment: "Removed from the song list",
        reviewedAt: new Date(),
      },
      $unset: { catalogSongId: 1, catalogVersionId: 1 },
    }
  );
};

const findSong = (id: string) => (mongoose.Types.ObjectId.isValid(id) ? SongModel.findById(id) : null);

const afterSongChange = async (songId: string) => {
  await cacheInvalidate(`songs:${songId}`);
  await invalidateSongLists();
};

// Add a version to a song
adminRouter.post("/song/:id/versions", async (req, res) => {
  try {
    await adminJwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: (error as Error).message || "Admins only" });
  }
  const version = validateVersion(req.body);
  if (typeof version === "string") {
    return res.status(400).send({ error: version });
  }
  try {
    const song = await findSong(req.params.id);
    if (!song) {
      return res.status(404).send({ error: `Song not found: id =  ${req.params.id}` });
    }
    const versionId = new mongoose.Types.ObjectId();
    const now = new Date();
    const updated = await SongModel.findByIdAndUpdate(
      song._id,
      {
        $push: {
          versions: {
            ...version,
            _id: versionId,
            pathName: version.pathName || `melody/${song._id}/${versionId}`,
            createdAt: now,
            updatedAt: now,
          },
        },
        $set: { updatedAt: now },
      },
      { new: true, runValidators: true }
    );
    await afterSongChange(String(song._id));
    res.status(201).send(updated);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: (error as Error).message || "Could not add the version" });
  }
});

// Edit a version
adminRouter.put("/song/:id/versions/:versionId", async (req, res) => {
  try {
    await adminJwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: (error as Error).message || "Admins only" });
  }
  const version = validateVersion(req.body);
  if (typeof version === "string") {
    return res.status(400).send({ error: version });
  }
  try {
    const song: any = await findSong(req.params.id);
    const existing = song?.versions?.find((item: any) => String(item._id) === req.params.versionId);
    if (!song || !existing) {
      return res.status(404).send({ error: "Version not found" });
    }
    const now = new Date();
    const updated = await SongModel.findOneAndUpdate(
      { _id: song._id, "versions._id": existing._id },
      {
        $set: {
          "versions.$": {
            ...version,
            _id: existing._id,
            pathName: version.pathName || `melody/${song._id}/${existing._id}`,
            // An edit keeps where the version came from unless the request says otherwise
            sourceMelodyId: version.sourceMelodyId ?? existing.sourceMelodyId,
            createdAt: existing.createdAt || now,
            // The frontend keeps notes under a URL with this date, so every edit moves it
            updatedAt: now,
          },
          updatedAt: now,
        },
      },
      { new: true, runValidators: true }
    );
    await afterSongChange(String(song._id));
    res.status(200).send(updated);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: (error as Error).message || "Could not save the version" });
  }
});

// Delete a version
adminRouter.delete("/song/:id/versions/:versionId", async (req, res) => {
  try {
    await adminJwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: (error as Error).message || "Admins only" });
  }
  try {
    const song: any = await findSong(req.params.id);
    const existing = song?.versions?.find((item: any) => String(item._id) === req.params.versionId);
    if (!song || !existing) {
      return res.status(404).send({ error: "Version not found" });
    }
    const updated = await SongModel.findByIdAndUpdate(
      song._id,
      { $pull: { versions: { _id: existing._id } }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    await afterSongChange(String(song._id));
    await releaseMelodies(String(song._id), String(existing._id));
    res.status(200).send(updated);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: (error as Error).message || "Could not delete the version" });
  }
});

// Make a version the default one (shown first): its notes move to the song,
// and the song's old notes take the version's place. The version keeps its id.
adminRouter.post("/song/:id/versions/:versionId/make-default", async (req, res) => {
  try {
    await adminJwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: (error as Error).message || "Admins only" });
  }
  try {
    const song: any = await findSong(req.params.id);
    const index = (song?.versions || []).findIndex((item: any) => String(item._id) === req.params.versionId);
    if (!song || index < 0) {
      return res.status(404).send({ error: "Version not found" });
    }
    const raw = song.toObject();
    const version = raw.versions[index];
    const songId = String(song._id);
    const versionId = String(version._id);
    const now = new Date();

    const $set: Record<string, unknown> = { updatedAt: now };
    const $unset: Record<string, 1> = {};
    const setOrUnset = (field: string, value: unknown) => {
      if (value === undefined || value === null || value === "") $unset[field] = 1;
      else $set[field] = value;
    };

    const oldDefault: Record<string, unknown> = {
      _id: version._id,
      label: raw.versionLabel || "Basic",
      author: raw.versionAuthor,
      level: raw.versionLevel,
      links: version.links || [],
      createdAt: raw.createdAt || now,
      updatedAt: now,
    };
    for (const field of VERSION_MUSIC_FIELDS) {
      oldDefault[field] = raw[field];
      setOrUnset(field, version[field]);
    }
    // A song made from a melody has a placeholder path; keep the paths unique
    if (raw.source === "melody") oldDefault.pathName = `melody/${songId}/${versionId}`;
    if (version.source === "melody") $set.pathName = `melody/${version.sourceMelodyId || songId}`;
    setOrUnset("versionLabel", version.label);
    setOrUnset("versionAuthor", version.author);
    setOrUnset("versionLevel", version.level);
    for (const key of Object.keys(oldDefault)) {
      if (oldDefault[key] === undefined || oldDefault[key] === null) delete oldDefault[key];
    }
    $set[`versions.${index}`] = oldDefault;

    const updated = await SongModel.findByIdAndUpdate(
      song._id,
      Object.keys($unset).length ? { $set, $unset } : { $set },
      { new: true, runValidators: true }
    );

    // Keep the links from users' melodies to where their notes now are
    if (version.sourceMelodyId && mongoose.Types.ObjectId.isValid(version.sourceMelodyId)) {
      await UserMelodyModel.updateOne(
        { _id: new mongoose.Types.ObjectId(version.sourceMelodyId), catalogSongId: songId },
        { $unset: { catalogVersionId: 1 } }
      );
    }
    if (raw.sourceMelodyId && mongoose.Types.ObjectId.isValid(raw.sourceMelodyId)) {
      await UserMelodyModel.updateOne(
        { _id: new mongoose.Types.ObjectId(raw.sourceMelodyId), catalogSongId: songId },
        { $set: { catalogVersionId: versionId } }
      );
    }
    await afterSongChange(songId);
    res.status(200).send(updated);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: (error as Error).message || "Could not change the default version" });
  }
});

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
    res.status(200).send(await SongModel.find({}).select(SONG_LIST_PROJECTION));
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
      "versionLabel",
      "versionAuthor",
      "versionLevel",
      // Sent back by the editor with the rest of the song, but versions change only through their own routes
      "versions",
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
    delete changes.versions;
    const $unset: Record<string, 1> = {};
    if (["versionLabel", "versionAuthor", "versionLevel"].some((field) => field in changes)) {
      const info = validateVersionInfo(
        { label: changes.versionLabel, author: changes.versionAuthor, level: changes.versionLevel },
        false
      );
      if (typeof info === "string") {
        return res.status(400).send({ error: info });
      }
      const fields: [string, string | undefined][] = [
        ["versionLabel", info.label],
        ["versionAuthor", info.author],
        ["versionLevel", info.level],
      ];
      for (const [field, value] of fields) {
        if (!(field in changes)) continue;
        delete changes[field];
        if (value) changes[field] = value;
        else $unset[field] = 1;
      }
    }
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
      Object.keys($unset).length ? { $set: changes, $unset } : { $set: changes },
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

    // Made from users' melodies (the song or its versions): give them back to their owners,
    // so they don't claim to be in the list
    await releaseMelodies(String(song._id));
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
