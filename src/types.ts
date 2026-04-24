export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  durationMs: number;
  addedAt: string;
  popularity: number;
  bpm: number;
  energy: number;
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

export interface AuthContextValue {
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  login: (tokenResponse: TokenResponse) => number;
  logout: () => void;
}
