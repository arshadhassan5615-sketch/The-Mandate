import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import MapScenePin from '../MapScenePin'
import type { AgendaItem } from '../../types/week'
import type { NewsArticle } from '../../types/news'
import { useNewsStore } from '../../stores/newsStore'
import { useGameStore } from '../../stores/gameStore'
import { useProvinceNewsStore } from '../../stores/provinceNewsStore'
import { useWeekStore } from '../../stores/weekStore'

const CURRENT_WEEK = 3
const CRISIS_ID = 'crisis-kravenstal'

const MEETING: AgendaItem = {
  id: 'strike_at_the_mill',
  title: 'Strike at the Mill',
  description: 'The union waits at the gate.',
  category: 'crisis',
  sceneId: '__test_scene',
  slotCost: 1,
  executionOrder: 1,
  weekAvailable: 1,
  weekDeadline: CURRENT_WEEK + 2,
}

function crisisArticle(): NewsArticle {
  return {
    id: CRISIS_ID,
    headline: 'Shaft collapse in Kravenstal leaves forty trapped',
    body: 'Details are still coming in.',
    publication: 'ashenmere_herald',
    weekNumber: CURRENT_WEEK,
    date: '20 Oct 1963',
    templateId: 'tpl_crisis',
    category: 'crisis',
  }
}

function renderPin(onSelectScene = vi.fn()) {
  render(
    <MapScenePin
      provinceId="kravenstal"
      items={[MEETING]}
      currentWeek={CURRENT_WEEK}
      onSelectScene={onSelectScene}
    />,
  )
  return onSelectScene
}

function openMenu() {
  fireEvent.click(screen.getByTestId('notification-pin'))
  return screen.getByRole('dialog', { name: 'Kravenstal: choose an action' })
}

describe('MapScenePin', () => {
  beforeEach(() => {
    useNewsStore.setState({ articles: [], isOpen: false })
    useProvinceNewsStore.getState().reset()
    useGameStore.setState({ currentWeek: CURRENT_WEEK })
  })

  it('lists only the meeting when the province has no news', () => {
    renderPin()
    const menu = openMenu()

    expect(within(menu).getByTestId('choice-strike_at_the_mill')).toBeInTheDocument()
    expect(within(menu).queryByTestId('choice-__updates')).toBeNull()
  })

  it('lists unseen updates first, followed by the meeting', () => {
    useNewsStore.setState({ articles: [crisisArticle()] })
    renderPin()
    const menu = openMenu()

    const choices = within(menu).getAllByRole('button')
    expect(choices[0]).toHaveAttribute('data-testid', 'choice-__updates')
    expect(choices[0]).toHaveTextContent('1 new update from Kravenstal')
    expect(choices[1]).toHaveAttribute('data-testid', 'choice-strike_at_the_mill')
  })

  it('calls onSelectScene with the meeting when it is chosen', () => {
    const onSelectScene = renderPin()
    const menu = openMenu()

    fireEvent.click(within(menu).getByTestId('choice-strike_at_the_mill'))

    expect(onSelectScene).toHaveBeenCalledTimes(1)
    expect(onSelectScene).toHaveBeenCalledWith(MEETING)
  })

  it('opens the dispatches and marks the reports seen when updates are chosen', () => {
    useNewsStore.setState({ articles: [crisisArticle()] })
    const onSelectScene = renderPin()
    const menu = openMenu()

    fireEvent.click(within(menu).getByTestId('choice-__updates'))

    expect(screen.getByRole('dialog', { name: 'Kravenstal dispatches' })).toBeInTheDocument()
    expect(useProvinceNewsStore.getState().seenIds).toContain(CRISIS_ID)
    expect(onSelectScene).not.toHaveBeenCalled()
  })

  it('opens the same menu when the touch target around the pin is tapped', () => {
    renderPin()

    fireEvent.click(screen.getByTestId('pin-touch-hit'))

    expect(screen.getByRole('dialog', { name: 'Kravenstal: choose an action' })).toBeInTheDocument()
  })

  it('closes the menu when Escape is pressed', () => {
    renderPin()
    openMenu()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Kravenstal: choose an action' })).toBeNull()
  })
})

describe('MapScenePin when a scene starts', () => {
  beforeEach(() => {
    useNewsStore.setState({ articles: [], isOpen: false })
    useProvinceNewsStore.getState().reset()
    useGameStore.setState({ currentWeek: CURRENT_WEEK })
    useWeekStore.setState({ phase: 'map' })
  })

  it('closes the menu and unfocuses once, and a new callback does not unfocus again', () => {
    const onUnfocusProvince = vi.fn()
    const { rerender } = render(
      <MapScenePin
        provinceId="kravenstal"
        items={[MEETING]}
        currentWeek={CURRENT_WEEK}
        onSelectScene={vi.fn()}
        onFocusProvince={vi.fn()}
        onUnfocusProvince={onUnfocusProvince}
      />,
    )
    fireEvent.click(screen.getByTestId('notification-pin'))
    expect(screen.getByTestId('province-choice-tab')).toBeInTheDocument()

    act(() => {
      useWeekStore.setState({ phase: 'scene' })
    })

    expect(screen.queryByTestId('province-choice-tab')).toBeNull()
    expect(onUnfocusProvince).toHaveBeenCalledTimes(1)

    const nextOnUnfocusProvince = vi.fn()
    rerender(
      <MapScenePin
        provinceId="kravenstal"
        items={[MEETING]}
        currentWeek={CURRENT_WEEK}
        onSelectScene={vi.fn()}
        onFocusProvince={vi.fn()}
        onUnfocusProvince={nextOnUnfocusProvince}
      />,
    )

    expect(onUnfocusProvince).toHaveBeenCalledTimes(1)
    expect(nextOnUnfocusProvince).not.toHaveBeenCalled()
  })
})
