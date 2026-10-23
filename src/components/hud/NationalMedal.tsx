// Sculpted gold national medal: the Veltria compass star raised in gold on blue enamel,
// inside a white ring, framed by a laurel wreath. Drawn as SVG so it scales with the HUD.
import { useId } from 'react'

interface NationalMedalProps {
  size: number
}

interface RimStop {
  offset: string
  color: string
}

interface MedalDefsProps {
  rimId: string
  faceId: string
  enamelId: string
}

interface LaurelBranchProps {
  angles: number[]
  face: string
}

interface MedalStarProps {
  rim: string
  face: string
}

const DARK = '#5a4318'
const RIM_STOPS: RimStop[] = [
  { offset: '0%', color: '#fff1bf' },
  { offset: '30%', color: '#e8c25a' },
  { offset: '60%', color: '#b88a2a' },
  { offset: '85%', color: '#f3d989' },
  { offset: '100%', color: '#9a7224' },
]
const FACE_STOPS: RimStop[] = [
  { offset: '0%', color: '#fff4c4' },
  { offset: '45%', color: '#f0cf6a' },
  { offset: '100%', color: '#c79a36' },
]
const ENAMEL_STOPS: RimStop[] = [
  { offset: '0%', color: '#3a6bb5' },
  { offset: '100%', color: '#132c58' },
]
const WHITE_RING = '#f4ecd8'
const GROOVE = '#7a5a22'
const EDGE = '#6b4f1c'

const LAUREL_RADIUS = 68
const STEM_RADIUS = 74
const LAUREL_FIRST_DEG = 110
const LAUREL_STEP_DEG = 15
const LAUREL_LEAF_COUNT = 9
const STAR_OUTER = 38
const STAR_INNER = 13
const STAR_TIPS = 8

const LEFT_BRANCH_DEG = Array.from({ length: LAUREL_LEAF_COUNT }, (_, i) => LAUREL_FIRST_DEG + i * LAUREL_STEP_DEG)
const RIGHT_BRANCH_DEG = LEFT_BRANCH_DEG.map((deg) => 180 - deg)
const STAR_POINTS = starPoints(100, 100, STAR_OUTER, STAR_INNER, STAR_TIPS)

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** Point on a ring around the medal centre; angle in degrees, SVG y runs down. */
function ringPoint(radius: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: round(100 + radius * Math.cos(rad)), y: round(100 + radius * Math.sin(rad)) }
}

/** Arc of the stem ring from startDeg to endDeg (startDeg < endDeg, span under 180 degrees). */
function arcPath(radius: number, startDeg: number, endDeg: number): string {
  const start = ringPoint(radius, startDeg)
  const end = ringPoint(radius, endDeg)
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`
}

/** Polygon points for a star with `tips` points; the first tip points straight up. */
function starPoints(cx: number, cy: number, outer: number, inner: number, tips: number): string {
  const vertexCount = tips * 2
  const stepDeg = 360 / vertexCount
  return Array.from({ length: vertexCount }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner
    const rad = ((-90 + i * stepDeg) * Math.PI) / 180
    return `${round(cx + radius * Math.cos(rad))},${round(cy + radius * Math.sin(rad))}`
  }).join(' ')
}

function GradientStops({ stops }: { stops: RimStop[] }) {
  return (
    <>
      {stops.map((stop) => (
        <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
      ))}
    </>
  )
}

function MedalDefs({ rimId, faceId, enamelId }: MedalDefsProps) {
  return (
    <defs>
      <linearGradient id={rimId} x1={0} y1={0} x2={1} y2={1}>
        <GradientStops stops={RIM_STOPS} />
      </linearGradient>
      <radialGradient id={faceId} cx="45%" cy="35%" r="75%">
        <GradientStops stops={FACE_STOPS} />
      </radialGradient>
      <radialGradient id={enamelId} cx="45%" cy="38%" r="70%">
        <GradientStops stops={ENAMEL_STOPS} />
      </radialGradient>
    </defs>
  )
}

function LaurelBranch({ angles, face }: LaurelBranchProps) {
  return (
    <>
      <path
        d={arcPath(STEM_RADIUS, Math.min(...angles), Math.max(...angles))}
        fill="none"
        stroke={DARK}
        strokeWidth={1.5}
      />
      {angles.map((deg) => {
        const { x, y } = ringPoint(LAUREL_RADIUS, deg)
        return (
          <ellipse
            key={deg}
            data-testid="medal-leaf"
            cx={x}
            cy={y}
            rx={5}
            ry={11}
            transform={`rotate(${deg} ${x} ${y})`}
            fill={face}
            stroke={DARK}
            strokeWidth={1}
          />
        )
      })}
    </>
  )
}

function MedalStar({ rim, face }: MedalStarProps) {
  return (
    <>
      <polygon
        points={STAR_POINTS}
        transform="translate(1.5 2.5)"
        fill="#000"
        opacity={0.35}
      />
      <polygon
        data-testid="medal-star"
        points={STAR_POINTS}
        fill={rim}
        stroke={DARK}
        strokeWidth={1.2}
      />
      <circle cx={100} cy={100} r={6} fill={face} stroke={DARK} strokeWidth={1} />
    </>
  )
}

export default function NationalMedal({ size }: NationalMedalProps) {
  // useId output can contain characters that are awkward in url(#...) references
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const rimId = `${uid}-rim`
  const faceId = `${uid}-face`
  const enamelId = `${uid}-enamel`
  const rim = `url(#${rimId})`
  const face = `url(#${faceId})`
  const enamel = `url(#${enamelId})`
  return (
    <svg
      data-testid="national-medal"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <MedalDefs rimId={rimId} faceId={faceId} enamelId={enamelId} />
      <circle cx={100} cy={104} r={97} fill={EDGE} />
      <circle cx={100} cy={100} r={97} fill={rim} stroke={DARK} strokeWidth={1.5} />
      <circle cx={100} cy={100} r={86} fill="none" stroke={GROOVE} strokeWidth={2.5} />
      <circle cx={100} cy={100} r={84} fill={face} />
      <g data-testid="medal-laurel">
        <LaurelBranch angles={LEFT_BRANCH_DEG} face={face} />
        <LaurelBranch angles={RIGHT_BRANCH_DEG} face={face} />
      </g>
      <circle cx={100} cy={100} r={50} fill={enamel} stroke={DARK} strokeWidth={2} />
      <circle cx={100} cy={100} r={44} fill="none" stroke={WHITE_RING} strokeWidth={3} />
      <MedalStar rim={rim} face={face} />
      <ellipse
        cx={78}
        cy={52}
        rx={62}
        ry={26}
        fill="#ffffff"
        opacity={0.22}
        transform="rotate(-20 78 52)"
      />
    </svg>
  )
}
