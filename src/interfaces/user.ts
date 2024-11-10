import { Languages } from "./common";
import { BagpipeTypes } from "./song";

export interface User {
  name: string;
  email: string;
  picture?: string;
  settings: UserSettings;
  updatedAt?: Date;
}

export interface UserSettings {
  bagpipeType: BagpipeTypes;
  tempo: number;
  isPreclick: boolean;
  language: Languages;
  transpose: number;
  lastSongUrl?: string;
}

export const defaultSetings: UserSettings = {
    tempo: 240,
    isPreclick: true,
    bagpipeType: BagpipeTypes.BelarusianTraditionalDuda,
    language: Languages.English,
    transpose: 0,
  }