import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaperHeading, PaperMeta, PaperSection, PaperSheet, SignatureBlock, WaxSeal } from '../PaperParts'

describe('PaperSheet', () => {
  it('renders the letterhead with the republic name and the default subtitle', () => {
    render(<PaperSheet testId="sheet"><p>Body</p></PaperSheet>)
    expect(screen.getByText('REPUBLIC OF VELTRIA')).toBeInTheDocument()
    expect(screen.getByText('Office of the Chancellor')).toBeInTheDocument()
    expect(screen.getByTestId('national-seal')).toHaveAttribute('data-surface', 'paper')
  })

  it('renders a custom letterhead subtitle', () => {
    render(<PaperSheet letterhead={{ subtitle: 'Ministry of Finance' }}><p>Body</p></PaperSheet>)
    expect(screen.getByText('Ministry of Finance')).toBeInTheDocument()
  })

  it('renders a decorative watermark that is hidden from assistive tech', () => {
    render(<PaperSheet><p>Body</p></PaperSheet>)
    const watermark = screen.getByTestId('paper-watermark')
    expect(watermark.tagName).toBe('IMG')
    expect(watermark).toHaveAttribute('alt', '')
    expect(watermark).toHaveAttribute('aria-hidden', 'true')
  })

  it('hides the letterhead when letterhead is false', () => {
    render(<PaperSheet letterhead={false}><p>Body</p></PaperSheet>)
    expect(screen.queryByText('REPUBLIC OF VELTRIA')).toBeNull()
    expect(screen.queryByTestId('national-seal')).toBeNull()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('hides the watermark when watermark is false', () => {
    render(<PaperSheet watermark={false}><p>Body</p></PaperSheet>)
    expect(screen.queryByTestId('paper-watermark')).toBeNull()
  })
})

describe('PaperSheet aged-paper options', () => {
  it('renders the registry lines left and right', () => {
    render(
      <PaperSheet testId="sheet" registry={{ left: 'REG. No. 1963/041', right: 'WEEK 3 · MARCH 1963' }}>
        <p>Body</p>
      </PaperSheet>,
    )
    expect(screen.getByTestId('paper-registry-left')).toHaveTextContent('REG. No. 1963/041')
    expect(screen.getByTestId('paper-registry-right')).toHaveTextContent('WEEK 3 · MARCH 1963')
  })

  it('omits a registry side that is not given', () => {
    render(<PaperSheet registry={{ left: 'DIPLOMATIC POUCH' }}><p>Body</p></PaperSheet>)
    expect(screen.getByTestId('paper-registry-left')).toBeInTheDocument()
    expect(screen.queryByTestId('paper-registry-right')).toBeNull()
  })

  it('adds 14px of extra top padding when a registry is given', () => {
    render(
      <>
        <PaperSheet testId="plain"><p>Body</p></PaperSheet>
        <PaperSheet testId="registered" registry={{ left: 'REG. No. 1963/001' }}><p>Body</p></PaperSheet>
      </>,
    )
    const plainTop = parseFloat(screen.getByTestId('plain').style.paddingTop)
    const registeredTop = parseFloat(screen.getByTestId('registered').style.paddingTop)
    expect(registeredTop - plainTop).toBe(14)
  })

  it('renders an ink stamp with its label and sub line, red by default', () => {
    render(<PaperSheet stamp={{ label: 'Received', sub: 'Chancellery · 14 MAR 1963' }}><p>Body</p></PaperSheet>)
    const stamp = screen.getByTestId('paper-stamp')
    expect(stamp).toHaveTextContent('Received')
    expect(screen.getByText('Chancellery · 14 MAR 1963')).toBeInTheDocument()
    expect(stamp.style.color).toBe('rgba(122, 42, 42, 0.75)')
  })

  it('uses the green ink for a green stamp', () => {
    render(<PaperSheet stamp={{ label: 'Signed', tone: 'green' }}><p>Body</p></PaperSheet>)
    expect(screen.getByTestId('paper-stamp').style.color).toBe('rgba(61, 106, 52, 0.75)')
  })

  it('renders the footnote inside the sheet', () => {
    render(<PaperSheet testId="sheet" footnote="Translated by the Foreign Ministry"><p>Body</p></PaperSheet>)
    expect(screen.getByTestId('paper-footnote')).toHaveTextContent('Translated by the Foreign Ministry')
    expect(screen.getByTestId('sheet')).toContainElement(screen.getByTestId('paper-footnote'))
  })

  it('wraps the article in the drop-shadow wrapper and keeps testId on the article', () => {
    render(<PaperSheet testId="sheet"><p>Body</p></PaperSheet>)
    const article = screen.getByTestId('sheet')
    expect(article.tagName).toBe('ARTICLE')
    expect(article).toHaveClass('cabinet-paper')
    const wrapper = article.parentElement
    expect(wrapper).toHaveClass('cabinet-paper-wrap')
    expect(wrapper?.style.filter).toContain('drop-shadow')
  })
})

describe('WaxSeal size', () => {
  it('defaults to 62px', () => {
    render(<WaxSeal />)
    expect(screen.getByTestId('wax-seal')).toHaveStyle({ width: '62px', height: '62px' })
  })
})

describe('PaperHeading and PaperMeta', () => {
  it('renders the heading as an h3 with the given id', () => {
    render(<PaperHeading id="decree-title">Decree of the Chancellor</PaperHeading>)
    expect(screen.getByRole('heading', { level: 3, name: 'Decree of the Chancellor' })).toHaveAttribute('id', 'decree-title')
  })

  it('renders the meta line', () => {
    render(<PaperMeta>Week 14, 1963</PaperMeta>)
    expect(screen.getByText('Week 14, 1963')).toBeInTheDocument()
  })
})

describe('PaperSection', () => {
  it('renders the section mark and the heading', () => {
    render(
      <PaperSection heading="Terms of the Levy">
        <p>Clause one</p>
      </PaperSection>,
    )
    expect(screen.getByText('§')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Terms of the Levy' })).toBeInTheDocument()
    expect(screen.getByText('Clause one')).toBeInTheDocument()
  })
})

describe('SignatureBlock', () => {
  it('shows the name when signed', () => {
    render(<SignatureBlock name="K. Ashavel" role="Chancellor" />)
    expect(screen.getByText('K. Ashavel')).toBeInTheDocument()
    expect(screen.getByText('Chancellor')).toBeInTheDocument()
  })

  it('leaves the name out when not signed', () => {
    render(<SignatureBlock name="K. Ashavel" role="Chancellor" signed={false} />)
    expect(screen.queryByText('K. Ashavel')).toBeNull()
    expect(screen.getByText('Chancellor')).toBeInTheDocument()
  })

  it('renders no wax seal by default', () => {
    render(<SignatureBlock name="K. Ashavel" role="Chancellor" />)
    expect(screen.queryByTestId('wax-seal')).toBeNull()
  })

  it('renders a wax seal when sealed', () => {
    render(<SignatureBlock name="K. Ashavel" role="Chancellor" sealed />)
    expect(screen.getByTestId('wax-seal')).toBeInTheDocument()
  })
})

describe('WaxSeal', () => {
  it('is decorative and hidden from assistive tech', () => {
    render(<WaxSeal />)
    expect(screen.getByTestId('wax-seal')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('PaperSheet density by viewport', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  afterEach(() => {
    window.innerWidth = originalWidth
    window.innerHeight = originalHeight
  })

  it('uses a 34px letterhead seal on compact screens and 54px on desktop', () => {
    window.innerWidth = 900
    window.innerHeight = 400
    const { unmount } = render(<PaperSheet testId="sheet"><p>Body</p></PaperSheet>)
    expect(screen.getByTestId('national-seal')).toHaveStyle({ width: '34px', height: '34px' })
    unmount()

    window.innerWidth = 1280
    window.innerHeight = 800
    render(<PaperSheet testId="sheet"><p>Body</p></PaperSheet>)
    expect(screen.getByTestId('national-seal')).toHaveStyle({ width: '54px', height: '54px' })
  })
})
