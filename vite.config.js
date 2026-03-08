import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',  // Relative paths for GitHub Pages compatibility
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
        index: resolve(__dirname, 'index.html'),
      },
      output: {
        // Code splitting: separate heavy dependencies into their own chunks
        manualChunks: {
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 300,
  },
  server: {
    open: true,
  },
});
