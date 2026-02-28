import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // Relative paths for GitHub Pages compatibility
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep a single JS bundle for simplicity (no code splitting for now)
        manualChunks: undefined,
      },
    },
  },
  server: {
    open: true,
  },
});
