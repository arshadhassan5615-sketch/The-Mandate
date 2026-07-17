// MapHeader helper cluster: pan/hotkey guidance only (no CLOSE MAP button).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MapView from '../MapView'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'

const MAPVIEW_SRC = readFileSync(resolve(__dirname, '../MapView.tsx'), 'utf8')

function openMap() {
  useGameStore.getState().resetToInitial()
  useWeekStore.setState({ phase: 'agenda' })
  useSettingsStore.setState({ mapOpen: true })
}

describe('MapView MapHeader helper', () => {
  beforeEach(() => {
    useSettingsStore.setState({ mapOpen: false })
  })

  it('shipped MapView source has zero CLOSE MAP strings', () => {
    expect(MAPVIEW_SRC).not.toMatch(/CLOSE MAP/)
    expect(MAPVIEW_SRC).toMatch(/Drag to pan · hover provinces · M to close/)
  })

  it('shows pan/hotkey helper without a CLOSE MAP button', () => {
    openMap()
    render(<MapView />)

    expect(screen.queryByRole('button', { name: /CLOSE MAP/i })).toBeNull()
    const helper = screen.getByText('Drag to pan · hover provinces · M to close')
    expect(helper).toBeInTheDocument()

    const cluster = screen.getByTestId('map-header-close-cluster')
    expect(cluster.contains(helper)).toBe(true)

    // Muted helper styling — not a free-floating full-width bar child
    expect(helper.style.color).toBe('var(--muted)')
    expect(cluster.style.position).toBe('fixed')
    expect(cluster.style.right).toBe('12px')
    expect(cluster.style.top).toBe('64px')
    // Not a full-width spanning header
    expect(cluster.style.left).not.toBe('0px')
    expect(cluster.style.width).not.toBe('100%')
  })
})
