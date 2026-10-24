import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CharacterCard from '../CharacterCard'
import ConversationPanel from '../ConversationPanel'
import { characterCardData } from '../characterCardData'
import type { CharacterCardData } from '../characterCardData'
import { INITIAL_STATE } from '../../../stores/gameStore'
import { useWeekStore } from '../../../stores/weekStore'
import { useNarrativeStore } from '../../../stores/narrativeStore'

type CurrentScene = NonNullable<ReturnType<typeof useNarrativeStore.getState>['currentScene']>
type HistoryEntries = Parameters<typeof ConversationPanel>[0]['history']

const VYKTOR_CARD: CharacterCardData = {
  id: 'vyktor_reznik',
  name: 'Vyktor Reznik',
  title: 'Chief of Staff',
  faction: 'Civic Renewal',
  relationship: 'Loyal and dependable',
  description: 'Your closest advisor.',
}

function anchorAt(left: number, top: number, width = 40, height = 40): DOMRect {
  return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect
}

describe('characterCardData', () => {
  it('returns the name, title, faction and relationship in words for a faction character', () => {
    const state = { ...INITIAL_STATE, factions: { ...INITIAL_STATE.factions, workersCoalition: 70 } }
    expect(characterCardData('gregor_maric', state)).toEqual({
      id: 'gregor_maric',
      name: 'Gregor Marić',
      title: 'Minister of Labor',
      faction: "Workers' Coalition",
      relationship: 'Loyal and dependable',
      description: expect.any(String),
    })
  })

  it('reads a personal character relationship from the personal stat', () => {
    const state = { ...INITIAL_STATE, personal: { ...INITIAL_STATE.personal, marriageHealth: 85 } }
    const data = characterCardData('jonas_ashavel', state)
    expect(data?.relationship).toBe('Your closest ally')
    expect(data?.faction).toBeNull()
  })

  it('returns null for an id that is not in the roster', () => {
    expect(characterCardData('zz_unknown_person', INITIAL_STATE)).toBeNull()
  })

  it('returns null for the player, so the player never gets a card', () => {
    expect(characterCardData('katerin_ashavel', INITIAL_STATE)).toBeNull()
  })
})

describe('CharacterCard', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  function setViewport(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  }

  beforeEach(() => setViewport(1024, 768))

  afterEach(() => setViewport(originalWidth, originalHeight))

  it('renders the name, title, faction and a relationship pill in a tooltip', () => {
    render(<CharacterCard data={VYKTOR_CARD} anchor={anchorAt(100, 300)} />)
    const card = screen.getByRole('tooltip')
    expect(card).toHaveAttribute('data-testid', 'character-card')
    expect(card).toHaveTextContent('Vyktor Reznik')
    expect(card).toHaveTextContent('Chief of Staff')
    expect(card).toHaveTextContent('Civic Renewal')
    expect(screen.getByText('Loyal and dependable')).toBeInTheDocument()
  })

  it('shows no numbers', () => {
    render(<CharacterCard data={VYKTOR_CARD} anchor={anchorAt(100, 300)} />)
    expect(screen.getByRole('tooltip').textContent).not.toMatch(/\d/)
  })

  it('shows initials when the character has no portrait', () => {
    render(<CharacterCard data={{ ...VYKTOR_CARD, id: 'zz_unknown_person', name: 'Zed Unknown' }} anchor={anchorAt(100, 300)} />)
    expect(screen.getByText('ZU')).toBeInTheDocument()
  })

  it('omits the faction line when the character has no faction', () => {
    render(<CharacterCard data={{ ...VYKTOR_CARD, faction: null }} anchor={anchorAt(100, 300)} />)
    expect(screen.queryByText('Civic Renewal')).toBeNull()
  })

  it('sits to the right of the anchor, 12px out, at the anchor top', () => {
    render(<CharacterCard data={VYKTOR_CARD} anchor={anchorAt(100, 300, 40, 40)} />)
    const card = screen.getByTestId('character-card')
    expect(card.style.left).toBe('152px')
    expect(card.style.top).toBe('300px')
    expect(card.style.position).toBe('fixed')
  })

  it('flips to the left of the anchor when the right side would overflow the viewport', () => {
    render(<CharacterCard data={VYKTOR_CARD} anchor={anchorAt(900, 300, 40, 40)} />)
    expect(screen.getByTestId('character-card').style.left).toBe('608px')
  })

  it('keeps the card top inside the viewport', () => {
    render(<CharacterCard data={VYKTOR_CARD} anchor={anchorAt(100, 700, 40, 40)} />)
    expect(screen.getByTestId('character-card').style.top).toBe('590px')
  })

  it('ignores the pointer so the card never steals hover from the speaker', () => {
    render(<CharacterCard data={VYKTOR_CARD} anchor={anchorAt(100, 300)} />)
    expect(screen.getByTestId('character-card').style.pointerEvents).toBe('none')
  })
})

describe('ConversationPanel speaker cards', () => {
  const HISTORY = [
    { id: '1', type: 'dialogue', characterId: 'vyktor_reznik', text: 'A' },
    { id: '2', type: 'dialogue', characterId: 'gregor_maric', text: 'B' },
    { id: '3', type: 'player_spoken', text: 'C' },
  ] as HistoryEntries

  function renderPanel(history: HistoryEntries = HISTORY) {
    return render(
      <ConversationPanel
        sceneTitle="Test"
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
        onAdvance={() => {}}
        onChoice={() => {}}
        onAdvanceQueue={() => {}}
        continueLabel="Continue"
        speakingCharacter={undefined}
      />,
    )
  }

  beforeEach(() => {
    useWeekStore.setState({ phase: 'scene' })
    useNarrativeStore.setState({
      currentScene: { id: 't', title: 'Test', location: 'Cabinet Room', type: 'meeting', narrative: [] } as unknown as CurrentScene,
    })
  })

  it('keeps the visible speaker text as "NAME :" on the hover target', () => {
    renderPanel()
    expect(screen.getAllByTestId('speaker-name')[0]).toHaveTextContent(/^Vyktor Reznik :$/)
  })

  it('shows the character card when an NPC speaker name is hovered', () => {
    renderPanel()
    fireEvent.mouseEnter(screen.getAllByTestId('speaker-name')[0])
    const card = screen.getByTestId('character-card')
    expect(card).toHaveTextContent('Vyktor Reznik')
    expect(card).toHaveTextContent('Chief of Staff')
  })

  it('hides the card when the pointer leaves the speaker name', () => {
    renderPanel()
    const name = screen.getAllByTestId('speaker-name')[0]
    fireEvent.mouseEnter(name)
    fireEvent.mouseLeave(name)
    expect(screen.queryByTestId('character-card')).toBeNull()
  })

  it('shows the card on keyboard focus of a speaker name', () => {
    renderPanel()
    fireEvent.focus(screen.getAllByTestId('speaker-name')[0])
    expect(screen.getByTestId('character-card')).toHaveTextContent('Vyktor Reznik')
  })

  it('never gives the player label a hover target or a card', () => {
    renderPanel()
    const youLabel = screen.getByText('YOU :')
    expect(youLabel.closest('[data-testid="speaker-name"]')).toBeNull()
    expect(screen.getAllByTestId('speaker-name')).toHaveLength(2)
    fireEvent.mouseEnter(youLabel)
    expect(screen.queryByTestId('character-card')).toBeNull()
  })

  it('shows only one card at a time', () => {
    renderPanel()
    const [vyktorName, gregorName] = screen.getAllByTestId('speaker-name')
    fireEvent.mouseEnter(vyktorName)
    fireEvent.mouseEnter(gregorName)
    const cards = screen.getAllByTestId('character-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]).toHaveTextContent('Gregor Marić')
  })

  it('clears the card when its speaker label leaves the conversation while hovered', () => {
    const { rerender } = renderPanel()
    fireEvent.mouseEnter(screen.getAllByTestId('speaker-name')[0])
    expect(screen.getByTestId('character-card')).toBeInTheDocument()

    rerender(
      <ConversationPanel
        sceneTitle="Test"
        sceneLocation="Cabinet Room"
        sceneType="meeting"
        currentWeek={2}
        sceneCharacters={[]}
        history={[{ id: '2', type: 'dialogue', characterId: 'gregor_maric', text: 'B' }] as HistoryEntries}
        activeSegment={null}
        activeText=""
        showCursor={false}
        choices={[]}
        showChoices={false}
        sceneDone={false}
        allDone={false}
        segmentDone={true}
        onAdvance={() => {}}
        onChoice={() => {}}
        onAdvanceQueue={() => {}}
        continueLabel="Continue"
        speakingCharacter={undefined}
      />,
    )
    expect(screen.queryByTestId('character-card')).toBeNull()
  })
})
