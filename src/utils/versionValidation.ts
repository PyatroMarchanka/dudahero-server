import { ISongVersion, VERSION_LEVELS, VersionLevel } from "../interfaces/song";
import { validateSongMelody } from "./melodyValidation";

const MAX_LABEL_LENGTH = 100;
const MAX_AUTHOR_LENGTH = 200;
const MAX_LINKS = 20;

const isText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const optionalText = (value: unknown, max: number) =>
  value === undefined || value === null || value === "" || (typeof value === "string" && value.length <= max);

const cleanText = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

// What describes a version (also the song's own default version)
export interface VersionInfo {
  label?: string;
  author?: string;
  level?: VersionLevel;
}

export const validateVersionInfo = (body: any, labelRequired: boolean): VersionInfo | string => {
  const { label, author, level } = body || {};
  if (labelRequired ? !isText(label, MAX_LABEL_LENGTH) : !optionalText(label, MAX_LABEL_LENGTH)) {
    return "A version name is required (max 100 characters)";
  }
  if (!optionalText(author, MAX_AUTHOR_LENGTH)) {
    return "Author is too long";
  }
  if (level !== undefined && level !== null && level !== "" && !VERSION_LEVELS.includes(level)) {
    return "Unknown level";
  }
  return {
    label: cleanText(label),
    author: cleanText(author),
    level: level || undefined,
  };
};

// A version an admin adds or edits from the song editor. Its notes are a
// .mid file (pathName) or notes stored in the database (melody).
export const validateVersion = (body: any): Omit<ISongVersion, "_id" | "createdAt" | "updatedAt"> | string => {
  const info = validateVersionInfo(body, true);
  if (typeof info === "string") return info;

  const { timeSignature, originalTempo, pathName, melody, transcribedBy, links, sourceMelodyId } = body || {};
  if (typeof timeSignature !== "string" || !/^\d{1,2}\/\d{1,2}$/.test(timeSignature)) {
    return "Invalid time signature";
  }
  // Catalog convention: originalTempo is double the real BPM
  if (typeof originalTempo !== "number" || !Number.isFinite(originalTempo) || originalTempo < 20 || originalTempo > 800) {
    return "Invalid tempo";
  }
  if (!optionalText(transcribedBy, MAX_AUTHOR_LENGTH)) {
    return "Transcribed by is too long";
  }
  if (links !== undefined && links !== null) {
    if (
      !Array.isArray(links) ||
      links.length > MAX_LINKS ||
      !links.every((link: any) => link && isText(link.url, 2000) && optionalText(link.name, 200))
    ) {
      return "Invalid links";
    }
  }

  let notes: Pick<ISongVersion, "pathName" | "source" | "melody">;
  if (melody !== undefined && melody !== null) {
    const clean = validateSongMelody(melody);
    if (typeof clean === "string") return clean;
    // Required by the schema and used by the frontend to tell tunes apart; there is no file behind it
    notes = { pathName: isText(pathName, 300) ? pathName : "", source: "melody", melody: clean };
  } else if (isText(pathName, 300)) {
    notes = { pathName: pathName.trim(), source: "file" };
  } else {
    return "A .mid file path or notes are required";
  }

  return {
    label: info.label as string,
    ...(info.author && { author: info.author }),
    ...(info.level && { level: info.level }),
    ...notes,
    timeSignature: timeSignature as ISongVersion["timeSignature"],
    originalTempo,
    ...(cleanText(transcribedBy) && { transcribedBy: cleanText(transcribedBy) }),
    links: (links || []).map((link: any) => ({
      type: typeof link.type === "string" ? link.type : "Other",
      name: cleanText(link.name) || link.url,
      url: link.url.trim(),
    })),
    ...(typeof sourceMelodyId === "string" && sourceMelodyId && { sourceMelodyId }),
  };
};
