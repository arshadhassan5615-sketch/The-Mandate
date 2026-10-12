// Full map: every province shows a name + condition chip, and provinces open
// their detail panel from the keyboard as well as by click.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MapView from '../MapView'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'

describe('MapView province chips', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useWeekStore.setState({ phase: 'agenda' })
    useSettingsStore.setState({ mapOpen: true })
  })

  it('shows a chip for each of the six provinces on the full map', () => {
    render(<MapView />)
    expect(screen.getAllByTestId('province-chip')).toHaveLength(6)
    expect(document.querySelector('[data-province="Kravenstal"]')).not.toBeNull()
  })

  it('shows the level from live state, not a number', () => {
    const g = useGameStore.getState()
    useGameStore.setState({ nation: { ...g.nation, unemployment: 30 } })
    render(<MapView />)
    const chip = document.querySelector('[data-province="Kravenstal"]')!
    expect(chip).toHaveAttribute('data-level', 'Crisis')
    expect(chip.textContent).not.toMatch(/\d/)
  })

  it('keeps the background map free of chips behind other screens', () => {
    useSettingsStore.setState({ mapOpen: false })
    render(<MapView />)
    expect(screen.queryAllByTestId('province-chip')).toHaveLength(0)
  })

  it('shows chips on the week map (map phase background)', () => {
    useSettingsStore.setState({ mapOpen: false })
    useWeekStore.setState({ phase: 'map' })
    render(<MapView />)
    expect(screen.getAllByTestId('province-chip')).toHaveLength(6)
  })

  it('opens a province from the keyboard', () => {
    const onProvinceDetail = vi.fn()
    render(<MapView onProvinceDetail={onProvinceDetail} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /^Kravenstal:/ }), { key: 'Enter' })
    expect(onProvinceDetail).toHaveBeenCalledWith('kravenstal')
  })
})
