import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest config for the Round 3 STEP 3 reachability report runs (moved into
// scripts/ per STEP 6 — run from the repo root).
//
//   npx vitest run --config scripts/vitest.report.config.ts
//   MANDATE_REPORT=1 npx vitest run --config scripts/vitest.report.config.ts
//
// Runs ONLY the scripts/-anchored report test. Same jsdom + setup as the main
// config so store-driven proofs behave identically. run-*.json telemetry outputs
// are written to the repo root and are NEVER committed.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['./scripts/playthroughs.report.test.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    css: false,
    testTimeout: 600000,
  },
  resolve: {
    alias: {
      '@': new URL('../src/', import.meta.url).pathname,
    },
  },
})
