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
        'src/test',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/*',
        'src/routes', // Route files tested via E2E
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
