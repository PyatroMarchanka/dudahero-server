import { IMelodyRoll } from "../interfaces/userMelody";
import { MelodyContent } from "../mongo/api/userMelodies";

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
export const validateRoll = (roll: any): IMelodyRoll | string => {
  if (!roll || typeof roll !== "object") {
    return "Melody notes are required";
  }
  const { bagpipeType, timeSignature, bpm, ppq, bars, notes, tonic } = roll;
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
  if (tonic !== undefined && !isInt(tonic, 0, 11)) {
    return "Invalid key";
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
    ...(tonic !== undefined && { tonic }),
  };
};

// Light sanity check only: the real parsing of ABC happens in the browser with
// abcjs, which also rejects tunes without notes before the form can be submitted.
export const validateMelody = (body: any): MelodyContent | string => {
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

