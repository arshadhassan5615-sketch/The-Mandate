import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from '../settingsStore'

const LS_VOLUME = 'mandate_volume'
const LS_TEXT_SPEED = 'mandate_textspeed'
const LS_CONTRAST = 'mandate_contrast'
const LS_FONT_SIZE = 'mandate_fontsize'
const LS_MEMORY_HINTS = 'mandate-memory-hints'
const LS_AUTO_ADVANCE = 'mandate-auto-advance'

describe('settingsStore.restoreDefaults', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.style.fontSize = ''
    document.documentElement.classList.remove('high-contrast')
    useSettingsStore.setState({
      masterVolume: 50, ambientVolume: 35, uiVolume: 60, musicVolume: 35, masterMuted: false,
      textSpeed: 'medium', highContrast: false, fontSize: 'normal',
      memoryHints: true, autoAdvance: false,
      storyMode: false, ironmanMode: false, settingsOpen: false, journalOpen: false,
    })
  })

  it('resets every audio, accessibility, memory and auto-advance value to its default', () => {
    const store = useSettingsStore.getState()
    store.setMasterVolume(10)
    store.setAmbientVolume(80)
    store.setUiVolume(5)
    store.setMusicVolume(90)
    store.toggleMute()
    store.setTextSpeed('fast')
    store.setFontSize('xlarge')
    store.toggleHighContrast()
    store.toggleMemoryHints()
    store.toggleAutoAdvance()

    useSettingsStore.getState().restoreDefaults()

    const after = useSettingsStore.getState()
    expect(after.masterVolume).toBe(50)
    expect(after.ambientVolume).toBe(35)
    expect(after.uiVolume).toBe(60)
    expect(after.musicVolume).toBe(35)
    expect(after.masterMuted).toBe(false)
    expect(after.textSpeed).toBe('medium')
    expect(after.highContrast).toBe(false)
    expect(after.fontSize).toBe('normal')
    expect(after.memoryHints).toBe(true)
    expect(after.autoAdvance).toBe(false)
  })

  it('writes the restored values to localStorage and the DOM', () => {
    const store = useSettingsStore.getState()
    store.setMasterVolume(10)
    store.setTextSpeed('slow')
    store.setFontSize('large')
    store.toggleHighContrast()
    store.toggleMemoryHints()
    store.toggleAutoAdvance()

    useSettingsStore.getState().restoreDefaults()

    expect(JSON.parse(localStorage.getItem(LS_VOLUME) ?? '{}').masterVolume).toBe(50)
    expect(localStorage.getItem(LS_TEXT_SPEED)).toBe('medium')
    expect(localStorage.getItem(LS_CONTRAST)).toBe('false')
    expect(localStorage.getItem(LS_FONT_SIZE)).toBe('normal')
    expect(localStorage.getItem(LS_MEMORY_HINTS)).toBe('true')
    expect(localStorage.getItem(LS_AUTO_ADVANCE)).toBe('false')
    expect(document.documentElement.style.fontSize).toBe('18px')
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false)
  })

  it('leaves story mode, ironman mode and open panel flags untouched', () => {
    useSettingsStore.setState({ storyMode: true, ironmanMode: true, settingsOpen: true, journalOpen: true })
    useSettingsStore.getState().setMasterVolume(20)

    useSettingsStore.getState().restoreDefaults()

    const after = useSettingsStore.getState()
    expect(after.masterVolume).toBe(50)
    expect(after.storyMode).toBe(true)
    expect(after.ironmanMode).toBe(true)
    expect(after.settingsOpen).toBe(true)
    expect(after.journalOpen).toBe(true)
  })
})
