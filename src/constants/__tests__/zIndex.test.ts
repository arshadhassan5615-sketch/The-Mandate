import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Z } from '../zIndex'

const SRC = resolve(__dirname, '../..')

// Layers the player opens on purpose. Every one of them must be readable
// while a conversation is running, so each must sit above the scene.
const LAYERED_FILES = [
  'components/narrative/ConversationPanel.tsx',
  'components/NewsOverlay.tsx',
  'components/LegislationOverlay.tsx',
  'components/ParliamentOverlay.tsx',
  'components/DecreeInbox.tsx',
  'components/JournalView.tsx',
  'components/LetterView.tsx',
  'components/RadioAddressView.tsx',
  'components/InvestmentPanel.tsx',
  'components/SpyMasterPanel.tsx',
  'components/SettingsPanel.tsx',
  'components/ProjectMidpointModal.tsx',
  'components/SaveSlotScreen.tsx',
  'components/panels/ConnectionsPanel.tsx',
  'components/panels/DebtPanel.tsx',
  'components/panels/DiplomaticLetterPanel.tsx',
  'components/panels/EconomyPanel.tsx',
  'components/panels/InflationPanel.tsx',
  'components/panels/InlineCodexPanel.tsx',
  'components/panels/NotepadPanel.tsx',
  'components/panels/OverviewPanel.tsx',
  'components/panels/ProvinceDetail.tsx',
  'components/panels/PublicOrderPanel.tsx',
  'components/panels/StatsPanel.tsx',
  'components/panels/StatePanel.tsx',
  'components/TopBar.tsx',
]

// Small values are local stacking inside a positioned parent (e.g. a close
// button at 10 inside its overlay) and are fine.
const LOCAL_STACKING_MAX = 49

describe('Z layer scale', () => {
  it('keeps the HUD below a running scene', () => {
    expect(Z.hud).toBeLessThan(Z.scene)
    expect(Z.topBar).toBeLessThan(Z.scene)
    expect(Z.navRail).toBeLessThan(Z.scene)
    expect(Z.katerinHud).toBeLessThan(Z.scene)
  })

  it('stacks scene < panel < overlay < modal < transition < system < debug', () => {
    const order = [Z.scene, Z.sceneTop, Z.panel, Z.overlay, Z.overlayRaised, Z.modal, Z.modalRaised, Z.transition, Z.system, Z.debug]
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThan(order[i - 1])
    }
  })

  it('puts the newspaper above a running conversation', () => {
    expect(Z.newsOverlay).toBeGreaterThan(Z.sceneTop)
  })

  it('lets the inline codex open above the newspaper it is linked from', () => {
    expect(Z.inlineCodex).toBeGreaterThan(Z.newsOverlay)
  })
})

describe('player-opened layers use the Z scale', () => {
  it.each(LAYERED_FILES)('%s has no raw global z-index literal', (file) => {
    const source = readFileSync(resolve(SRC, file), 'utf8')
    const raw = [...source.matchAll(/zIndex:\s*(\d+)/g)]
      .map(m => Number(m[1]))
      .filter(n => n > LOCAL_STACKING_MAX)
    expect(raw).toEqual([])
    expect(source).toMatch(/from ['"](\.\.\/)+constants\/zIndex['"]/)
  })
})
