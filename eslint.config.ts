import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import vitest from '@vitest/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build output, generated files, and the ESLint config file itself.
  // Self-linting eslint.config.ts produces spurious unsafe-assignment errors on
  // community plugin imports that lack precise TypeScript types.
  {
    ignores: [
      'dist',
      'build',
      '.react-router',
      'node_modules',
      'coverage',
      'test-results',
      'eslint.config.ts',
    ],
  },

  // Base JS rules (applied to all files)
  js.configs.recommended,

  // TypeScript strict rules for app source (src/) — uses strict app tsconfig
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Root config files, Pages Functions, and e2e specs — use the node tsconfig (not in src/)
  {
    files: [
      '*.config.{ts,mts}',
      'react-router.config.ts',
      'functions/**/*.ts',
      'e2e/**/*.{ts,tsx}',
    ],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React rules — applied to all TS/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // React hooks exhaustive deps — catch missing dependencies
      ...reactHooks.configs.recommended.rules,

      // Warn on non-fast-refresh component exports
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Accessibility — WCAG 2.1 AA baseline (ADR-0005)
      ...jsxA11y.configs.recommended.rules,

      // SOC2: Never swallow errors silently (CLAUDE.md convention)
      '@typescript-eslint/no-floating-promises': 'error',

      // Disallow dangerouslySetInnerHTML without going through approved sanitization
      // (DOMPurify — see ADR-0008). Custom rule placeholder — enforced in code review.
      // Future: add eslint-plugin-no-unsanitized for automated enforcement.

      // Allow underscore-prefixed unused vars (common TS pattern for intentional ignoring)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Route files intentionally export both a default component and named exports
  // (meta, loader, action, etc.) — this is the React Router v7 framework convention.
  {
    files: ['src/routes/**/*.{ts,tsx}', 'src/root.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Test files: Vitest globals + relax strict rules that are noisy in test contexts
  {
    files: ['src/**/*.test.{ts,tsx}', 'e2e/**/*.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      // Tests frequently use type assertions and non-null assertions intentionally
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Vitest/Playwright globals are untyped — suppress unsafe-* rules in test files
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // Disable ESLint formatting rules — Prettier handles formatting (ADR-0005)
  prettierConfig
);
