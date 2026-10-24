import { motion } from 'framer-motion'
import type { VoteProjection } from '../types/vote'

interface VoteTrackerProps {
  projection: VoteProjection
  animated?: boolean
  showThreshold?: boolean
  compact?: boolean
  tension?: number
}

export default function VoteTracker({
  projection,
  animated = false,
  showThreshold = true,
  compact = false,
  tension = 0,
}: VoteTrackerProps) {
  const { yesSeats, noSeats, undecidedSeats, threshold, totalSeats } = projection
  const yesPct = (yesSeats / totalSeats) * 100
  const noPct = (noSeats / totalSeats) * 100
  const undPct = (undecidedSeats / totalSeats) * 100
  const thresholdPct = (threshold / totalSeats) * 100
  const isClose = Math.abs(yesSeats - threshold) <= 5

  const barHeight = compact ? 24 : 40

  return (
    <div style={{ width: '100%' }}>
      {/* Labels */}
      {!compact && (
        <div style={labelRowStyle}>
          <span style={{ color: 'var(--accent-green)' }}>YES {yesSeats}</span>
          <span style={{ color: 'var(--text-muted)' }}>UNDECIDED {undecidedSeats}</span>
          <span style={{ color: 'var(--accent-red)' }}>NO {noSeats}</span>
        </div>
      )}

      {/* Bar */}
      <div style={{ position: 'relative', height: barHeight, marginBottom: compact ? 4 : 8 }}>
        <div style={{
          ...barTrackStyle,
          height: barHeight,
          borderRadius: compact ? 4 : 6,
        }}>
          {/* YES segment */}
          <motion.div
            initial={animated ? { width: '0%' } : undefined}
            animate={{
              width: `${yesPct}%`,
              backgroundColor: isClose && tension > 0.5 ? '#d4a843' : 'var(--accent-green)',
            }}
            transition={animated ? { duration: 1.5, ease: 'easeOut' } : undefined}
            style={{
              height: '100%',
              borderRadius: `${compact ? 4 : 6}px 0 0 ${compact ? 4 : 6}px`,
              ...(yesPct === 0 ? { borderRadius: 0 } : {}),
            }}
          />
          {/* Undecided segment */}
          <motion.div
            initial={animated ? { width: '0%' } : undefined}
            animate={{ width: `${undPct}%` }}
            transition={animated ? { duration: 1.5, ease: 'easeOut', delay: 0.3 } : undefined}
            style={{
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />
          {/* NO segment */}
          <motion.div
            initial={animated ? { width: '0%' } : undefined}
            animate={{
              width: `${noPct}%`,
              backgroundColor: 'var(--accent-red)',
            }}
            transition={animated ? { duration: 1.5, ease: 'easeOut', delay: 0.6 } : undefined}
            style={{
              height: '100%',
              borderRadius: `0 ${compact ? 4 : 6}px ${compact ? 4 : 6}px 0`,
              ...(noPct === 0 ? { borderRadius: 0 } : {}),
            }}
          />
        </div>

        {/* Threshold marker */}
        {showThreshold && (
          <div style={{
            position: 'absolute',
            left: `${thresholdPct}%`,
            top: -4,
            bottom: -4,
            width: 2,
            backgroundColor: 'var(--amber-dim)',
            zIndex: 2,
          }}>
            <span style={{
              position: 'absolute',
              top: -18,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--amber-dim)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.05em',
            }}>
              PASS {threshold}
            </span>
          </div>
        )}
      </div>

      {/* Compact labels */}
      {compact && (
        <div style={{ ...labelRowStyle, fontSize: 11 }}>
          <span style={{ color: 'var(--accent-green)' }}>{yesSeats} YES</span>
          <span style={{ color: 'var(--text-muted)' }}>{undecidedSeats} UND</span>
          <span style={{ color: 'var(--accent-red)' }}>{noSeats} NO</span>
        </div>
      )}

      {/* Tension indicator */}
      {isClose && tension > 0 && (
        <div style={tensionRowStyle}>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ color: 'var(--amber-dim)', fontSize: 12 }}
          >
            WITHIN 5 SEATS — TOO CLOSE TO CALL
          </motion.span>
        </div>
      )}

      {/* Margin text */}
      {!compact && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <span style={{
            fontSize: 12,
            color: projection.willPass ? 'var(--accent-green)' : 'var(--accent-red)',
            fontFamily: 'var(--font-mono)',
          }}>
            {projection.willPass
              ? `Projected to PASS by ${projection.margin} seat${projection.margin !== 1 ? 's' : ''}`
              : `Projected to FAIL by ${Math.abs(projection.margin)} seat${Math.abs(projection.margin) !== 1 ? 's' : ''}`
            }
          </span>
        </div>
      )}
    </div>
  )
}

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  columnGap: 12,
  rowGap: 2,
  marginBottom: 4,
  fontSize: 13,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.03em',
}

const barTrackStyle: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  overflow: 'hidden',
  backgroundColor: 'rgba(255,255,255,0.04)',
}

const tensionRowStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 4,
}
