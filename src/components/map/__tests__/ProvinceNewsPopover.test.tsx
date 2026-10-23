import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProvinceNewsPopover from '../ProvinceNewsPopover'
import type { ProvinceNewsItem } from '../../../engine/provinceNews'
import type { NewsArticle } from '../../../types/news'

const ALERT_ARTICLE: NewsArticle = {
  id: 'alert-1',
  headline: 'Shaft collapse traps forty miners',
  body: 'Rescue crews reached the lower galleries before dawn.',
  publication: 'peoples_standard',
  weekNumber: 3,
  date: '14 Mar 1963',
  templateId: 'tpl_collapse',
  category: 'crisis',
}

const ECONOMY_ARTICLE: NewsArticle = {
  id: 'news-1',
  headline: 'Smelter output climbs for a second month',
  body: 'Foundry managers credit new furnace contracts.',
  publication: 'ashenmere_herald',
  weekNumber: 3,
  date: '12 Mar 1963',
  templateId: 'tpl_smelter',
  category: 'economy',
}

const ITEMS: ProvinceNewsItem[] = [
  { article: ALERT_ARTICLE, isAlert: true },
  { article: ECONOMY_ARTICLE, isAlert: false },
]

function renderPopover(overrides: Partial<Parameters<typeof ProvinceNewsPopover>[0]> = {}) {
  const props = {
    provinceName: 'Kravenstal',
    items: ITEMS,
    onClose: vi.fn(),
    onOpenPapers: vi.fn(),
    ...overrides,
  }
  render(<ProvinceNewsPopover {...props} />)
  return props
}

describe('ProvinceNewsPopover', () => {
  it('lists each headline and the paper name', () => {
    renderPopover()
    expect(screen.getByRole('heading', { name: ALERT_ARTICLE.headline })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: ECONOMY_ARTICLE.headline })).toBeInTheDocument()
    expect(screen.getByText(/The People's Standard · 14 Mar 1963/)).toBeInTheDocument()
    expect(screen.getByText(/The Ashenmere Herald · 12 Mar 1963/)).toBeInTheDocument()
  })

  it('shows URGENT only for alert items', () => {
    renderPopover()
    expect(screen.getAllByText('URGENT')).toHaveLength(1)
  })

  it('names the dialog after the province', () => {
    renderPopover()
    expect(screen.getByRole('dialog', { name: 'Kravenstal dispatches' })).toBeInTheDocument()
  })

  it('calls onClose from the Close button', () => {
    const { onClose } = renderPopover()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape', () => {
    const { onClose } = renderPopover()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on a backdrop click', () => {
    const { onClose } = renderPopover()
    fireEvent.click(screen.getByTestId('province-news-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for a click inside the panel', () => {
    const { onClose } = renderPopover()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the empty-state text when there are no items', () => {
    renderPopover({ items: [] })
    expect(screen.getByText('No reports from this province in the last two weeks.')).toBeInTheDocument()
  })

  it('calls onOpenPapers from the Open the newspapers button', () => {
    const { onOpenPapers } = renderPopover()
    fireEvent.click(screen.getByRole('button', { name: 'Open the newspapers' }))
    expect(onOpenPapers).toHaveBeenCalledTimes(1)
  })
})
