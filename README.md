# Tracksy

Tracksy is a React + Vite frontend MVP for Spotify playlist management. It includes a mocked OAuth login flow, playlist browsing, track inspection, and placeholder UI elements for future features like cleaning duplicates, sorting by vibe, and improving recommendations.

## Tech stack

- React
- Vite
- React Router
- TailwindCSS

## Project structure

- `src/components` — reusable UI components
- `src/pages` — route screens for Home, Dashboard, Callback
- `src/hooks` — custom hooks for auth and Spotify data
- `src/services` — mocked Spotify service data
- `src/context` — authentication provider
- `src/utils` — formatting helpers
- `src/styles` — Tailwind setup files

## Getting started

### 1. Set up Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in:
   - **App name**: `Tracksy` (or whatever you want)
   - **App description**: `Spotify playlist management tool`
   - **Redirect URI**: `http://localhost:5173/callback`
5. Copy the **Client ID** from your app dashboard

### 2. Configure environment

Copy `.env.example` to `.env` and add your Spotify Client ID:

```bash
cp .env.example .env
```

Edit `.env` and replace `your_spotify_client_id_here` with your actual Client ID:

```env
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id_here
VITE_SPOTIFY_REDIRECT_URI=https://23ovii.github.io/tracksy/callback
VITE_SPOTIFY_SCOPE=playlist-read-private playlist-read-collaborative user-read-private
```

### 3. Install and run locally

```bash
npm install
npm run dev
```

## Deployment to GitHub Pages

### 1. Set up GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add these secrets:

- `VITE_SPOTIFY_CLIENT_ID`: Your Spotify Client ID
- `VITE_SPOTIFY_REDIRECT_URI`: `https://23ovii.github.io/tracksy/callback`

**Note**: The scope (`playlist-read-private playlist-read-collaborative user-read-private`) is now hardcoded in the code for simplicity and doesn't need to be a secret.

### 2. Enable GitHub Pages

In your repository **Settings → Pages**:
- Set **Source** to "GitHub Actions"
- The workflow will automatically deploy on every push to main

### 3. Update Spotify App Redirect URI

In your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), update your app's redirect URI to:
```
https://23ovii.github.io/tracksy/callback
```

### 4. Deploy

Push your changes to the `main` branch. The GitHub Action will automatically build and deploy your app.

## Available routes

- `/` — login home screen
- `/dashboard` — playlist overview
- `/callback` — OAuth callback handler

## Notes

This app now includes a real Spotify OAuth PKCE flow. Make sure your Spotify app's redirect URI matches exactly: `https://23ovii.github.io/tracksy/callback` for production or `http://localhost:5173/callback` for local development

### 2. Enable GitHub Pages

In your repository **Settings → Pages**:
- Set **Source** to "GitHub Actions"
- The workflow will automatically deploy on every push to main

### 3. Update Spotify App Redirect URI

In your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), update your app's redirect URI to:
```
https://23ovii.github.io/tracksy/callback
```

### 4. Deploy

Push your changes to the `main` branch. The GitHub Action will automatically build and deploy your app.

## Available routes

- `/` — login home screen
- `/dashboard` — playlist overview
- `/callback` — OAuth callback handler

## Notes

This app now includes a real Spotify OAuth PKCE flow. Make sure your Spotify app's redirect URI matches exactly: `https://23ovii.github.io/tracksy/callback` for production or `http://localhost:5173/callback` for local development.
