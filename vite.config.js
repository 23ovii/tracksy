import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Plugin is a no-op when authToken is absent (local dev without token)
      silent: true,
    }),
  ],
  build: {
    sourcemap: 'hidden',
  },
  base: '/',
  server: {
    host: '127.0.0.1',
  },
});
