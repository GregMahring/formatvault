import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // Tailwind v4 runs as a Vite plugin — no postcss.config needed
    tailwindcss(),
    reactRouter(),
    // Resolves @/* path aliases from tsconfig automatically
    tsconfigPaths(),
  ],

  server: {
    port: 5173,
    open: true,
  },

  build: {
    // Source maps only for client bundle — SSR bundle uses externals so manualChunks
    // must be client-only (applied via the reactRouter plugin's client build pass)
    sourcemap: true,
    rollupOptions: {
      output: {
        // manualChunks applies to the client bundle only.
        // React Router SSR externalises React modules, so we guard against SSR context.
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/zustand')) {
            return 'vendor-state';
          }
          if (
            id.includes('node_modules/@codemirror') ||
            id.includes('node_modules/@uiw/react-codemirror') ||
            id.includes('node_modules/@lezer')
          ) {
            return 'vendor-codemirror';
          }
        },
      },
    },
  },

  // Web Worker support — use ES module format for modern browsers
  worker: {
    format: 'es',
  },
});
