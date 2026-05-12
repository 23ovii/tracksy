export interface SpotifyImage {
  url: string;
  width?: number;
  height?: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  name: string;
  release_date?: string;
  images?: SpotifyImage[];
}

export interface SpotifyTrackObject {
  id: string | null;
  uri: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  track_number: number;
  duration_ms: number;
  popularity: number;
}

export interface SpotifyPlaylistTrackItem {
  added_at: string;
  is_local: boolean;
  track: SpotifyTrackObject | null;
}

export interface SpotifyPaging<T> {
  items: T[];
  next: string | null;
  total: number;
}

export interface SpotifyPlaylistObject {
  id: string;
  name: string;
  owner: { id: string };
  tracks: { total: number };
  images?: SpotifyImage[];
}

export interface SpotifyUserObject {
  id: string;
  display_name: string | null;
  images?: SpotifyImage[];
}

export interface SpotifyErrorResponse {
  error?: { message?: string; status?: number };
  error_description?: string;
}
