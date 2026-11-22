export enum SongTypes {
  Belarusian = "belarusian",
  Medieval = "medieval",
  Irish = "irish",
  Schotland = "schotland",
  Scandinavian = "scandinavian",
  Balkan = "balkan",
  Polish = "polish",
  Other = "other",
}

export type TimeSignatures =
  | "3/4"
  | "4/4"
  | "5/4"
  | "6/4"
  | "6/8"
  | "7/8"
  | "8/8"
  | "9/8"
  | "10/8"
  | "11/8";

import { IMelodyRoll } from "./userMelody";

// The notes of a catalog song that came from a user's melody, copied when an
// admin approved it. The frontend builds the MIDI from them in the browser.
export interface ISongMelody {
  format: "abc" | "roll";
  abc?: string;
  roll?: IMelodyRoll;
}

export type VersionLevel = "basic" | "intermediate" | "advanced";
export const VERSION_LEVELS: VersionLevel[] = ["basic", "intermediate", "advanced"];

// Another version of a song: its own notes, by its own author. The song's
// name, about, lyrics, type, labels and stats are shared by all versions.
export interface ISongVersion {
  _id?: any;
  // e.g. "With ornaments", "As played by ..."
  label: string;
  // The bagpiper or arranger, free text
  author?: string;
  level?: VersionLevel;
  // The notes, the same fields as on a song
  pathName: string;
  source?: "file" | "melody";
  sourceMelodyId?: string;
  melody?: ISongMelody;
  timeSignature: TimeSignatures;
  originalTempo: number;
  transcribedBy?: string;
  links?: SongLink[];
  createdAt?: Date;
  updatedAt?: Date;
}

// The fields a version has of its own; "make default" swaps them with the song's
export const VERSION_MUSIC_FIELDS = [
  "pathName",
  "source",
  "sourceMelodyId",
  "melody",
  "timeSignature",
  "originalTempo",
  "transcribedBy",
] as const;

export interface ISong {
  name: string;
  type: string;
  bagpipesToPlay: BagpipeTypes[];
  timeSignature: TimeSignatures;
  pathName: string;
  labels: string[];
  id: string;
  about: string;
  transcribedBy: string;
  originalTempo: number;
  links: SongLink[];
  lyrycs?: string;
  // "file": a .mid file in the frontend's public/midi (every song without a source).
  // "melody": a user's melody approved into the catalog, played from `melody`.
  source?: "file" | "melody";
  sourceMelodyId?: string;
  melody?: ISongMelody;
  // The song's own notes are its default version (shown first, normally the
  // basic one). These describe it; absent label = "Basic".
  versionLabel?: string;
  versionAuthor?: string;
  versionLevel?: VersionLevel;
  // Every other version. Absent = the song has only its default version.
  versions?: ISongVersion[];
  stats: IStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongLink {
  type: LinkTypes;
  name: string;
  url: string;
}

export enum LinkTypes {
  Audio = "audio",
  Video = "video",
  Other = "other",
}

export enum BagpipeTypes {
  BelarusianTraditionalDuda = "bd",
  BelarusianNONTraditionalDuda = "bnd",
  BelarusianOpenDuda = "bod",
  Dudelsack = "ddl",
  Highlander = "ghb",
}

export interface IStats {
  views: number;
  likes: number;
  lastViewed: Date;
}

