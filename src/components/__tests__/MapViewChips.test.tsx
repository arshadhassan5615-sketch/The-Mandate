// Full map: provinces open their detail panel from the keyboard as well as by
// click, and no status chips are drawn on the map.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MapView from '../MapView'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'

describe('MapView provinces', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useWeekStore.setState({ phase: 'agenda' })
    useSettingsStore.setState({ mapOpen: true })
  })

  it('draws no province status chips on the full map', () => {
    render(<MapView />)
    expect(screen.queryAllByTestId('province-chip')).toHaveLength(0)
  })

  it('draws no province status chips on the week map', () => {
    useSettingsStore.setState({ mapOpen: false })
    useWeekStore.setState({ phase: 'map' })
    render(<MapView />)
    expect(screen.queryAllByTestId('province-chip')).toHaveLength(0)
  })

  it('names the province button with its live condition level', () => {
    const g = useGameStore.getState()
    useGameStore.setState({ nation: { ...g.nation, unemployment: 30 } })
    render(<MapView />)
    expect(screen.getByRole('button', { name: /^Kravenstal: Crisis/ })).toBeInTheDocument()
  })

  it('opens a province from the keyboard', () => {
    const onProvinceDetail = vi.fn()
    render(<MapView onProvinceDetail={onProvinceDetail} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /^Kravenstal:/ }), { key: 'Enter' })
    expect(onProvinceDetail).toHaveBeenCalledWith('kravenstal')
  })
})
