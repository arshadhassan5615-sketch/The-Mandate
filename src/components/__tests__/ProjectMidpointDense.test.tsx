// Project midpoint decision on touch (non-desktop) layouts: options sit in a scrolling body
// under a pinned header, each option is at least 44px tall, and a tap resolves the decision.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import type { ViewportMode } from '../../hooks/useViewportMode'
import projectDefinitions from '../../data/projects.json'
import ProjectMidpointModal from '../ProjectMidpointModal'
import { useGameStore } from '../../stores/gameStore'

const viewport = vi.hoisted(() => ({ mode: 'compact' as ViewportMode }))

vi.mock('../../hooks/usePageInsets', () => ({
  usePageInsets: () => {
    const insets = {
      desktop: { top: 52, right: 96, bottom: 0, left: 124 },
      compact: { top: 40, right: 64, bottom: 0, left: 80 },
      phone: { top: 52, right: 0, bottom: 60, left: 0 },
    }[viewport.mode]
    return {
      ...insets,
      isPhone: viewport.mode === 'phone',
      isCompact: viewport.mode === 'compact',
      mode: viewport.mode,
    }
  },
}))

const PROJECT_ID = 'kravenstal_steel'
const CHOICE_ID = 'steel_state_owned'
const CHOICE_COUNT = (projectDefinitions as { id: string; midpointChoices: unknown[] }[])
  .find(d => d.id === PROJECT_ID)!.midpointChoices.length
const MIN_TOUCH_HEIGHT = 44

function setUpStore() {
  useGameStore.getState().resetToInitial()
  useGameStore.setState({
    activeProjects: [{
      projectId: PROJECT_ID,
      startedWeek: 1,
      currentWeek: 3,
      phase: 'active',
      midpointResolved: false,
      totalCost: 120,
    }],
  })
}

function optionButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button.choice-btn'))
}

describe('ProjectMidpointModal dense (compact) layout', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
    vi.useFakeTimers()
    setUpStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders every midpoint option inside the scrolling body, not the pinned header', () => {
    render(<ProjectMidpointModal projectId={PROJECT_ID} onResolved={vi.fn()} />)

    const options = optionButtons()
    expect(options).toHaveLength(CHOICE_COUNT)

    const body = options[0].closest('div[style*="overflow-y"]') as HTMLElement | null
    expect(body).not.toBeNull()
    options.forEach(option => expect(body!.contains(option)).toBe(true))
    // The heading and the decision prompt stay outside the scroll body.
    expect(body!.contains(screen.getByRole('heading', { name: def().title }))).toBe(false)
  })

  it('gives every option a touch-sized minimum height', () => {
    render(<ProjectMidpointModal projectId={PROJECT_ID} onResolved={vi.fn()} />)

    optionButtons().forEach(option => {
      expect(option.style.minHeight).toBe(`${MIN_TOUCH_HEIGHT}px`)
    })
  })

  it('resolves the midpoint through the store when an option is chosen, then reports resolved', () => {
    const onResolved = vi.fn()
    const realResolve = useGameStore.getState().resolveMidpoint
    const resolveSpy = vi.fn(realResolve)
    useGameStore.setState({ resolveMidpoint: resolveSpy })

    try {
      render(<ProjectMidpointModal projectId={PROJECT_ID} onResolved={onResolved} />)

      const chosen = optionButtons().find(b => b.textContent?.includes(CHOICE_ID.replace(/_/g, ' ')))
      expect(chosen).toBeDefined()
      fireEvent.click(chosen!)

      expect(resolveSpy).toHaveBeenCalledTimes(1)
      expect(resolveSpy).toHaveBeenCalledWith(PROJECT_ID, CHOICE_ID)
      const project = useGameStore.getState().activeProjects.find(p => p.projectId === PROJECT_ID)
      expect(project?.midpointResolved).toBe(true)

      expect(onResolved).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(1200)
      })
      expect(onResolved).toHaveBeenCalledTimes(1)
    } finally {
      useGameStore.setState({ resolveMidpoint: realResolve })
    }
  })
})

function def() {
  return (projectDefinitions as { id: string; title: string }[]).find(d => d.id === PROJECT_ID)!
}
