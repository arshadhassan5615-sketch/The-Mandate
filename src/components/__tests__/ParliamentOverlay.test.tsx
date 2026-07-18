import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ParliamentOverlay, {
  verdictText,
  stanceColor,
} from '../ParliamentOverlay'
import type { ParliamentBill, ParliamentBillResult } from '../../types/parliament'

function makeBill(overrides: Partial<ParliamentBill> = {}): ParliamentBill {
  return {
    id: 'pb_ui_1',
    title: 'Worker Safety Reform Act',
    proposingBloc: 'reformist',
    weekAvailable: 8,
    description: 'A measure to strengthen factory inspections across Kravenstal.',
    baselineStances: {
      conservative: 'against',
      hardliner: 'against',
      reformist: 'for',
    },
    fullText: 'Section 1. Test full text.',
    signEffects: [],
    vetoEffects: [],
    signFlags: [],
    vetoFlags: [],
    canSpeak: false,
    ...overrides,
  }
}

function makeResult(
  billOverrides: Partial<ParliamentBill> = {},
  resultOverrides: Partial<Omit<ParliamentBillResult, 'bill'>> = {},
): ParliamentBillResult {
  return {
    bill: makeBill(billOverrides),
    computedStances: {
      conservative: 'against',
      hardliner: 'against',
      reformist: 'for',
    },
    forWeight: 50,
    againstWeight: 40,
    passed: true,
    isStrongMajority: false,
    marginPercent: 10,
    ...resultOverrides,
  }
}

describe('verdictText / stanceColor pure helpers', () => {
  it('produces correct strings for fail / strong-pass / narrow-pass', () => {
    expect(
      verdictText(makeResult({}, { passed: false, isStrongMajority: false, marginPercent: -20 })),
    ).toBe('The motion fails to carry.')

    expect(
      verdictText(makeResult({}, { passed: true, isStrongMajority: true, marginPercent: 40 })),
    ).toBe('The motion carries by a commanding majority.')

    expect(
      verdictText(makeResult({}, { passed: true, isStrongMajority: false, marginPercent: 5 })),
    ).toBe('The motion carries — narrowly.')
  })

  it('maps stance colors', () => {
    expect(stanceColor('for')).toBe('var(--accent-green)')
    expect(stanceColor('against')).toBe('var(--accent-red)')
    expect(stanceColor('neutral')).toBe('#c9a84c')
  })
})

describe('ParliamentOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the first bill announce stage on mount', () => {
    const results = [makeResult({ title: 'Worker Safety Reform Act' })]
    render(<ParliamentOverlay results={results} onComplete={() => {}} />)

    expect(screen.getByTestId('parliament-stage-announce')).toBeTruthy()
    expect(screen.getByTestId('parliament-bill-title').textContent).toContain(
      'Worker Safety Reform Act',
    )
    expect(screen.getByText(/strengthen factory inspections/i)).toBeTruthy()
  })

  it('skips speak_prompt when canSpeak is false (announce → stances → verdict)', () => {
    const results = [makeResult({ canSpeak: false })]
    render(<ParliamentOverlay results={results} onComplete={() => {}} />)

    fireEvent.click(screen.getByTestId('parliament-continue')) // → stances
    expect(screen.getByTestId('parliament-stage-stances')).toBeTruthy()

    fireEvent.click(screen.getByTestId('parliament-continue')) // → verdict (skip speak)
    expect(screen.getByTestId('parliament-stage-verdict')).toBeTruthy()
    expect(screen.queryByTestId('parliament-stage-speak-prompt')).toBeNull()
  })

  it('passes through speak_prompt when canSpeak is true', () => {
    const results = [
      makeResult({
        canSpeak: true,
        speakFlavorText: 'I ask this chamber to vote its conscience.',
      }),
    ]
    render(<ParliamentOverlay results={results} onComplete={() => {}} />)

    fireEvent.click(screen.getByTestId('parliament-continue')) // announce → stances
    fireEvent.click(screen.getByTestId('parliament-continue')) // stances → speak_prompt
    expect(screen.getByTestId('parliament-stage-speak-prompt')).toBeTruthy()
    expect(screen.getByTestId('parliament-speak')).toBeTruthy()
    expect(screen.getByTestId('parliament-stay-silent')).toBeTruthy()
  })

  it('Stay Silent skips speak_shown and goes to verdict', () => {
    const results = [
      makeResult({
        canSpeak: true,
        speakFlavorText: 'Words that should not appear if silent.',
      }),
    ]
    render(<ParliamentOverlay results={results} onComplete={() => {}} />)

    fireEvent.click(screen.getByTestId('parliament-continue'))
    fireEvent.click(screen.getByTestId('parliament-continue'))
    fireEvent.click(screen.getByTestId('parliament-stay-silent'))

    expect(screen.getByTestId('parliament-stage-verdict')).toBeTruthy()
    expect(screen.queryByTestId('parliament-speak-flavor')).toBeNull()
  })

  it('Speak shows speakFlavorText before verdict', () => {
    const flavor = 'I ask this chamber to vote its conscience.'
    const results = [makeResult({ canSpeak: true, speakFlavorText: flavor })]
    render(<ParliamentOverlay results={results} onComplete={() => {}} />)

    fireEvent.click(screen.getByTestId('parliament-continue'))
    fireEvent.click(screen.getByTestId('parliament-continue'))
    fireEvent.click(screen.getByTestId('parliament-speak'))

    expect(screen.getByTestId('parliament-stage-speak-shown')).toBeTruthy()
    expect(screen.getByTestId('parliament-speak-flavor').textContent).toBe(flavor)

    fireEvent.click(screen.getByTestId('parliament-continue'))
    expect(screen.getByTestId('parliament-stage-verdict')).toBeTruthy()
  })

  it('advancing past the last bill verdict calls onComplete once with full results', () => {
    const results = [
      makeResult({ id: 'pb_a', title: 'Bill A', canSpeak: false }),
      makeResult({ id: 'pb_b', title: 'Bill B', canSpeak: false }),
    ]
    const onComplete = vi.fn()
    render(<ParliamentOverlay results={results} onComplete={onComplete} />)

    // Bill A: announce → stances → verdict → next
    fireEvent.click(screen.getByTestId('parliament-continue'))
    fireEvent.click(screen.getByTestId('parliament-continue'))
    expect(screen.getByTestId('parliament-verdict-text')).toBeTruthy()
    fireEvent.click(screen.getByTestId('parliament-continue')) // Next Bill

    // Bill B announce
    expect(screen.getByTestId('parliament-stage-announce')).toBeTruthy()
    expect(screen.getByTestId('parliament-bill-title').textContent).toContain('Bill B')

    fireEvent.click(screen.getByTestId('parliament-continue'))
    fireEvent.click(screen.getByTestId('parliament-continue'))
    fireEvent.click(screen.getByTestId('parliament-continue')) // Conclude Sitting

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(results)
  })

  it('empty results array calls onComplete([]) without crashing', () => {
    const onComplete = vi.fn()
    const { container } = render(
      <ParliamentOverlay results={[]} onComplete={onComplete} />,
    )

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith([])
    expect(container.querySelector('[data-testid="parliament-overlay"]')).toBeNull()
  })
})
