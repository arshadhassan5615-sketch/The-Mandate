import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import LetterView from '../LetterView'
import { useGameStore } from '../../stores/gameStore'

// The Jonas letter opens from week 8 while the marriage is strained.
function openJonasPreview(tone: 'Personal' | 'Formal') {
  render(<LetterView onClose={() => {}} />)
  fireEvent.click(screen.getAllByRole('button').find(b => /jonas/i.test(b.textContent ?? ''))!)
  fireEvent.click(screen.getByText(tone))
  fireEvent.click(screen.getByText('PREVIEW LETTER'))
}

describe('LetterView preview', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    const g = useGameStore.getState()
    useGameStore.setState({ currentWeek: 8, sentLetters: [], personal: { ...g.personal, marriageHealth: 40 } })
  })
  afterEach(() => vi.useRealTimers())

  it('sends a personal letter as Katerin, without the state seal', () => {
    openJonasPreview('Personal')
    expect(screen.queryByAltText('Seal of the Republic of Veltria')).not.toBeInTheDocument()
    expect(screen.getByText('Katerin Ashavel')).toBeInTheDocument()
  })

  it('puts a formal letter under the state seal', () => {
    openJonasPreview('Formal')
    expect(screen.getByAltText('Seal of the Republic of Veltria')).toBeInTheDocument()
    expect(screen.getByText('Office of the Chancellor')).toBeInTheDocument()
  })

  it('signs the letter before it is sent', () => {
    vi.useFakeTimers()
    openJonasPreview('Personal')
    fireEvent.click(screen.getByText('SIGN & SEND'))
    expect(screen.getByAltText('Signature of Katerin Ashavel')).toBeInTheDocument()
    expect(useGameStore.getState().sentLetters).toHaveLength(0)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(useGameStore.getState().sentLetters).toHaveLength(1)
    expect(screen.getByText('Letter Sent')).toBeInTheDocument()
  })
})
