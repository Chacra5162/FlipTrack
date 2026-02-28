import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // Relative paths for GitHub Pages compatibility
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
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
