import { Languages } from "./common";
import { BagpipeTypes } from "./song";

export interface User {
    name: string;
    email: string;
    settings?: UserSettings;
}

export interface UserSettings {
    bagpipe: BagpipeTypes;
    tempo: number;
    userPreclick: boolean;
    language: Languages;
}