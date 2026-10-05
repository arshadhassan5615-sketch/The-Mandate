import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest config for the reply audit D1 run (Phase A, read-only):
//
//   npx vitest run --config scripts/vitest.reply.config.ts
//
// Runs ONLY scripts/reply-audit.d1.test.ts against the real stores, with the
// same jsdom + setup as the main suite. Writes docs/REPLY_AUDIT/data/d1-*.json
// and the full per-click record to node_modules/.cache/reply-audit/.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['./scripts/reply-audit.d1.test.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    css: false,
    testTimeout: 1800000,
  },
  resolve: {
    alias: {
      '@': new URL('../src/', import.meta.url).pathname,
    },
  },
})
