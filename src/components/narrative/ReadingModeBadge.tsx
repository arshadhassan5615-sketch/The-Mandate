import { Z } from '../../constants/zIndex'

export type ReadingMode = 'auto' | 'skip'

interface ReadingModeBadgeProps {
  mode: ReadingMode | null
}

const MODE_LABEL: Record<ReadingMode, string> = {
  auto: 'AUTO',
  skip: 'SKIP ▸▸',
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

export default function ReadingModeBadge({ mode }: ReadingModeBadgeProps) {
  if (mode === null) return null

  return (
    <div data-testid="reading-mode" aria-live="polite" style={BADGE_STYLE}>
      {MODE_LABEL[mode]}
    </div>
  )
}
