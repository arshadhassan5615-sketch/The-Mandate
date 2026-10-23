// Embossed metal seal for one province, drawn as a coin lying tilted on the map.
// When a painted medal is supplied via `art`, that image replaces the drawn seal.
import { useId, type ComponentType } from 'react'
import { SEAL_TILT_RATIO, type SealEmblem } from './provinceSeals'

interface ProvinceSealProps {
  name: string
  emblem: SealEmblem
  field: string
  size: number
  isCapital?: boolean
  isLit?: boolean
  isHovered?: boolean
  art?: string | null
}

interface SealFaceProps {
  name: string
  emblem: SealEmblem
  field: string
  size: number
  isCapital: boolean
  uid: string
}

interface RimStop {
  offset: string
  color: string
}

interface RimGradientProps {
  id: string
  stops: RimStop[]
}

interface SealNameProps {
  name: string
  arcId: string
  isCapital: boolean
}

interface SealDecorationProps {
  isCapital: boolean
  rimId: string
}

interface GlyphProps {
  rimId: string
}

const INK = '#3a2a12'
const GLINT = '#fff4cf'
const FACE_SHADE = '#f4ecd8'
const LEAF_FILL = '#7c8a3a'
const GOLD_EDGE = '#6b4f1c'
const BRONZE_EDGE = '#4d3a24'
const EDGE_OFFSET_RATIO = 0.045
const SHADOW_FILTER = 'drop-shadow(0 6px 8px rgba(0,0,0,0.5))'
const LIT_FILTER = `drop-shadow(0 0 10px rgba(232,190,90,0.85)) ${SHADOW_FILTER}`

const GOLD_RIM: RimStop[] = [
  { offset: '0%', color: '#f6e3a1' },
  { offset: '45%', color: '#d9b45a' },
  { offset: '80%', color: '#9c7a2c' },
  { offset: '100%', color: '#e9cf85' },
]
const BRONZE_RIM: RimStop[] = [
  { offset: '0%', color: '#e2c79a' },
  { offset: '45%', color: '#b48c58' },
  { offset: '80%', color: '#755836' },
  { offset: '100%', color: '#d2b382' },
]

const RIM_RING_RADIUS = 74
const ARC_PATH = 'M 30 100 A 70 70 0 0 1 170 100'
const NAME_FONT = "'Playfair Display', serif"
const RIVET_ANGLES_DEG = [60, 90, 120]
const LAUREL_FIRST_DEG = 25
const LAUREL_LAST_DEG = 155
const LAUREL_LEAF_COUNT = 12
const CROWN_PATH = 'M86 74 L88 62 L94 69 L100 58 L106 69 L112 62 L114 74 Z'
const ARM_PATH = 'M74 104 Q78 130 100 132 Q122 130 126 104'
const GRAIN_COUNT = 4
const GRAIN_STEP_PX = 10
const GRAIN_DRIFT_PX = 1.5
const WHEAT_HEADS = [
  { x: 100, y: 74, drift: 0 },
  { x: 88, y: 82, drift: 1 },
  { x: 112, y: 82, drift: -1 },
]

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** Point on a ring around the seal centre; angle in degrees, SVG y runs down. */
function ringPoint(radius: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: round(100 + radius * Math.cos(rad)), y: round(100 + radius * Math.sin(rad)) }
}

/** Polygon points for a star with `points` tips; the first tip points straight up. */
function starPoints(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const vertexCount = points * 2
  const stepDeg = 360 / vertexCount
  return Array.from({ length: vertexCount }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner
    const rad = ((-90 + i * stepDeg) * Math.PI) / 180
    return `${round(cx + radius * Math.cos(rad))},${round(cy + radius * Math.sin(rad))}`
  }).join(' ')
}

const COMPASS_POINTS = starPoints(100, 104, 32, 11, 8)

function RimGradient({ id, stops }: RimGradientProps) {
  return (
    <linearGradient id={id} x1={0} y1={0} x2={1} y2={1}>
      {stops.map((stop) => (
        <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
      ))}
    </linearGradient>
  )
}

function SealName({ name, arcId, isCapital }: SealNameProps) {
  const label = name.toUpperCase()
  const fontProps = {
    fontFamily: NAME_FONT,
    fontWeight: 700,
    fontSize: isCapital ? 17 : 18,
    letterSpacing: isCapital ? 4 : 3,
  }
  return (
    <>
      <text {...fontProps} fill={GLINT} opacity={0.55} transform="translate(0 0.9)">
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">{label}</textPath>
      </text>
      <text {...fontProps} fill={INK}>
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">{label}</textPath>
      </text>
    </>
  )
}

function Rivets({ rimId }: GlyphProps) {
  return (
    <>
      {RIVET_ANGLES_DEG.map((deg) => {
        const { x, y } = ringPoint(RIM_RING_RADIUS, deg)
        return (
          <circle
            key={deg}
            data-testid="seal-rivet"
            cx={x}
            cy={y}
            r={3.2}
            fill={`url(#${rimId})`}
            stroke={INK}
            strokeWidth={0.8}
          />
        )
      })}
    </>
  )
}

function Laurel() {
  const stepDeg = (LAUREL_LAST_DEG - LAUREL_FIRST_DEG) / (LAUREL_LEAF_COUNT - 1)
  return (
    <>
      <circle cx={100} cy={100} r={94} fill="none" stroke={INK} strokeWidth={0.8} opacity={0.6} />
      {Array.from({ length: LAUREL_LEAF_COUNT }, (_, i) => {
        const deg = LAUREL_FIRST_DEG + i * stepDeg
        const { x, y } = ringPoint(RIM_RING_RADIUS, deg)
        return (
          <ellipse
            key={i}
            data-testid="seal-laurel"
            cx={x}
            cy={y}
            rx={3}
            ry={7}
            transform={`rotate(${round(deg + 90)} ${x} ${y})`}
            fill={LEAF_FILL}
            stroke={INK}
            strokeWidth={0.6}
          />
        )
      })}
    </>
  )
}

function SealDecoration({ isCapital, rimId }: SealDecorationProps) {
  return isCapital ? <Laurel /> : <Rivets rimId={rimId} />
}

function Compass() {
  return (
    <>
      <polygon points={COMPASS_POINTS} />
      <circle cx={100} cy={104} r={5} />
    </>
  )
}

function HammerPick() {
  return (
    <>
      <rect x={97} y={74} width={6} height={54} transform="rotate(45 100 100)" />
      <rect x={84} y={68} width={32} height={11} rx={1.5} transform="rotate(45 100 100)" />
      <rect x={97} y={74} width={6} height={54} transform="rotate(-45 100 100)" />
      <path d="M78 78 Q100 62 122 78 L119 83 Q100 71 81 83 Z" transform="rotate(-45 100 100)" />
    </>
  )
}

function Wheat() {
  return (
    <>
      <path d="M100 132 L100 74" fill="none" strokeWidth={2.2} />
      <path d="M100 132 Q94 108 88 82" fill="none" strokeWidth={2.2} />
      <path d="M100 132 Q106 108 112 82" fill="none" strokeWidth={2.2} />
      {WHEAT_HEADS.map((head) =>
        Array.from({ length: GRAIN_COUNT }, (_, k) => {
          const x = head.x + head.drift * GRAIN_DRIFT_PX * k
          const y = head.y + 4 + k * GRAIN_STEP_PX
          const angle = k % 2 === 0 ? -25 : 25
          return (
            <ellipse
              key={`${head.x}-${k}`}
              cx={x}
              cy={y}
              rx={3.6}
              ry={7}
              transform={`rotate(${angle} ${x} ${y})`}
            />
          )
        }),
      )}
    </>
  )
}

function Fortress() {
  return (
    <>
      <path d="M72 130 V94 H79 V85 H88 V94 H96 V85 H104 V94 H112 V85 H121 V94 H128 V130 Z" />
      <path d="M92 130 V114 A8 8 0 0 1 108 114 V130 Z" fill={INK} />
    </>
  )
}

function Anchor({ rimId }: GlyphProps) {
  return (
    <>
      <circle cx={100} cy={72} r={7} fill="none" strokeWidth={4} stroke={`url(#${rimId})`} />
      <circle cx={100} cy={72} r={7} fill="none" stroke={INK} strokeWidth={1} />
      <rect x={96.5} y={78} width={7} height={46} rx={1} />
      <rect x={84} y={84} width={32} height={6} rx={1.5} />
      <path d={ARM_PATH} fill="none" strokeWidth={6} stroke={`url(#${rimId})`} />
      <path d={ARM_PATH} fill="none" stroke={INK} strokeWidth={1} />
      <path d="M68 108 L74 98 L80 108 Z" />
      <path d="M120 108 L126 98 L132 108 Z" />
    </>
  )
}

function Mountain() {
  return (
    <>
      <path d="M64 128 L89 86 L100 101 L115 74 L138 128 Z" />
      <path d="M108 86 L115 74 L122 86 L117.5 83 L113 88 Z" fill={FACE_SHADE} />
    </>
  )
}

const EMBLEM_GLYPHS: Record<SealEmblem, ComponentType<GlyphProps>> = {
  compass: Compass,
  hammer_pick: HammerPick,
  wheat: Wheat,
  fortress: Fortress,
  anchor: Anchor,
  mountain: Mountain,
}

function SealFace({ name, emblem, field, size, isCapital, uid }: SealFaceProps) {
  const rimId = `${uid}-rim`
  const fieldId = `${uid}-field`
  const arcId = `${uid}-arc`
  const Glyph = EMBLEM_GLYPHS[emblem]
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs>
        <RimGradient id={rimId} stops={isCapital ? GOLD_RIM : BRONZE_RIM} />
        <radialGradient id={fieldId} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={field} stopOpacity={0.7} />
          <stop offset="100%" stopColor={field} stopOpacity={1} />
        </radialGradient>
        <path id={arcId} d={ARC_PATH} fill="none" />
      </defs>
      <circle cx={100} cy={100} r={98} fill={`url(#${rimId})`} stroke={INK} strokeWidth={1} />
      <circle cx={100} cy={100} r={88} fill={`url(#${rimId})`} opacity={0.92} stroke={INK} strokeWidth={0.8} />
      <circle cx={100} cy={100} r={60} fill="none" stroke={INK} strokeWidth={1.2} />
      <circle cx={100} cy={100} r={59} fill={FACE_SHADE} />
      <circle cx={100} cy={100} r={59} fill={`url(#${fieldId})`} />
      <SealName name={name} arcId={arcId} isCapital={isCapital} />
      <SealDecoration isCapital={isCapital} rimId={rimId} />
      <g data-emblem={emblem} fill={`url(#${rimId})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
        <Glyph rimId={rimId} />
        {isCapital && <path d={CROWN_PATH} />}
      </g>
      <ellipse cx={78} cy={66} rx={46} ry={26} fill="#ffffff" opacity={0.12} transform="rotate(-25 78 66)" />
    </svg>
  )
}

export default function ProvinceSeal({
  name,
  emblem,
  field,
  size,
  isCapital = false,
  isLit = false,
  isHovered = false,
  art = null,
}: ProvinceSealProps) {
  // useId output can contain characters that are awkward in url(#...) references
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <div
      data-testid="province-seal"
      data-capital={isCapital ? 'true' : 'false'}
      style={{
        position: 'relative',
        width: size,
        height: Math.round(size * SEAL_TILT_RATIO),
        transform: isHovered ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 0.18s ease, filter 0.18s ease',
        filter: isLit ? LIT_FILTER : SHADOW_FILTER,
        pointerEvents: 'none',
      }}
    >
      {art !== null ? (
        <img
          src={art}
          alt=""
          data-testid="province-seal-art"
          draggable={false}
          style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 'auto', display: 'block' }}
        />
      ) : (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: Math.round((size * SEAL_TILT_RATIO - size) / 2),
          width: size,
          height: size,
          transform: 'perspective(700px) rotateX(42deg)',
          transformOrigin: '50% 50%',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          aria-hidden="true"
          style={{ position: 'absolute', left: 0, top: size * EDGE_OFFSET_RATIO }}
        >
          <circle cx={100} cy={100} r={98} fill={isCapital ? GOLD_EDGE : BRONZE_EDGE} />
        </svg>
        <SealFace
          name={name}
          emblem={emblem}
          field={field}
          size={size}
          isCapital={isCapital}
          uid={uid}
        />
      </div>
      )}
    </div>
  )
}
