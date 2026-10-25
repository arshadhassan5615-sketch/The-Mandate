import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocumentSeal, SignatureLine } from '../StateDocument'

describe('DocumentSeal', () => {
  it('shows the seal of the Republic', () => {
    render(<DocumentSeal />)
    expect(screen.getByAltText('Seal of the Republic of Veltria')).toBeInTheDocument()
  })
})

describe('SignatureLine', () => {
  it('shows an empty line with its caption before signing', () => {
    render(<SignatureLine isSigned={false} caption="Chancellor of the Republic" />)
    expect(screen.getByText('Chancellor of the Republic')).toBeInTheDocument()
    expect(screen.queryByAltText('Signature of Katerin Ashavel')).not.toBeInTheDocument()
  })

  it('writes the signature in once signed', () => {
    render(<SignatureLine isSigned caption="Chancellor of the Republic" />)
    expect(screen.getByAltText('Signature of Katerin Ashavel')).toBeInTheDocument()
  })

  it('crops the signature to its ink band when cropToInk is set', () => {
    render(<SignatureLine isSigned cropToInk caption="Chancellor of the Republic" />)
    const img = screen.getByAltText('Signature of Katerin Ashavel')
    expect(img.style.objectFit).toBe('cover')
    expect(img.getAttribute('style')).toMatch(/aspect-ratio:\s*1\s*\/\s*0\.3/)
  })

  it('keeps the signature contained by default', () => {
    render(<SignatureLine isSigned caption="Chancellor of the Republic" />)
    const img = screen.getByAltText('Signature of Katerin Ashavel')
    expect(img.style.objectFit).toBe('contain')
    expect(img.getAttribute('style')).not.toMatch(/aspect-ratio/)
  })
})
