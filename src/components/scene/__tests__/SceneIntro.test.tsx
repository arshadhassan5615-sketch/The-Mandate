import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SceneIntro from '../SceneIntro'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import type { NarrativeNode } from '../../../types/narrative'
import { establishingShownWeek } from '../establishingMemory'
import { secondsToMs, CINEMA_FADE_IN_S, CINEMA_FADE_OUT_S, CINEMA_SKIP_FADE_S } from '../cinematic'

const INTRO_SCENE: NarrativeNode = {
  id: 'test_intro_scene',
  title: 'Intro test scene',
  act: 1,
  weekAvailable: 1,
  type: 'meeting',
  agendaCost: 0,
  location: 'chancery',
  characters: ['vyktor_reznik'],
  prerequisites: [],
  cutscene: {
    panels: [
      { image: 'inauguration', caption: 'Cap' },
      { image: 'inauguration', caption: 'Cap 2' },
    ],
  },
}

const NO_CUTSCENE_SCENE: NarrativeNode = {
  ...INTRO_SCENE,
  id: 'test_no_cutscene_scene',
  cutscene: undefined,
}

const ONE_STILL_SCENE: NarrativeNode = {
  ...INTRO_SCENE,
  id: 'test_one_still',
  cutscene: { panels: [{ image: 'inauguration', caption: 'Cap' }] },
}

const CABINET_SCENE: NarrativeNode = {
  ...NO_CUTSCENE_SCENE,
  id: 'test_cabinet_scene',
  location: 'Cabinet Room — Ashenmere Palace',
}

function currentKind(): string | null {
  return screen.getByTestId('scene-intro').getAttribute('data-kind')
}

describe('SceneIntro', () => {
  let bubbleSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    bubbleSpy = vi.fn()
    establishingShownWeek.clear()
  })

  afterEach(() => {
    window.removeEventListener('keydown', bubbleSpy)
    vi.useRealTimers()
    establishingShownWeek.clear()
    useNarrativeStore.setState({ currentScene: null, newlyMetIds: [] })
  })

  it('shows the painted still with its caption first', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })

    render(<SceneIntro />)

    expect(screen.getByRole('dialog', { name: 'Scene introduction' })).toBeInTheDocument()
    expect(currentKind()).toBe('still')
    expect(screen.getByText('Cap')).toBeInTheDocument()
  })

  it('moves to the next still on Space', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)

    fireEvent.keyDown(window, { key: ' ' })

    expect(screen.getByText('Cap 2')).toBeInTheDocument()
    expect(currentKind()).toBe('still')
  })

  it('consumes Space so a bubbling window listener never receives it', () => {
    window.addEventListener('keydown', bubbleSpy)
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)

    fireEvent.keyDown(window, { key: ' ' })

    expect(screen.getByText('Cap 2')).toBeInTheDocument()
    expect(bubbleSpy).not.toHaveBeenCalled()
  })

  it('removes the dialog on Escape', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('scene-intro')).toHaveAttribute('data-closing', 'true')

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_SKIP_FADE_S)) })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('auto-advances to the next still after its duration', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)
    expect(currentKind()).toBe('still')

    act(() => { vi.advanceTimersByTime(6000) })
    expect(screen.getByText('Cap')).toBeInTheDocument()
    expect(screen.queryByText('Cap 2')).toBeNull()

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_FADE_IN_S)) })

    expect(screen.getByText('Cap 2')).toBeInTheDocument()
  })

  it('renders nothing for a scene without a cutscene or establishing shot, even when people are newly met', () => {
    useNarrativeStore.setState({
      currentScene: NO_CUTSCENE_SCENE,
      newlyMetIds: ['vyktor_reznik', 'lucan_vael', 'nadia_voss'],
    })
    const { container } = render(<SceneIntro />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the location establishing shot first the first time a location opens in a week', () => {
    useNarrativeStore.setState({ currentScene: CABINET_SCENE, newlyMetIds: [] })

    render(<SceneIntro />)

    expect(currentKind()).toBe('establishing')
    expect(screen.getByText('The Cabinet Room')).toBeInTheDocument()
  })

  it('does not show the establishing shot again for the same location in the same week', () => {
    useNarrativeStore.setState({ currentScene: CABINET_SCENE, newlyMetIds: [] })
    const first = render(<SceneIntro />)
    expect(currentKind()).toBe('establishing')
    first.unmount()

    useNarrativeStore.setState({ currentScene: { ...CABINET_SCENE, id: 'test_cabinet_second' } })
    render(<SceneIntro />)

    expect(screen.queryByTestId('scene-intro')).toBeNull()
  })

  it('fades out after the last card instead of vanishing', () => {
    useNarrativeStore.setState({ currentScene: ONE_STILL_SCENE, newlyMetIds: [] })
    render(<SceneIntro />)

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_FADE_IN_S) + 6000) })

    expect(screen.getByTestId('scene-intro')).toHaveAttribute('data-closing', 'true')

    act(() => { vi.advanceTimersByTime(secondsToMs(CINEMA_FADE_OUT_S)) })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('ignores Space while fading out', () => {
    useNarrativeStore.setState({ currentScene: ONE_STILL_SCENE, newlyMetIds: [] })
    render(<SceneIntro />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('scene-intro')).toHaveAttribute('data-closing', 'true')

    window.addEventListener('keydown', bubbleSpy)
    fireEvent.keyDown(window, { key: ' ' })

    expect(bubbleSpy).toHaveBeenCalledTimes(1)
  })

  it('never shows a first-meeting card', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)
    expect(screen.queryByText(/first meeting/i)).toBeNull()

    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.queryByText(/first meeting/i)).toBeNull()

    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.queryByText(/first meeting/i)).toBeNull()

    act(() => { vi.advanceTimersByTime(20000) })
    expect(screen.queryByText(/first meeting/i)).toBeNull()
  })
})
