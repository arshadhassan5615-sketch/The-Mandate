import type { CSSProperties, ReactNode } from 'react'
import { Z } from '../../constants/zIndex'

export type ReadingMode = 'auto' | 'skip'

interface ReadingModeBadgeProps {
  mode: ReadingMode | null
}

const MODE_LABEL: Record<ReadingMode, ReactNode> = {
  auto: 'AUTO',
  skip: <>SKIP <span aria-hidden="true">▸▸</span></>,
}

// Spoken to screen readers in place of the visible label, which is hidden from them.
const MODE_ANNOUNCEMENT: Record<ReadingMode, string> = {
  auto: 'Auto-advance on',
  skip: 'Skipping read lines',
}

// Sits under the conversation column, aligned to its left edge.
const BADGE_STYLE = {
  position: 'fixed',
  bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
  left: 'calc(50% - 0.3vw - clamp(218px, 36.3vw, 1094px) / 2 + 12px)',
  zIndex: Z.sceneTop,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.22em',
  color: '#c9a84c',
  border: '1px solid rgba(201,168,76,0.5)',
  background: 'rgba(10,9,8,0.9)',
  padding: '3px 8px',
  borderRadius: 2,
  pointerEvents: 'none',
} as const

// With no mode the box keeps its place in the page but draws nothing.
const EMPTY_BADGE_STYLE: CSSProperties = {
  ...BADGE_STYLE,
  border: 'none',
  background: 'transparent',
  padding: 0,
}

// Standard visually hidden pattern: stays in the accessibility tree, takes no space on screen.
const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

// The status region is always mounted so that a change in mode is announced.
export default function ReadingModeBadge({ mode }: ReadingModeBadgeProps) {
  if (mode === null) {
    return <div role="status" data-testid="reading-mode" style={EMPTY_BADGE_STYLE} />
  }

  return (
    <div role="status" data-testid="reading-mode" style={BADGE_STYLE}>
      <span aria-hidden="true">{MODE_LABEL[mode]}</span>
      <span style={VISUALLY_HIDDEN_STYLE}>{MODE_ANNOUNCEMENT[mode]}</span>
    </div>
  )
}
