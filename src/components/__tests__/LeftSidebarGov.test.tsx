// Structural proof: Decrees on LeftSidebar; News on RightSidebar only (6E-2).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeftSidebar from '../LeftSidebar'
import RightSidebar from '../RightSidebar'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'
import { useSettingsStore } from '../../stores/settingsStore'

const LEFT_SRC = readFileSync(resolve(__dirname, '../LeftSidebar.tsx'), 'utf8')
const RIGHT_SRC = readFileSync(resolve(__dirname, '../RightSidebar.tsx'), 'utf8')
const LAYOUT_SRC = readFileSync(resolve(__dirname, '../GameLayout.tsx'), 'utf8')

describe('Sidebar split: Decrees on LeftSidebar, News on RightSidebar', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useWeekStore.setState({ phase: 'agenda' })
    useSettingsStore.setState({ mapOpen: false })
  })

  it('LeftSidebar source has Decrees but no News/Connections/Overview code', () => {
    expect(LEFT_SRC).toMatch(/Decrees/)
    expect(LEFT_SRC).toMatch(/left:\s*['"]12px['"]/)
    expect(LEFT_SRC).toMatch(/pendingCount/)
    expect(LEFT_SRC).not.toMatch(/useNewsStore|unreadCount|label="News/)
    expect(LEFT_SRC).not.toMatch(/Connections/)
    expect(LEFT_SRC).not.toMatch(/Overview/)
  })

  it('RightSidebar source owns News; has no Decrees; keeps registry controls', () => {
    expect(RIGHT_SRC).toMatch(/useNewsStore/)
    expect(RIGHT_SRC).toMatch(/News Dispatch/)
    expect(RIGHT_SRC).not.toMatch(/Decrees/)
    expect(RIGHT_SRC).toMatch(/Assembly/)
    expect(RIGHT_SRC).toMatch(/Codex/)
    expect(RIGHT_SRC).toMatch(/Journal/)
  })

  it('GameLayout mounts LeftSidebar under the same gameplay phase gate as RightSidebar', () => {
    expect(LAYOUT_SRC).toMatch(/import LeftSidebar from '\.\/LeftSidebar'/)
    expect(LAYOUT_SRC).toMatch(/<LeftSidebar\s*\/>/)
    expect(LAYOUT_SRC).toMatch(/<RightSidebar\s*\/>/)
  })

  it('renders Decrees and Statistics on LeftSidebar, and no News button', () => {
    render(<LeftSidebar />)
    expect(screen.queryByRole('button', { name: /News/i })).toBeNull()
    expect(screen.getByRole('button', { name: /Decrees/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /National Statistics/i })).toBeInTheDocument()
    expect(screen.getByTestId('left-sidebar-cluster')).toBeInTheDocument()
  })

  it('RightSidebar renders News and Assembly, and no Decrees button', () => {
    render(<RightSidebar />)
    expect(screen.getByRole('button', { name: /^News Dispatch/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Assembly$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Journal$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Decrees$/i })).toBeNull()
  })
})
