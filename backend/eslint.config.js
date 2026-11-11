import js from '@eslint/js';
import globals from 'globals';

/** Flat ESLint config (ESLint 9). Minimal, practical rules for Node ESM. */
export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
    },
  },
  {
    files: ['**/*.test.js', '**/tests/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  { ignores: ['node_modules/**', 'uploads/**', 'coverage/**'] },
];
