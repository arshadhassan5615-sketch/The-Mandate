import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotepadPanel from '../NotepadPanel'
import { useGameStore } from '../../../stores/gameStore'
import type { MeetingNote } from '../../../types/meetingNotes'

const week1Note: MeetingNote = {
  sceneId: 'scene_inauguration',
  title: 'Inauguration',
  week: 1,
  lines: ['Vyktor watched the room closely.'],
}

const week2Note: MeetingNote = {
  sceneId: 'scene_cabinet',
  title: 'Cabinet Appointments',
  week: 2,
  lines: ['Vostane and Maric cannot both be pleased.', 'The Church controls the rural schools.'],
}

describe('NotepadPanel (Katerin\'s journal)', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentWeek: 2,
      personalNotes: '',
      meetingNotes: [week1Note, week2Note],
    })
  })

  it('renders a dialog labelled Katerin\'s Journal', () => {
    render(<NotepadPanel onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Katerin\'s Journal' })).toBeInTheDocument()
  })

  it('opens on the latest week with notes and shows its titles and lines', () => {
    render(<NotepadPanel onClose={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Cabinet Appointments' })).toBeInTheDocument()
    expect(screen.getByText('Vostane and Maric cannot both be pleased.')).toBeInTheDocument()
    expect(screen.getByText('The Church controls the rural schools.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Inauguration' })).not.toBeInTheDocument()
  })

  it('pages back to the previous week with notes and disables Previous at the first one', () => {
    render(<NotepadPanel onClose={() => {}} />)
    const previous = screen.getByRole('button', { name: 'Previous week' })
    expect(previous).toBeEnabled()
    fireEvent.click(previous)
    expect(screen.getByRole('heading', { name: 'Inauguration' })).toBeInTheDocument()
    expect(screen.getByText('Vyktor watched the room closely.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Cabinet Appointments' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next week' })).toBeEnabled()
  })

  it('shows the empty-state text for a week with no notes', () => {
    useGameStore.setState({ currentWeek: 3, meetingNotes: [] })
    render(<NotepadPanel onClose={() => {}} />)
    expect(screen.getByText('Nothing written yet. The meetings will fill these pages.')).toBeInTheDocument()
  })

  it('autosaves typing in the notes page to personalNotes', async () => {
    render(<NotepadPanel onClose={() => {}} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'My notes' }), {
      target: { value: 'Deficit is worse than intel' },
    })
    await waitFor(
      () => expect(useGameStore.getState().personalNotes).toBe('Deficit is worse than intel'),
      { timeout: 3500 },
    )
  })

  it('closes when Close journal is clicked', () => {
    const onClose = vi.fn()
    render(<NotepadPanel onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close journal' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<NotepadPanel onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
