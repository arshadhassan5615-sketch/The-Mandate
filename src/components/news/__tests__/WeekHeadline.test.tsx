import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import WeekHeadline from '../WeekHeadline'
import { topStoryOfWeek } from '../weekTopStory'
import { useGameStore } from '../../../stores/gameStore'
import { useNewsStore } from '../../../stores/newsStore'
import { useWeekStore } from '../../../stores/weekStore'
import type { NewsArticle } from '../../../types/news'

const SHOW_MS = 7000

function makeArticle(overrides: Partial<NewsArticle>): NewsArticle {
  return {
    id: 'article-1',
    headline: 'Harbour strike spreads',
    body: 'Body text',
    publication: 'ashenmere_herald',
    weekNumber: 3,
    date: '21 January 1963',
    templateId: 'template-1',
    category: 'economy',
    ...overrides,
  }
}

function advance(ms: number) {
  act(() => { vi.advanceTimersByTime(ms) })
}

// The exit animation runs on real animation frames, which fake timers do not drive.
// Once the state change has happened, switch to real timers and wait for removal.
async function expectHeadlineGone() {
  vi.useRealTimers()
  await waitFor(() => expect(screen.queryByTestId('week-headline')).toBeNull(), { timeout: 2000 })
}

describe('topStoryOfWeek', () => {
  it('picks a crisis over an economy story', () => {
    const economy = makeArticle({ id: 'eco', category: 'economy' })
    const crisis = makeArticle({ id: 'cri', category: 'crisis' })

    expect(topStoryOfWeek([economy, crisis], 3)).toBe(crisis)
  })

  it('breaks ties by list order', () => {
    const first = makeArticle({ id: 'first', category: 'crisis' })
    const second = makeArticle({ id: 'second', category: 'crisis' })

    expect(topStoryOfWeek([first, second], 3)).toBe(first)
  })

  it('ignores articles from other weeks', () => {
    const otherWeekCrisis = makeArticle({ id: 'old', weekNumber: 2, category: 'crisis' })
    const economy = makeArticle({ id: 'eco', weekNumber: 3, category: 'economy' })

    expect(topStoryOfWeek([otherWeekCrisis, economy], 3)).toBe(economy)
  })

  it('returns null for an empty list or a week with no articles', () => {
    expect(topStoryOfWeek([], 3)).toBeNull()
    expect(topStoryOfWeek([makeArticle({ weekNumber: 2 })], 3)).toBeNull()
  })
})

describe('WeekHeadline', () => {
  beforeEach(() => {
    // Only the hide timer is faked; animation frames stay real so framer-motion exits can finish.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    useGameStore.setState({ currentWeek: 3 })
    useWeekStore.setState({ phase: 'map' })
    useNewsStore.setState({ articles: [makeArticle({})], isOpen: false, lastReadIndex: -1, readRecords: {} })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the week top story with its paper name on the map', () => {
    render(<WeekHeadline />)

    const headline = screen.getByTestId('week-headline')
    expect(headline).toHaveTextContent('The Ashenmere Herald')
    expect(headline).toHaveTextContent('Harbour strike spreads')
    expect(headline).toHaveTextContent('21 January 1963')
  })

  it('opens the papers and hides when the clipping is clicked', async () => {
    render(<WeekHeadline />)

    fireEvent.click(screen.getByTestId('week-headline'))

    expect(useNewsStore.getState().isOpen).toBe(true)
    await expectHeadlineGone()
  })

  it('hides on dismiss without opening the papers', async () => {
    render(<WeekHeadline />)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss headline' }))

    expect(useNewsStore.getState().isOpen).toBe(false)
    await expectHeadlineGone()
  })

  it('auto-hides after the show window', async () => {
    render(<WeekHeadline />)

    advance(SHOW_MS - 1)
    expect(screen.getByTestId('week-headline')).toBeInTheDocument()

    advance(1)
    await expectHeadlineGone()
  })

  it('stays visible while hovered past the show window and hides after mouse leave', async () => {
    render(<WeekHeadline />)
    const headline = screen.getByTestId('week-headline')

    fireEvent.mouseEnter(headline)
    advance(SHOW_MS * 2)
    expect(screen.getByTestId('week-headline')).toBeInTheDocument()

    fireEvent.mouseLeave(headline)
    advance(SHOW_MS - 1)
    expect(screen.getByTestId('week-headline')).toBeInTheDocument()

    advance(1)
    await expectHeadlineGone()
  })

  it('stays visible while focus is inside past the show window and hides after focus leaves', async () => {
    render(<WeekHeadline />)
    const headline = screen.getByTestId('week-headline')

    act(() => { headline.focus() })
    advance(SHOW_MS * 2)
    expect(screen.getByTestId('week-headline')).toBeInTheDocument()

    act(() => { headline.blur() })
    advance(SHOW_MS)
    await expectHeadlineGone()
  })

  it('does not reappear for the same week after it has been hidden', async () => {
    render(<WeekHeadline />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss headline' }))
    await expectHeadlineGone()

    act(() => {
      useNewsStore.getState().addArticles([makeArticle({ id: 'late', category: 'crisis' })])
    })

    expect(screen.queryByTestId('week-headline')).toBeNull()
  })

  it('shows once for a new week', async () => {
    render(<WeekHeadline />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss headline' }))
    await expectHeadlineGone()

    act(() => {
      useGameStore.setState({ currentWeek: 4 })
      useNewsStore.getState().addArticles([makeArticle({ id: 'week-4', weekNumber: 4, headline: 'Week four story' })])
    })

    expect(screen.getByTestId('week-headline')).toHaveTextContent('Week four story')
  })

  it('shows nothing when the week has no articles', () => {
    useNewsStore.setState({ articles: [makeArticle({ weekNumber: 2 })] })

    render(<WeekHeadline />)

    expect(screen.queryByTestId('week-headline')).toBeNull()
  })

  it('shows nothing outside the map phase', () => {
    useWeekStore.setState({ phase: 'scene' })

    render(<WeekHeadline />)

    expect(screen.queryByTestId('week-headline')).toBeNull()
  })
})
