import { motion, AnimatePresence } from 'framer-motion'
import { useWeekStore } from '../stores/weekStore'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function weekToDate(week: number): string {
  const monthIdx = Math.min(Math.floor((week - 1) / 4.33), 11)
  const month = MONTHS[monthIdx]
  // Approximate day of month from week within month
  const weekInMonth = ((week - 1) % 4.33)
  const day = Math.min(Math.floor(weekInMonth * 7) + 1, 28)
  const ordinal = day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`
  return `${month} ${ordinal}, 1963`
}

export default function TransitionOverlay() {
  const { transitionLabel, transitionWeek } = useWeekStore()

  return (
    <AnimatePresence>
      {transitionLabel && (
        <motion.div
          key={transitionLabel === 'scene' ? 'scene' : transitionLabel === 'week' ? 'week' : 'epilogue'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            background: '#0d0a05',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.2rem',
          }}
        >
          {transitionLabel === 'week' && transitionWeek && (
            <>
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.68rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--amber-dim)',
                margin: 0,
              }}>
                ▸ Week {transitionWeek}
              </p>
              <h2 style={{
                fontFamily: "'Playfair Display', 'IM Fell English', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontWeight: 500,
                color: 'var(--amber)',
                letterSpacing: '0.06em',
                margin: 0,
                textAlign: 'center',
              }}>
                {weekToDate(transitionWeek)}
              </h2>
              <p style={{
                fontFamily: "'IM Fell English', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '0.95rem',
                color: 'var(--cream)',
                opacity: 0.45,
                margin: 0,
                letterSpacing: '0.04em',
              }}>
                Republic of Veltria
              </p>
            </>
          )}
          {transitionLabel === 'scene' && (
            <p style={{
              fontFamily: "'IM Fell English', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '0.9rem',
              color: 'var(--cream)',
              opacity: 0.3,
              margin: 0,
            }}>
              ...
            </p>
          )}
          {transitionLabel === 'epilogue' && (
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.8rem',
              color: 'var(--amber)',
              letterSpacing: '0.08em',
              margin: 0,
              opacity: 0.7,
            }}>
              Epilogue
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
