// Ongoing situations for the State of the Republic panel: each national
// pressure as a severity and a trend, in words. The values behind them are
// hidden stats, so no numbers are ever shown. Trends compare today's value with
// the weekly history the game already records (weekStore.completeWeek).
import type { GameState } from '../../types/gameState'

export type Severity = 'Calm' | 'Strained' | 'Serious' | 'Critical'
export type Trend = 'Worsening' | 'Easing' | 'Holding'

export interface Situation {
  id: string
  title: string
  severity: Severity
  trend: Trend
  /** One line in words describing where things stand. */
  summary: string
}

type HistoryPoint = { week: number; value: number }

interface SituationDef {
  id: string
  title: string
  value: (s: SituationState) => number
  history: (s: SituationState) => readonly HistoryPoint[] | undefined
  /** true when a higher value is worse (debt, inflation) */
  higherIsWorse: boolean
  /** Severity bounds, from the calm end: [strained, serious, critical]. */
  bounds: readonly [number, number, number]
  /** Smallest change that counts as a trend rather than noise. */
  deadBand: number
  summaries: Record<Severity, string>
}

export type SituationState = Pick<GameState, 'nation' | 'currentWeek'> &
  Partial<Pick<GameState, 'economyHistory' | 'debtHistory' | 'inflationHistory' | 'publicOrderHistory'>>

const DEFS: readonly SituationDef[] = [
  {
    id: 'economy', title: 'The Economy',
    value: s => s.nation.economyHealth, history: s => s.economyHistory,
    higherIsWorse: false, bounds: [10, -20, -50], deadBand: 2,
    summaries: {
      Calm: 'Output is growing steadily.',
      Strained: 'Output is stagnating.',
      Serious: 'The economy is contracting.',
      Critical: 'The economy is in freefall.',
    },
  },
  {
    id: 'debt', title: 'National Debt',
    value: s => s.nation.nationalDebt, history: s => s.debtHistory,
    higherIsWorse: true, bounds: [300, 450, 600], deadBand: 5,
    summaries: {
      Calm: 'Debt is under control.',
      Strained: 'Debt service is weighing on the budget.',
      Serious: 'Creditors are growing nervous.',
      Critical: 'The Republic is close to default.',
    },
  },
  {
    id: 'inflation', title: 'Prices',
    value: s => s.nation.inflation, history: s => s.inflationHistory,
    higherIsWorse: true, bounds: [5, 10, 18], deadBand: 0.5,
    summaries: {
      Calm: 'Prices are steady.',
      Strained: 'Prices are climbing faster than wages.',
      Serious: 'Families are struggling to buy bread and fuel.',
      Critical: 'Money is losing its value week by week.',
    },
  },
  {
    id: 'order', title: 'Public Order',
    value: s => s.nation.publicOrder, history: s => s.publicOrderHistory,
    higherIsWorse: false, bounds: [65, 45, 28], deadBand: 2,
    summaries: {
      Calm: 'The streets are quiet.',
      Strained: 'Protests flare up in the cities.',
      Serious: 'Unrest is spreading beyond the capital.',
      Critical: 'The state is losing control of the streets.',
    },
  },
]

const SEVERITY_RANK: Record<Severity, number> = { Critical: 0, Serious: 1, Strained: 2, Calm: 3 }

/** How many weeks back the trend looks, to smooth single-week noise. */
const TREND_WINDOW_WEEKS = 2

export function severityOf(value: number, def: Pick<SituationDef, 'higherIsWorse' | 'bounds'>): Severity {
  const [strained, serious, critical] = def.bounds
  const worseThan = (bound: number) => (def.higherIsWorse ? value >= bound : value < bound)
  if (worseThan(critical)) return 'Critical'
  if (worseThan(serious)) return 'Serious'
  if (worseThan(strained)) return 'Strained'
  return 'Calm'
}

export function trendOf(
  now: number,
  history: readonly HistoryPoint[] | undefined,
  currentWeek: number,
  def: Pick<SituationDef, 'higherIsWorse' | 'deadBand'>,
): Trend {
  if (!history || history.length === 0) return 'Holding'
  const target = currentWeek - TREND_WINDOW_WEEKS
  // The latest snapshot at or before the target week; else the oldest we have.
  const earlier = [...history].reverse().find(p => p.week <= target) ?? history[0]
  const change = now - earlier.value
  if (Math.abs(change) < def.deadBand) return 'Holding'
  const gettingWorse = def.higherIsWorse ? change > 0 : change < 0
  return gettingWorse ? 'Worsening' : 'Easing'
}

/** Every national situation, most severe first (worsening before easing on ties). */
export function buildSituations(state: SituationState): Situation[] {
  return DEFS
    .map(def => {
      const value = def.value(state)
      const severity = severityOf(value, def)
      return {
        id: def.id,
        title: def.title,
        severity,
        trend: trendOf(value, def.history(state), state.currentWeek, def),
        summary: def.summaries[severity],
      }
    })
    .sort((a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      Number(b.trend === 'Worsening') - Number(a.trend === 'Worsening'))
}
