# Tracksy

Sort your Spotify playlists by BPM, energy, popularity, and more — then save the new order back to Spotify.

## Setup

```bash
git clone https://github.com/23ovii/tracksy.git
cd tracksy
npm install
cp .env.example .env   # add your Spotify Client ID
npm run dev            # http://127.0.0.1:5173
```

## Environment

| Variable | Value |
|---|---|
| `VITE_SPOTIFY_CLIENT_ID` | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `VITE_SPOTIFY_REDIRECT_URI` | `http://127.0.0.1:5173/callback` for local dev |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |
| `npm run lint` | Check for issues |
