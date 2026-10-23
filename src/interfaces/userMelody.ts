export interface IUserMelody {
  // _id of the user who submitted the melody
  ownerId: string;
  title: string;
  // Source of truth: the frontend converts ABC to MIDI with abcjs when playing
  abc: string;
  createdAt?: Date;
  updatedAt?: Date;
}
