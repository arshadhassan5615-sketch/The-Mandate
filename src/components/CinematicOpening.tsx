import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekStore } from '../stores/weekStore'

const LINES = [
  "By 1963, the Republic of Veltria had survived two occupations,",
  "one civil war,",
  "and twenty years of a government that called itself democratic.",
  "The factories in Kravenstal still ran.",
  "The courts in Ashenmere still sat.",
  "The newspapers still printed.",
  "But the treasury had been quietly emptied.",
  "The secret police kept files on half the Assembly.",
  "The Constitution had been amended eleven times in eight years —",
  "each time, in the direction of the man holding the pen.",
  "Chancellor Halvek died in February.",
  "Some said naturally.",
  "His government died with him.",
  "In the elections that followed,",
  "a woman from Kravenstal won by a margin no one had predicted",
  "and no one could explain.",
  "She had no powerful family.",
  "No party machine.",
  "No general behind her.",
  "She had a name that people trusted.",
  "Tomorrow she takes the oath.",
  "Tonight, she reads the real numbers.",
]

const LINE_DURATION = 2200
const FADE_DURATION = 0.9
const HOLD_DURATION = 1.1

export default function CinematicOpening() {
  const [lineIndex, setLineIndex] = useState(0)
  const [visible,   setVisible]   = useState(true)
  const [done,      setDone]      = useState(false)
  const startPrologue = useWeekStore(s => s.startPrologue)

  useEffect(() => {
    if (done) return

    const showNext = () => {
      setVisible(false)
      setTimeout(() => {
        if (lineIndex >= LINES.length - 1) {
          setDone(true)
          setTimeout(() => startPrologue(), 1800)
        } else {
          setLineIndex(i => i + 1)
          setVisible(true)
        }
      }, FADE_DURATION * 1000)
    }

    const timer = setTimeout(showNext, LINE_DURATION)
    return () => clearTimeout(timer)
  }, [lineIndex, done, startPrologue])

  const handleSkip = () => {
    if (done) return
    setDone(true)
    startPrologue()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      onClick={handleSkip}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Film grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.12,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }}/>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, rgba(0,0,0,0.7) 100%)',
      }}/>

      {/* Line text */}
      <AnimatePresence mode="wait">
        {visible && !done && (
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_DURATION, ease: 'easeInOut' }}
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
              color: 'rgba(220, 210, 185, 0.92)',
              textAlign: 'center',
              maxWidth: '680px',
              lineHeight: 1.5,
              padding: '0 2rem',
              position: 'relative', zIndex: 1,
              letterSpacing: '0.01em',
            }}
          >
            {LINES[lineIndex]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Skip hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ delay: 4, duration: 1.5 }}
        style={{
          position: 'absolute', bottom: '2.5rem',
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.55rem', letterSpacing: '0.25em',
          color: '#fff', textTransform: 'uppercase',
          zIndex: 1,
        }}
      >
        Click anywhere to skip
      </motion.p>
    </motion.div>
  )
}
