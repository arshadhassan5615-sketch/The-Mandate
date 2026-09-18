// MapHeader removed: the map has no header cluster, CLOSE MAP button or helper text.
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

describe('MapView header removal', () => {
  beforeEach(() => {
    useSettingsStore.setState({ mapOpen: false })
  })

  it('shipped MapView source has no header cluster, CLOSE MAP or helper strings', () => {
    expect(MAPVIEW_SRC).not.toMatch(/CLOSE MAP/)
    expect(MAPVIEW_SRC).not.toMatch(/function MapHeader/)
    expect(MAPVIEW_SRC).not.toMatch(/Drag to pan · hover provinces · M to close/)
  })

  it('open map renders no header cluster, helper text or CLOSE MAP button', () => {
    openMap()
    render(<MapView />)

    expect(screen.queryByRole('button', { name: /CLOSE MAP/i })).toBeNull()
    expect(screen.queryByText('Drag to pan · hover provinces · M to close')).toBeNull()
    expect(screen.queryByTestId('map-header-close-cluster')).toBeNull()
  })
})
