import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // Keep production assets portable when served from a preview or subdirectory.
  base: './',
  build: {
    rollupOptions: { input: resolve(import.meta.dirname, 'app.html') },
  },
});
