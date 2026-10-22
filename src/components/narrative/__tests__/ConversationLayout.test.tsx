import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import ConversationPanel from '../ConversationPanel'
import { useWeekStore } from '../../../stores/weekStore'
import { useNarrativeStore } from '../../../stores/narrativeStore'

type CurrentScene = NonNullable<ReturnType<typeof useNarrativeStore.getState>['currentScene']>

const HISTORY = [
  { id: '1', type: 'dialogue', characterId: 'vyktor_reznik', text: 'A' },
  { id: '2', type: 'dialogue', characterId: 'gregor_maric', text: 'B' },
  { id: '3', type: 'player_spoken', text: 'C' },
]

type HistoryEntries = Parameters<typeof ConversationPanel>[0]['history']

// jsdom's CSS parser drops some values (mask-image and width given as calc() or
// clamp()), so those are observed by recording the values React writes to the
// style setters.
function recordStyleWrites(props: readonly string[]) {
  const styleProto = Object.getPrototypeOf(document.createElement('div').style) as object
  const values: string[] = []
  const restores = props.map(prop => {
    const descriptor = Object.getOwnPropertyDescriptor(styleProto, prop)
    if (!descriptor?.set) throw new Error(`CSSStyleDeclaration has no ${prop} setter`)
    const originalSet = descriptor.set
    Object.defineProperty(styleProto, prop, {
      ...descriptor,
      set(this: CSSStyleDeclaration, value: string) {
        values.push(value)
        originalSet.call(this, value)
      },
    })
    return () => Object.defineProperty(styleProto, prop, descriptor)
  })
  return { values, restore: () => restores.forEach(restore => restore()) }
}

function renderPanel(history: HistoryEntries = HISTORY as HistoryEntries, sceneTitle = 'Test') {
  return render(
    <ConversationPanel
      sceneTitle={sceneTitle}
      sceneLocation="Cabinet Room"
      sceneType="meeting"
      currentWeek={2}
      sceneCharacters={[]}
      history={history}
      activeSegment={null}
      activeText=""
      showCursor={false}
      choices={[]}
      showChoices={false}
      sceneDone={false}
      allDone={false}
      segmentDone={true}
      onAdvance={vi.fn()}
      onChoice={vi.fn()}
      onAdvanceQueue={vi.fn()}
      continueLabel="Continue"
      speakingCharacter={undefined}
    />,
  )
}

describe('ConversationPanel layout', () => {
  beforeEach(() => {
    useWeekStore.setState({ phase: 'scene' })
    useNarrativeStore.setState({
      currentScene: { id: 't', title: 'Test', location: 'Cabinet Room', type: 'meeting', narrative: [] } as unknown as CurrentScene,
    })
  })

  it('indents quoted dialogue 6px under the speaker label, as in the reference', () => {
    renderPanel()
    expect(screen.getByText('"A"').style.paddingLeft).toBe('6px')
  })

  it('shows the newest line in white and earlier dialogue in grey', () => {
    renderPanel([
      { id: '1', type: 'dialogue', characterId: 'vyktor_reznik', text: 'A' },
      { id: '2', type: 'dialogue', characterId: 'gregor_maric', text: 'B' },
    ] as HistoryEntries)
    expect(screen.getByText('"A"').style.color).toBe('rgb(185, 185, 185)')
    expect(screen.getByText('"B"').style.color).toBe('rgb(255, 255, 255)')
  })

  it('shows the newest narration line in white too', () => {
    renderPanel([
      { id: '1', type: 'dialogue', characterId: 'vyktor_reznik', text: 'A' },
      { id: '2', type: 'description', text: 'Silence.' },
    ] as HistoryEntries)
    expect(screen.getByText('"A"').style.color).toBe('rgb(185, 185, 185)')
    expect(screen.getByText('Silence.').style.color).toBe('rgb(255, 255, 255)')
  })

  it('does not fade the bottom of the history, so the newest line stays at full brightness', () => {
    const writes = recordStyleWrites(['maskImage', 'WebkitMaskImage'])
    try {
      renderPanel()
    } finally {
      writes.restore()
    }
    expect(writes.values.some(v => v.includes('100% - 60px'))).toBe(false)
  })

  it('shows the map scrim and no speaker stage', () => {
    renderPanel()
    expect(screen.queryByTestId('speaker-stage')).toBeNull()
    expect(screen.getByTestId('scene-map-scrim')).toBeInTheDocument()
  })

  it('lists the other speakers in the portrait rail, none marked speaking when the player spoke last', () => {
    renderPanel()
    const rail = screen.getByTestId('portrait-rail')
    const medallions = within(rail).getAllByTestId('portrait-medallion')
    expect(medallions).toHaveLength(2)
    expect(medallions[0].getAttribute('aria-label')).toContain('Vyktor')
    expect(medallions[1].getAttribute('aria-label')).toContain('Gregor')
    expect(medallions[1]).toHaveAttribute('data-state', 'present')
    medallions.forEach(m => expect(m.getAttribute('data-speaking')).not.toBe('true'))
  })

  it('keeps portraits in first-appearance order but puts the latest non-player speaker last, marked speaking', () => {
    renderPanel([...HISTORY, { id: '4', type: 'dialogue', characterId: 'vyktor_reznik', text: 'D' }])
    const medallions = within(screen.getByTestId('portrait-rail')).getAllByTestId('portrait-medallion')
    expect(medallions[0].getAttribute('aria-label')).toContain('Gregor')
    expect(medallions[0].getAttribute('data-speaking')).toBe('false')
    expect(medallions[1].getAttribute('aria-label')).toContain('Vyktor')
    expect(medallions[1].getAttribute('data-speaking')).toBe('true')
  })
})

describe('ConversationPanel viewport layouts', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  function setViewport(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  }

  beforeEach(() => {
    useWeekStore.setState({ phase: 'scene' })
    useNarrativeStore.setState({
      currentScene: { id: 't', title: 'Test', location: 'Cabinet Room', type: 'meeting', narrative: [] } as unknown as CurrentScene,
    })
  })

  afterEach(() => {
    setViewport(originalWidth, originalHeight)
  })

  it.each([
    { name: 'landscape phone', width: 844, height: 390, mode: 'compact' },
    { name: 'narrow phone', width: 600, height: 800, mode: 'phone' },
    { name: 'desktop', width: 1440, height: 900, mode: 'desktop' },
  ])('uses the same column layout on a $name ($width x $height)', ({ width, height, mode }) => {
    setViewport(width, height)
    const widthWrites = recordStyleWrites(['width'])
    let rendered: ReturnType<typeof renderPanel>
    try {
      rendered = renderPanel(undefined, 'Layout Probe')
    } finally {
      widthWrites.restore()
    }
    const { container } = rendered
    const panel = container.querySelector<HTMLElement>('[data-layout]')
    expect(panel?.getAttribute('data-layout')).toBe(mode)
    expect(widthWrites.values).toContain('clamp(218px, 36.3vw, 1094px)')
    expect(panel?.style.top).toBe('0px')
    expect(panel?.style.getPropertyValue('--choice-font')).toBe('clamp(6.5px, 0.95vw, 29px)')
    expect(screen.getByTestId('portrait-rail-anchor')).toBeInTheDocument()
    expect(container.querySelector('[data-layout="row"]')).toBeNull()
    expect(screen.getByLabelText('Scroll to top of conversation')).toBeInTheDocument()
    expect(screen.getAllByText('Layout Probe')).toHaveLength(1)
  })
})

describe('ConversationPanel desktop column', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  // Nearest ancestor that scrolls vertically (the history log or the inner column).
  function nearestScroller(el: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = el.parentElement
    while (node && node.style.overflowY !== 'auto') node = node.parentElement
    return node
  }

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true, writable: true })
    useWeekStore.setState({ phase: 'scene' })
    useNarrativeStore.setState({
      currentScene: { id: 't', title: 'Column Probe', location: 'Cabinet Room', type: 'meeting', narrative: [] } as unknown as CurrentScene,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: originalHeight, configurable: true, writable: true })
  })

  it('draws a pure-black column with no side borders', () => {
    const { container } = renderPanel(undefined, 'Column Probe')
    const panel = container.querySelector<HTMLElement>('[data-layout]')
    expect(panel?.getAttribute('data-layout')).toBe('desktop')
    expect(panel?.style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect(panel?.style.borderLeft).toBe('')
    expect(panel?.style.borderRight).toBe('')
  })

  it('hangs the portrait stack on the column left border', () => {
    renderPanel()
    const anchor = screen.getByTestId('portrait-rail-anchor')
    expect(anchor.style.left).toBe('calc(var(--rail-small) / 2)')
    expect(anchor.style.transform).toContain('translateX(-100%)')
  })

  it('falls back to 19vh below the column top when there is no line to hang the stack on', () => {
    renderPanel([])
    const anchor = screen.getByTestId('portrait-rail-anchor')
    expect(anchor.style.top).toBe('19vh')
    expect(anchor.getAttribute('data-rail-top')).toBe('')
  })

  it('measures to 8px in jsdom, where every rect is zero, so the stack sits at the minimum gap', () => {
    renderPanel()
    const anchor = screen.getByTestId('portrait-rail-anchor')
    expect(anchor.getAttribute('data-rail-top')).toBe('8')
    expect(anchor.style.top).toBe('8px')
  })

  it('hangs the stack so its bottom sits on the newest line, clamped to the visible history', () => {
    const { container } = renderPanel()
    const panel = container.querySelector<HTMLElement>('[data-layout]')!
    const entries = panel.querySelectorAll<HTMLElement>('[data-entry]')
    const lastEntry = entries[entries.length - 1]
    const scroller = lastEntry.parentElement!
    const rail = screen.getByTestId('portrait-rail-anchor')

    const rectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const rect = (top: number, bottom: number, height: number) => ({ top, bottom, height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect
      if (this === lastEntry) return rect(0, 400, 0)
      if (this === panel) return rect(0, 0, 0)
      if (this === scroller) return rect(0, 600, 600)
      if (this === rail) return rect(0, 0, 150)
      return rect(0, 0, 0)
    })
    Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 800 })
    try {
      act(() => {
        scroller.dispatchEvent(new Event('scroll'))
      })
      expect(rail.getAttribute('data-rail-top')).toBe('250')
      expect(rail.style.top).toBe('250px')
    } finally {
      rectSpy.mockRestore()
      Reflect.deleteProperty(panel, 'clientHeight')
    }
  })

  it('renders dialogue lines in neutral light grey', () => {
    renderPanel()
    expect(screen.getByText('"A"').style.color).toBe('rgb(185, 185, 185)')
  })

  it('publishes the portrait medallion size variables on the column', () => {
    const { container } = renderPanel()
    const panel = container.querySelector<HTMLElement>('[data-layout]')
    expect(panel?.style.getPropertyValue('--rail-small')).toBe('clamp(24px, 4.2vw, 126px)')
    expect(panel?.style.getPropertyValue('--rail-big')).toBe('clamp(48px, 8.4vw, 252px)')
  })

  it('sizes choice text from the Suzerain-scaled desktop variable at 1440x900', () => {
    const { container } = renderPanel()
    const panel = container.querySelector<HTMLElement>('[data-layout]')
    expect(panel?.style.getPropertyValue('--choice-font')).toBe('clamp(6.5px, 0.95vw, 29px)')
    expect(panel?.style.getPropertyValue('--choice-hint-font')).toBe('clamp(6px, 0.85vw, 26px)')
  })

  it('pins the column to the top of the viewport', () => {
    const { container } = renderPanel()
    const panel = container.querySelector<HTMLElement>('[data-layout]')
    expect(panel?.style.top).toBe('0px')
  })

  it('offsets the column 0.3vw left of centre via its right inset', () => {
    const { container } = renderPanel()
    const panel = container.querySelector<HTMLElement>('[data-layout]')
    expect(panel?.style.right).toBe('0.6vw')
  })

  it('labels speakers as "NAME :" with no role', () => {
    renderPanel()
    const label = screen.getByText('Vyktor Reznik :')
    expect(label.textContent).not.toContain('·')
    expect(screen.getByText('Gregor Marić :')).toBeInTheDocument()
  })

  it('renders the scene title once, inside the scrolling history', () => {
    renderPanel(undefined, 'Column Probe')
    const titles = screen.getAllByText('Column Probe')
    expect(titles).toHaveLength(1)
    const firstLine = screen.getByText('"A"')
    expect(nearestScroller(titles[0])).toBe(nearestScroller(firstLine))
  })
})

describe('ConversationPanel thoughts and choice overflow', () => {
  const THOUGHT_HISTORY = [
    { id: '1', type: 'internal_thought', text: 'The river is wider than the map shows' },
    { id: '2', type: 'dialogue', characterId: 'vyktor_reznik', text: 'A' },
  ]

  const CHOICES = [
    { id: 'c1', text: 'Option one' },
    { id: 'c2', text: 'Option two' },
  ]

  const CHOICES_MASK = 'linear-gradient(to bottom, black 0%, black calc(100% - 36px), transparent 100%)'

  interface RenderOptions {
    history?: HistoryEntries
    choices?: typeof CHOICES
    showChoices?: boolean
  }

  function overflowPanel({ history = THOUGHT_HISTORY as HistoryEntries, choices = CHOICES, showChoices = true }: RenderOptions = {}) {
    return (
      <ConversationPanel
        sceneTitle="Overflow Probe"
        sceneLocation="Cabinet Room"
        sceneType="meeting"
        currentWeek={2}
        sceneCharacters={[]}
        history={history}
        activeSegment={null}
        activeText=""
        showCursor={false}
        choices={choices as Parameters<typeof ConversationPanel>[0]['choices']}
        showChoices={showChoices}
        sceneDone={false}
        allDone={false}
        segmentDone={true}
        onAdvance={vi.fn()}
        onChoice={vi.fn()}
        onAdvanceQueue={vi.fn()}
        continueLabel="Continue"
        speakingCharacter={undefined}
      />
    )
  }

  function renderWithChoices(options: RenderOptions = {}) {
    return render(overflowPanel(options))
  }

  // Fakes a scrollable choice list: content taller than its visible box.
  function stubChoiceOverflow(overflowing: boolean) {
    const scrollHeight = overflowing ? 500 : 100
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 100 })
  }

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    useWeekStore.setState({ phase: 'scene' })
    useNarrativeStore.setState({
      currentScene: { id: 't', title: 'Overflow Probe', location: 'Cabinet Room', type: 'meeting', narrative: [] } as unknown as CurrentScene,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight')
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight')
    vi.unstubAllGlobals()
  })

  it('renders internal thoughts without the ✦ glyph', () => {
    renderWithChoices({ showChoices: false })
    expect(screen.getByText('The river is wider than the map shows')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('✦')
  })

  it('never shows a "scroll for more options" text cue, even when choices overflow', () => {
    stubChoiceOverflow(true)
    renderWithChoices()
    expect(screen.getByText('Option one')).toBeInTheDocument()
    expect(screen.queryByText(/scroll for more options/i)).toBeNull()
    expect(document.body.textContent).not.toMatch(/scroll for more options/i)
  })

  it('fades the bottom of the choice list when choices overflow', () => {
    stubChoiceOverflow(true)
    const writes = recordStyleWrites(['maskImage', 'WebkitMaskImage'])
    try {
      renderWithChoices()
    } finally {
      writes.restore()
    }
    expect(writes.values).toContain(CHOICES_MASK)
    const list = screen.getByText('Option one').closest<HTMLElement>('.conversation-choices')
    expect(list?.style.overflowY).toBe('auto')
  })

  it('applies no mask when the choice list fits', () => {
    stubChoiceOverflow(false)
    const writes = recordStyleWrites(['maskImage', 'WebkitMaskImage'])
    try {
      renderWithChoices()
    } finally {
      writes.restore()
    }
    expect(writes.values).not.toContain(CHOICES_MASK)
  })

  it('keeps the newest line visible by pinning the history to its bottom when choices appear', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 1000 })
    const { rerender } = renderWithChoices({ showChoices: false })
    const scroller = screen.getByText('"A"').closest<HTMLElement>('[data-entry]')?.parentElement
    expect(scroller?.style.overflowY).toBe('auto')
    if (scroller) scroller.scrollTop = 0

    rerender(overflowPanel({ showChoices: true }))
    expect(screen.getByText('Option one')).toBeInTheDocument()
    expect(scroller?.scrollTop).toBe(1000)
  })
})
