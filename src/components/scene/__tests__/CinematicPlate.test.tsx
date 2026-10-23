import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CinematicPlate from '../CinematicPlate'
import { secondsToMs, CINEMA_FADE_IN_S, CINEMA_FADE_OUT_S, CINEMA_SKIP_FADE_S } from '../cinematic'

const HOLD_MS = 6000

describe('CinematicPlate', () => {
  let bubbleSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    bubbleSpy = vi.fn()
  })

  afterEach(() => {
    window.removeEventListener('keydown', bubbleSpy)
    vi.useRealTimers()
  })

  it('shows the image full screen', () => {
    render(<CinematicPlate image="url:end" holdMs={HOLD_MS} onDone={vi.fn()} />)

    const plate = screen.getByTestId('cinematic-plate')
    expect(plate.querySelector('img')).toHaveAttribute('src', 'url:end')
  })

  it('fades out after the fade-in and hold, then calls onDone', () => {
    const onDone = vi.fn()
    render(<CinematicPlate image="url:end" holdMs={HOLD_MS} onDone={onDone} />)

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_FADE_IN_S) + HOLD_MS - 1) })
    expect(screen.getByTestId('cinematic-plate')).toHaveAttribute('data-leaving', 'false')
    expect(onDone).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByTestId('cinematic-plate')).toHaveAttribute('data-leaving', 'true')
    expect(onDone).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_FADE_OUT_S)) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips with a quick fade on Space and swallows the key', () => {
    const onDone = vi.fn()
    window.addEventListener('keydown', bubbleSpy)
    render(<CinematicPlate image="url:end" holdMs={HOLD_MS} onDone={onDone} />)

    fireEvent.keyDown(window, { key: ' ' })

    expect(screen.getByTestId('cinematic-plate')).toHaveAttribute('data-leaving', 'true')
    expect(bubbleSpy).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_SKIP_FADE_S)) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips on click', () => {
    const onDone = vi.fn()
    render(<CinematicPlate image="url:end" holdMs={HOLD_MS} onDone={onDone} />)

    fireEvent.click(screen.getByTestId('cinematic-plate'))

    expect(screen.getByTestId('cinematic-plate')).toHaveAttribute('data-leaving', 'true')

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_SKIP_FADE_S)) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('calls onDone only once even if clicked again while leaving', () => {
    const onDone = vi.fn()
    render(<CinematicPlate image="url:end" holdMs={HOLD_MS} onDone={onDone} />)

    fireEvent.click(screen.getByTestId('cinematic-plate'))
    fireEvent.click(screen.getByTestId('cinematic-plate'))

    act(() => { vi.advanceTimersByTime(20000) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
