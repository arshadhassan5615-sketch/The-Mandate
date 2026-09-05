import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekStore } from '../stores/weekStore'
import { useSettingsStore } from '../stores/settingsStore'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function weekToDate(week: number): string {
  // Calendar math — same anchor as TopBar's weekToDate (1 Jan 1963, +7 days
  // per week) so the overlay and the TopBar agree on the date for a week.
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  const ordinal = (day: number): string => {
    if (day >= 11 && day <= 13) return day + 'th'
    switch (day % 10) {
      case 1: return day + 'st'
      case 2: return day + 'nd'
      case 3: return day + 'rd'
      default: return day + 'th'
    }
  }
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()}`
}

// Election outcomes set transitionLabel from completeWeek but previously had
// no render branch — the player stared at a blank screen for 1.5-2s.
const ELECTION_SCREENS: Record<string, { title: string; subline: string; color: string }> = {
  'Election Victory': { title: 'ELECTION VICTORY', subline: 'The people have spoken.', color: 'var(--amber)' },
  defeat:            { title: 'ELECTORAL DEFEAT', subline: 'The mandate is over.',       color: '#b8544a' },
  term_limit:        { title: 'MANDATE COMPLETE', subline: 'Two terms. Your legacy is written.', color: 'var(--amber)' },
}

export default function TransitionOverlay() {
  const { transitionLabel, transitionWeek } = useWeekStore()

  // Force-close all UI overlays the instant a transition begins
  useEffect(() => {
    if (!transitionLabel) return

    // Immediately close Settings, SaveMenu, and any other open panels
    // so they never bleed through the black fade.
    const { settingsOpen, setSettingsOpen, setSaveMenuOpen } = useSettingsStore.getState()
    if (settingsOpen) setSettingsOpen(false)
    setSaveMenuOpen(false)

    // Safety timeout: force-clear transition if overlay is stuck for >10 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('[TransitionOverlay] Safety timeout — force-clearing stuck transition:', transitionLabel)
      useWeekStore.setState({ transitionLabel: '', transitionWeek: null })
    }, 10000)
    return () => clearTimeout(safetyTimeout)
  }, [transitionLabel])

  // Click-to-skip: only for the week card and election outcomes. 'scene' is
  // excluded (advanceQueue's transitionLabel guard depends on its timing) and
  // 'epilogue' must always play fully.
  const canSkip = transitionLabel === 'week' || !!ELECTION_SCREENS[transitionLabel]
  const skipTransition = () => {
    if (!canSkip) return
    useWeekStore.setState({ transitionLabel: '', transitionWeek: null })
  }

  return (
    <AnimatePresence>
      {transitionLabel && (
        <motion.div
          key={transitionLabel === 'scene' ? 'scene' : transitionLabel === 'week' ? 'week' : 'epilogue'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          onClick={skipTransition}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#0d0a05',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.2rem',
            cursor: canSkip ? 'pointer' : 'default',
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
          {ELECTION_SCREENS[transitionLabel] && (() => {
            const screen = ELECTION_SCREENS[transitionLabel]
            return (
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: "'Playfair Display', 'IM Fell English', Georgia, serif",
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
                  fontWeight: 500,
                  color: screen.color,
                  letterSpacing: '0.08em',
                  margin: 0,
                  textShadow: `0 0 24px ${screen.color === 'var(--amber)' ? 'rgba(201,168,76,0.3)' : 'rgba(224,92,74,0.25)'}`,
                }}>
                  {screen.title}
                </p>
                <p style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  color: 'var(--cream)',
                  opacity: 0.5,
                  margin: '1rem 0 0',
                  letterSpacing: '0.04em',
                }}>
                  {screen.subline}
                </p>
              </div>
            )
          })()}
          {canSkip && (
            <p style={{
              position: 'absolute', bottom: '2rem', left: 0, right: 0,
              textAlign: 'center',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6rem', letterSpacing: '0.2em',
              color: 'rgba(201,168,76,0.35)',
              margin: 0,
              animation: 'hint-fade-in 0.4s ease-out 0.3s backwards',
            }}>
              click to continue
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
