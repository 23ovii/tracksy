import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { host: '127.0.0.1' },
});
