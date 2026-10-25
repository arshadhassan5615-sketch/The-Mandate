import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ALL_CODEX_ENTRIES, useCodexStore } from '../../../stores/codexStore'
import { renderWithEntities } from '../EntityLinker'
import { allEntityCodexIds } from '../entityMaps'

describe('entity codex links', () => {
  it('every id the linker can produce exists in the codex', () => {
    const codexIds = new Set(ALL_CODEX_ENTRIES.map(entry => entry.id))
    const missing = allEntityCodexIds().filter(id => !codexIds.has(id))
    expect(missing, `Missing codex ids: ${missing.join(', ')}`).toEqual([])
  })
})

describe('renderWithEntities', () => {
  beforeEach(() => {
    useCodexStore.setState({ activeEntryId: null, inlineCodexOpen: false })
  })

  it('opens the inline codex entry for a faction link when clicked', () => {
    render(<>{renderWithEntities('The Iron Covenant met in Ashenmere.', true)}</>)

    const ironLink = screen.getByText('Iron Covenant')
    const provinceLink = screen.getByText('Ashenmere')
    expect(ironLink).toBeInTheDocument()
    expect(provinceLink).toBeInTheDocument()

    fireEvent.click(ironLink)

    const state = useCodexStore.getState()
    expect(state.activeEntryId).toBe('faction_iron_covenant')
    expect(state.inlineCodexOpen).toBe(true)
  })
})
