import { Languages } from "./common";
import { BagpipeTypes } from "./song";

export interface User {
  name: string;
  email: string;
  picture?: string;
  settings: UserSettings;
  updatedAt?: Date;
  createdAt?: Date;
  isAdmin?: boolean;
  // `id` strings of the songs the user marked as favorite
  favoriteSongs?: string[];
}

export enum Views {
  MusicSheet = "musicSheet",
  Bagpipe = "bagpipe",
}

export interface UserSettings {
  bagpipeType: BagpipeTypes;
  tempo: number;
  isPreclick: boolean;
  language: Languages;
  transpose: number;
  // Tonality of the whistle on the flute site, kept apart from the bagpipe `transpose`
  fluteTranspose?: number;
  lastSongUrl?: string;
  view: Views;
}

export const defaultSetings: UserSettings = {
    tempo: 240,
    isPreclick: true,
    bagpipeType: BagpipeTypes.BelarusianTraditionalDuda,
    language: Languages.English,
    transpose: 0,
    view: Views.Bagpipe,
  }