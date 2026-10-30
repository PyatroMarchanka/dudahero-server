import express from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { MAX_MELODIES_PER_USER, MelodyContent, userMelodiesApi } from "../mongo/api/userMelodies";
import { IMelodyRoll } from "../interfaces/userMelody";
import { logger } from "../utils/logger";

export const melodiesRouter = express.Router();

// Same cap the frontend's abcToMidi enforces
const MAX_ABC_LENGTH = 20_000;
const MAX_TITLE_LENGTH = 200;
// Piano-roll caps, far past any real tune; also keeps a request well under the 100kb body limit
const MAX_ROLL_NOTES = 3_000;
const MAX_ROLL_BARS = 500;

const isInt = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

// Checks the shape of a piano-roll melody and returns a clean copy, so nothing
// the client added beyond these fields is stored.
const validateRoll = (roll: any): IMelodyRoll | string => {
  if (!roll || typeof roll !== "object") {
    return "Melody notes are required";
  }
  const { bagpipeType, timeSignature, bpm, ppq, bars, notes } = roll;
  if (roll.version !== 1) {
    return "Unknown melody version";
  }
  if (typeof bagpipeType !== "string" || !bagpipeType || bagpipeType.length > 40) {
    return "Invalid bagpipe type";
  }
  if (typeof timeSignature !== "string" || !/^\d{1,2}\/\d{1,2}$/.test(timeSignature)) {
    return "Invalid time signature";
  }
  if (!isInt(bpm, 20, 400) || !isInt(ppq, 24, 960) || !isInt(bars, 1, MAX_ROLL_BARS)) {
    return "Invalid tempo or length";
  }
  if (!Array.isArray(notes) || !notes.length) {
    return "Add at least one note";
  }
  if (notes.length > MAX_ROLL_NOTES) {
    return `Too many notes (max ${MAX_ROLL_NOTES})`;
  }
  const maxTick = ppq * 4 * 16 * MAX_ROLL_BARS;
  const validNotes = notes.every(
    (note: unknown) =>
      Array.isArray(note) &&
      note.length === 3 &&
      isInt(note[0], 0, 127) &&
      isInt(note[1], 0, maxTick) &&
      isInt(note[2], 1, maxTick)
  );
  if (!validNotes) {
    return "Invalid notes";
  }

  return {
    version: 1,
    bagpipeType,
    timeSignature,
    bpm,
    ppq,
    bars,
    notes: notes.map((note: number[]) => [note[0], note[1], note[2]] as [number, number, number]),
  };
};

// Light sanity check only: the real parsing of ABC happens in the browser with
// abcjs, which also rejects tunes without notes before the form can be submitted.
const validateMelody = (body: any): MelodyContent | string => {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return "A title is required";
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return `Title is too long (max ${MAX_TITLE_LENGTH} characters)`;
  }

  if (body?.format === "roll") {
    const roll = validateRoll(body.roll);
    return typeof roll === "string" ? roll : { title, format: "roll", roll };
  }

  const abc = body?.abc;
  if (typeof abc !== "string" || !abc.trim()) {
    return "ABC notation is required";
  }
  if (abc.length > MAX_ABC_LENGTH) {
    return `ABC notation is too large (max ${MAX_ABC_LENGTH} characters)`;
  }

  return { title, format: "abc", abc };
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
    const saved = await userMelodiesApi.addMelody(ownerId, melody);
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
    const saved = await userMelodiesApi.updateMelody(req.cookies.userId, req.params.id, melody);
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
