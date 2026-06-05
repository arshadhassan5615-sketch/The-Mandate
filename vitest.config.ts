import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest config for The Mandate.
//
// Scope of this first slice: get the harness green with a small critical-path
// test suite. Coverage thresholds are deliberately NOT set yet — we'll add
// them in a later round once the suite is real and >=80% on src/engine/**
// and src/stores/** is achievable.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'coverage'],
    css: false,
  },
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
})
