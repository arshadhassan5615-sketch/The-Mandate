// LeftSidebar single Stats button + tabbed StatsPanel + embedded panel bodies
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LeftSidebar from '../LeftSidebar'
import EconomyPanel from '../panels/EconomyPanel'
import StatsPanel from '../panels/StatsPanel'
import { useGameStore } from '../../stores/gameStore'

function resetStore() {
  useGameStore.getState().resetToInitial()
}

describe('EconomyPanel embedded mode', () => {
  beforeEach(resetStore)

  it('standalone includes shell (data-testid economy-panel) and body value', () => {
    render(<EconomyPanel onClose={() => {}} />)
    expect(screen.getByTestId('economy-panel')).toBeInTheDocument()
    expect(screen.getByTestId('economy-panel-body')).toBeInTheDocument()
    expect(screen.getByTestId('economy-health-value')).toBeInTheDocument()
    expect(screen.getByText('ECONOMY')).toBeInTheDocument()
  })

  it('embedded omits shell header title and only shows body', () => {
    render(<EconomyPanel embedded />)
    expect(screen.queryByTestId('economy-panel')).not.toBeInTheDocument()
    expect(screen.getByTestId('economy-panel-body')).toBeInTheDocument()
    expect(screen.getByTestId('economy-health-value')).toBeInTheDocument()
    expect(screen.queryByText('ECONOMY')).not.toBeInTheDocument()
  })
})

describe('StatsPanel tabs', () => {
  beforeEach(resetStore)

  it('defaults to economy body and switches to debt/inflation/public order', () => {
    render(<StatsPanel onClose={() => {}} />)
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument()
    expect(screen.getByTestId('stats-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('economy-panel-body')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('stats-tab-debt'))
    expect(screen.queryByTestId('economy-panel-body')).not.toBeInTheDocument()
    expect(screen.getByTestId('debt-panel-body')).toBeInTheDocument()
    expect(screen.getByTestId('debt-value')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('stats-tab-inflation'))
    expect(screen.getByTestId('inflation-panel-body')).toBeInTheDocument()
    expect(screen.getByTestId('inflation-value')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('stats-tab-publicOrder'))
    expect(screen.getByTestId('public-order-panel-body')).toBeInTheDocument()
    expect(screen.getByTestId('public-order-value')).toBeInTheDocument()
  })
})

describe('LeftSidebar single Stats control', () => {
  beforeEach(resetStore)

  it('opens StatsPanel from one button; no expand sub-rail', () => {
    render(<LeftSidebar />)
    expect(screen.queryByTestId('stats-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('stats-sub-buttons')).not.toBeInTheDocument()
    expect(screen.queryByTestId('stats-parent-button')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('stats-button'))
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument()
    expect(screen.getByTestId('economy-panel-body')).toBeInTheDocument()

    // Tab switching still works from sidebar-opened panel
    fireEvent.click(screen.getByTestId('stats-tab-inflation'))
    expect(screen.getByTestId('inflation-panel-body')).toBeInTheDocument()
  })
})
