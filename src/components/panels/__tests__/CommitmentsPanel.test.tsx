import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import CommitmentsPanel from '../CommitmentsPanel'
import { useCommitmentStore } from '../../../stores/commitmentStore'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import type { Commitment, ResolutionRule } from '../../../engine/commitments'
import { charName } from '../../narrative/speakers'

const promisePensions: Commitment = {
  id: 'scene_harbour:choice_1',
  sceneId: 'scene_harbour',
  sceneTitle: 'The Harbour Speech',
  choiceId: 'choice_1',
  week: 4,
  quote: 'I promise the pensions will be paid.',
  witnesses: ['gregor_maric', 'minister_volkov'],
  flags: ['promised_pensions'],
}

const promiseMines: Commitment = {
  id: 'scene_breakfast:choice_2',
  sceneId: 'scene_breakfast',
  sceneTitle: 'Cabinet Breakfast',
  choiceId: 'choice_2',
  week: 9,
  quote: 'You have my word on the mines.',
  witnesses: ['irina_dusek'],
  flags: ['promised_mines'],
}

const NO_RULES: readonly ResolutionRule[] = []

function seed(commitments: Commitment[], activeFlags: string[] = []) {
  useCommitmentStore.setState({ commitments })
  useNarrativeStore.setState({ activeFlags })
}

describe('CommitmentsPanel', () => {
  beforeEach(() => {
    seed([])
  })

  it('is a labelled dialog titled Commitments', () => {
    render(<CommitmentsPanel onClose={() => {}} rules={NO_RULES} />)
    expect(screen.getByRole('dialog', { name: 'Commitments' })).toBeInTheDocument()
  })

  it('lists outstanding commitments newest first with week, scene, quote, witnesses and On record', () => {
    seed([promisePensions, promiseMines])
    render(<CommitmentsPanel onClose={() => {}} rules={NO_RULES} />)

    const entries = screen.getAllByTestId('commitment-entry')
    expect(entries).toHaveLength(2)
    expect(entries[0]).toHaveTextContent('Week 9 · Cabinet Breakfast')
    expect(entries[1]).toHaveTextContent('Week 4 · The Harbour Speech')

    expect(screen.getByText('“You have my word on the mines.”')).toBeInTheDocument()
    expect(screen.getByText('“I promise the pensions will be paid.”')).toBeInTheDocument()
    expect(screen.getByText(charName('irina_dusek'))).toBeInTheDocument()
    expect(screen.getByText(charName('gregor_maric'))).toBeInTheDocument()
    expect(screen.getByText(charName('minister_volkov'))).toBeInTheDocument()

    const statuses = screen.getAllByTestId('commitment-status')
    expect(statuses).toHaveLength(2)
    for (const status of statuses) {
      expect(status).toHaveAttribute('data-status', 'outstanding')
      expect(status).toHaveTextContent('On record')
    }
  })

  it('shows the outstanding count on the On record tab', () => {
    seed([promisePensions, promiseMines])
    render(<CommitmentsPanel onClose={() => {}} rules={NO_RULES} />)
    expect(screen.getByRole('tab', { name: /On record/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /On record/ })).toHaveTextContent('(2)')
    expect(screen.getByRole('tab', { name: /Resolved/ })).toHaveTextContent('(0)')
  })

  it('moves a commitment to Resolved with a Kept stamp when a keptBy flag is active', () => {
    seed([promisePensions, promiseMines], ['pensions_paid'])
    const rules: ResolutionRule[] = [{ madeBy: 'promised_pensions', keptBy: ['pensions_paid'] }]
    render(<CommitmentsPanel onClose={() => {}} rules={rules} />)

    expect(screen.getAllByTestId('commitment-entry')).toHaveLength(1)
    expect(screen.getByRole('tab', { name: /Resolved/ })).toHaveTextContent('(1)')

    fireEvent.click(screen.getByRole('tab', { name: /Resolved/ }))
    const entry = screen.getByTestId('commitment-entry')
    expect(entry).toHaveTextContent('I promise the pensions will be paid.')
    const status = within(entry).getByTestId('commitment-status')
    expect(status).toHaveAttribute('data-status', 'kept')
    expect(status).toHaveTextContent('Kept')
  })

  it('shows a Broken stamp when a brokenBy flag is active', () => {
    seed([promisePensions, promiseMines], ['mines_sold'])
    const rules: ResolutionRule[] = [{ madeBy: 'promised_mines', brokenBy: ['mines_sold'] }]
    render(<CommitmentsPanel onClose={() => {}} rules={rules} />)

    fireEvent.click(screen.getByRole('tab', { name: /Resolved/ }))
    const status = screen.getByTestId('commitment-status')
    expect(status).toHaveAttribute('data-status', 'broken')
    expect(status).toHaveTextContent('Broken')
  })

  it('shows the empty note for On record when nothing has been promised', () => {
    render(<CommitmentsPanel onClose={() => {}} rules={NO_RULES} />)
    expect(
      screen.getByText('You have given no commitments yet. When you give your word, it is recorded here.'),
    ).toBeInTheDocument()
  })

  it('shows the empty note for Resolved when no commitment has been tested', () => {
    seed([promisePensions])
    render(<CommitmentsPanel onClose={() => {}} rules={NO_RULES} />)
    fireEvent.click(screen.getByRole('tab', { name: /Resolved/ }))
    expect(screen.getByText('No commitment has been tested yet.')).toBeInTheDocument()
  })

  it('ties the selected tab to the tabpanel it shows', () => {
    seed([promisePensions])
    render(<CommitmentsPanel onClose={() => {}} rules={NO_RULES} />)
    const record = screen.getByRole('tab', { name: /On record/ })
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', record.getAttribute('aria-controls'))
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', record.id)

    fireEvent.click(screen.getByRole('tab', { name: /Resolved/ }))
    const resolved = screen.getByRole('tab', { name: /Resolved/ })
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', resolved.getAttribute('aria-controls'))
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', resolved.id)
  })

  it('closes from the close button and from Escape', () => {
    const onClose = vi.fn()
    render(<CommitmentsPanel onClose={onClose} rules={NO_RULES} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close Commitments' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
