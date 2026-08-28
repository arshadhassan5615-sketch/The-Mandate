import { useState, useEffect, useRef } from 'react'

export interface ComicPanel {
  image: string
  caption: string
  sfx?: string // URL to sound effect audio file
  duration?: number // milliseconds to display panel
}

interface ComicCutsceneProps {
  panels: ComicPanel[]
  onComplete: () => void
}

export default function ComicCutscene({ panels, onComplete }: ComicCutsceneProps) {
  const [currentPanel, setCurrentPanel] = useState(0)
  const [exiting, setExiting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const panel = panels[currentPanel]
  const duration = panel?.duration ?? 4000

  useEffect(() => {
    if (!panel) {
      onComplete()
      return
    }

    // Play SFX if provided
    if (panel.sfx) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(panel.sfx)
      audio.volume = 0.7
      audio.play().catch(() => {})
      audioRef.current = audio
    }

    // Auto-advance to next panel
    const timer = setTimeout(() => {
      if (currentPanel < panels.length - 1) {
        setCurrentPanel(prev => prev + 1)
      } else {
        // Last panel, start exit transition
        setExiting(true)
        setTimeout(() => {
          onComplete()
        }, 800)
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [currentPanel, panel, panels.length, duration, onComplete])

  if (!panel) return null

  return (
    <div
      onClick={() => {
        // Allow click to skip to next panel
        if (currentPanel < panels.length - 1) {
          setCurrentPanel(prev => prev + 1)
        } else {
          setExiting(true)
          setTimeout(() => onComplete(), 800)
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        cursor: 'pointer',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.8s ease-in-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      {/* Image with Ken Burns Effect */}
      <img
        src={panel.image}
        alt="Comic Panel"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          animation: 'kenburns 6s ease-out forwards',
          filter: 'sepia(0.2) contrast(1.1) brightness(0.9)',
        }}
      />

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Caption */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(0, 0, 0, 0.85)',
        borderTop: '1px solid rgba(201,168,76,0.4)',
        padding: '1.5rem 2rem',
        width: '100%',
        maxWidth: '800px',
        textAlign: 'center',
        marginBottom: '2rem',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        opacity: 0,
        animation: 'caption-fade-in 1s ease-out 0.5s forwards',
      }}>
        <p style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          fontSize: '1.2rem',
          color: '#e8dcc8',
          margin: 0,
          fontStyle: 'italic',
          lineHeight: 1.6,
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        }}>
          {panel.caption}
        </p>
      </div>

      {/* Skip Hint */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.6rem',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>
        Click to Skip
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translateY(0); }
          100% { transform: scale(1.15) translateY(-2%); }
        }
        @keyframes caption-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
