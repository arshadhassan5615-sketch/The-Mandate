import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ProvinceNewsPins from '../ProvinceNewsPins'
import { useNewsStore } from '../../../stores/newsStore'
import { useGameStore } from '../../../stores/gameStore'
import { useProvinceNewsStore } from '../../../stores/provinceNewsStore'
import type { NewsArticle } from '../../../types/news'

const CRISIS_HEADLINE = 'Shaft collapse in Kravenstal leaves forty trapped'

function article(overrides: Partial<NewsArticle> & Pick<NewsArticle, 'id' | 'headline'>): NewsArticle {
  return {
    body: 'Details are still coming in.',
    publication: 'ashenmere_herald',
    weekNumber: 3,
    date: '20 Oct 1963',
    templateId: `tpl_${overrides.id}`,
    category: 'economy',
    ...overrides,
  }
}

const SEED_ARTICLES: NewsArticle[] = [
  article({ id: 'crisis-kravenstal', headline: CRISIS_HEADLINE, category: 'crisis' }),
  article({ id: 'economy-thornfeld', headline: 'Grain quotas rise in Thornfeld', category: 'economy' }),
  article({ id: 'old-kravenstal', headline: 'Kravenstal strike ends', category: 'economy', weekNumber: 1 }),
]

function provinceContainer(id: string): HTMLElement {
  return screen.getByTestId(`province-news-${id}`)
}

describe('ProvinceNewsPins', () => {
  beforeEach(() => {
    useNewsStore.setState({ articles: [], isOpen: false })
    useGameStore.setState({ currentWeek: 3 })
    useProvinceNewsStore.getState().reset()
  })

  it('uses the same notification pin for every province update, crises included', () => {
    useNewsStore.setState({ articles: SEED_ARTICLES })
    render(<ProvinceNewsPins />)

    const kravenstalPins = within(provinceContainer('kravenstal')).getAllByTestId('notification-pin')
    expect(kravenstalPins).toHaveLength(1)
    expect(kravenstalPins[0]).toHaveAttribute('data-kind', 'news')

    const thornfeldPins = within(provinceContainer('thornfeld')).getAllByTestId('notification-pin')
    expect(thornfeldPins).toHaveLength(1)
    expect(thornfeldPins[0]).toHaveAttribute('data-kind', 'news')
  })

  it('renders no container for provinces without reports', () => {
    useNewsStore.setState({ articles: SEED_ARTICLES })
    render(<ProvinceNewsPins />)

    expect(screen.queryByTestId('province-news-ashenmere')).toBeNull()
    expect(screen.queryByTestId('province-news-sevagrad')).toBeNull()
    expect(screen.queryByTestId('province-news-aldenmoor')).toBeNull()
    expect(screen.queryByTestId('province-news-dravenhollow')).toBeNull()
  })

  it('opens the dispatches for a province and marks its reports seen', () => {
    useNewsStore.setState({ articles: SEED_ARTICLES })
    render(<ProvinceNewsPins />)

    fireEvent.click(within(provinceContainer('kravenstal')).getByTestId('notification-pin'))

    const dialog = screen.getByRole('dialog', { name: /Kravenstal dispatches/ })
    expect(within(dialog).getByText(CRISIS_HEADLINE)).toBeInTheDocument()
    expect(screen.queryByTestId('province-news-kravenstal')).toBeNull()
  })

  it('closes the dispatches from the Close button', () => {
    useNewsStore.setState({ articles: SEED_ARTICLES })
    render(<ProvinceNewsPins />)

    fireEvent.click(within(provinceContainer('kravenstal')).getByTestId('notification-pin'))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens the newspapers and closes the dispatches', () => {
    useNewsStore.setState({ articles: SEED_ARTICLES })
    render(<ProvinceNewsPins />)

    fireEvent.click(within(provinceContainer('kravenstal')).getByTestId('notification-pin'))
    fireEvent.click(screen.getByRole('button', { name: 'Open the newspapers' }))

    expect(useNewsStore.getState().isOpen).toBe(true)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows one update pin per province with a count of its unseen updates', () => {
    const many = ['a1', 'a2', 'a3', 'a4', 'a5'].map(id =>
      article({ id, headline: `Kravenstal report ${id}`, category: 'economy' }),
    )
    useNewsStore.setState({ articles: many })
    render(<ProvinceNewsPins />)

    const container = provinceContainer('kravenstal')
    const pins = within(container).getAllByTestId('notification-pin')
    expect(pins).toHaveLength(1)
    expect(within(container).getByTestId('pin-count')).toHaveTextContent('5')
  })

  it('shows no notification pin for a province that has a meeting pin', () => {
    useNewsStore.setState({ articles: SEED_ARTICLES })
    render(<ProvinceNewsPins meetingProvinces={new Set(['kravenstal'])} />)

    expect(screen.queryByTestId('province-news-kravenstal')).toBeNull()
    expect(screen.getByTestId('province-news-thornfeld')).toBeInTheDocument()
  })
})
