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
        // Code splitting: separate heavy dependencies and gated views
        manualChunks(id) {
          if (id.includes('@supabase/supabase-js')) return 'vendor-supabase';
          // Pro-tier views + features → single chunk (avoids circular dependency)
          if (/views\/(insights|profit-dashboard|breakdown|reports|crosslist-dashboard|shipping|sourcing|buyers)\.js/.test(id)) return 'pro-tier';
          if (/features\/(whatnot-show|packing-slip|shipping-rates|haul|mileage|price-history|repricing|comps|photo-tools|batch-list|ai-listing|inventory-value|ship-labels|listing-templates)\.js/.test(id)) return 'pro-tier';
          // Unlimited-tier views → own chunk
          if (/views\/tax-center\.js/.test(id)) return 'unlimited-tier';
        },
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
  },
  server: {
    open: true,
  },
});
