import { useState, type CSSProperties } from 'react'
import { useGameStore } from '../../stores/gameStore'
import veltriaSeal from '../../assets/images/veltria_seal.png'
import { Z } from '../../constants/zIndex'

// Mirrors the week thresholds in gameStore.ts's advanceWeek
// (13/26/39 cutovers → acts 2/3/4). Kept local and read-only —
// if that logic ever changes, this must be updated to match.
const ACT_WEEK_RANGES: Record<number, [number, number]> = {
  1: [1, 13],
  2: [14, 26],
  3: [27, 39],
  4: [40, 52],
}

const TREND_LINE_COLOR = '#e8dcc0'

// OverviewPanel "elevated" boundary (moderate vs elevated)
const THRESHOLD_VALUE = 8

// ─── Pure helpers (exported for unit tests) ───────────────────────────────────

/**
 * Color thresholds for inflation (0…30%), INVERTED — higher is worse:
 *   > 15 → red   (OverviewPanel danger)
 *   > 8  → gold  (OverviewPanel elevated / orange band; use gold for panel chrome)
 *   ≤ 8  → green (moderate / acceptable)
 */
export function inflationColor(rate: number): string {
  if (rate > 15) return 'var(--accent-red)'
  if (rate > 8) return '#c9a84c'
  return 'var(--accent-green)'
}

/** Format live inflation for display (OverviewPanel uses toFixed(1) + %). */
export function formatInflation(rate: number): string {
  return `${rate.toFixed(1)}%`
}

export type InflationHistoryPoint = { week: number; value: number }

export interface ChartPoint {
  x: number
  y: number
  week: number
  value: number
}

/** Map week/value pairs into SVG coordinates. Y domain is fixed 0…30. */
export function mapInflationHistoryToPoints(
  history: InflationHistoryPoint[],
  width = 280,
  height = 120,
  pad = 12,
): ChartPoint[] {
  if (history.length === 0) return []

  const minW = Math.min(...history.map(h => h.week))
  const maxW = Math.max(...history.map(h => h.week))
  const spanW = maxW - minW || 1
  const minV = 0
  const maxV = 30
  const spanV = maxV - minV
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  return history.map(h => {
    const x = pad + ((h.week - minW) / spanW) * innerW
    // Higher inflation → higher on chart → smaller SVG y
    const y = pad + (1 - (h.value - minV) / spanV) * innerH
    return { x, y, week: h.week, value: h.value }
  })
}

export function pointsToPolyline(points: ChartPoint[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface InflationPanelProps {
  /** Required for standalone; optional when embedded inside StatsPanel. */
  onClose?: () => void
  /** When true, render body only (no fixed shell, seal, title, or close). */
  embedded?: boolean
}

const CHART_W = 280
const CHART_H = 140
const CHART_PAD = 12
// Round numbers read cleaner than 0/7.5/15/22.5/30 on a dense panel
const GRID_VALUES = [0, 10, 20, 30] as const

const tickLabelStyle: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.5rem',
  color: 'rgba(107,96,80,0.55)',
  letterSpacing: '0.08em',
  margin: 0,
}

const filterNavBtnStyle = (disabled: boolean): CSSProperties => ({
  background: 'transparent',
  border: '1px solid rgba(196,148,58,0.35)',
  color: 'var(--amber)',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: '0.85rem',
  lineHeight: 1,
  padding: '4px 10px',
  opacity: disabled ? 0.3 : 0.85,
  fontFamily: "'IBM Plex Mono', monospace",
})

export default function InflationPanel({ onClose, embedded = false }: InflationPanelProps) {
  const inflation = useGameStore(s => s.nation.inflation)
  const inflationHistory = useGameStore(s => s.inflationHistory)
  const currentAct = useGameStore(s => s.currentAct)
  const [filterIndex, setFilterIndex] = useState(0)

  const filterOptions = [
    'All Time',
    ...Array.from({ length: currentAct }, (_, i) => `Act ${i + 1}`),
  ]

  const filteredHistory =
    filterIndex === 0
      ? inflationHistory
      : (() => {
          const [start, end] = ACT_WEEK_RANGES[filterIndex] ?? [1, 999]
          return inflationHistory.filter(h => h.week >= start && h.week <= end)
        })()

  const color = inflationColor(inflation)
  const points = mapInflationHistoryToPoints(filteredHistory, CHART_W, CHART_H)
  // Threshold at 8% on 0…30 domain
  const yThreshold =
    CHART_PAD + (1 - (THRESHOLD_VALUE - 0) / 30) * (CHART_H - CHART_PAD * 2)

  // Gauge: 0..30 → 0..100%
  const pct = Math.min(100, Math.max(0, (inflation / 30) * 100))

  const gridlines = GRID_VALUES.map(value => ({
    value,
    y: mapInflationHistoryToPoints([{ week: 0, value }], CHART_W, CHART_H)[0].y,
  }))

  const weekLabelStep =
    filteredHistory.length > 8 ? Math.ceil(filteredHistory.length / 6) : 1
  const weekLabelIndices: number[] = []
  if (filteredHistory.length > 0) {
    for (let i = 0; i < filteredHistory.length; i += weekLabelStep) {
      weekLabelIndices.push(i)
    }
    const last = filteredHistory.length - 1
    if (weekLabelIndices[weekLabelIndices.length - 1] !== last) {
      weekLabelIndices.push(last)
    }
  }

  const body = (
      <div
        data-testid="inflation-panel-body"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.48rem',
            letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase',
            margin: '0 0 8px',
          }}>
            Inflation Rate
          </p>
          <p
            data-testid="inflation-value"
            style={{
              fontFamily: "'Playfair Display', serif", fontSize: '2.6rem',
              fontWeight: 700, color, margin: 0, lineHeight: 1,
              letterSpacing: '0.02em',
            }}
          >
            {formatInflation(inflation)}
          </p>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem',
            color: 'rgba(107,96,80,0.55)', margin: '6px 0 0', letterSpacing: '0.08em',
          }}>
            0 … 30%
          </p>
        </div>

        {/* Gauge: green (low) → gold → red (high) — inverted danger direction */}
        <div
          data-testid="inflation-gauge"
          style={{ marginBottom: '18px', padding: '0 2px' }}
        >
          <div style={{ position: 'relative', height: '10px', margin: '4px 0 0' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '5px',
                background:
                  'linear-gradient(90deg, var(--accent-green) 0%, #c9a84c 40%, var(--accent-red) 100%)',
                opacity: 0.35,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: '-4px',
                bottom: '-4px',
                transform: 'translateX(-50%)',
                width: '3px',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 6px ${color}, 0 0 10px rgba(0,0,0,0.35)`,
                  flexShrink: 0,
                  marginBottom: '1px',
                }}
              />
              <div
                style={{
                  flex: 1,
                  width: '2px',
                  background: color,
                  borderRadius: '1px',
                  minHeight: '12px',
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
            }}
          >
            <span style={tickLabelStyle}>0%</span>
            <span style={tickLabelStyle}>15%</span>
            <span style={tickLabelStyle}>30%</span>
          </div>
        </div>

        <div style={{
          border: '1px solid rgba(196,148,58,0.12)',
          background: 'rgba(8,6,4,0.5)',
          padding: '10px 8px 8px',
        }}>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.45rem',
            letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase',
            margin: '0 0 8px 4px',
          }}>
            Weekly Trend
          </p>

          {points.length === 0 ? (
            <div
              data-testid="inflation-trend-empty"
              style={{
                height: CHART_H,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <div style={{ position: 'relative', height: '48px', width: '100%' }}>
                <svg
                  viewBox={`0 0 ${CHART_W} 48`}
                  width="100%"
                  height={48}
                  style={{ display: 'block' }}
                  aria-hidden
                >
                  <line
                    x1={CHART_PAD}
                    y1={24}
                    x2={CHART_W - CHART_PAD}
                    y2={24}
                    stroke="rgba(196,148,58,0.35)"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={CHART_PAD}
                    cy={24}
                    r={4}
                    fill="rgba(201,168,76,0.85)"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.35;1;0.35"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="r"
                      values="3;5;3"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontStyle: 'italic',
                  fontSize: '0.52rem',
                  color: 'rgba(107,96,80,0.55)',
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                No trend data yet — advance weeks to record history.
              </p>
            </div>
          ) : (
            <svg
              data-testid="inflation-trend-svg"
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              width="100%"
              height={CHART_H}
              style={{ display: 'block' }}
              role="img"
              aria-label="Inflation over weeks"
            >
              <defs>
                <filter id="inflation-line-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx={0}
                    dy={1}
                    stdDeviation={1.2}
                    floodColor="#000000"
                    floodOpacity={0.45}
                  />
                </filter>
              </defs>

              {gridlines.map(({ value, y }) => (
                <g key={`gridline-${value}`}>
                  <line
                    x1={CHART_PAD}
                    y1={y}
                    x2={CHART_W - CHART_PAD}
                    y2={y}
                    stroke="rgba(196,148,58,0.1)"
                    strokeWidth={1}
                  />
                  <text
                    x={2}
                    y={y}
                    dy="0.35em"
                    fontSize={7}
                    fontFamily="'IBM Plex Mono', monospace"
                    fill="rgba(107,96,80,0.55)"
                  >
                    {value}
                  </text>
                </g>
              ))}

              <text
                x={CHART_W - 4}
                y={gridlines.find(g => g.value === 30)?.y ?? CHART_PAD}
                dy="0.35em"
                textAnchor="end"
                fontSize={7}
                fontFamily="'IBM Plex Mono', monospace"
                fill="rgba(107,96,80,0.55)"
                letterSpacing="0.1em"
              >
                HIGH
              </text>
              <text
                x={CHART_W - 4}
                y={gridlines.find(g => g.value === 0)?.y ?? CHART_H - CHART_PAD}
                dy="0.35em"
                textAnchor="end"
                fontSize={7}
                fontFamily="'IBM Plex Mono', monospace"
                fill="rgba(107,96,80,0.55)"
                letterSpacing="0.1em"
              >
                LOW
              </text>

              <line
                x1={CHART_PAD}
                y1={yThreshold}
                x2={CHART_W - CHART_PAD}
                y2={yThreshold}
                stroke="var(--accent-red)"
                strokeWidth={1.75}
              />

              {points.length === 1 ? (
                <circle
                  cx={points[0].x}
                  cy={points[0].y}
                  r={4}
                  fill={inflationColor(points[0].value)}
                />
              ) : (
                <polyline
                  data-testid="inflation-trend-polyline"
                  fill="none"
                  stroke={TREND_LINE_COLOR}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={pointsToPolyline(points)}
                  filter="url(#inflation-line-shadow)"
                />
              )}
              {points.map((p, i) => (
                <circle
                  key={`${p.week}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  fill={TREND_LINE_COLOR}
                />
              ))}

              {weekLabelIndices.map(idx => {
                const hist = filteredHistory[idx]
                const pt = points[idx]
                if (!hist || !pt) return null
                return (
                  <text
                    key={`week-label-${hist.week}-${idx}`}
                    x={pt.x}
                    y={CHART_H - 2}
                    textAnchor="middle"
                    fontSize={7}
                    fontFamily="'IBM Plex Mono', monospace"
                    fill="rgba(107,96,80,0.55)"
                  >
                    W{hist.week}
                  </text>
                )
              })}
            </svg>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '10px',
            }}
          >
            <button
              type="button"
              onClick={() => setFilterIndex(i => Math.max(0, i - 1))}
              disabled={filterIndex === 0}
              style={filterNavBtnStyle(filterIndex === 0)}
              aria-label="Previous filter range"
            >
              ←
            </button>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.55rem',
                letterSpacing: '0.12em',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                minWidth: '72px',
                textAlign: 'center',
              }}
            >
              {filterOptions[filterIndex]}
            </span>
            <button
              type="button"
              onClick={() =>
                setFilterIndex(i => Math.min(filterOptions.length - 1, i + 1))
              }
              disabled={filterIndex === filterOptions.length - 1}
              style={filterNavBtnStyle(filterIndex === filterOptions.length - 1)}
              aria-label="Next filter range"
            >
              →
            </button>
          </div>
        </div>
      </div>
  )

  if (embedded) {
    return <>{body}</>
  }

  return (
    <div
      data-testid="inflation-panel"
      style={{
        position: 'fixed', left: '52px', top: '50px', width: '320px',
        height: 'calc(100vh - 110px)', zIndex: Z.panel,
        background: 'rgba(12,10,8,0.96)',
        border: '1px solid rgba(196,148,58,0.25)', borderRight: 'none',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 4px 24px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid rgba(196,148,58,0.15)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <img
            src={veltriaSeal}
            alt=""
            style={{
              width: '48px',
              height: '48px',
              display: 'block',
              margin: '0 auto 8px auto',
              opacity: 0.9,
            }}
          />
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.1rem',
            fontWeight: 600, color: 'var(--amber)', margin: 0, letterSpacing: '0.03em',
          }}>
            INFLATION
          </h2>
        </div>
        <button onClick={() => onClose?.()} style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1,
        }}>✕</button>
      </div>
      {body}
    </div>
  )
}
