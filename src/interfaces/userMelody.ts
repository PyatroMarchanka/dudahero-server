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
}

export type MelodyFormat = "abc" | "roll";

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
  createdAt?: Date;
  updatedAt?: Date;
}
