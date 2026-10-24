import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Z } from '../../constants/zIndex'
import { paperName } from '../../data/paperName'
import { useGameStore } from '../../stores/gameStore'
import { useNewsStore } from '../../stores/newsStore'
import { useWeekStore } from '../../stores/weekStore'
import type { NewsArticle } from '../../types/news'
import { topStoryOfWeek } from './weekTopStory'

const HEADLINE_SHOW_MS = 7000
const ENTER_S = 0.45
const EXIT_S = 0.5
const ENTER_RISE_PX = 24
const EXIT_FALL_PX = 16

const PAPER_FONT = "'Playfair Display', serif"
const MONO_FONT = "'IBM Plex Mono', monospace"

/**
 * Small non-blocking clipping with the week's top story, shown when a new week
 * opens on the map. Shown at most once per week; auto-hides, dismisses, or opens
 * the papers on click. Never intercepts pointer events outside the card.
 */
export default function WeekHeadline() {
  const reduceMotion = useReducedMotion() ?? false
  const currentWeek = useGameStore(s => s.currentWeek)
  const phase = useWeekStore(s => s.phase)
  const articles = useNewsStore(s => s.articles)
  const [shownWeek, setShownWeek] = useState(0)
  const [card, setCard] = useState<NewsArticle | null>(null)

  // Derived during render: a week's top story opens the clipping once, on the map.
  // Leaving the map clears it. Both changes are guarded, so they settle on the next pass.
  const story = phase === 'map' ? topStoryOfWeek(articles, currentWeek) : null
  if (story && currentWeek > shownWeek) {
    setShownWeek(currentWeek)
    setCard(story)
  } else if (phase !== 'map' && card) {
    setCard(null)
  }

  // Auto-hide timer. The only setState here runs inside the timer callback.
  useEffect(() => {
    if (card === null) return
    const timer = window.setTimeout(() => setCard(null), HEADLINE_SHOW_MS)
    return () => window.clearTimeout(timer)
  }, [card])

  const handleOpenPapers = () => {
    useNewsStore.getState().setOpen(true)
    setCard(null)
  }

  const handleDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setCard(null)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: Z.scene,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {card && (
          <motion.div
            key={card.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: ENTER_RISE_PX }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion
              ? { opacity: 0, transition: { duration: EXIT_S } }
              : { opacity: 0, y: EXIT_FALL_PX, transition: { duration: EXIT_S } }}
            transition={{ duration: ENTER_S }}
            style={{ position: 'relative', pointerEvents: 'auto' }}
          >
            <button
              type="button"
              data-testid="week-headline"
              onClick={handleOpenPapers}
              style={{
                display: 'block',
                width: 'min(520px, calc(100vw - 260px))',
                background: 'linear-gradient(180deg, #efe6d2 0%, #e3d7bd 100%)',
                color: '#1c160e',
                border: '1px solid #b9a77f',
                boxShadow: '0 10px 26px rgba(0,0,0,0.55)',
                padding: '10px 16px 12px',
                textAlign: 'left',
                transform: 'rotate(-0.6deg)',
                cursor: 'pointer',
              }}
            >
              <div style={{
                fontFamily: PAPER_FONT,
                fontWeight: 700,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#3a2a12',
                paddingRight: '28px',
              }}>
                {paperName(card.publication)}
                <span style={{ fontFamily: MONO_FONT, fontSize: '10px', color: '#6b5a3e', letterSpacing: '0.04em' }}>
                  {` · ${card.date}`}
                </span>
              </div>
              <div style={{ height: '1px', background: '#8c7a55', margin: '6px 0 8px' }} />
              <div style={{
                fontFamily: PAPER_FONT,
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: 1.2,
                color: '#1c160e',
              }}>
                {card.headline}
              </div>
              <div style={{
                marginTop: '8px',
                textAlign: 'right',
                fontFamily: MONO_FONT,
                fontSize: '9px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#6b5a3e',
              }}>
                Read the papers ›
              </div>
            </button>
            <button
              type="button"
              aria-label="Dismiss headline"
              onClick={handleDismiss}
              style={{
                position: 'absolute',
                top: '4px',
                right: '6px',
                width: '22px',
                height: '22px',
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: '#6b5a3e',
                fontSize: '16px',
                lineHeight: '22px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
