import type { CSSProperties } from 'react'
import type { MeetingNote } from '../../types/meetingNotes'
import { rem } from '../../constants/typography'

// Non-component pieces of Katerin's journal: ink colour, handwriting style, page paper and
// pure week helpers. Kept out of journalBook.tsx so that file exports components only.

export const INK = '#3a2a1a'
export const INK_SHADOW = '0 0 0.4px rgba(58,42,26,0.6)'
const HANDWRITING_FONT = "'Cedarville Cursive', cursive"
const FIBRE_NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 0 0.08  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`
const EDGE_SHADE = 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(110,70,25,0.30) 100%)'
const PAPER_COLOUR = '#dccaa2'

export const LEATHER_BACKGROUND =
  'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px) 0 0 / 3px 3px, #3a2618'

export const HAND_STYLE: CSSProperties = {
  fontFamily: HANDWRITING_FONT,
  fontSize: rem(19),
  lineHeight: 1.6,
  color: INK,
  textShadow: INK_SHADOW,
  margin: 0,
}

/** Aged paper: spine shadow on the side facing the binding, edge shading, foxing and fibre noise. */
export function paperBackground(spineSide: 'left' | 'right', stains: Array<[number, number, number]>): string {
  const spineShadow = spineSide === 'right'
    ? 'linear-gradient(to left, rgba(60,35,10,0.35), transparent 40px) right 0 top 0 / 40px 100% no-repeat'
    : 'linear-gradient(to right, rgba(60,35,10,0.35), transparent 40px) left 0 top 0 / 40px 100% no-repeat'
  const stainLayers = stains.map(([x, y, radius]) =>
    `radial-gradient(circle at ${x}% ${y}%, rgba(120,80,30,0.10) 0, transparent ${radius}px)`,
  )
  return [spineShadow, EDGE_SHADE, ...stainLayers, FIBRE_NOISE, PAPER_COLOUR].join(', ')
}

/** Sorted, unique weeks that have at least one meeting note. */
export function sortedNoteWeeks(notes: MeetingNote[]): number[] {
  return [...new Set(notes.map(note => note.week))].sort((a, b) => a - b)
}

/** The nearest week with notes before (-1) or after (+1) the current one, or undefined at the ends. */
export function adjacentNoteWeek(weeks: number[], current: number, direction: -1 | 1): number | undefined {
  if (direction < 0) {
    const earlier = weeks.filter(week => week < current)
    return earlier[earlier.length - 1]
  }
  return weeks.find(week => week > current)
}
