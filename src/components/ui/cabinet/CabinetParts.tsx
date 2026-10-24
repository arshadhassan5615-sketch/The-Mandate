import type { ButtonHTMLAttributes, CSSProperties, ReactNode, Ref } from 'react'
import { rem } from '../../../constants/typography'
import veltriaSeal from '../../../assets/images/veltria_seal.png'
import { CAB_FONT } from './cabinetStyles'

const DIAMOND: CSSProperties = { color: 'var(--cab-gold)', fontSize: rem(8), verticalAlign: 2, margin: '0 8px' }
const GOLD_LINE = 'rgba(201,168,76,0.6)'
const CORNER_SIZE = 18
const CORNER_BORDER = '2px solid var(--cab-gold)'

interface MedallionCloseProps {
  label: string
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
  size?: number
  style?: CSSProperties
}

/** Round gold medallion close button. */
export function MedallionClose({ label, onClick, buttonRef, size = 32, style }: MedallionCloseProps) {
  return (
    <button
      type="button"
      className="cabinet-close"
      aria-label={label}
      ref={buttonRef}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 30%, #2c2c2c 0%, #101010 68%)',
        border: '2px solid var(--cab-gold-rim)',
        color: 'var(--cab-gold-bright)',
        fontSize: rem(14),
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        cursor: 'pointer',
        ...style,
      }}
    >
      <span aria-hidden="true">✕</span>
    </button>
  )
}

/** Thin gold rule with a centred diamond. */
export function OrnamentRule({ lineWidth = 70 }: { lineWidth?: number }) {
  return (
    <div
      aria-hidden="true"
      data-testid="ornament-rule"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <span style={{ width: lineWidth, height: 1, background: GOLD_LINE }} />
      <span style={{ width: 7, height: 7, background: 'var(--cab-gold)', transform: 'rotate(45deg)', margin: '0 8px' }} />
      <span style={{ width: lineWidth, height: 1, background: GOLD_LINE }} />
    </div>
  )
}

/** Hairline gold frame with corner brackets. The parent must be positioned. */
export function GoldFrame({ inset = 8 }: { inset?: number }) {
  const cornerOffset = inset - 4
  const corners: { testId: string; style: CSSProperties }[] = [
    { testId: 'top-left', style: { top: cornerOffset, left: cornerOffset, borderTop: CORNER_BORDER, borderLeft: CORNER_BORDER } },
    { testId: 'top-right', style: { top: cornerOffset, right: cornerOffset, borderTop: CORNER_BORDER, borderRight: CORNER_BORDER } },
    { testId: 'bottom-left', style: { bottom: cornerOffset, left: cornerOffset, borderBottom: CORNER_BORDER, borderLeft: CORNER_BORDER } },
    { testId: 'bottom-right', style: { bottom: cornerOffset, right: cornerOffset, borderBottom: CORNER_BORDER, borderRight: CORNER_BORDER } },
  ]
  return (
    <>
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset, border: '1px solid var(--cab-gold-line)', pointerEvents: 'none' }}
      />
      {corners.map((corner) => (
        <div
          key={corner.testId}
          aria-hidden="true"
          data-testid="gold-corner"
          style={{
            position: 'absolute',
            width: CORNER_SIZE,
            height: CORNER_SIZE,
            pointerEvents: 'none',
            ...corner.style,
          }}
        />
      ))}
    </>
  )
}

interface CabinetCardProps {
  title: string
  children: ReactNode
  testId?: string
  bodyStyle?: CSSProperties
  style?: CSSProperties
}

/** Card with a maroon title strip between gold hairlines. Never shrinks inside a flex column unless `style` says so. */
export function CabinetCard({ title, children, testId, bodyStyle, style }: CabinetCardProps) {
  return (
    <section
      data-testid={testId}
      style={{
        background: 'var(--cab-card)',
        border: '1px solid var(--cab-card-edge)',
        borderRadius: 6,
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      <h3
        style={{
          margin: 0,
          background: 'var(--cab-strip)',
          borderTop: '1px solid rgba(201,168,76,0.45)',
          borderBottom: '1px solid rgba(201,168,76,0.45)',
          padding: '7px 10px',
          textAlign: 'center',
          fontFamily: CAB_FONT.title,
          fontWeight: 700,
          fontSize: rem(14),
          color: '#e9dfc5',
        }}
      >
        <span aria-hidden="true" style={DIAMOND}>◆</span>
        {title}
        <span aria-hidden="true" style={DIAMOND}>◆</span>
      </h3>
      <div style={bodyStyle}>{children}</div>
    </section>
  )
}

/** Coloured dot that marks a severity level. */
export function SeverityDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, marginRight: 8, verticalAlign: 1 }}
    />
  )
}

/** Outlined uppercase tag in one colour. */
export function StatusPill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: CAB_FONT.label,
        fontWeight: 700,
        fontSize: rem(10),
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color,
        border: '1px solid currentColor',
        borderRadius: 10,
        padding: '2px 9px',
      }}
    >
      {children}
    </span>
  )
}

const PRIMARY_STYLE: CSSProperties = {
  background: 'linear-gradient(#5a2028, #3e151b)',
  border: '1px solid var(--cab-gold)',
  color: '#f1e2be',
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
}

const SECONDARY_STYLE: CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(201,168,76,0.5)',
  color: '#cfc6b0',
}

const BUTTON_SIZES = {
  regular: { padding: '11px 30px', fontSize: rem(13) },
  small: { padding: '7px 16px', fontSize: rem(11.5) },
} as const

interface CabinetButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'regular' | 'small'
}

/** Tracked uppercase button, primary (maroon, gold edge) or secondary (outlined). */
export function CabinetButton({ variant = 'secondary', size = 'regular', children, ...rest }: CabinetButtonProps) {
  const sizing = BUTTON_SIZES[size]
  return (
    <button
      type="button"
      {...rest}
      className={['cabinet-btn', `cabinet-btn--${variant}`, rest.className].filter(Boolean).join(' ')}
      style={{
        fontFamily: CAB_FONT.label,
        fontWeight: 700,
        fontSize: sizing.fontSize,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        padding: sizing.padding,
        borderRadius: 4,
        cursor: 'pointer',
        ...(variant === 'primary' ? PRIMARY_STYLE : SECONDARY_STYLE),
        ...rest.style,
      }}
    >
      {children}
    </button>
  )
}

const DARK_SEAL_STYLE: CSSProperties = {
  filter: 'invert(1) sepia(1) saturate(3) brightness(0.95)',
  mixBlendMode: 'screen',
  opacity: 0.85,
}

const PAPER_SEAL_STYLE: CSSProperties = { mixBlendMode: 'multiply' }

/** The Veltria seal, recoloured for dark panels or printed for paper. */
export function NationalSeal({ surface, size }: { surface: 'dark' | 'paper'; size: number }) {
  return (
    <img
      src={veltriaSeal}
      alt=""
      aria-hidden="true"
      data-testid="national-seal"
      data-surface={surface}
      style={{
        width: size,
        height: size,
        display: 'block',
        ...(surface === 'dark' ? DARK_SEAL_STYLE : PAPER_SEAL_STYLE),
      }}
    />
  )
}
