import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for flexible deployment on Vercel or GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});