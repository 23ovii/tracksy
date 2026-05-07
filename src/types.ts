export interface Track {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  albumYear: number;
  trackNumber: number;
  durationMs: number;
  addedAt: string;
  popularity: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  color1: string;
  color2: string;
  imageUrl?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  images: { url: string }[];
}

export interface AuthContextValue {
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  login: (tokenResponse: TokenResponse) => number;
  logout: () => void;
}
