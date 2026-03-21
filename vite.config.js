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
          // Pro analytics views → own chunk
          if (/views\/(insights|profit-dashboard|breakdown|reports)\.js/.test(id)) return 'pro-analytics';
          if (/features\/(analytics-calc|inventory-health|inventory-value|platform-roi|period-compare|sourcing-analytics|listing-score|margin-alerts|flip-score|source-score|arbitrage-alerts|seasonal-calendar|profit-heatmap|kpi-goals|sales-velocity)\.js/.test(id)) return 'pro-analytics';
          // Pro crosslist + marketplace views → own chunk
          if (/views\/(crosslist-dashboard|shipping|sourcing|buyers)\.js/.test(id)) return 'pro-ops';
          if (/features\/(whatnot-show|packing-slip|shipping-rates|ship-labels|haul|haul-receipt|mileage|repricing|comps|photo-tools|batch-list|ai-listing|listing-templates|price-history|social-gallery|deep-links)\.js/.test(id)) return 'pro-ops';
          // Unlimited-tier views → own chunk
          if (/views\/tax-center\.js/.test(id)) return 'unlimited-tier';
          if (/features\/(donations|voice-add)\.js/.test(id)) return 'unlimited-tier';
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
