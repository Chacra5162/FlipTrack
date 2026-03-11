// vite.config.js
import { defineConfig } from "file:///sessions/magical-gallant-lovelace/mnt/New%20folder--New%20folder/fliptrack/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "/sessions/magical-gallant-lovelace/mnt/New folder--New folder/fliptrack";
var vite_config_default = defineConfig({
  base: "./",
  // Relative paths for GitHub Pages compatibility
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        app: resolve(__vite_injected_original_dirname, "app.html"),
        index: resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        // Code splitting: separate heavy dependencies and gated views
        manualChunks(id) {
          if (id.includes("@supabase/supabase-js")) return "vendor-supabase";
          if (/views\/(insights|profit-dashboard|breakdown|reports|crosslist-dashboard|shipping|sourcing|buyers)\.js/.test(id)) return "pro-tier";
          if (/features\/(whatnot-show|packing-slip|shipping-rates|haul|mileage|price-history|repricing|comps|photo-tools|batch-list|ai-listing|inventory-value|ship-labels|listing-templates)\.js/.test(id)) return "pro-tier";
          if (/views\/tax-center\.js/.test(id)) return "unlimited-tier";
        }
      }
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500
  },
  server: {
    open: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvbWFnaWNhbC1nYWxsYW50LWxvdmVsYWNlL21udC9OZXcgZm9sZGVyLS1OZXcgZm9sZGVyL2ZsaXB0cmFja1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL21hZ2ljYWwtZ2FsbGFudC1sb3ZlbGFjZS9tbnQvTmV3IGZvbGRlci0tTmV3IGZvbGRlci9mbGlwdHJhY2svdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL21hZ2ljYWwtZ2FsbGFudC1sb3ZlbGFjZS9tbnQvTmV3JTIwZm9sZGVyLS1OZXclMjBmb2xkZXIvZmxpcHRyYWNrL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6ICcuLycsICAvLyBSZWxhdGl2ZSBwYXRocyBmb3IgR2l0SHViIFBhZ2VzIGNvbXBhdGliaWxpdHlcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIGFwcDogcmVzb2x2ZShfX2Rpcm5hbWUsICdhcHAuaHRtbCcpLFxuICAgICAgICBpbmRleDogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIENvZGUgc3BsaXR0aW5nOiBzZXBhcmF0ZSBoZWF2eSBkZXBlbmRlbmNpZXMgYW5kIGdhdGVkIHZpZXdzXG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJykpIHJldHVybiAndmVuZG9yLXN1cGFiYXNlJztcbiAgICAgICAgICAvLyBQcm8tdGllciB2aWV3cyArIGZlYXR1cmVzIFx1MjE5MiBzaW5nbGUgY2h1bmsgKGF2b2lkcyBjaXJjdWxhciBkZXBlbmRlbmN5KVxuICAgICAgICAgIGlmICgvdmlld3NcXC8oaW5zaWdodHN8cHJvZml0LWRhc2hib2FyZHxicmVha2Rvd258cmVwb3J0c3xjcm9zc2xpc3QtZGFzaGJvYXJkfHNoaXBwaW5nfHNvdXJjaW5nfGJ1eWVycylcXC5qcy8udGVzdChpZCkpIHJldHVybiAncHJvLXRpZXInO1xuICAgICAgICAgIGlmICgvZmVhdHVyZXNcXC8od2hhdG5vdC1zaG93fHBhY2tpbmctc2xpcHxzaGlwcGluZy1yYXRlc3xoYXVsfG1pbGVhZ2V8cHJpY2UtaGlzdG9yeXxyZXByaWNpbmd8Y29tcHN8cGhvdG8tdG9vbHN8YmF0Y2gtbGlzdHxhaS1saXN0aW5nfGludmVudG9yeS12YWx1ZXxzaGlwLWxhYmVsc3xsaXN0aW5nLXRlbXBsYXRlcylcXC5qcy8udGVzdChpZCkpIHJldHVybiAncHJvLXRpZXInO1xuICAgICAgICAgIC8vIFVubGltaXRlZC10aWVyIHZpZXdzIFx1MjE5MiBvd24gY2h1bmtcbiAgICAgICAgICBpZiAoL3ZpZXdzXFwvdGF4LWNlbnRlclxcLmpzLy50ZXN0KGlkKSkgcmV0dXJuICd1bmxpbWl0ZWQtdGllcic7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gU2V0IGNodW5rIHNpemUgd2FybmluZyBsaW1pdFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBvcGVuOiB0cnVlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJZLFNBQVMsb0JBQW9CO0FBQ3hhLFNBQVMsZUFBZTtBQUR4QixJQUFNLG1DQUFtQztBQUd6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUE7QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLEtBQUssUUFBUSxrQ0FBVyxVQUFVO0FBQUEsUUFDbEMsT0FBTyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxNQUN4QztBQUFBLE1BQ0EsUUFBUTtBQUFBO0FBQUEsUUFFTixhQUFhLElBQUk7QUFDZixjQUFJLEdBQUcsU0FBUyx1QkFBdUIsRUFBRyxRQUFPO0FBRWpELGNBQUksd0dBQXdHLEtBQUssRUFBRSxFQUFHLFFBQU87QUFDN0gsY0FBSSxzTEFBc0wsS0FBSyxFQUFFLEVBQUcsUUFBTztBQUUzTSxjQUFJLHdCQUF3QixLQUFLLEVBQUUsRUFBRyxRQUFPO0FBQUEsUUFDL0M7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
