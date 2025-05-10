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