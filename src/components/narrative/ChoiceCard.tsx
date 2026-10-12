import type { KeyboardEvent } from 'react'

export type ChoiceCardState = 'idle' | 'hovered' | 'selected' | 'fading' | 'dimmed'

interface ChoiceCardProps {
  index: number                 // 0-based; shown 1-based to match the number-key shortcut
  text: string
  hint?: string                 // author-written tooltip from the scene JSON
  state: ChoiceCardState
  onSelect: () => void
  onHoverChange: (hovered: boolean) => void
}

const ANIMATION: Record<ChoiceCardState, string> = {
  idle: 'none',
  hovered: 'none',
  selected: 'choice-glow-burst 0.4s ease-out',
  fading: 'choice-fade-out 0.8s ease forwards',
  dimmed: 'choice-dim-others 0.3s ease forwards',
}

export default function ChoiceCard({ index, text, hint, state, onSelect, onHoverChange }: ChoiceCardProps) {
  const isSelected = state === 'selected'
  const isLit = isSelected || state === 'hovered'
  const isResolving = state === 'selected' || state === 'fading' || state === 'dimmed'

  // Enter/Space activate the button natively; stop them reaching the window
  // listener that advances dialogue.
  const stopAdvanceKeys = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
  }

  return (
    <button
      type="button"
      className="choice-card"
      disabled={isResolving}
      onClick={onSelect}
      onKeyDown={stopAdvanceKeys}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      style={{
        display: 'flex',
        gap: '10px',
        width: '100%',
        textAlign: 'left',
        padding: '14px 18px',
        border: isLit ? '1px solid #c9a84c' : '1px solid rgba(181,154,94,0.55)',
        borderRadius: '4px',
        background: isSelected
          ? 'rgba(201,168,76,0.18)'
          : state === 'hovered'
          ? 'rgba(201,168,76,0.08)'
          : 'rgba(15,12,8,0.6)',
        color: '#e6dcc3',
        fontFamily: "'Crimson Text', Georgia, serif",
        fontSize: '16px',
        lineHeight: 1.45,
        cursor: isResolving ? 'default' : 'pointer',
        transition: 'all var(--dur-fast) var(--ease-standard)',
        userSelect: 'none',
        flexShrink: 0,
        transform: isSelected ? 'scale(0.97)' : 'scale(1)',
        opacity: state === 'fading' ? 0 : state === 'dimmed' ? 0.4 : 1,
        boxShadow: isSelected
          ? '0 0 20px rgba(201,168,76,0.3)'
          : state === 'hovered'
          ? '0 0 12px rgba(201,168,76,0.18)'
          : 'none',
        animation: ANIMATION[state],
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ position: 'relative', zIndex: 1, flexShrink: 0, color: 'var(--brass)' }}>{index + 1}.</span>
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span>{text}</span>
        {hint && (
          <span
            className="choice-card__hint"
            style={{ fontSize: '13px', fontStyle: 'italic', color: 'rgba(200,185,155,0.7)', lineHeight: 1.35 }}
          >
            {hint}
          </span>
        )}
      </span>
      {isSelected && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'choice-ripple 0.4s ease-out',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
    </button>
  )
}
