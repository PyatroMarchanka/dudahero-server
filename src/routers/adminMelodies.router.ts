import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { adminJwtAuth, getAuthUserId } from "../middleware/jwtAuth";
import { userMelodiesApi } from "../mongo/api/userMelodies";
import { SongModel } from "../mongo/schemas/song";
import { ISongMelody, SongTypes } from "../interfaces/song";
import { REVIEW_STATUSES, ReviewStatus } from "../interfaces/userMelody";
import { validateMelody, validateRoll } from "../utils/melodyValidation";
import { cacheInvalidate } from "../utils/cache";
import { logger } from "../utils/logger";

// Review of the melodies users send in. Every route is for admins only.
export const adminMelodiesRouter = express.Router();

const MAX_COMMENT_LENGTH = 1000;
const MAX_TEXT_LENGTH = 5000;

const requireAdmin = async (req: Request, res: Response) => {
  try {
    await adminJwtAuth(req);
    return true;
  } catch (error) {
    res.status(403).send({ error: (error as Error).message || "Admins only" });
    return false;
  }
};

const readComment = (body: any): string | undefined | false => {
  if (body?.comment === undefined || body.comment === null) return undefined;
  if (typeof body.comment !== "string" || body.comment.length > MAX_COMMENT_LENGTH) return false;
  return body.comment.trim() || undefined;
};

// Why a database step failed, in words an admin can act on (these routes are admin only)
const reasonOf = (error: any): string => {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0];
    return `A catalog song with the same ${field || "id"} already exists`;
  }
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return error.message;
  }
  return error?.message ? `Server error: ${error.message}` : "Server error";
};

const isShortString = (value: unknown, max = 200): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const optionalText = (value: unknown, max = MAX_TEXT_LENGTH) =>
  value === undefined || value === null || (typeof value === "string" && value.length <= max);

// The catalog fields an admin fills in when approving (prefilled by the frontend from the melody)
interface CatalogFields {
  name: string;
  type: string;
  bagpipesToPlay: string[];
  timeSignature: string;
  originalTempo: number;
  labels: string[];
  about?: string;
  transcribedBy?: string;
}

const validateCatalogFields = (body: any): CatalogFields | string => {
  const { name, type, bagpipesToPlay, timeSignature, originalTempo, labels, about, transcribedBy } = body || {};
  if (!isShortString(name)) return "A song name is required";
  if (!Object.values(SongTypes).includes(type)) return "Choose a song type";
  if (
    !Array.isArray(bagpipesToPlay) ||
    !bagpipesToPlay.length ||
    bagpipesToPlay.length > 10 ||
    !bagpipesToPlay.every((bagpipe: unknown) => isShortString(bagpipe, 10))
  ) {
    return "Choose at least one bagpipe";
  }
  if (typeof timeSignature !== "string" || !/^\d{1,2}\/\d{1,2}$/.test(timeSignature)) {
    return "Invalid time signature";
  }
  // Catalog convention: originalTempo is double the real BPM
  if (!Number.isInteger(originalTempo) || originalTempo < 40 || originalTempo > 800) {
    return "Invalid tempo";
  }
  const labelList = labels === undefined ? [] : labels;
  if (
    !Array.isArray(labelList) ||
    labelList.length > 20 ||
    !labelList.every((label: unknown) => isShortString(label, 50))
  ) {
    return "Invalid labels";
  }
  if (!optionalText(about) || !optionalText(transcribedBy, 200)) {
    return "Text is too long";
  }
  return {
    name: name.trim(),
    type,
    bagpipesToPlay,
    timeSignature,
    originalTempo,
    labels: labelList,
    ...(about && { about }),
    ...(transcribedBy && { transcribedBy: transcribedBy.trim() }),
  };
};

// Catalog ids look like "<type>_<Name-With-Dashes>"; the melody id's tail keeps them unique
const catalogIdFor = (type: string, name: string, melodyId: string) =>
  `${type}_${name.trim().replace(/[\s/\\?#%]+/g, "-")}-${melodyId.slice(-6)}`;

const melodyCopy = (melody: any): ISongMelody | null => {
  if (melody.format === "roll") {
    const roll = validateRoll(melody.roll);
    return typeof roll === "string" ? null : { format: "roll", roll };
  }
  return typeof melody.abc === "string" && melody.abc.trim() ? { format: "abc", abc: melody.abc } : null;
};

const invalidateSongCaches = async (songId?: string) => {
  await cacheInvalidate("songs:all");
  await cacheInvalidate("songs:top:*");
  await cacheInvalidate("songs:shortnames");
  if (songId) await cacheInvalidate(`songs:${songId}`);
};

// GET /v1/admin/melodies?status=pending&page=0
adminMelodiesRouter.get("/", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const status = (typeof req.query.status === "string" ? req.query.status : "pending") as ReviewStatus;
  if (!REVIEW_STATUSES.includes(status)) {
    return res.status(400).send({ error: "Unknown status" });
  }
  const page = Math.max(0, parseInt(String(req.query.page ?? "0"), 10) || 0);

  try {
    res.status(200).send(await userMelodiesApi.getMelodiesByStatus(status, page));
  } catch (error) {
    logger.info("Error listing melodies for review:", error);
    res.status(400).send({ error: "Could not load melodies" });
  }
});

adminMelodiesRouter.get("/counts", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    res.status(200).send(await userMelodiesApi.countByStatus());
  } catch (error) {
    logger.info("Error counting melodies for review:", error);
    res.status(400).send({ error: "Could not count melodies" });
  }
});

adminMelodiesRouter.get("/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const melody = await userMelodiesApi.getAdminMelody(req.params.id);
    if (!melody) {
      return res.status(404).send({ error: "Melody not found" });
    }
    res.status(200).send(melody);
  } catch (error) {
    logger.info("Error fetching melody for review:", error);
    res.status(400).send({ error: "Could not load melody" });
  }
});

// Admin edits the notes or title of any melody. Its review status doesn't change.
adminMelodiesRouter.put("/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const content = validateMelody(req.body);
  if (typeof content === "string") {
    return res.status(400).send({ error: content });
  }

  try {
    const melody = await userMelodiesApi.adminUpdateMelody(getAuthUserId(req), req.params.id, content);
    if (!melody) {
      return res.status(404).send({ error: "Melody not found" });
    }
    // An admin's edit of an approved melody goes straight to its catalog song
    if (melody.reviewStatus === "approved" && melody.catalogSongId && mongoose.Types.ObjectId.isValid(melody.catalogSongId)) {
      const copy = melodyCopy(melody);
      if (copy) {
        await SongModel.findByIdAndUpdate(melody.catalogSongId, { $set: { melody: copy, updatedAt: new Date() } });
        await invalidateSongCaches(melody.catalogSongId);
      }
    }
    res.status(200).send(melody);
  } catch (error) {
    logger.info("Error updating melody as admin:", error);
    res.status(500).send({ error: `Could not update melody. ${reasonOf(error)}` });
  }
});

// Approve: copy the melody into the song catalog (or refresh the copy made by an earlier approval)
adminMelodiesRouter.post("/:id/approve", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const fields = validateCatalogFields(req.body);
  if (typeof fields === "string") {
    return res.status(400).send({ error: fields });
  }
  const comment = readComment(req.body);
  if (comment === false) {
    return res.status(400).send({ error: `Comment is too long (max ${MAX_COMMENT_LENGTH} characters)` });
  }

  try {
    const melody: any = await userMelodiesApi.getRawMelody(req.params.id);
    if (!melody) {
      return res.status(404).send({ error: "Melody not found" });
    }
    if ((melody.reviewStatus || "draft") === "draft") {
      return res.status(400).send({ error: "This melody wasn't sent for review" });
    }
    const copy = melodyCopy(melody);
    if (!copy) {
      return res.status(400).send({ error: "The melody has no notes to add to the catalog" });
    }

    const melodyId = melody._id.toString();
    const existing =
      melody.catalogSongId && mongoose.Types.ObjectId.isValid(melody.catalogSongId)
        ? await SongModel.findById(melody.catalogSongId)
        : null;

    let song: any;
    if (existing) {
      // Keep the catalog id, so links to the song keep working
      song = await SongModel.findByIdAndUpdate(
        existing._id,
        { $set: { ...fields, source: "melody", sourceMelodyId: melodyId, melody: copy, updatedAt: new Date() } },
        { new: true, runValidators: true }
      );
    } else {
      song = await SongModel.create({
        ...fields,
        id: catalogIdFor(fields.type, fields.name, melodyId),
        // Required by the schema and used by the frontend to tell songs apart; there is no file behind it
        pathName: `melody/${melodyId}`,
        source: "melody",
        sourceMelodyId: melodyId,
        melody: copy,
        links: [],
        stats: { views: 0 },
      });
    }
    await invalidateSongCaches(song._id.toString());

    const reviewed = await userMelodiesApi.setReview(melodyId, {
      status: "approved",
      adminId: getAuthUserId(req),
      comment,
      catalogSongId: song._id.toString(),
    });
    res.status(200).send({ melody: reviewed, song });
  } catch (error) {
    logger.info("Error approving melody:", error);
    res.status(500).send({ error: `Could not approve melody. ${reasonOf(error)}` });
  }
});

// Reject, optionally taking an earlier approved copy out of the catalog
adminMelodiesRouter.post("/:id/reject", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const comment = readComment(req.body);
  if (comment === false) {
    return res.status(400).send({ error: `Comment is too long (max ${MAX_COMMENT_LENGTH} characters)` });
  }

  try {
    const melody: any = await userMelodiesApi.getRawMelody(req.params.id);
    if (!melody) {
      return res.status(404).send({ error: "Melody not found" });
    }
    if ((melody.reviewStatus || "draft") === "draft") {
      return res.status(400).send({ error: "This melody wasn't sent for review" });
    }

    let catalogSongId: string | null | undefined;
    if (req.body?.removeFromCatalog === true && melody.catalogSongId) {
      await SongModel.findByIdAndDelete(melody.catalogSongId);
      await invalidateSongCaches(melody.catalogSongId);
      catalogSongId = null;
    }

    const reviewed = await userMelodiesApi.setReview(melody._id.toString(), {
      status: "rejected",
      adminId: getAuthUserId(req),
      comment,
      catalogSongId,
    });
    res.status(200).send({ melody: reviewed });
  } catch (error) {
    logger.info("Error rejecting melody:", error);
    res.status(500).send({ error: `Could not reject melody. ${reasonOf(error)}` });
  }
});
