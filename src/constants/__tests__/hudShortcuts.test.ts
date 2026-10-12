import { describe, it, expect } from 'vitest'
import { HUD_SHORTCUTS } from '../hudShortcuts'

// Keys already taken by other global handlers: S quick-save, Ctrl+S/Ctrl+D,
// Space/Enter advance dialogue, 1-5 pick choices.
const RESERVED = ['s', ' ', 'enter', '1', '2', '3', '4', '5']

describe('HUD_SHORTCUTS', () => {
  const keys = Object.values(HUD_SHORTCUTS).map(k => k.toLowerCase())

  it('assigns each panel a single distinct key', () => {
    expect(new Set(keys).size).toBe(keys.length)
    keys.forEach(k => expect(k).toHaveLength(1))
  })

  it('never collides with keys other handlers own', () => {
    keys.forEach(k => expect(RESERVED).not.toContain(k))
  })

  it('keeps the existing bindings players may already know', () => {
    expect(HUD_SHORTCUTS.codex).toBe('C')
    expect(HUD_SHORTCUTS.journal).toBe('J')
    expect(HUD_SHORTCUTS.notepad).toBe('N')
    expect(HUD_SHORTCUTS.map).toBe('M')
  })
})
