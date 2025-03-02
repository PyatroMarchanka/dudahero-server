export interface IPlaylist {
  name: string;
  songsIds: string[];
  userId: string;
  _id?: string;
}

export interface PlaylistSong {
  name: string;
  tags: string[];
  _id?: string;
}

export interface PlaylistTags {
  userId: string;
  tags: string[];
  _id?: string;
}
