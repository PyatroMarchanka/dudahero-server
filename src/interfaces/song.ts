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
  
  export interface ISong {
    name: string;
    type: string;
    bagpipesToPlay: BagpipeTypes[];
    timeSignature: TimeSignatures;
    pathName: string;
    labels: string[]
    id: string;
    about: string;
    trinscribedBy: string;
    originalTempo: number;
  }


export enum BagpipeTypes {
    BelarusianTraditionalDuda = "bd",
    BelarusianNONTraditionalDuda = "bnd",
    BelarusianOpenDuda = "bod",
    Dudelsack = "ddl",
    Highlander = "ghb",
  }
  
