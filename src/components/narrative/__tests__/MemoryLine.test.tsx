import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import MemoryLine from '../MemoryLine'
import { memoryTextFor, MEMORY_FADE_IN_S, MEMORY_HOLD_MS, MEMORY_FADE_OUT_S } from '../memoryLineText'
import { secondsToMs } from '../../scene/cinematic'
import type { SceneChoice } from '../../../types/narrative'

const IRON_CHOICE: SceneChoice = {
  id: 'court_iron',
  text: 'Side with the Covenant',
  stateChanges: [{ stat: 'factions.ironCovenant', operation: 'add', value: 12 }],
}

const QUIET_CHOICE: SceneChoice = {
  id: 'quiet',
  text: 'Say nothing',
  stateChanges: [{ stat: 'factions.ironCovenant', operation: 'add', value: 2 }],
}

describe('memoryTextFor', () => {
  it('returns null when the setting is disabled', () => {
    expect(memoryTextFor(IRON_CHOICE, [], false)).toBeNull()
  })

  it('returns null for an undefined choice', () => {
    expect(memoryTextFor(undefined, [], true)).toBeNull()
  })

  it('names the faction for a qualifying change when no character is present', () => {
    expect(memoryTextFor(IRON_CHOICE, [], true)).toBe('The Iron Covenant will remember that.')
  })

  it('returns null when no change qualifies', () => {
    expect(memoryTextFor(QUIET_CHOICE, [], true)).toBeNull()
  })
})

/**
 * Advances the fake clock in its own act() so React flushes state updates and
 * effects between steps, the way it does in the browser.
 */
function advance(ms: number) {
  act(() => { vi.advanceTimersByTime(ms) })
}

describe('MemoryLine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the text in a status region', () => {
    render(<MemoryLine text="Gregor Marić will remember that." onDone={vi.fn()} />)

    const line = screen.getByRole('status')
    expect(line).toHaveTextContent('Gregor Marić will remember that.')
    expect(line).toHaveAttribute('aria-live', 'polite')
  })

  it('calls onDone once after the fade-in, hold and fade-out', () => {
    const onDone = vi.fn()
    render(<MemoryLine text="Gregor Marić will remember that." onDone={onDone} />)

    advance(3500)
    expect(onDone).not.toHaveBeenCalled()

    advance(100)
    advance(700)
    expect(onDone).toHaveBeenCalledTimes(1)

    advance(5000)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('finishes at fade-in plus hold plus fade-out', () => {
    const onDone = vi.fn()
    render(<MemoryLine text="x" onDone={onDone} />)

    const leaveAtMs = secondsToMs(MEMORY_FADE_IN_S) + MEMORY_HOLD_MS
    advance(leaveAtMs)
    expect(onDone).not.toHaveBeenCalled()

    advance(secondsToMs(MEMORY_FADE_OUT_S) - 1)
    expect(onDone).not.toHaveBeenCalled()

    advance(1)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('does not restart its timers when the parent re-renders with a new onDone', () => {
    const firstDone = vi.fn()
    const secondDone = vi.fn()
    const { rerender } = render(<MemoryLine text="x" onDone={firstDone} />)

    advance(3000)
    rerender(<MemoryLine text="x" onDone={secondDone} />)

    advance(600)
    advance(600)
    expect(firstDone).not.toHaveBeenCalled()
    expect(secondDone).toHaveBeenCalledTimes(1)
  })

  it('never intercepts pointer input', () => {
    render(<MemoryLine text="x" onDone={vi.fn()} />)

    const wrapper = screen.getByRole('status').parentElement
    expect(wrapper).toHaveStyle({ pointerEvents: 'none' })
  })
})
