import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import CodexImages from '../CodexImages'

describe('CodexImages', () => {
  it('renders nothing for an unknown entry id', () => {
    const { container } = render(<CodexImages entryId="no_such_entry" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the junta flag as main with one alternative thumbnail for Morivask', () => {
    render(<CodexImages entryId="nation_morivask" />)
    const main = screen.getByTestId('codex-image-main')
    expect(within(main).getByText('Flag of the Skala junta · since 1959')).toBeInTheDocument()
    expect(screen.getAllByTestId('codex-image-alt')).toHaveLength(1)
    expect(screen.getByText('Other flags')).toBeInTheDocument()
  })

  it('makes the republic flag the main image when its thumbnail is clicked', () => {
    render(<CodexImages entryId="nation_morivask" />)
    fireEvent.click(screen.getByRole('button', { name: 'Show Republic of Morivask · until 1959' }))
    const main = screen.getByTestId('codex-image-main')
    expect(within(main).getByText('Republic of Morivask · until 1959')).toBeInTheDocument()
    expect(within(main).queryByText('Flag of the Skala junta · since 1959')).toBeNull()
    expect(screen.getByRole('button', { name: 'Show Flag of the Skala junta · since 1959' })).toBeInTheDocument()
  })

  it('renders a character portrait fully opaque', () => {
    render(<CodexImages entryId="character_danika_oberlin" />)
    const main = screen.getByTestId('codex-image-main')
    // The portrait's <img> sits directly inside its circular frame, which carries the opacity
    const frame = within(main).getByAltText('Danika Oberlin').parentElement
    expect(frame).not.toBeNull()
    expect(frame).toHaveStyle({ opacity: '1' })
  })
})
