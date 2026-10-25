import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import CodexViewer from '../CodexViewer'
import { useCodexStore } from '../../stores/codexStore'

describe('CodexViewer entry images', () => {
  beforeEach(() => {
    useCodexStore.setState({ activeEntryId: null })
  })

  it('shows the junta flag caption for an entry that has images', () => {
    useCodexStore.getState().openCodex('nations', 'nation_morivask')
    render(<CodexViewer />)

    const paper = screen.getByTestId('codex-entry-paper')
    const main = within(paper).getByTestId('codex-image-main')
    expect(main).toHaveTextContent('Flag of the Skala junta · since 1959')
  })

  it('renders no image block for an entry without images', () => {
    useCodexStore.getState().openCodex('history', 'history_bni')
    render(<CodexViewer />)

    const paper = screen.getByTestId('codex-entry-paper')
    expect(within(paper).queryByTestId('codex-image-main')).toBeNull()
  })
})
