// Political compass for the results screen, built from the alignment of every
// recorded choice (the same tags the Journal shows). Personal and deflecting
// choices carry no politics and are left out.
//   y axis: Reform (+1, top)  ↔  Authority (-1, bottom)
//   x axis: Pragmatic (-1, left)  ↔  Populist (+1, right)
import type { ChoiceAlignment } from '../../types/journal'

export interface CompassPosition {
  x: number
  y: number
  /** Number of political choices the position is drawn from. */
  count: number
  label: string
}

/** Below this many political choices the position is too noisy to plot. */
export const MIN_COMPASS_CHOICES = 3
/** Inside this distance of an axis the player reads as centrist on it. */
const CENTRE_BAND = 0.15

export function compassPosition(breakdown: Record<ChoiceAlignment, number>): CompassPosition | null {
  const { reformist, authoritarian, populist, pragmatist } = breakdown
  const count = reformist + authoritarian + populist + pragmatist
  if (count < MIN_COMPASS_CHOICES) return null
  const x = (populist - pragmatist) / count
  const y = (reformist - authoritarian) / count
  return { x, y, count, label: compassLabel(x, y) }
}

export function compassLabel(x: number, y: number): string {
  if (Math.abs(x) < CENTRE_BAND && Math.abs(y) < CENTRE_BAND) return 'Steward of the Centre'
  if (Math.abs(x) < CENTRE_BAND) return y > 0 ? 'Constitutional Reformer' : 'Chancellor of Order'
  if (Math.abs(y) < CENTRE_BAND) return x > 0 ? 'Voice of the Crowd' : 'Cabinet Pragmatist'
  if (y > 0) return x > 0 ? 'Tribune of Reform' : 'Reforming Technocrat'
  return x > 0 ? 'Strong Hand of the People' : 'Iron Administrator'
}
