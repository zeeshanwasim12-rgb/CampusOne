import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    // in-memory Mongo download + boot can take a moment on first run
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false, // share one in-memory Mongo across suites
  },
});
