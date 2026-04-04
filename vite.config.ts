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

  // Scan all route files so Vite discovers every dependency upfront.
  // Without this, route-specific deps (e.g. @radix-ui/react-tabs, codemirror)
  // are discovered on first navigation, triggering re-optimization that creates
  // duplicate React instances and "Invalid hook call" errors.
  optimizeDeps: {
    entries: ['src/routes/**/*.tsx', 'src/components/**/*.tsx'],
  },

  server: {
    port: 5173,
    open: true,
  },

  build: {
    // Source maps in dev/CI only — never expose server code in production
    sourcemap: process.env['NODE_ENV'] !== 'production',
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
          // Consolidate all Radix UI primitives into one shared chunk.
          // Without this, Rollup scatters them across route chunks (e.g. the
          // "button" chunk ends up 30KB because it absorbs @radix-ui/react-dialog,
          // @radix-ui/react-tooltip, etc. from shared importers).
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
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
