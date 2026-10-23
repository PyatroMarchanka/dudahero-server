import express from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { MAX_MELODIES_PER_USER, userMelodiesApi } from "../mongo/api/userMelodies";
import { logger } from "../utils/logger";

export const melodiesRouter = express.Router();

// Same cap the frontend's abcToMidi enforces
const MAX_ABC_LENGTH = 20_000;
const MAX_TITLE_LENGTH = 200;

// Light sanity check only: the real parsing happens in the browser with abcjs,
// which also rejects tunes without notes before the form can be submitted.
const validateMelody = (body: any): { title: string; abc: string } | string => {
  const abc = body?.abc;
  if (typeof abc !== "string" || !abc.trim()) {
    return "ABC notation is required";
  }
  if (abc.length > MAX_ABC_LENGTH) {
    return `ABC notation is too large (max ${MAX_ABC_LENGTH} characters)`;
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return "A title is required";
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return `Title is too long (max ${MAX_TITLE_LENGTH} characters)`;
  }

  return { title, abc };
};

// Melodies of the logged-in user, newest first
melodiesRouter.get("/", async (req, res) => {
  try {
    jwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: "Login required" });
  }

  try {
    const melodies = await userMelodiesApi.getUserMelodies(req.cookies.userId);
    res.status(200).send({ melodies });
  } catch (error) {
    logger.info("Error fetching melodies:", error);
    res.status(400).send({ error: "Could not load melodies" });
  }
});

// A single melody. Open without login so a melody link can be shared,
// but melodies are never listed publicly.
melodiesRouter.get("/:id", async (req, res) => {
  try {
    const melody = await userMelodiesApi.getMelodyById(req.params.id);
    if (!melody) {
      return res.status(404).send({ error: "Melody not found" });
    }
    res.status(200).send(melody);
  } catch (error) {
    logger.info("Error fetching melody:", error);
    res.status(400).send({ error: "Could not load melody" });
  }
});

melodiesRouter.post("/", async (req, res) => {
  try {
    jwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: "Login required" });
  }

  const melody = validateMelody(req.body);
  if (typeof melody === "string") {
    return res.status(400).send({ error: melody });
  }

  try {
    const ownerId = req.cookies.userId;
    if ((await userMelodiesApi.countUserMelodies(ownerId)) >= MAX_MELODIES_PER_USER) {
      return res.status(400).send({ error: `You can keep up to ${MAX_MELODIES_PER_USER} melodies` });
    }
    const saved = await userMelodiesApi.addMelody(ownerId, melody.title, melody.abc);
    res.status(201).send(saved);
  } catch (error) {
    logger.info("Error saving melody:", error);
    res.status(400).send({ error: "Could not save melody" });
  }
});

melodiesRouter.put("/:id", async (req, res) => {
  try {
    jwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: "Login required" });
  }

  const melody = validateMelody(req.body);
  if (typeof melody === "string") {
    return res.status(400).send({ error: melody });
  }

  try {
    const saved = await userMelodiesApi.updateMelody(req.cookies.userId, req.params.id, melody.title, melody.abc);
    if (!saved) {
      return res.status(404).send({ error: "Melody not found" });
    }
    res.status(200).send(saved);
  } catch (error) {
    logger.info("Error updating melody:", error);
    res.status(400).send({ error: "Could not update melody" });
  }
});

melodiesRouter.delete("/:id", async (req, res) => {
  try {
    jwtAuth(req);
  } catch (error) {
    return res.status(403).send({ error: "Login required" });
  }

  try {
    const removed = await userMelodiesApi.removeMelody(req.cookies.userId, req.params.id);
    if (!removed) {
      return res.status(404).send({ error: "Melody not found" });
    }
    res.status(204).end();
  } catch (error) {
    logger.info("Error removing melody:", error);
    res.status(400).send({ error: "Could not remove melody" });
  }
});
