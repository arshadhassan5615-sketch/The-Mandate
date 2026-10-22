import type { CSSProperties } from 'react'
import { Z } from '../constants/zIndex'
import { enterLandscapeFullscreen, useNeedsRotation } from '../hooks/orientation'

const CREAM = '#e6dcc3'

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: Z.system,
  background: '#0d0b08',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: 24,
  textAlign: 'center',
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: "'Playfair Display', serif",
  fontSize: 22,
  color: CREAM,
}

const bodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: "'Crimson Text', serif",
  fontSize: 16,
  color: CREAM,
  opacity: 0.75,
}

const buttonStyle: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  border: '1px solid var(--brass)',
  color: 'var(--brass)',
  background: 'transparent',
  minHeight: 44,
  padding: '0 20px',
  cursor: 'pointer',
}

export default function RotateDevicePrompt() {
  const needsRotation = useNeedsRotation()
  if (!needsRotation) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="rotate-prompt-title" style={overlayStyle}>
      <svg
        className="rotate-hint-icon"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        stroke="var(--brass)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="22" y="12" width="20" height="36" rx="3" />
        <line x1="29" y1="43" x2="35" y2="43" />
        <path d="M10 28 C10 14 20 6 32 6" />
        <polyline points="27,2 32,6 27,10" />
      </svg>
      <h2 id="rotate-prompt-title" style={headingStyle}>Turn your phone sideways</h2>
      <p style={bodyStyle}>The Mandate is played in landscape.</p>
      <button type="button" style={buttonStyle} onClick={() => void enterLandscapeFullscreen()}>
        Play fullscreen
      </button>
    </div>
  )
}
