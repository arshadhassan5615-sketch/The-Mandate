import { useEffect, useState, useCallback, useRef } from 'react'

interface CliffhangerScreenProps {
  text: string
  onContinue: () => void
}

export default function CliffhangerScreen({ text, onContinue }: CliffhangerScreenProps) {
  const [visible, setVisible] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  // Continue exactly once. The guard is a ref, not state: the 4s auto-continue
  // timer below holds the first render's callback, so a state flag there was
  // stale and a Space press followed by the timer called onContinue twice.
  const continuedRef = useRef(false)
  const onContinueRef = useRef(onContinue)
  useEffect(() => { onContinueRef.current = onContinue }, [onContinue])

  const handleContinue = useCallback(() => {
    if (continuedRef.current) return
    continuedRef.current = true
    setFadingOut(true)
    setTimeout(() => onContinueRef.current(), 600)
  }, [])

  // Auto-continue after 4 seconds
  useEffect(() => {
    const t = setTimeout(handleContinue, 4000)
    return () => clearTimeout(t)
  }, [handleContinue])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleContinue()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleContinue])

  return (
    <div
      onClick={handleContinue}
      style={{
        position: 'fixed', inset: 0, zIndex: 290,
        background: '#080604',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fadingOut ? 0 : visible ? 1 : 0,
        transition: 'opacity 0.8s ease',
        cursor: 'pointer',
      }}
    >
      {/* Vignette */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Film grain */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="+"0 0 256 256"+" xmlns="+"http://www.w3.org/2000/svg"%22%3E%3Cfilter id=%22grain%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23grain)%22 opacity=%220.03%22/%3E%3C/svg%3E")',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '500px', textAlign: 'center', padding: '2rem',
      }}>
        <p style={{
          fontFamily: "'Crimson Text', serif",
          fontSize: '1.08rem', fontStyle: 'italic',
          color: '#d4c8b0', lineHeight: 1.8,
          letterSpacing: '0.03em',
          margin: 0, whiteSpace: 'pre-line',
        }}>
          {text}
        </p>

        <div style={{
          width: '40px', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(212,200,176,0.2), transparent)',
          margin: '2.2rem auto 1.2rem',
        }} />

        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.45rem', letterSpacing: '0.14em',
          color: 'rgba(212,200,176,0.25)', margin: 0,
          animation: 'blink 2.5s step-end infinite',
        }}>
          CLICK TO CONTINUE
        </p>
      </div>
    </div>
  )
}
