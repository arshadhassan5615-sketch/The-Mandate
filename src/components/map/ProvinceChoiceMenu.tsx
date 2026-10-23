// Province choice menu: a title tab over a body of option rows (read updates, or hold a meeting),
// opened from a province pin that has both. Each row carries a round icon disc.
import { useEffect, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Z } from '../../constants/zIndex'

export type ChoiceIcon = 'updates' | 'meeting' | 'urgent'

export interface ProvinceChoice {
  id: string
  title: string
  detail?: string
  icon: ChoiceIcon
  /** 'info' rows (reading) and 'action' rows (meetings) differ in colour. */
  variant: 'info' | 'action'
  disabled?: boolean
}

interface ProvinceChoiceMenuProps {
  title: string
  subtitle?: string
  choices: readonly ProvinceChoice[]
  onSelect: (id: string) => void
  onClose: () => void
}

const GOLD_RULE = 'rgba(200,170,110,0.45)'
const TITLE_FONT = "'Playfair Display', serif"
const BODY_FONT = "'Crimson Text', Georgia, serif"
const ENTRANCE_SECONDS = 0.18
const GLYPH_SIZE = 16
const GLYPH_FILL = '#efd9a0'

// Inline row styles set background and border, so the hover rule below uses !important to win over them.
const CHOICE_CSS = `
.province-choice { transition: filter 0.15s ease, border-color 0.15s ease; }
.province-choice:not(:disabled):hover, .province-choice:not(:disabled):focus-visible { filter: brightness(1.18); border-color: #e8c66a !important; outline: none; }
`

const BACKDROP_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: Z.modalRaised,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const PANEL_STYLE: CSSProperties = {
  width: 'min(400px, 92vw)',
  display: 'flex',
  flexDirection: 'column',
}

const TAB_STYLE: CSSProperties = {
  alignSelf: 'flex-start',
  position: 'relative',
  zIndex: 1,
  marginBottom: -1,
  background: '#0c0c0c',
  border: `1px solid ${GOLD_RULE}`,
  borderBottom: 'none',
  borderRadius: '3px 3px 0 0',
  padding: '5px 14px 4px',
}

const TITLE_STYLE: CSSProperties = {
  fontFamily: TITLE_FONT,
  fontWeight: 700,
  fontSize: 17,
  color: '#f0d896',
  lineHeight: 1.1,
}

const SUBTITLE_STYLE: CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: 12,
  color: 'rgba(230,215,185,0.75)',
}

const BODY_STYLE: CSSProperties = {
  background: 'rgba(12,12,12,0.95)',
  border: `1px solid ${GOLD_RULE}`,
  borderRadius: '0 3px 3px 3px',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
}

const ROW_BASE_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  minHeight: 46,
  padding: '7px 12px',
  borderRadius: 3,
  textAlign: 'left',
  color: 'inherit',
}

const INFO_ROW_STYLE: CSSProperties = {
  background: '#242424',
  border: '1px solid #c9a84c',
}

const ACTION_ROW_STYLE: CSSProperties = {
  background: 'linear-gradient(90deg, #4a1d22 0%, #2b1114 100%)',
  border: '1px solid rgba(140,70,70,0.55)',
}

const ICON_DISC_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  flexShrink: 0,
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: '2px solid transparent',
  background:
    'radial-gradient(circle at 50% 35%, #2c2c2c, #0b0b0b 72%) padding-box, linear-gradient(160deg, #a0a0a0, #3c3c3c 45%, #1c1c1c 70%, #5e5e5e) border-box',
}

const TEXT_CELL_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}

const ROW_TITLE_STYLE: CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: 16,
  fontWeight: 600,
  color: '#f1e6cc',
  lineHeight: 1.2,
}

const ROW_DETAIL_STYLE: CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: 12,
  color: 'rgba(225,205,175,0.7)',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

function rowStyleFor(choice: ProvinceChoice): CSSProperties {
  return {
    ...ROW_BASE_STYLE,
    ...(choice.variant === 'info' ? INFO_ROW_STYLE : ACTION_ROW_STYLE),
    cursor: choice.disabled ? 'not-allowed' : 'pointer',
    opacity: choice.disabled ? 0.5 : 1,
  }
}

function renderIconGlyph(icon: ChoiceIcon): ReactNode {
  if (icon === 'updates') {
    return (
      <svg
        data-testid="choice-icon-updates"
        aria-hidden="true"
        width={GLYPH_SIZE}
        height={GLYPH_SIZE}
        viewBox="0 0 24 24"
        fill={GLYPH_FILL}
        style={{ flexShrink: 0 }}
      >
        <path
          fillRule="evenodd"
          d="M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4zM6 7v5h6V7zm8 .5V9h4V7.5zm0 3V12h4v-1.5zM6 14.5V16h12v-1.5z"
        />
      </svg>
    )
  }
  if (icon === 'meeting') {
    return (
      <svg
        data-testid="choice-icon-meeting"
        aria-hidden="true"
        width={GLYPH_SIZE}
        height={GLYPH_SIZE}
        viewBox="0 0 24 24"
        fill={GLYPH_FILL}
        style={{ flexShrink: 0 }}
      >
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h8A2.5 2.5 0 0 1 16 5.5v5a2.5 2.5 0 0 1-2.5 2.5H8l-3.5 3v-3A2.5 2.5 0 0 1 3 10.5z" />
        <path d="M18 8h.5A2.5 2.5 0 0 1 21 10.5v5a2.5 2.5 0 0 1-2.5 2.5V21L15 18h-4.5A2.5 2.5 0 0 1 8 15.5V15h5.5A4.5 4.5 0 0 0 18 10.5z" />
      </svg>
    )
  }
  return (
    <svg
      data-testid="choice-icon-urgent"
      aria-hidden="true"
      width={GLYPH_SIZE}
      height={GLYPH_SIZE}
      viewBox="0 0 24 24"
      fill={GLYPH_FILL}
      style={{ flexShrink: 0 }}
    >
      <text x="12" y="19" textAnchor="middle" fontSize="20" fontWeight="900" fontFamily={TITLE_FONT}>!</text>
    </svg>
  )
}

export default function ProvinceChoiceMenu({ title, subtitle, choices, onSelect, onClose }: ProvinceChoiceMenuProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div data-testid="province-choice-backdrop" onClick={handleBackdropClick} style={BACKDROP_STYLE}>
      <style>{CHOICE_CSS}</style>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${title}: choose an action`}
        style={PANEL_STYLE}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ENTRANCE_SECONDS }}
      >
        <div data-testid="province-choice-tab" style={TAB_STYLE}>
          <div style={TITLE_STYLE}>{title}</div>
          {subtitle && <div style={SUBTITLE_STYLE}>{subtitle}</div>}
        </div>

        <div style={BODY_STYLE}>
          {choices.map((choice) => {
            const variantClass = choice.variant === 'info' ? 'province-choice--info' : 'province-choice--action'
            return (
              <button
                key={choice.id}
                type="button"
                data-testid={`choice-${choice.id}`}
                disabled={choice.disabled}
                onClick={() => onSelect(choice.id)}
                className={`province-choice ${variantClass}`}
                style={rowStyleFor(choice)}
              >
                <span aria-hidden="true" style={ICON_DISC_STYLE}>
                  {renderIconGlyph(choice.icon)}
                </span>
                <span style={TEXT_CELL_STYLE}>
                  <span style={ROW_TITLE_STYLE}>{choice.title}</span>
                  {choice.detail && <span style={ROW_DETAIL_STYLE}>{choice.detail}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
