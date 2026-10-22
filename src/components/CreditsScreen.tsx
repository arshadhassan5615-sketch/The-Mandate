import { useEffect } from 'react'
import { Z } from '../constants/zIndex'
import credits from '../data/credits.json'

const BRASS = '#b59a5e'
const MONO = "'IBM Plex Mono', monospace"

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: Z.modal,
  background: 'rgba(8,7,5,0.96)',
} as const

const backButtonStyle = {
  position: 'fixed',
  top: 12,
  right: 'calc(12px + env(safe-area-inset-right, 0px))',
  zIndex: 1,
  minHeight: 40,
  padding: '0 16px',
  background: 'transparent',
  border: `1px solid ${BRASS}`,
  color: BRASS,
  fontFamily: MONO,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  cursor: 'pointer',
} as const

function useEscapeToClose(onClose: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
}

export default function CreditsScreen({ onClose }: { onClose: () => void }) {
  useEscapeToClose(onClose)

  return (
    <div role="dialog" aria-label="Credits" aria-modal="true" style={overlayStyle}>
      <button type="button" onClick={onClose} style={backButtonStyle}>
        Back
      </button>
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          height: '100%',
          overflowY: 'auto',
          padding: 'clamp(16px, 6vh, 64px) 24px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', 'IM Fell English', Georgia, serif",
            color: 'var(--amber)',
            fontSize: 'clamp(1.4rem, 5vh, 2.4rem)',
            margin: '0 0 28px',
          }}
        >
          {credits.title}
        </h2>
        {credits.sections.map(section => (
          <section key={section.heading} style={{ marginBottom: 28 }}>
            <h3
              style={{
                fontFamily: MONO,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                color: BRASS,
                fontWeight: 400,
                margin: '0 0 8px',
              }}
            >
              {section.heading}
            </h3>
            {section.lines.map(line => (
              <p
                key={line}
                style={{
                  fontFamily: "'Crimson Text', Georgia, serif",
                  fontSize: 17,
                  color: '#e6dcc3',
                  margin: '2px 0',
                }}
              >
                {line}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
