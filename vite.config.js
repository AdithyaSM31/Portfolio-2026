import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    // three.js alone is ~500 kB minified; the page is a single WebGL experience
    chunkSizeWarningLimit: 900,
  },
});
