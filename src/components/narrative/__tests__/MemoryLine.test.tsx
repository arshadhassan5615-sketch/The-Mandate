import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import type { RefObject } from 'react'
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

/** A column ref whose bounding rect is the given box. The box is read on each call, so a test can move it. */
function columnRefAt(box: { left: number; right: number }): RefObject<HTMLDivElement | null> {
  const node = document.createElement('div')
  node.getBoundingClientRect = () => ({ left: box.left, right: box.right } as DOMRect)
  return { current: node }
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

  it('shows the text without being a live region, so it is announced once by the scene status', () => {
    render(<MemoryLine text="Gregor Marić will remember that." onDone={vi.fn()} columnRef={columnRefAt({ left: 300, right: 700 })} />)

    expect(screen.getByTestId('memory-line')).toHaveTextContent('Gregor Marić will remember that.')
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByTestId('memory-line')).not.toHaveAttribute('aria-live')
  })

  it('calls onDone once after the fade-in, hold and fade-out', () => {
    const onDone = vi.fn()
    render(<MemoryLine text="Gregor Marić will remember that." onDone={onDone} columnRef={columnRefAt({ left: 300, right: 700 })} />)

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
    render(<MemoryLine text="x" onDone={onDone} columnRef={columnRefAt({ left: 300, right: 700 })} />)

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
    const column = columnRefAt({ left: 300, right: 700 })
    const { rerender } = render(<MemoryLine text="x" onDone={firstDone} columnRef={column} />)

    advance(3000)
    rerender(<MemoryLine text="x" onDone={secondDone} columnRef={column} />)

    advance(600)
    advance(600)
    expect(firstDone).not.toHaveBeenCalled()
    expect(secondDone).toHaveBeenCalledTimes(1)
  })

  it('never intercepts pointer input', () => {
    render(<MemoryLine text="x" onDone={vi.fn()} columnRef={columnRefAt({ left: 300, right: 700 })} />)

    const wrapper = screen.getByTestId('memory-line').parentElement
    expect(wrapper).toHaveStyle({ pointerEvents: 'none' })
  })
})

describe('MemoryLine placement by viewport', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  function setViewport(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  }

  function renderBesideColumn(box: { left: number; right: number }) {
    return render(<MemoryLine text="x" onDone={vi.fn()} columnRef={columnRefAt(box)} />)
  }

  /** The line's horizontal span as set by its wrapper: `left` to `left + maxWidth`. */
  function lineSpan(wrapper: HTMLElement): { left: number; right: number } {
    const left = parseFloat(wrapper.style.left)
    return { left, right: left + parseFloat(wrapper.style.maxWidth) }
  }

  afterEach(() => setViewport(originalWidth, originalHeight))

  it('(a) sits on the right of a wide desktop column, with the same margin and rail inset as before', () => {
    setViewport(1280, 800)
    renderBesideColumn({ left: 404, right: 868 })

    const wrapper = screen.getByTestId('memory-line').parentElement as HTMLElement
    expect(wrapper.style.left).toBe('880px')
    expect(wrapper.style.maxWidth).toBe(`${1280 - 96 - 868 - 24}px`)
    expect(wrapper.style.top).toContain('20px')
    expect(screen.getByTestId('memory-line').querySelector('span:last-child')).toHaveStyle({ textAlign: 'left' })
  })

  it('(b) at 844x390 with the column at 266-573 and a 64px rail, picks the left side below the crest', () => {
    setViewport(844, 390)
    renderBesideColumn({ left: 266, right: 573 })

    const wrapper = screen.getByTestId('memory-line').parentElement as HTMLElement
    expect(wrapper.style.left).toBe('12px')
    expect(wrapper.style.maxWidth).toBe('242px')
    expect(wrapper.style.top).toContain('84px')
    expect(screen.getByTestId('memory-line').querySelector('span:last-child')).toHaveStyle({ textAlign: 'left' })
  })

  it('(c) at 667x375 with the column centred, picks the larger side and never overlaps the column', () => {
    setViewport(667, 375)
    const leftCase = { left: 212, right: 454 }
    const { unmount } = renderBesideColumn(leftCase)
    const leftSpan = lineSpan(screen.getByTestId('memory-line').parentElement as HTMLElement)
    expect(leftSpan.right).toBeLessThanOrEqual(leftCase.left)
    unmount()

    setViewport(667, 375)
    const rightCase = { left: 60, right: 300 }
    renderBesideColumn(rightCase)
    const rightSpan = lineSpan(screen.getByTestId('memory-line').parentElement as HTMLElement)
    expect(rightSpan.left).toBeGreaterThanOrEqual(rightCase.right)
  })

  it('(d) when both side gaps are tiny, drops to the bottom of the viewport, centred', () => {
    setViewport(300, 500)
    renderBesideColumn({ left: 40, right: 260 })

    const wrapper = screen.getByTestId('memory-line').parentElement as HTMLElement
    // Phone mode: 12px margin plus the 60px phone tool bar.
    expect(wrapper.style.bottom).toBe('calc(72px)')
    expect(wrapper.style.top).toBe('')
    expect(wrapper.style.textAlign).toBe('center')
    expect(screen.getByTestId('memory-line').style.maxWidth).toBe('min(90vw, 360px)')
  })

  it('(e) on desktop, a left-side line starts below the 124px crest', () => {
    setViewport(1000, 700)
    renderBesideColumn({ left: 400, right: 900 })

    const wrapper = screen.getByTestId('memory-line').parentElement as HTMLElement
    expect(wrapper.style.left).toBe('12px')
    expect(wrapper.style.top).toContain('124px')
  })

  it('(f) moves the line when the window is resized and the column moves', () => {
    setViewport(1280, 800)
    const box = { left: 404, right: 868 }
    renderBesideColumn(box)
    const wrapper = screen.getByTestId('memory-line').parentElement as HTMLElement
    expect(wrapper.style.left).toBe('880px')

    setViewport(844, 390)
    box.left = 266
    box.right = 573
    act(() => { window.dispatchEvent(new Event('resize')) })

    expect(wrapper.style.left).toBe('12px')
    expect(wrapper.style.maxWidth).toBe('242px')
  })
})
