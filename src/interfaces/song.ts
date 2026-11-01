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

