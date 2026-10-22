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

const CHOICE_TEXT = '#6e9ea2'                       // muted teal, Suzerain-style
const CHOICE_TEXT_LIT = '#a8e0e3'                   // hovered / selected
const CHOICE_BORDER = '#5a5746'                     // olive-grey rule at rest
const CHOICE_BORDER_LIT = '#8fd0d4'                 // brighter teal rule when lit

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
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '3px 10px 3px 17px',
        border: `1px solid ${isLit ? CHOICE_BORDER_LIT : CHOICE_BORDER}`,
        borderRadius: '4px',
        background: isSelected
          ? 'rgba(95,149,151,0.14)'
          : state === 'hovered'
          ? 'rgba(255,255,255,0.035)'
          : 'transparent',
        color: isLit ? CHOICE_TEXT_LIT : CHOICE_TEXT,
        fontFamily: "'Crimson Text', Georgia, serif",
        fontSize: 'var(--choice-font, clamp(12px, 0.98vw, 15px))',
        lineHeight: 1.25,
        cursor: isResolving ? 'default' : 'pointer',
        transition: 'color var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        userSelect: 'none',
        flexShrink: 0,
        opacity: state === 'fading' ? 0 : state === 'dimmed' ? 0.4 : 1,
        boxShadow: isSelected ? '0 0 10px rgba(95,149,151,0.35)' : 'none',
        animation: ANIMATION[state],
        position: 'relative',
      }}
    >
      {/* Number and text run as one line, so wrapped text returns under the number */}
      <span style={{ fontWeight: 400 }}>{index + 1}.</span>{' '}
      <span>{text}</span>
      {hint && (
        <span
          className="choice-card__hint"
          style={{ display: 'block', marginTop: '4px', fontSize: 'var(--choice-hint-font, clamp(11px, 0.85vw, 13px))', fontStyle: 'italic', color: 'rgba(110,158,162,0.7)', lineHeight: 1.35 }}
        >
          {hint}
        </span>
      )}
    </button>
  )
}
