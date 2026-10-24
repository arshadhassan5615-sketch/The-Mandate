import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentPager } from '../DocumentPager'

function renderPager(overrides: Partial<Parameters<typeof DocumentPager>[0]> = {}) {
  const onPrevious = vi.fn()
  const onNext = vi.fn()
  render(
    <DocumentPager index={1} total={3} noun="Decree" onPrevious={onPrevious} onNext={onNext} {...overrides} />,
  )
  return { onPrevious, onNext }
}

describe('DocumentPager', () => {
  it('shows a 1-based "X of Y" label for the current index', () => {
    renderPager({ index: 1, total: 3 })
    expect(screen.getByText('Decree 2 of 3')).toBeInTheDocument()
  })

  it('shows "No decrees" when there are no documents', () => {
    renderPager({ index: 0, total: 0 })
    expect(screen.getByText('No decrees')).toBeInTheDocument()
  })

  it('disables the previous button on the first document', () => {
    renderPager({ index: 0, total: 3 })
    expect(screen.getByRole('button', { name: 'Previous decree' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next decree' })).toBeEnabled()
  })

  it('disables the next button on the last document', () => {
    renderPager({ index: 2, total: 3 })
    expect(screen.getByRole('button', { name: 'Next decree' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous decree' })).toBeEnabled()
  })

  it('disables both buttons when there are no documents', () => {
    renderPager({ index: 0, total: 0 })
    expect(screen.getByRole('button', { name: 'Previous decree' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next decree' })).toBeDisabled()
  })

  it('calls onPrevious and onNext when the enabled buttons are clicked', () => {
    const { onPrevious, onNext } = renderPager({ index: 1, total: 3 })
    fireEvent.click(screen.getByRole('button', { name: 'Previous decree' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next decree' }))
    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('uses the noun in the aria labels in lower case', () => {
    renderPager({ index: 1, total: 3, noun: 'Letter' })
    expect(screen.getByRole('button', { name: 'Previous letter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next letter' })).toBeInTheDocument()
    expect(screen.getByText('Letter 2 of 3')).toBeInTheDocument()
  })
})
