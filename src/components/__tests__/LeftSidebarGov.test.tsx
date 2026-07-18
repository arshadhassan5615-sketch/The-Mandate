// Structural proof: News + Decrees on LeftSidebar; not on RightSidebar.
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

describe('LeftSidebar News + Decrees split', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useWeekStore.setState({ phase: 'agenda' })
    useSettingsStore.setState({ mapOpen: false })
  })

  it('LeftSidebar source has News and Decrees only (not Connections/Overview)', () => {
    expect(LEFT_SRC).toMatch(/News/)
    expect(LEFT_SRC).toMatch(/Decrees/)
    expect(LEFT_SRC).toMatch(/left:\s*['"]12px['"]/)
    expect(LEFT_SRC).toMatch(/pendingCount/)
    expect(LEFT_SRC).toMatch(/unreadCount/)
    expect(LEFT_SRC).not.toMatch(/Connections/)
    expect(LEFT_SRC).not.toMatch(/Overview/)
  })

  it('RightSidebar source has zero News/Decrees; keeps other registry controls', () => {
    expect(RIGHT_SRC).not.toMatch(/\bNews\b/)
    expect(RIGHT_SRC).not.toMatch(/Decrees/)
    expect(RIGHT_SRC).toMatch(/Connections/)
    expect(RIGHT_SRC).toMatch(/Overview/)
    expect(RIGHT_SRC).toMatch(/Codex/)
    expect(RIGHT_SRC).toMatch(/PERSONAL/)
  })

  it('GameLayout mounts LeftSidebar under the same gameplay phase gate as RightSidebar', () => {
    expect(LAYOUT_SRC).toMatch(/import LeftSidebar from '\.\/LeftSidebar'/)
    expect(LAYOUT_SRC).toMatch(/<LeftSidebar\s*\/>/)
    expect(LAYOUT_SRC).toMatch(/<RightSidebar\s*\/>/)
  })

  it('renders News and Decrees on LeftSidebar', () => {
    render(<LeftSidebar />)
    expect(screen.getByRole('button', { name: /News/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Decrees/i })).toBeInTheDocument()
    expect(screen.getByTestId('left-sidebar-cluster')).toBeInTheDocument()
  })

  it('RightSidebar keeps Connections and has no News/Decrees buttons', () => {
    render(<RightSidebar />)
    expect(screen.getByRole('button', { name: /^Connections$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Journal$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^News$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Decrees$/i })).toBeNull()
  })
})
