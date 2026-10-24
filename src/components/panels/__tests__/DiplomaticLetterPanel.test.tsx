import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DiplomaticLetterPanel from '../DiplomaticLetterPanel'
import { useLetterStore } from '../../../stores/letterStore'
import type { DiplomaticLetter } from '../../../types/letters'

function letter(id: string, headline: string): DiplomaticLetter {
  return {
    id,
    weekTriggered: 1,
    sender: 'Ambassador Test',
    senderTitle: 'Ambassador of Testland',
    ministry: 'Ministry of Testing',
    headline,
    body: 'First paragraph of the letter.\n\nSecond paragraph of the letter.',
    seal: 'arcturian',
    entities: [],
  }
}

const FIRST = letter('letter_first', 'Opening overture from the north')
const SECOND = letter('letter_second', 'Reply on the grain tariffs')

function seed(isOpen: boolean) {
  useLetterStore.setState({
    letters: [FIRST, SECOND],
    readIds: new Set<string>(),
    currentIndex: 0,
    isOpen,
    unreadCount: 2,
  })
}

describe('DiplomaticLetterPanel', () => {
  beforeEach(() => {
    seed(false)
  })

  it('shows the first letter with a count of two', () => {
    seed(true)
    render(<DiplomaticLetterPanel />)
    expect(screen.getByRole('heading', { name: FIRST.headline })).toBeInTheDocument()
    expect(screen.getByText('Letter 1 of 2')).toBeInTheDocument()
  })

  it('shows the next letter when Next is pressed', () => {
    seed(true)
    render(<DiplomaticLetterPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Next letter' }))
    expect(screen.getByRole('heading', { name: SECOND.headline })).toBeInTheDocument()
    expect(screen.getByText('Letter 2 of 2')).toBeInTheDocument()
  })

  it('closes when Close letters is pressed', () => {
    seed(true)
    render(<DiplomaticLetterPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Close letters' }))
    expect(useLetterStore.getState().isOpen).toBe(false)
    expect(screen.queryByTestId('diplomatic-letter')).not.toBeInTheDocument()
  })
})
