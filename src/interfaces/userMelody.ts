// A melody drawn in the piano-roll editor. Pitches are MIDI numbers written
// for an A instrument (like the catalog .mid files); ticks use `ppq` per
// quarter note. Each note is [pitch, startTick, durationTicks].
export interface IMelodyRoll {
  version: 1;
  // The bagpipe whose hole lines the melody was written on
  bagpipeType: string;
  timeSignature: string;
  // Real beats per minute
  bpm: number;
  ppq: number;
  bars: number;
  notes: [number, number, number][];
  // Pitch class of the key's tonic (0 = C), written for an A instrument. Absent means A.
  tonic?: number;
}

export type MelodyFormat = "abc" | "roll";

// draft: only the owner works on it. pending: sent for review. approved: an
// admin added it to the song catalog. rejected: an admin sent it back.
export type ReviewStatus = "draft" | "pending" | "approved" | "rejected";
export const REVIEW_STATUSES: ReviewStatus[] = ["draft", "pending", "approved", "rejected"];

export interface IUserMelody {
  // _id of the user who submitted the melody
  ownerId: string;
  title: string;
  // Records saved before the editor existed have no format: they are "abc"
  format?: MelodyFormat;
  // Source of truth for "abc" melodies: the frontend converts ABC to MIDI with abcjs when playing
  abc?: string;
  // Source of truth for "roll" melodies: the frontend builds the MIDI from the notes
  roll?: IMelodyRoll;
  // Records saved before reviews existed have no status: they are "draft"
  reviewStatus?: ReviewStatus;
  // Last time the owner sent it for review
  submittedAt?: Date;
  // _id of the admin who approved or rejected it, and when
  reviewedBy?: string;
  reviewedAt?: Date;
  // Optional note from the admin to the owner
  reviewComment?: string;
  // _id of whoever saved it last (the owner, or an admin editing it)
  lastEditedBy?: string;
  // _id of the catalog song made from it on approval
  catalogSongId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
