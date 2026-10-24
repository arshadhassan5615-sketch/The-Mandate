import type { CSSProperties, ReactNode } from 'react'
import { rem } from '../../../constants/typography'
import veltriaSeal from '../../../assets/images/veltria_seal.png'
import { usePageInsets } from '../../../hooks/usePageInsets'
import { NationalSeal } from './CabinetParts'
import { CAB_FONT } from './cabinetStyles'

// The cream paper parts of a Cabinet document: the sheet itself, its headings,
// sections, signature and wax seal. Colours are fixed inks for ivory paper, so
// they do not follow the dark panel tokens.

const INK = '#2a241c'
const INK_SOFT = '#5a4d3a'
const INK_FAINT = '#6b5f4b'
const PAPER = '#e8ddc4'
const PAPER_TEXT = '#2b1f12'
const PAPER_TEXT_SHADOW = '0 0 0.35px rgba(43,31,18,0.6)'
const RULE_FAINT = 'rgba(42,36,28,0.35)'
const DEFAULT_SUBTITLE = 'Office of the Chancellor'
const WATERMARK_WIDTH = 300
const WATERMARK_OPACITY = 0.07
const SEAL_SIZE = 54
const DENSE_SEAL_SIZE = 34
const WAX_SEAL_DEFAULT_SIZE = 62
const PADDING_Y = 26
const PADDING_X = 34
const DENSE_PADDING_Y = 16
const DENSE_PADDING_X = 20
const REGISTRY_EXTRA_TOP = 14
const SIGNATURE_LINE_WIDTH = 180
const REGISTRY_TOP = 18
const REGISTRY_SIDE = 26
const STAMP_TOP = 42
const STAMP_RIGHT = 30
const FOOTNOTE_GAP = 14
const TYPEWRITER_FONT = "'Special Elite', 'Courier New', monospace"
const REGISTRY_INK = '#4a3a28'
const FOOTNOTE_INK = '#2e3e5c'

// Inset certificate rules in brown ink, with the inner edge shadow.
const CERTIFICATE_EDGE = [
  'inset 0 0 0 8px transparent',
  'inset 0 0 0 9px rgba(70,45,20,0.45)',
  'inset 0 0 0 12px transparent',
  'inset 0 0 0 13px rgba(70,45,20,0.22)',
  'inset 0 0 50px rgba(110,75,30,0.18)',
].join(', ')

// Deckled edge. clip-path would hide an outer box-shadow, so the drop shadow sits on the wrapper.
const DECKLE_CLIP =
  'polygon(0.4% 0.6%, 12% 0, 27% 0.5%, 41% 0.1%, 58% 0.6%, 73% 0, 88% 0.4%, 99.6% 0.2%, 100% 14%, 99.5% 31%, 100% 52%, 99.6% 69%, 100% 86%, 99.4% 99.5%, 84% 100%, 66% 99.4%, 49% 100%, 32% 99.5%, 15% 100%, 0.3% 99.6%, 0 82%, 0.5% 64%, 0 47%, 0.4% 29%, 0 12%)'

// Layers from the top: fibre noise, foxing, fold crease, edge vignette, base colour.
const PAPER_BACKGROUND = [
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0 0.12 0 0 0 0.10 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E") repeat`,
  'radial-gradient(circle at 12% 18%, rgba(150,100,40,0.10) 0, rgba(150,100,40,0.06) 18px, transparent 34px)',
  'radial-gradient(circle at 86% 9%, rgba(150,100,40,0.10) 0, rgba(150,100,40,0.06) 18px, transparent 34px)',
  'radial-gradient(circle at 78% 72%, rgba(150,100,40,0.10) 0, rgba(150,100,40,0.06) 18px, transparent 34px)',
  'radial-gradient(circle at 18% 88%, rgba(150,100,40,0.10) 0, rgba(150,100,40,0.06) 18px, transparent 34px)',
  'radial-gradient(circle at 55% 44%, rgba(150,100,40,0.07) 0, rgba(150,100,40,0.04) 12px, transparent 22px)',
  'linear-gradient(180deg, transparent 49.4%, rgba(90,60,25,0.07) 49.8%, rgba(255,250,235,0.35) 50.1%, transparent 50.6%)',
  'radial-gradient(ellipse at 50% 45%, rgba(255,250,235,0) 58%, rgba(140,95,40,0.20) 100%)',
  PAPER,
].join(', ')

const PAPER_WRAP_STYLE: CSSProperties = {
  filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.5))',
}

const WATERMARK_STYLE: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%,-50%)',
  width: WATERMARK_WIDTH,
  maxWidth: '70%',
  opacity: WATERMARK_OPACITY,
  mixBlendMode: 'multiply',
  pointerEvents: 'none',
}

const REGISTRY_LINE_STYLE: CSSProperties = {
  position: 'absolute',
  top: REGISTRY_TOP,
  fontFamily: TYPEWRITER_FONT,
  fontSize: rem(11),
  lineHeight: 1.2,
  color: REGISTRY_INK,
  letterSpacing: '0.04em',
  pointerEvents: 'none',
}

const FOOTNOTE_STYLE: CSSProperties = {
  position: 'relative',
  marginTop: FOOTNOTE_GAP,
  fontFamily: CAB_FONT.script,
  fontStyle: 'italic',
  fontSize: rem(12),
  color: FOOTNOTE_INK,
}

const STAMP_INK = {
  red: 'rgba(122,42,42,0.75)',
  blue: 'rgba(47,95,138,0.75)',
  green: 'rgba(61,106,52,0.75)',
} as const

type StampTone = keyof typeof STAMP_INK

export interface PaperStampProps {
  label: string
  sub?: string
  tone?: StampTone
}

export interface PaperRegistry {
  left?: string
  right?: string
}

interface PaperSheetProps {
  children: ReactNode
  letterhead?: { subtitle?: string } | false
  watermark?: boolean
  testId?: string
  style?: CSSProperties
  /** Layout for the shadow wrapper, e.g. to let the sheet fill and scroll inside a flex column. */
  wrapStyle?: CSSProperties
  /** Typed reference lines across the top of the sheet. */
  registry?: PaperRegistry
  /** Rubber ink stamp in the top right corner. */
  stamp?: PaperStampProps
  /** Translator or sender note, set bottom-left inside the sheet. */
  footnote?: string
}

interface LetterheadProps {
  subtitle?: string
  dense: boolean
}

function Letterhead({ subtitle, dense }: LetterheadProps) {
  return (
    <div style={{ textAlign: 'center', marginBottom: dense ? 6 : 10 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <NationalSeal surface="paper" size={dense ? DENSE_SEAL_SIZE : SEAL_SIZE} />
      </div>
      <div
        style={{
          fontFamily: CAB_FONT.label,
          fontWeight: 700,
          fontSize: rem(dense ? 10 : 11),
          letterSpacing: '0.32em',
          color: INK_SOFT,
          marginTop: 4,
        }}
      >
        REPUBLIC OF VELTRIA
      </div>
      {subtitle && (
        <div style={{ fontFamily: CAB_FONT.script, fontStyle: 'italic', fontSize: rem(13), color: INK_FAINT }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

function RegistryLines({ registry }: { registry: PaperRegistry }) {
  return (
    <>
      {registry.left && (
        <span data-testid="paper-registry-left" style={{ ...REGISTRY_LINE_STYLE, left: REGISTRY_SIDE }}>
          {registry.left}
        </span>
      )}
      {registry.right && (
        <span data-testid="paper-registry-right" style={{ ...REGISTRY_LINE_STYLE, right: REGISTRY_SIDE }}>
          {registry.right}
        </span>
      )}
    </>
  )
}

function InkStamp({ label, sub, tone = 'red' }: PaperStampProps) {
  const ink = STAMP_INK[tone]
  return (
    <div
      data-testid="paper-stamp"
      style={{
        position: 'absolute',
        top: STAMP_TOP,
        right: STAMP_RIGHT,
        border: `2px solid ${ink}`,
        color: ink,
        fontFamily: CAB_FONT.label,
        fontWeight: 700,
        fontSize: rem(11),
        letterSpacing: '.2em',
        padding: '3px 10px',
        textAlign: 'center',
        transform: 'rotate(-9deg)',
        opacity: 0.85,
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
      }}
    >
      <span>{label}</span>
      {sub && <span style={{ display: 'block', fontSize: rem(9), letterSpacing: '.2em' }}>{sub}</span>}
    </div>
  )
}

/** A cream state document sheet with letterhead, certificate border and faint seal watermark. */
export function PaperSheet({
  children,
  letterhead = { subtitle: DEFAULT_SUBTITLE },
  watermark = true,
  testId,
  style,
  wrapStyle,
  registry,
  stamp,
  footnote,
}: PaperSheetProps) {
  const dense = usePageInsets().mode !== 'desktop'
  const paddingY = (dense ? DENSE_PADDING_Y : PADDING_Y) + (registry ? REGISTRY_EXTRA_TOP : 0)
  const paddingX = dense ? DENSE_PADDING_X : PADDING_X
  return (
    <div className="cabinet-paper-wrap anim-rise-in" style={{ ...PAPER_WRAP_STYLE, ...wrapStyle }}>
      <article
        data-testid={testId}
        className="cabinet-paper"
        style={{
          position: 'relative',
          background: PAPER_BACKGROUND,
          color: PAPER_TEXT,
          borderRadius: 2,
          padding: `${paddingY}px ${paddingX}px`,
          boxShadow: CERTIFICATE_EDGE,
          clipPath: DECKLE_CLIP,
          textShadow: PAPER_TEXT_SHADOW,
          fontFamily: CAB_FONT.body,
          ...style,
        }}
      >
        {watermark && (
          <img src={veltriaSeal} alt="" aria-hidden="true" data-testid="paper-watermark" style={WATERMARK_STYLE} />
        )}
        {registry && <RegistryLines registry={registry} />}
        {stamp && <InkStamp {...stamp} />}
        {letterhead !== false && <Letterhead subtitle={letterhead.subtitle} dense={dense} />}
        {/* No z-index here: a stacking context would stop the watermark's multiply blend. */}
        <div style={{ position: 'relative' }}>{children}</div>
        {footnote && <div data-testid="paper-footnote" style={FOOTNOTE_STYLE}>{footnote}</div>}
      </article>
    </div>
  )
}

/** Centred, ruled heading across the sheet. */
export function PaperHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      style={{
        margin: '8px 0 4px',
        padding: '6px 0',
        borderTop: `1px solid ${INK}`,
        borderBottom: `1px solid ${INK}`,
        textAlign: 'center',
        fontFamily: CAB_FONT.title,
        fontWeight: 700,
        fontSize: rem(18),
        color: INK,
      }}
    >
      {children}
    </h3>
  )
}

/** Italic line under a heading, such as a date or reference. */
export function PaperMeta({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 10px',
        textAlign: 'center',
        fontFamily: CAB_FONT.body,
        fontStyle: 'italic',
        fontSize: rem(13.5),
        color: INK_SOFT,
      }}
    >
      {children}
    </p>
  )
}

/** A numbered-style section of the document, headed with a section mark. */
export function PaperSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section style={{ padding: '9px 0', borderBottom: `1px solid ${RULE_FAINT}` }}>
      <h4
        style={{
          margin: '0 0 3px',
          fontFamily: CAB_FONT.title,
          fontWeight: 700,
          fontSize: rem(14.5),
          color: INK,
        }}
      >
        <span aria-hidden="true" style={{ color: '#7a2a2a', marginRight: 6 }}>§</span>
        {heading}
      </h4>
      <div style={{ fontSize: rem(15), lineHeight: 1.5 }}>{children}</div>
    </section>
  )
}

/** A red wax seal, decorative. */
export function WaxSeal({ size = WAX_SEAL_DEFAULT_SIZE }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      data-testid="wax-seal"
      style={{
        width: size,
        height: size,
        borderRadius: '48% 52% 50% 50%',
        background: 'radial-gradient(circle at 35% 30%, #b5443a, #7e1f1a 60%, #5a1411)',
        boxShadow: 'inset 0 0 0 7px rgba(0,0,0,0.10), inset 0 0 0 9px rgba(255,200,180,0.12), 0 3px 6px rgba(0,0,0,0.4)',
        transform: 'rotate(-8deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,220,200,0.4)',
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      ★
    </div>
  )
}

interface SignatureBlockProps {
  name: string
  role: string
  signed?: boolean
  sealed?: boolean
}

/** Signature line with the name in script above it, and an optional wax seal. */
export function SignatureBlock({ name, role, signed = true, sealed = false }: SignatureBlockProps) {
  return (
    <div
      data-testid="signature-block"
      style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 18, marginTop: 14 }}
    >
      {sealed && <WaxSeal />}
      <div style={{ width: SIGNATURE_LINE_WIDTH, textAlign: 'center' }}>
        <div style={{ fontFamily: CAB_FONT.signature, fontSize: rem(30), minHeight: rem(40), color: INK }}>
          {signed ? name : ''}
        </div>
        <div style={{ borderTop: `1px solid ${INK}` }} />
        <div style={{ fontFamily: CAB_FONT.body, fontStyle: 'italic', fontSize: rem(12), color: INK_SOFT, marginTop: 2 }}>
          {role}
        </div>
      </div>
    </div>
  )
}
