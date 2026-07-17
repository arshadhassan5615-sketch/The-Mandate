// MapHeader close-cluster: pan helper must stay docked next to CLOSE MAP.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MapView from '../MapView'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'

function openMap() {
  useGameStore.getState().resetToInitial()
  useWeekStore.setState({ phase: 'agenda' })
  useSettingsStore.setState({ mapOpen: true })
}

describe('MapView MapHeader helper', () => {
  beforeEach(() => {
    useSettingsStore.setState({ mapOpen: false })
  })

  it('keeps the pan/hotkey helper adjacent to CLOSE MAP in the close cluster', () => {
    openMap()
    render(<MapView />)

    const closeBtn = screen.getByRole('button', { name: /CLOSE MAP/i })
    const helper = screen.getByText('Drag to pan · hover provinces · M to close')
    expect(closeBtn).toBeInTheDocument()
    expect(helper).toBeInTheDocument()

    const cluster = screen.getByTestId('map-header-close-cluster')
    expect(cluster.contains(closeBtn)).toBe(true)
    expect(cluster.contains(helper)).toBe(true)

    // Helper is docked to the right of CLOSE MAP (DOM order: button then helper)
    const children = Array.from(cluster.children)
    const btnIdx = children.indexOf(closeBtn)
    const helperIdx = children.indexOf(helper)
    expect(btnIdx).toBeGreaterThanOrEqual(0)
    expect(helperIdx).toBe(btnIdx + 1)

    // Muted helper styling — not a free-floating full-width bar child
    expect(helper.style.color).toBe('var(--muted)')
    expect(cluster.style.position).toBe('fixed')
    expect(cluster.style.right).toBe('12px')
    expect(cluster.style.top).toBe('12px')
    // Not a full-width spanning header
    expect(cluster.style.left).not.toBe('0px')
    expect(cluster.style.width).not.toBe('100%')
  })
})
