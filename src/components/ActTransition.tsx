import { useEffect, useState } from 'react'

interface ActTransitionProps {
  actNumber: number
  actTitle: string
  onComplete: () => void
}

export default function ActTransition({
  actNumber,
  actTitle,
  onComplete
}: ActTransitionProps) {
  const [phase, setPhase] = useState<'fadein' | 'hold' | 'fadeout'>('fadein')
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    // Fade in over 800ms
    const t1 = setTimeout(() => setOpacity(1), 50)
    // Hold for 2.5 seconds
    const t2 = setTimeout(() => setPhase('hold'), 850)
    // Fade out over 800ms
    const t3 = setTimeout(() => {
      setPhase('fadeout')
      setOpacity(0)
    }, 3400)
    // Complete
    const t4 = setTimeout(() => onComplete(), 4300)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onComplete])

  const actNames: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000000',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity,
      transition: 'opacity 0.8s ease-in-out',
      pointerEvents: 'all',
    }}>
      {/* Decorative top line */}
      <div style={{
        width: '200px',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
        marginBottom: '24px',
        opacity: opacity,
        transition: 'opacity 1s ease 0.3s',
      }} />

      {/* ACT I in Gotica font */}
      <div style={{
        fontFamily: "'PorSiempreGotica', serif",
        fontSize: '72px',
        color: '#c9a84c',
        letterSpacing: '12px',
        textTransform: 'uppercase',
        marginBottom: '16px',
        textShadow: '0 0 40px rgba(201,168,76,0.4)',
      }}>
        Act {actNames[actNumber] ?? actNumber}
      </div>

      {/* Subtitle line */}
      <div style={{
        width: '120px',
        height: '1px',
        background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)',
        marginBottom: '20px',
      }} />

      {/* The Beginning in Great Vibes font */}
      <div style={{
        fontFamily: "'GreatVibes', cursive",
        fontSize: '52px',
        color: '#c9a84c',
        letterSpacing: '2px',
        textShadow: '0 0 30px rgba(201,168,76,0.3)',
      }}>
        {actTitle}
      </div>

      {/* Decorative bottom line */}
      <div style={{
        width: '200px',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
        marginTop: '24px',
      }} />
    </div>
  )
}
