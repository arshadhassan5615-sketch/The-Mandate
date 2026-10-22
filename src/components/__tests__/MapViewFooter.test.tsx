// MapView footer strip was removed: it must not render at any viewport size.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
}

describe('MapView footer', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  beforeEach(() => {
    useSettingsStore.setState({ mapOpen: false })
  })
  afterEach(() => setViewport(originalWidth, originalHeight))

  it('renders no footer strip on desktop (1440x900) or compact (844x390)', () => {
    for (const [width, height] of [[1440, 900], [844, 390]] as const) {
      setViewport(width, height)
      openMap()
      const { unmount } = render(<MapView />)
      expect(screen.queryByTestId('map-footer')).toBeNull()
      expect(screen.queryByText(/Province status reflects/)).toBeNull()
      unmount()
    }
  })
})
