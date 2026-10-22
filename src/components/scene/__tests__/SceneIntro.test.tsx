import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SceneIntro from '../SceneIntro'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { charName } from '../../narrative/speakers'
import type { NarrativeNode } from '../../../types/narrative'
import { establishingShownWeek } from '../establishingMemory'

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
  cutscene: { panels: [{ image: 'inauguration', caption: 'Cap' }] },
}

const NO_CUTSCENE_SCENE: NarrativeNode = {
  ...INTRO_SCENE,
  id: 'test_no_cutscene_scene',
  cutscene: undefined,
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

  it('moves to the introduction card on Space', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)

    fireEvent.keyDown(window, { key: ' ' })

    expect(currentKind()).toBe('introduction')
    expect(screen.getByText(charName('vyktor_reznik'))).toBeInTheDocument()
  })

  it('consumes Space so a bubbling window listener never receives it', () => {
    window.addEventListener('keydown', bubbleSpy)
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)

    fireEvent.keyDown(window, { key: ' ' })

    expect(currentKind()).toBe('introduction')
    expect(bubbleSpy).not.toHaveBeenCalled()
  })

  it('removes the dialog on Escape', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('auto-advances from the still to the introduction after its duration', () => {
    useNarrativeStore.setState({ currentScene: INTRO_SCENE, newlyMetIds: ['vyktor_reznik'] })
    render(<SceneIntro />)
    expect(currentKind()).toBe('still')

    act(() => { vi.advanceTimersByTime(6000) })

    expect(currentKind()).toBe('introduction')
  })

  it('renders nothing when there is no cutscene and three people are newly met', () => {
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
})
