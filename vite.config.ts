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
          // Exact package names — a bare 'node_modules/react' prefix also matched
          // react-remove-scroll, react-style-singleton, etc. (Dialog/Menu-only deps)
          // and put them on every page.
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/zustand')) {
            return 'vendor-state';
          }
          // Only the CodeMirror core belongs in the shared chunk. Language packs
          // (@codemirror/lang-*, legacy-modes and their @lezer grammars) are
          // dynamically imported by CodeEditor — matching them here would merge
          // every language into every editor page.
          if (
            /node_modules\/@codemirror\/(state|view|language|commands|autocomplete|lint|search|theme-one-dark)\//.test(
              id
            ) ||
            /node_modules\/@lezer\/(common|highlight|lr)\//.test(id) ||
            id.includes('node_modules/@uiw/')
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
    // Worker bundles are built separately and don't inherit top-level plugins,
    // so '@/' imports inside workers need the path-alias plugin here too.
    plugins: () => [tsconfigPaths()],
  },
});
