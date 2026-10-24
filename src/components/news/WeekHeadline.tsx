import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, MouseEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Z } from '../../constants/zIndex'
import { paperName } from '../../data/paperName'
import { useViewportMode } from '../../hooks/useViewportMode'
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
const DISMISS_HIT_PX = 32

/** Desktop keeps clear of the side rails; phone and compact screens use nearly the full width. */
const DESKTOP_CARD_WIDTH = 'min(520px, calc(100vw - 260px))'
const NARROW_CARD_WIDTH = 'min(520px, calc(100vw - 32px))'

const PAPER_FONT = 'var(--font-headline)'
const MONO_FONT = 'var(--font-mono)'

/**
 * Small non-blocking clipping with the week's top story, shown when a new week
 * opens on the map. Shown at most once per week; auto-hides, dismisses, or opens
 * the papers on click. Never intercepts pointer events outside the card.
 * Auto-hide pauses while the pointer is over the card or focus is inside it.
 */
export default function WeekHeadline() {
  const reduceMotion = useReducedMotion() ?? false
  const viewportMode = useViewportMode()
  const currentWeek = useGameStore(s => s.currentWeek)
  const phase = useWeekStore(s => s.phase)
  const articles = useNewsStore(s => s.articles)
  const [shownWeek, setShownWeek] = useState(0)
  const [card, setCard] = useState<NewsArticle | null>(null)
  const [isPointerOver, setIsPointerOver] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const isHeld = isPointerOver || isFocusWithin
  const cardWidth = viewportMode === 'desktop' ? DESKTOP_CARD_WIDTH : NARROW_CARD_WIDTH

  // Derived during render: a week's top story opens the clipping once, on the map.
  // Leaving the map clears it. Both changes are guarded, so they settle on the next pass.
  const story = phase === 'map' ? topStoryOfWeek(articles, currentWeek) : null
  if (story && currentWeek > shownWeek) {
    setShownWeek(currentWeek)
    setCard(story)
  } else if (phase !== 'map' && card) {
    setCard(null)
    setIsPointerOver(false)
    setIsFocusWithin(false)
  }

  // Auto-hide timer, held in hideTimerRef. It is cleared while the card is held and
  // restarted with the full window once it is released. Cleanup clears it on unmount.
  // The only setState here runs inside the timer callback.
  useEffect(() => {
    if (card === null || isHeld) return
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      setCard(null)
    }, HEADLINE_SHOW_MS)
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [card, isHeld])

  const closeCard = () => {
    setCard(null)
    setIsPointerOver(false)
    setIsFocusWithin(false)
  }

  const handleOpenPapers = () => {
    useNewsStore.getState().setOpen(true)
    closeCard()
  }

  const handleDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    closeCard()
  }

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setIsFocusWithin(false)
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
            onMouseEnter={() => setIsPointerOver(true)}
            onMouseLeave={() => setIsPointerOver(false)}
            onFocus={() => setIsFocusWithin(true)}
            onBlur={handleBlur}
            style={{ position: 'relative', pointerEvents: 'auto' }}
          >
            <button
              type="button"
              data-testid="week-headline"
              onClick={handleOpenPapers}
              style={{
                display: 'block',
                width: cardWidth,
                background: 'linear-gradient(180deg, var(--doc-paper) 0%, var(--doc-paper-edge) 100%)',
                color: 'var(--doc-ink)',
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
                color: 'var(--doc-ink)',
                paddingRight: '36px',
              }}>
                {paperName(card.publication)}
                <span style={{ fontFamily: MONO_FONT, fontSize: '10px', color: 'var(--doc-ink-muted)', letterSpacing: '0.04em' }}>
                  {` · ${card.date}`}
                </span>
              </div>
              <div style={{ height: '1px', background: '#8c7a55', margin: '6px 0 8px' }} />
              <div style={{
                fontFamily: PAPER_FONT,
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: 1.2,
                color: 'var(--doc-ink)',
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
                color: 'var(--doc-ink-muted)',
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
                top: '2px',
                right: '2px',
                width: `${DISMISS_HIT_PX}px`,
                height: `${DISMISS_HIT_PX}px`,
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: 'var(--doc-ink-muted)',
                fontSize: '16px',
                lineHeight: `${DISMISS_HIT_PX}px`,
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
