// Global test setup for The Mandate.
//
// Runs once before every test file. Two responsibilities:
//   1. Mock modules that touch Web Audio / DOM APIs jsdom cannot drive
//   2. Polyfill browser APIs some modules call on import or at mount
//
// Keep this file lean — heavy mocks here slow every test. Add per-test mocks
// inside the test file using `vi.mock(...)` when the global is unused.

import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// ─── Audio engine mock ────────────────────────────────────────────────────────
// The real audioEngine instantiates an AudioContext on first call, which jsdom
// does not provide. Every named export becomes a no-op so imports succeed and
// the engines that depend on it (no engine imports it directly, but components
// that may be transitively tested later do) don't throw on load.

vi.mock('../engine/audioEngine', () => ({
  setAudioSettings: vi.fn(),
  startAmbient: vi.fn(),
  stopAmbient: vi.fn(),
  playTypewriterKey: vi.fn(),
  playTypewriterKeyThrottled: vi.fn(),
  playPaperShuffle: vi.fn(),
  playStamp: vi.fn(),
  playChime: vi.fn(),
  playCodexUnlock: vi.fn(),
  playPageTurn: vi.fn(),
  resumeAudioContext: vi.fn(),
  destroyAudio: vi.fn(),
}))

// ─── AudioManager mock ────────────────────────────────────────────────────────
// Same rationale as above; AudioManager manages an MP3 track registry.

vi.mock('../engine/AudioManager', () => ({
  AudioManager: {
    play: vi.fn(),
    stop: vi.fn(),
    fadeOut: vi.fn(),
    setVolume: vi.fn(),
  },
}))

// ─── DOM polyfills ────────────────────────────────────────────────────────────
// `matchMedia` is referenced by some media-query-driven components.

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
