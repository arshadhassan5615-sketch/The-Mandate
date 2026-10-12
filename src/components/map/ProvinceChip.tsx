// Name + condition chip under a province building on the full map.
// Lives inside the map's scaled layer, so it counter-scales to stay readable
// at any zoom (a phone fits the whole country at roughly 0.25×). The map image
// already prints province names; the chip repeats the name only where those
// printed labels are too small to read (phones).
import type { ProvinceStatusLevel } from './provinceStatus'

interface ProvinceChipProps {
  name: string
  level: ProvinceStatusLevel
  color: string
  mapZoom: number
  showName: boolean
  /** Chip size on screen, 1 = default. Phones use less so neighbours do not touch. */
  size?: number
}

export default function ProvinceChip({ name, level, color, mapZoom, showName, size = 1 }: ProvinceChipProps) {
  const isCalm = level === 'Stable'
  return (
    <div
      data-testid="province-chip"
      data-level={level}
      data-province={name}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: `translate(-50%, 4px) scale(${size / mapZoom})`,
        transformOrigin: 'top center',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        padding: '3px 8px',
        background: 'rgba(14,11,7,0.88)',
        border: `1px solid ${isCalm ? 'rgba(201,168,76,0.35)' : color}`,
        borderRadius: '2px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }}
    >
      {showName && (
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '12px',
          color: '#e8dcc0',
          letterSpacing: '0.02em',
        }}>
          {name}
        </span>
      )}
      <span aria-hidden style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '9px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: isCalm ? 'rgba(201,168,76,0.75)' : color,
      }}>
        {level}
      </span>
    </div>
  )
}
