import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/** Flat ESLint config (ESLint 9) for the React + Vite frontend. */
export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    // Base rules for all source. react-hooks lives here (not just .jsx) so hook
    // helpers in .js files (e.g. hooks/useApi.js) resolve the rule + its
    // eslint-disable comments.
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // React-component rules only for .jsx. jsx-uses-vars stops components/icons
    // referenced only inside JSX from being reported as unused.
    files: ['**/*.jsx'],
    settings: { react: { version: '18' } },
    plugins: { react: reactPlugin, 'react-refresh': reactRefresh },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Tests run under Vitest (imports come from 'vitest'); allow node globals too.
    files: ['**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
];
