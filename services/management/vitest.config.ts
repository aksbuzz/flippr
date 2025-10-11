/// <reference types="vitest/config" />

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: 'tests/setup/global-setup.ts',
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules/', 'src/config/**', 'src/common/logger.ts'],
    },
  },
});
