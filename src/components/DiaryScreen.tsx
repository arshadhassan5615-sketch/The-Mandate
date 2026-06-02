import { useEffect, useState, useCallback, useRef } from 'react'
import type { DiaryEntry } from '../engine/DiaryEngine'
import CharacterPortrait from './portraits/CharacterPortrait'

interface DiaryScreenProps {
  entry: DiaryEntry
  onContinue: () => void
}

export default function DiaryScreen({ entry, onContinue }: DiaryScreenProps) {
  const [visible, setVisible] = useState(false)
  const [textVisible, setTextVisible] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setTextVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [visible])

  // Reset scroll to top when a new diary entry opens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [entry.week])

  const handleContinue = useCallback(() => {
    if (fadingOut) return
    setFadingOut(true)
    setTimeout(() => onContinue(), 1000)
  }, [fadingOut, onContinue])

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
        position: 'fixed', inset: 0, zIndex: 300,
        background: '#0a0806',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fadingOut ? 0 : visible ? 1 : 0,
        transition: 'opacity 1s ease',
        cursor: 'pointer',
      }}
    >
      {/* CRT scanlines overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
        pointerEvents: 'none', opacity: 0.5,
      }} />

      {/* Film grain */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="+"0 0 256 256"+" xmlns="+"http://www.w3.org/2000/svg"%22%3E%3Cfilter id=%22grain%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23grain)%22 opacity=%220.04%22/%3E%3C/svg%3E")',
        pointerEvents: 'none',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        pointerEvents: 'none',
      }} />

      <div
        ref={scrollRef}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', height: '100%',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(200,144,42,0.2) transparent',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          padding: '80px 3.5rem 60px',
          opacity: textVisible ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      >
        <div style={{ maxWidth: '640px', width: '100%', position: 'relative' }}>
          {/* Katerin's portrait — soft, small, circular, top-left */}
          <div style={{
            position: 'absolute', top: '-60px', left: '-0.5rem',
            opacity: 0.28, filter: 'sepia(0.3) brightness(0.9)',
          }}>
            <CharacterPortrait
              characterId="katerin_ashavel"
              isActive={false}
              size={68}
              showName={false}
            />
          </div>

          {/* "Dear Diary" header */}
          <p style={{
            fontFamily: "'Caveat', 'Georgia', serif",
            fontSize: '1.6rem',
            color: '#a89870', opacity: 0.55,
            marginBottom: '0.3rem', fontStyle: 'italic',
          }}>
            Dear Diary,
          </p>

          {/* Date header */}
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.55rem', letterSpacing: '0.18em',
            color: 'var(--amber-dim)', textTransform: 'uppercase',
            marginBottom: '2.5rem',
          }}>
            {entry.date}
          </p>

          {/* Diary text — Caveat font, literary voice */}
          <div style={{
            fontFamily: "'Caveat', 'Georgia', serif",
            fontSize: '1.08rem',
            color: '#c8bfa5', lineHeight: 1.8,
            letterSpacing: '0.03em',
            textAlign: 'justify',
          }}>
            {entry.text.split('\n\n').map((para, i) => (
              <p key={i} style={{
                marginBottom: '1.3rem',
                textIndent: '1.6em',
              }}>
                {para}
              </p>
            ))}
          </div>

          {/* Decorative divider */}
          <div style={{
            width: '60px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #c8902a44, transparent)',
            margin: '2.5rem auto 2rem',
          }} />

          {/* Continue prompt */}
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.48rem', letterSpacing: '0.15em',
            color: 'var(--muted)', opacity: 0.6,
            textAlign: 'center',
            animation: 'blink 2.5s step-end infinite',
          }}>
            PRESS SPACE TO CONTINUE
          </p>
        </div>
      </div>
    </div>
  )
}
