import { create } from 'zustand'
import { setAudioSettings } from '../engine/audioEngine'

const LS_IRONMAN = 'mandate_ironman'
const LS_VOLUME = 'mandate_volume'
const LS_TEXT_SPEED = 'mandate_textspeed'
const LS_CONTRAST = 'mandate_contrast'
const LS_FONT_SIZE = 'mandate_fontsize'

export type TextSpeed = 'slow' | 'medium' | 'fast' | 'instant'
export type FontSize = 'normal' | 'large' | 'xlarge'

export const TEXT_SPEED_MS: Record<TextSpeed, number> = {
  slow: 42,
  medium: 26,
  fast: 14,
  instant: 0,
}

export const FONT_SIZE_CSS: Record<FontSize, string> = {
  normal: '18px',
  large: '22px',
  xlarge: '26px',
}

interface AudioSettings {
  masterVolume: number
  ambientVolume: number
  uiVolume: number
  musicVolume: number
  masterMuted: boolean
}

interface AccessibilitySettings {
  textSpeed: TextSpeed
  highContrast: boolean
  fontSize: FontSize
}

interface SettingsStore extends AudioSettings, AccessibilitySettings {
  ironmanMode: boolean
  sessionStartTime: number
  accumulatedPlayMinutes: number
  saveMenuOpen: boolean
  settingsOpen: boolean
  mapOpen: boolean
  debugOpen: boolean
  characterMapOpen: boolean
  journalOpen: boolean
  letterOpen: boolean
  notepadOpen: boolean
  decreeInboxOpen: boolean
  mapPan: { x: number; y: number }

  setMapPan: (pan: { x: number; y: number }) => void

  // Audio actions
  setMasterVolume: (v: number) => void
  setAmbientVolume: (v: number) => void
  setUiVolume: (v: number) => void
  setMusicVolume: (v: number) => void
  toggleMute: () => void

  // Accessibility actions
  setTextSpeed: (s: TextSpeed) => void
  toggleHighContrast: () => void
  setFontSize: (s: FontSize) => void

  // Panel actions
  toggleIronmanMode: () => void
  setSaveMenuOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setMapOpen: (open: boolean) => void
  setDebugOpen: (open: boolean) => void
  setCharacterMapOpen: (open: boolean) => void
  setJournalOpen: (open: boolean) => void
  setLetterOpen: (open: boolean) => void
  setNotepadOpen: (open: boolean) => void
  setDecreeInboxOpen: (open: boolean) => void
  setPlayTime: (minutes: number) => void
}

function loadAudio(): AudioSettings {
  try {
    const raw = localStorage.getItem(LS_VOLUME)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { masterVolume: 50, ambientVolume: 35, uiVolume: 60, musicVolume: 35, masterMuted: false }
}

function persistAudio(s: AudioSettings) {
  localStorage.setItem(LS_VOLUME, JSON.stringify(s))
}

function loadAccessibility(): AccessibilitySettings {
  return {
    textSpeed: (localStorage.getItem(LS_TEXT_SPEED) as TextSpeed) ?? 'medium',
    highContrast: localStorage.getItem(LS_CONTRAST) === 'true',
    fontSize: (localStorage.getItem(LS_FONT_SIZE) as FontSize) ?? 'normal',
  }
}

function applyAccessibilityToDom(acc: AccessibilitySettings) {
  document.documentElement.style.fontSize = FONT_SIZE_CSS[acc.fontSize]
  if (acc.highContrast) {
    document.documentElement.classList.add('high-contrast')
  } else {
    document.documentElement.classList.remove('high-contrast')
  }
}

function applyAudioToEngine(audio: AudioSettings) {
  setAudioSettings({
    masterVolume: audio.masterVolume / 100,
    ambientVolume: audio.ambientVolume / 100,
    uiVolume: audio.uiVolume / 100,
    masterMuted: audio.masterMuted,
  })
}

const initialAudio = loadAudio()
const initialAccess = loadAccessibility()

// Apply on load
applyAccessibilityToDom(initialAccess)
applyAudioToEngine(initialAudio)

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ironmanMode: localStorage.getItem(LS_IRONMAN) === 'true',
  sessionStartTime: Date.now(),
  accumulatedPlayMinutes: 0,
  saveMenuOpen: false,
  settingsOpen: false,
  mapOpen: false,
  debugOpen: false,
  characterMapOpen: false,
  journalOpen: false,
  letterOpen: false,
  notepadOpen: false,
  decreeInboxOpen: false,
  mapPan: { x: 0, y: 0 },

  ...initialAudio,
  ...initialAccess,

  // ── Audio actions ──────────────────────────────────────────────────────────

  setMasterVolume: (v) => {
    const next = { ...get(), masterVolume: v }
    persistAudio(next)
    applyAudioToEngine(next)
    set({ masterVolume: v })
  },

  setAmbientVolume: (v) => {
    const next = { ...get(), ambientVolume: v }
    persistAudio(next)
    applyAudioToEngine(next)
    set({ ambientVolume: v })
  },

  setUiVolume: (v) => {
    const next = { ...get(), uiVolume: v }
    persistAudio(next)
    applyAudioToEngine(next)
    set({ uiVolume: v })
  },

  setMusicVolume: (v) => {
    const next = { ...get(), musicVolume: v }
    persistAudio(next)
    set({ musicVolume: v })
  },

  toggleMute: () => {
    const next = { ...get(), masterMuted: !get().masterMuted }
    persistAudio(next)
    applyAudioToEngine(next)
    set({ masterMuted: !get().masterMuted })
  },

  // ── Accessibility actions ──────────────────────────────────────────────────

  setTextSpeed: (s) => {
    localStorage.setItem(LS_TEXT_SPEED, s)
    set({ textSpeed: s })
  },

  toggleHighContrast: () => {
    const next = !get().highContrast
    localStorage.setItem(LS_CONTRAST, String(next))
    applyAccessibilityToDom({ ...get(), highContrast: next })
    set({ highContrast: next })
  },

  setFontSize: (s) => {
    localStorage.setItem(LS_FONT_SIZE, s)
    applyAccessibilityToDom({ ...get(), fontSize: s })
    set({ fontSize: s })
  },

  // ── Existing actions ───────────────────────────────────────────────────────

  toggleIronmanMode: () =>
    set(s => {
      const next = !s.ironmanMode
      localStorage.setItem(LS_IRONMAN, String(next))
      return { ironmanMode: next }
    }),

  setSaveMenuOpen: (open) => set({ saveMenuOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setMapOpen: (open) => set({ mapOpen: open }),
  setMapPan: (pan) => set({ mapPan: pan }),
  setDebugOpen: (open) => set({ debugOpen: open }),
  setCharacterMapOpen: (open) => set({ characterMapOpen: open }),
  setJournalOpen: (open) => set({ journalOpen: open }),
  setLetterOpen: (open) => set({ letterOpen: open }),
  setNotepadOpen: (open) => set({ notepadOpen: open }),
  setDecreeInboxOpen: (open) => set({ decreeInboxOpen: open }),

  setPlayTime: (minutes) =>
    set({ accumulatedPlayMinutes: minutes, sessionStartTime: Date.now() }),
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// Preserves UI panel state (open menus, settings) across hot reloads
if (import.meta.hot) {
  import.meta.hot.accept()
}

export function currentPlayTimeMinutes(): number {
  const { accumulatedPlayMinutes, sessionStartTime } = useSettingsStore.getState()
  return accumulatedPlayMinutes + (Date.now() - sessionStartTime) / 60_000
}
