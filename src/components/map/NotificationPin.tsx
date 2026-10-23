// Map notification pin: a round dark news or red alert marker with a gold-outlined
// tail and an optional count badge, or a gold event marker standing on a point that marks a meeting to play.
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { getPinArt } from '../../assets/pinArt'

export type PinKind = 'news' | 'alert' | 'event'

interface NotificationPinProps {
  kind: PinKind
  label: string
  size?: number
  count?: number
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void
}

const CREAM = '#efd9a0'
const INK = '#3a2a12'
const GOLD = '#c9a84c'
const BLACK = '#0b0b0b'
const ALERT_RED_DARK = '#3a0c08'
const DEFAULT_SIZE = 30
const EVENT_DEFAULT_SIZE = 34
const PIN_FONT = "'Playfair Display', serif"
const COUNT_CAP = 9
/** A painted pin's disc fills the button with this much rim to spare on each side; its point hangs below. */
const PAINTED_BLEED = 0.08

const METAL_BORDER = 'linear-gradient(160deg, #a0a0a0, #3c3c3c 45%, #1c1c1c 70%, #5e5e5e) border-box'
const NEWS_DISC_BG = `radial-gradient(circle at 50% 32%, #2c2c2c 0%, #0b0b0b 70%) padding-box, ${METAL_BORDER}`
const ALERT_DISC_BG = `radial-gradient(circle at 50% 32%, #8a2a22 0%, ${ALERT_RED_DARK} 72%) padding-box, ${METAL_BORDER}`
const EVENT_DISC_BG = 'radial-gradient(circle at 50% 30%, #f6dc84 0%, #c99a32 75%) padding-box, linear-gradient(160deg, #8a8a8a, #3c3c3c 50%, #6a6a6a) border-box'

const PIN_CSS = `
.notification-pin { transition: transform 0.15s ease; }
.notification-pin:hover, .notification-pin:focus-visible { transform: scale(1.12); outline: none; }
.notification-pin:active { transform: scale(0.95); }
`

function discStyle(size: number, background: string): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background,
    border: `${Math.max(2, Math.round(size * 0.1))}px solid transparent`,
    boxShadow: '0 2px 5px rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

function Tail({ size, fill }: { size: number; fill: string }) {
  return (
    <svg
      data-testid="pin-tail"
      aria-hidden="true"
      width={size * 0.9}
      height={size * 0.62}
      viewBox="0 0 90 62"
      style={{ position: 'absolute', left: size * 0.48, top: -size * 0.16, overflow: 'visible' }}
    >
      <polygon points="0,62 90,0 58,62" fill={fill} stroke={GOLD} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  )
}

function Point({ size }: { size: number }) {
  return (
    <svg
      data-testid="pin-point"
      aria-hidden="true"
      width={size * 0.36}
      height={size * 0.3}
      viewBox="0 0 36 30"
      style={{ position: 'absolute', left: '50%', top: size - 2, transform: 'translateX(-50%)' }}
    >
      <polygon points="0,0 36,0 18,30" fill="#4a4a4a" />
    </svg>
  )
}

function MeetingGlyph({ size }: { size: number }) {
  return (
    <svg
      data-testid="glyph-meeting"
      aria-hidden="true"
      width={size * 0.52}
      height={size * 0.52}
      viewBox="0 0 24 24"
      fill={INK}
    >
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h8A2.5 2.5 0 0 1 16 5.5v5a2.5 2.5 0 0 1-2.5 2.5H8l-3.5 3v-3A2.5 2.5 0 0 1 3 10.5z" />
      <path d="M18 8h.5A2.5 2.5 0 0 1 21 10.5v5a2.5 2.5 0 0 1-2.5 2.5V21L15 18h-4.5A2.5 2.5 0 0 1 8 15.5V15h5.5A4.5 4.5 0 0 0 18 10.5z" />
    </svg>
  )
}

function NewsGlyph({ size }: { size: number }) {
  return (
    <svg
      data-testid="glyph-news"
      aria-hidden="true"
      width={size * 0.52}
      height={size * 0.52}
      viewBox="0 0 24 24"
      fill={CREAM}
    >
      <path
        fillRule="evenodd"
        d="M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4zM6 7v5h6V7zm8 .5V9h4V7.5zm0 3V12h4v-1.5zM6 14.5V16h12v-1.5z"
      />
    </svg>
  )
}

function AlertGlyph({ size }: { size: number }) {
  return (
    <span
      data-testid="glyph-alert"
      aria-hidden="true"
      style={{ fontFamily: PIN_FONT, fontWeight: 900, fontSize: size * 0.62, lineHeight: 1, color: CREAM }}
    >
      !
    </span>
  )
}

function CountBadge({ size, count }: { size: number; count: number }) {
  return (
    <span
      data-testid="pin-count"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -size * 0.12,
        left: -size * 0.12,
        minWidth: size * 0.46,
        height: size * 0.46,
        borderRadius: size * 0.23,
        padding: '0 3px',
        boxSizing: 'border-box',
        background: '#efd9a0',
        color: '#2a1a08',
        border: '1.5px solid #3a2a12',
        fontFamily: PIN_FONT,
        fontWeight: 700,
        fontSize: size * 0.28,
        lineHeight: `${size * 0.46 - 3}px`,
        textAlign: 'center',
        zIndex: 2,
      }}
    >
      {count > COUNT_CAP ? `${COUNT_CAP}+` : count}
    </span>
  )
}

export default function NotificationPin({ kind, label, size, count, onClick }: NotificationPinProps) {
  const isEvent = kind === 'event'
  const isAlert = kind === 'alert'
  const pinSize = size ?? (isEvent ? EVENT_DEFAULT_SIZE : DEFAULT_SIZE)
  const showCount = !isEvent && typeof count === 'number' && count > 1
  const art = getPinArt(kind)
  return (
    <>
      <style>{PIN_CSS}</style>
      <button
        type="button"
        data-testid="notification-pin"
        data-kind={kind}
        aria-label={label}
        className="notification-pin"
        onClick={onClick}
        style={{
          position: 'relative',
          width: pinSize,
          height: pinSize,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'block',
        }}
      >
        {art !== null ? (
          // A painted pin, when one has been added, replaces the drawn one.
          <img
            src={art}
            alt=""
            aria-hidden="true"
            data-testid="pin-art"
            draggable={false}
            style={{
              position: 'absolute',
              left: -pinSize * PAINTED_BLEED,
              top: -pinSize * PAINTED_BLEED,
              width: pinSize * (1 + 2 * PAINTED_BLEED),
              height: 'auto',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <>
            {!isEvent && <Tail size={pinSize} fill={isAlert ? ALERT_RED_DARK : BLACK} />}
            {isEvent && <Point size={pinSize} />}
            <span aria-hidden="true" style={discStyle(pinSize, isEvent ? EVENT_DISC_BG : isAlert ? ALERT_DISC_BG : NEWS_DISC_BG)}>
              {isAlert && <AlertGlyph size={pinSize} />}
              {kind === 'news' && <NewsGlyph size={pinSize} />}
              {isEvent && <MeetingGlyph size={pinSize} />}
            </span>
          </>
        )}
        {showCount && <CountBadge size={pinSize} count={count} />}
      </button>
    </>
  )
}
