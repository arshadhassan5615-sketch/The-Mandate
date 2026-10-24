import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { MeetingNote } from '../../types/meetingNotes'
import { rem } from '../../constants/typography'
import { weekToDate } from '../../engine/dates'
import { INK, INK_SHADOW, HAND_STYLE } from './journalPaper'

// Visual pieces of Katerin's journal (see docs/ui-contenders/j1-journal-book.html).
// Components only; the non-component helpers live in journalPaper.ts.

const HEADING_FONT = "'La Belle Aurore', cursive"
const CINZEL_FONT = "'Cinzel', Georgia, serif"

/** Hand-drawn heading with a 1.5px ink underline, 70% wide and tilted -1 degree. */
export function InkHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      style={{
        fontFamily: HEADING_FONT,
        fontSize: rem(24),
        lineHeight: 1.3,
        color: INK,
        textShadow: INK_SHADOW,
        margin: 0,
        width: 'fit-content',
      }}
    >
      {children}
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          width: '70%',
          height: 1.5,
          marginTop: 2,
          background: INK,
          transform: 'rotate(-1deg)',
          transformOrigin: 'left center',
        }}
      />
    </h3>
  )
}

const INK_TEXT_BUTTON_BASE: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: HEADING_FONT,
  fontSize: rem(15),
  color: 'rgba(58,42,26,0.75)',
  textUnderlineOffset: '3px',
}

/** Small ink-styled text button that underlines on hover (the Wk / Sc / Ch quick inserts). */
export function InkTextButton({ label, title, onClick }: { label: string; title?: string; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...INK_TEXT_BUTTON_BASE, textDecoration: isHovered ? 'underline' : 'none' }}
    >
      {label}
    </button>
  )
}

const PAGER_BUTTON_BASE: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  flexShrink: 0,
  background: 'radial-gradient(circle at 50% 30%, #2c2c2c 0%, #101010 68%)',
  border: '2px solid var(--cab-gold-rim)',
  color: 'var(--cab-gold-bright)',
  fontFamily: 'Arial, sans-serif',
  fontSize: rem(11),
  lineHeight: 1,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export function PagerButton({ glyph, ariaLabel, disabled, onClick }: {
  glyph: string
  ariaLabel: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{ ...PAGER_BUTTON_BASE, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  )
}

/** Left page: the date line and the meeting notes written during one week. */
export function MeetingsContent({ week, notes }: { week: number; notes: MeetingNote[] }) {
  const weekNotes = notes.filter(note => note.week === week)
  return (
    <>
      <p style={{
        fontFamily: HEADING_FONT,
        fontSize: rem(18),
        lineHeight: '26px',
        color: 'rgba(58,42,26,0.7)',
        textShadow: INK_SHADOW,
        margin: '0 0 8px',
      }}>
        {`Week ${week} — ${weekToDate(week)}`}
      </p>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {weekNotes.length === 0 ? (
          <p style={{ ...HAND_STYLE, opacity: 0.6 }}>
            Nothing written yet. The meetings will fill these pages.
          </p>
        ) : weekNotes.map((note, noteIndex) => (
          <section key={`${note.sceneId}-${noteIndex}`} style={{ marginTop: noteIndex === 0 ? 0 : 22 }}>
            <InkHeading>{note.title}</InkHeading>
            <div style={{ marginTop: 10 }}>
              {note.lines.map((line, lineIndex) => (
                <p key={lineIndex} style={HAND_STYLE}>{line}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

/** Small pill that switches which page is shown on phone and compact layouts. */
export function PageTab({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      style={{
        fontFamily: CINZEL_FONT,
        fontWeight: 500,
        fontSize: rem(10),
        letterSpacing: '.12em',
        padding: '5px 14px',
        borderRadius: 999,
        cursor: 'pointer',
        border: '1px solid rgba(201,168,76,0.45)',
        background: isActive ? 'rgba(201,168,76,0.22)' : 'rgba(8,8,6,0.4)',
        color: isActive ? 'var(--cab-gold-bright)' : '#cfc6b0',
      }}
    >
      {label}
    </button>
  )
}
