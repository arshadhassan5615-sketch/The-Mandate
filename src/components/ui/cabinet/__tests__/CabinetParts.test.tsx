import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  CabinetButton,
  CabinetCard,
  GoldFrame,
  MedallionClose,
  NationalSeal,
  OrnamentRule,
} from '../CabinetParts'
import { cabPillSegment } from '../cabinetStyles'
import { rem } from '../../../../constants/typography'

describe('MedallionClose', () => {
  it('renders a button with the given aria-label and calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<MedallionClose label="Close decree" onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Close decree' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('OrnamentRule', () => {
  it('renders the ornament rule test id', () => {
    render(<OrnamentRule />)
    expect(screen.getByTestId('ornament-rule')).toBeInTheDocument()
  })
})

describe('GoldFrame', () => {
  it('renders exactly four gold corner brackets', () => {
    render(<GoldFrame />)
    expect(screen.getAllByTestId('gold-corner')).toHaveLength(4)
  })
})

describe('CabinetCard', () => {
  it('renders its title in an h3 and its children', () => {
    render(
      <CabinetCard title="Ministry of Finance" testId="card">
        <p>Budget line</p>
      </CabinetCard>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Ministry of Finance' })).toBeInTheDocument()
    expect(screen.getByText('Budget line')).toBeInTheDocument()
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('never shrinks inside a flex column by default', () => {
    render(
      <CabinetCard title="Audio" testId="card">
        <p>Slider</p>
      </CabinetCard>,
    )
    expect(screen.getByTestId('card').style.flexShrink).toBe('0')
  })

  it('lets a passed style override flex-shrink', () => {
    render(
      <CabinetCard title="Codex" testId="card" style={{ flexShrink: 1 }}>
        <p>Entries</p>
      </CabinetCard>,
    )
    expect(screen.getByTestId('card').style.flexShrink).toBe('1')
  })
})

describe('CabinetButton', () => {
  it('renders the primary class names', () => {
    render(<CabinetButton variant="primary">Sign</CabinetButton>)
    const button = screen.getByRole('button', { name: 'Sign' })
    expect(button).toHaveClass('cabinet-btn', 'cabinet-btn--primary')
  })

  it('defaults to type button and the secondary variant', () => {
    render(<CabinetButton>Cancel</CabinetButton>)
    const button = screen.getByRole('button', { name: 'Cancel' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('cabinet-btn', 'cabinet-btn--secondary')
  })

  it('passes through disabled and onClick', () => {
    const onClick = vi.fn()
    const { rerender } = render(<CabinetButton onClick={onClick}>Go</CabinetButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(
      <CabinetButton onClick={onClick} disabled>
        Go
      </CabinetButton>,
    )
    const button = screen.getByRole('button', { name: 'Go' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('NationalSeal', () => {
  it('uses screen blending and the dark data-surface on dark panels', () => {
    render(<NationalSeal surface="dark" size={64} />)
    const seal = screen.getByTestId('national-seal')
    expect(seal).toHaveAttribute('data-surface', 'dark')
    expect(seal.style.mixBlendMode).toBe('screen')
  })

  it('uses multiply blending and the paper data-surface on paper', () => {
    render(<NationalSeal surface="paper" size={64} />)
    const seal = screen.getByTestId('national-seal')
    expect(seal).toHaveAttribute('data-surface', 'paper')
    expect(seal.style.mixBlendMode).toBe('multiply')
  })
})

describe('cabPillSegment', () => {
  it('uses a gold border when active', () => {
    expect(cabPillSegment(true).border).toContain('--cab-gold')
  })

  it('uses a transparent border when inactive', () => {
    expect(cabPillSegment(false).border).toBe('1px solid transparent')
  })
})

describe('CabinetButton size', () => {
  it('uses the regular padding and type size by default', () => {
    render(<CabinetButton>Cancel</CabinetButton>)
    const button = screen.getByRole('button', { name: 'Cancel' })
    expect(button).toHaveStyle({ padding: '11px 30px', fontSize: rem(13) })
    expect(button).not.toHaveAttribute('size')
  })

  it('uses the small padding and type size when size is small', () => {
    render(<CabinetButton size="small">Cancel</CabinetButton>)
    const button = screen.getByRole('button', { name: 'Cancel' })
    expect(button).toHaveStyle({ padding: '7px 16px', fontSize: rem(11.5) })
    expect(button).not.toHaveAttribute('size')
  })
})
