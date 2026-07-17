// Prove the mouse-following province HoverLabel is gone from shipped MapView.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MapView from '../MapView'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'

const MAPVIEW_SRC = readFileSync(resolve(__dirname, '../MapView.tsx'), 'utf8')

describe('MapView province hover tooltip removal', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useWeekStore.setState({ phase: 'agenda' })
    useSettingsStore.setState({ mapOpen: false })
  })

  it('source no longer contains HoverLabel action labels or component', () => {
    expect(MAPVIEW_SRC).not.toMatch(/Open Province Info/)
    expect(MAPVIEW_SRC).not.toMatch(/View Active Events/)
    expect(MAPVIEW_SRC).not.toMatch(/function HoverLabel/)
    expect(MAPVIEW_SRC).not.toMatch(/function TooltipRow/)
    // Building hover and zone clicks still present
    expect(MAPVIEW_SRC).toMatch(/hoveredBuilding/)
    expect(MAPVIEW_SRC).toMatch(/handleOpenDetail/)
    expect(MAPVIEW_SRC).toMatch(/onProvinceDetail/)
  })

  it('open map does not mount the removed tooltip strings', () => {
    useSettingsStore.setState({ mapOpen: true })
    render(<MapView />)
    expect(screen.queryByText('Open Province Info')).toBeNull()
    expect(screen.queryByText(/View Active Events/)).toBeNull()
    // Close control still present (map chrome intact)
    expect(screen.getByRole('button', { name: /CLOSE MAP/i })).toBeInTheDocument()
  })
})
