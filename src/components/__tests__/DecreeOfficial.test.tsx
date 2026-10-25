// Decree page as a formal state decree: numbered heading, preamble, articles,
// dating line and a seal slot beside the Chancellor's signature.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import DecreeInbox from '../DecreeInbox'
import { useDecreeStore } from '../../stores/decreeStore'
import { useGameStore } from '../../stores/gameStore'
import { ALL_DECREES } from '../../data/decrees'
import type { Decree } from '../../types/decree'
import { proposalPhrase } from '../decree/decreeWording'

function decree(id: string): Decree {
  const found = ALL_DECREES.find(d => d.id === id)
  if (!found) throw new Error(`missing decree ${id}`)
  return found
}

function provisionParagraphs(d: Decree): string[] {
  return d.description.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0)
}

function seedPending(d: Decree) {
  useDecreeStore.setState({
    pendingDecrees: [d],
    signedDecrees: [],
    rejectedDecrees: [],
    tabledDecrees: [],
    selectedDecree: d,
    pendingLongTermEffects: [],
  })
}

function seedSigned(d: Decree) {
  const signed = { ...d, signed: true }
  useDecreeStore.setState({
    pendingDecrees: [],
    signedDecrees: [signed],
    rejectedDecrees: [],
    tabledDecrees: [],
    selectedDecree: signed,
    pendingLongTermEffects: [],
  })
}

describe('decree as a formal state document', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: 2 })
  })

  it('numbers the decree by the year of the week', () => {
    const price = decree('decree_price_controls')
    seedPending(price)
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByTestId('decree-number')).toHaveTextContent(/^DECREE No\. \d+ OF 1963$/)
  })

  it('opens with the preamble naming the proposal and HEREBY DECREES', () => {
    const price = decree('decree_price_controls')
    seedPending(price)
    render(<DecreeInbox onClose={() => {}} />)
    const preamble = screen.getByTestId('decree-preamble')
    expect(preamble).toHaveTextContent('having regard to the Constitution of the Republic')
    expect(preamble).toHaveTextContent(proposalPhrase(price.proposedBy))
    expect(screen.getByTestId('decree-hereby')).toHaveTextContent('HEREBY DECREES')
    expect(screen.getByTestId('decree-sub')).toHaveTextContent(proposalPhrase(price.proposedBy))
  })

  it('numbers the articles: summary, each provision paragraph, then entry into force', () => {
    const price = decree('decree_price_controls')
    const paragraphs = provisionParagraphs(price)
    seedPending(price)
    render(<DecreeInbox onClose={() => {}} />)
    const articles = within(screen.getByTestId('decree-articles')).getAllByRole('listitem')
    expect(articles).toHaveLength(1 + paragraphs.length + 1)
    expect(articles[0]).toHaveTextContent('ARTICLE 1')
    expect(articles[0]).toHaveTextContent(price.summary)
    expect(articles[articles.length - 1]).toHaveTextContent(
      `ARTICLE ${articles.length}`,
    )
    expect(articles[articles.length - 1]).toHaveTextContent(
      'This decree enters into force on the day of its publication in the Official Gazette.',
    )
  })

  it('dates the decree in words on the given line', () => {
    seedPending(decree('decree_price_controls'))
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByTestId('decree-given')).toHaveTextContent(
      'Given at Ashenmere, this eighth day of January, in the year nineteen hundred and sixty-three.',
    )
  })

  it('leaves a L.S. place for the seal beside the signature while the decree is pending', () => {
    seedPending(decree('decree_price_controls'))
    render(<DecreeInbox onClose={() => {}} />)
    const slot = screen.getByTestId('decree-seal-slot')
    expect(within(slot).getByTestId('decree-locus-sigilli')).toHaveTextContent('L.S.')
    expect(screen.queryByTestId('decree-emblem')).toBeNull()
  })

  it('places the emblem in the seal slot once the decree is signed', () => {
    seedSigned(decree('decree_price_controls'))
    render(<DecreeInbox onClose={() => {}} />)
    const slot = screen.getByTestId('decree-seal-slot')
    expect(within(slot).getByTestId('decree-emblem')).toBeInTheDocument()
    expect(screen.queryByTestId('decree-locus-sigilli')).toBeNull()
  })

  it('prints the state press footer', () => {
    seedPending(decree('decree_price_controls'))
    render(<DecreeInbox onClose={() => {}} />)
    const printer = screen.getByTestId('decree-printer')
    expect(printer).toHaveTextContent('PRINTED BY THE STATE PRESS · ASHENMERE')
    expect(printer).toHaveTextContent('SHEET 1 OF 1')
  })
})

describe('proposalPhrase', () => {
  it('names an ordinary proposer with "the"', () => {
    expect(proposalPhrase('Reform Committee')).toBe('on the proposal of the Reform Committee')
  })

  it('names an archbishop or chancellor without "the"', () => {
    expect(proposalPhrase('Archbishop Renek')).toBe('on the proposal of Archbishop Renek')
  })

  it("treats Chancellor Ashavel's decrees as her own motion", () => {
    expect(proposalPhrase('Chancellor Ashavel')).toBe("issued on the Chancellor's own motion")
  })
})
