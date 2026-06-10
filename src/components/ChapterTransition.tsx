import { useEffect, useState } from 'react'

interface ChapterTransitionProps {
  actNumber: number
  actTitle: string
  onComplete: () => void
}

export default function ChapterTransition({ actNumber, actTitle, onComplete }: ChapterTransitionProps) {
  const [phase, setPhase] = useState<'fade-in' | 'hold' | 'fade-out'>('fade-in')

  useEffect(() => {
    // Fade in (1s)
    const fadeTimer = setTimeout(() => setPhase('hold'), 1000)
    // Hold for 2.5s, then fade out
    const holdTimer = setTimeout(() => setPhase('fade-out'), 3500)
    // Finish after fade out (1s)
    const finishTimer = setTimeout(() => onComplete(), 4500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(holdTimer)
      clearTimeout(finishTimer)
    }
  }, [onComplete])

  const opacity = phase === 'fade-in' ? 0 : phase === 'hold' ? 1 : 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: opacity,
        transition: 'opacity 1s ease-in-out',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: "'Por Siempre Gotica', 'Playfair Display', serif",
          fontSize: '24px',
          letterSpacing: '8px',
          color: '#c9a84c',
          textTransform: 'uppercase',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        Act {actNumber}
      </div>
      <div
        style={{
          fontFamily: "'Great Vibes', cursive",
          fontSize: '64px',
          color: '#c9a84c',
          textAlign: 'center',
          textShadow: '0 2px 10px rgba(201,168,76,0.3)',
        }}
      >
        {actTitle}
      </div>
    </div>
  )
}
