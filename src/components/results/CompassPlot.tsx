// Results-screen compass (S20): where the Chancellor's choices placed her.
import type { CompassPosition } from './compass'

const SIZE = 240
const PAD = 28
const INNER = SIZE - PAD * 2
const MID = SIZE / 2

const AXIS_LABELS = [
  { text: 'Reform', x: MID, y: 14, anchor: 'middle' },
  { text: 'Authority', x: MID, y: SIZE - 6, anchor: 'middle' },
  { text: 'Pragmatic', x: 4, y: MID - 6, anchor: 'start' },
  { text: 'Populist', x: SIZE - 4, y: MID - 6, anchor: 'end' },
] as const

export default function CompassPlot({ position }: { position: CompassPosition | null }) {
  if (!position) {
    return (
      <p data-testid="compass-empty" style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: 'var(--muted)', textAlign: 'center' }}>
        Too few political decisions were recorded to place this Chancellor.
      </p>
    )
  }

  const dotX = MID + position.x * (INNER / 2)
  const dotY = MID - position.y * (INNER / 2)

  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
      <svg
        role="img"
        aria-label={`Political compass: ${position.label}, from ${position.count} decisions`}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ width: 'min(320px, 100%)', height: 'auto' }}
      >
        <rect x={PAD} y={PAD} width={INNER} height={INNER} fill="rgba(200,144,42,0.04)" stroke="rgba(200,144,42,0.35)" />
        <line x1={MID} y1={PAD} x2={MID} y2={SIZE - PAD} stroke="rgba(200,144,42,0.25)" />
        <line x1={PAD} y1={MID} x2={SIZE - PAD} y2={MID} stroke="rgba(200,144,42,0.25)" />
        {AXIS_LABELS.map(l => (
          <text key={l.text} x={l.x} y={l.y} textAnchor={l.anchor} fill="var(--muted)"
            style={{ fontFamily: "'Special Elite', monospace", fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {l.text}
          </text>
        ))}
        <circle data-testid="compass-dot" cx={dotX} cy={dotY} r={9} fill="rgba(200,144,42,0.2)" />
        <circle cx={dotX} cy={dotY} r={4.5} fill="var(--amber)" stroke="#0d0b09" strokeWidth={1.5} />
      </svg>
      <figcaption style={{ textAlign: 'center' }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--amber)', display: 'block' }}>
          {position.label}
        </span>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Drawn from {position.count} political decisions
        </span>
      </figcaption>
    </figure>
  )
}
