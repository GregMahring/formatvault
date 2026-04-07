import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // No need to import describe/it/expect in every file
    globals: true,

    // Only scan src/ — exclude Playwright E2E specs which have their own runner
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'e2e', 'dist', 'build'],

    // Use jsdom for DOM APIs (React component testing)
    environment: 'jsdom',

    // Setup file: imports @testing-library/jest-dom matchers
    setupFiles: ['./src/test/setup.ts'],

    // Coverage thresholds (aspirational — relax if blocking)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules',
        'build',
        'src/test',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/*',
        // Tested via E2E or integration — not unit tests
        'src/routes',
        'src/components',
        'src/stores',
        'src/workers',
        'functions',
        'e2e',
        // SSR/entry files — not meaningful to unit-test
        'src/entry.client.tsx',
        'src/entry.server.tsx',
        'src/root.tsx',
        'src/routes.ts',
        // Feature hooks — React hooks requiring browser/component environment
        'src/features/**/use*.ts',
        // Hooks that depend on browser APIs (clipboard, download, file I/O, etc.)
        'src/hooks/useCopyToClipboard.ts',
        'src/hooks/useDownload.ts',
        'src/hooks/useFileParser.ts',
        'src/hooks/useKeyboardShortcuts.ts',
        'src/hooks/useMediaQuery.ts',
        'src/hooks/usePiiMasking.ts',
        'src/hooks/useRegisterCommands.ts',
        'src/hooks/useTreeState.ts',
        // Lib files consumed only via routes/components (no direct unit tests)
        'src/lib/detectFormat.ts',
        'src/lib/editorTheme.ts',
        'src/lib/fuzzyMatch.ts',
        'src/lib/meta.ts',
        'src/lib/piiMasker.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 80,
        branches: 70,
        statements: 70,
      },
    },
  },
});
