import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useWeekStore } from '../stores/weekStore'
import { saveGame } from '../engine/SaveManager'
import { useGameStore } from '../stores/gameStore'
import { Z } from '../constants/zIndex'
import { useViewportMode } from '../hooks/useViewportMode'

const sliderLabelStyle: CSSProperties = {
  fontFamily: "'Special Elite', monospace",
  fontSize: '0.65rem',
  color: 'var(--muted)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const sliderValueStyle: CSSProperties = {
  fontFamily: "'Special Elite', monospace",
  fontSize: '0.62rem',
  color: 'var(--amber)',
  letterSpacing: '0.08em',
}

function Slider({ label, value, onChange, min = 0, max = 100, compact = false }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; compact?: boolean
}) {
  const rangeInput = (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="budget-slider"
      style={{ width: '100%' }}
    />
  )

  if (compact) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '7.5rem 1fr 2.6rem',
        alignItems: 'center',
        columnGap: '0.6rem',
        marginBottom: '0.35rem',
      }}>
        <span style={sliderLabelStyle}>{label}</span>
        {rangeInput}
        <span style={{ ...sliderValueStyle, textAlign: 'right' }}>{value}%</span>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
        <span style={sliderLabelStyle}>{label}</span>
        <span style={sliderValueStyle}>{value}%</span>
      </div>
      {rangeInput}
    </div>
  )
}

function Toggle({ label, description, checked, onChange, disabled, compact = false }: {
  label: string; description?: string; checked: boolean; onChange: () => void; disabled?: boolean; compact?: boolean
}) {
  const opacity = disabled ? 0.4 : 1
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compact ? '0.35rem 0' : '0.7rem 0',
        borderBottom: '1px solid rgba(200,144,42,0.08)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity,
      }}
    >
      <div>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.65rem',
          color: 'var(--cream)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        {description && (
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.55rem',
            color: 'var(--muted)',
            marginTop: '0.15rem',
            letterSpacing: '0.04em',
          }}>
            {description}
          </p>
        )}
      </div>
      <div
        style={{
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          background: checked ? 'var(--amber)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginLeft: '1rem',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--cream)',
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </div>
  )
}

function SegmentedPicker<T extends string>({ label, options, value, onChange, compact = false }: {
  label: string; options: readonly T[]; value: T; onChange: (v: T) => void; compact?: boolean
}) {
  return (
    <div style={{ marginBottom: compact ? '0.5rem' : '1rem' }}>
      <span style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.65rem',
        color: 'var(--muted)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: '0.4rem',
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              padding: '0.4rem 0.5rem',
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: value === opt ? 'var(--amber-glow-strong)' : 'transparent',
              border: `1px solid ${value === opt ? 'var(--amber)' : 'var(--border)'}`,
              color: value === opt ? 'var(--amber)' : 'var(--muted)',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.15s',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPanel() {
  const {
    masterVolume, ambientVolume, uiVolume, musicVolume, masterMuted,
    textSpeed, highContrast, fontSize, ironmanMode, storyMode, memoryHints, autoAdvance,
    setMasterVolume, setAmbientVolume, setUiVolume, setMusicVolume, toggleMute,
    setTextSpeed, toggleHighContrast, setFontSize, toggleIronmanMode, toggleStoryMode, toggleMemoryHints, toggleAutoAdvance,
    settingsOpen, setSettingsOpen,
  } = useSettingsStore()
  const phase = useWeekStore(s => s.phase)
  const transitionLabel = useWeekStore(s => s.transitionLabel)
  const isNewGame = phase === 'title'
  const [confirming, setConfirming] = useState(false)
  const isCompact = useViewportMode() === 'compact'
  const sectionLabelGap = isCompact ? '0.5rem' : '1rem'
  const sectionDividerMargin = isCompact ? '0.75rem 0' : '1.5rem 0'
  const bodyPadding = isCompact ? '0.5rem 1.5rem' : '1.5rem'
  const barPadding = isCompact ? '0.5rem 1.5rem' : '1rem 1.5rem'

  const handleReturnToMenu = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    const slot = useWeekStore.getState().activeSlot
    await saveGame(slot, 'PROGRESS SAVE')
    await saveGame(0, 'AUTOSAVE')
    useGameStore.getState().resetToInitial()
    useWeekStore.setState({ phase: 'title' })
    setSettingsOpen(false)
  }

  if (!settingsOpen || transitionLabel) return null

  const ironmanDescription = isNewGame
    ? 'No manual saves. Your decisions are final. Autosave only.'
    : 'Ironman mode can only be toggled from the main menu before starting a new game.'

  const storyModeDescription = 'For players here for the story. Setbacks from your decisions hit half as hard. Good outcomes are unchanged.'

  const sectionDivider = (
    <div style={{ height: '1px', background: 'var(--border)', margin: sectionDividerMargin }} />
  )

  const audioSection = (
    <>
      {/* ── Audio ──────────────────────────────────────────────────────── */}
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.58rem',
        letterSpacing: '0.22em',
        color: 'var(--amber)',
        textTransform: 'uppercase',
        marginBottom: sectionLabelGap,
      }}>
        ▸ Audio
      </p>

      <Slider label="Master Volume" value={masterVolume} onChange={setMasterVolume} compact={isCompact} />
      <Slider label="Music Volume" value={musicVolume} onChange={setMusicVolume} compact={isCompact} />
      <Slider label="Ambient Volume" value={ambientVolume} onChange={setAmbientVolume} compact={isCompact} />
      <Slider label="UI Sound Volume" value={uiVolume} onChange={setUiVolume} compact={isCompact} />

      <Toggle
        label="Mute All Audio"
        checked={masterMuted}
        onChange={toggleMute}
        compact={isCompact}
      />
    </>
  )

  const accessibilitySection = (
    <>
      {/* ── Accessibility ──────────────────────────────────────────────── */}
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.58rem',
        letterSpacing: '0.22em',
        color: 'var(--amber)',
        textTransform: 'uppercase',
        marginBottom: sectionLabelGap,
      }}>
        ▸ Accessibility
      </p>

      <SegmentedPicker
        label="Text Speed"
        options={['slow', 'medium', 'fast', 'instant'] as const}
        value={textSpeed}
        onChange={setTextSpeed}
        compact={isCompact}
      />

      <SegmentedPicker
        label="Font Size"
        options={['normal', 'large', 'xlarge'] as const}
        value={fontSize}
        onChange={setFontSize}
        compact={isCompact}
      />

      <Toggle
        label="High Contrast Mode"
        description={isCompact ? undefined : 'Increases contrast ratios and adds focus indicators'}
        checked={highContrast}
        onChange={toggleHighContrast}
        compact={isCompact}
      />
    </>
  )

  const gameSection = (
    <>
      {/* ── Game ──────────────────────────────────────────────────────────── */}
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.58rem',
        letterSpacing: '0.22em',
        color: 'var(--amber)',
        textTransform: 'uppercase',
        marginBottom: sectionLabelGap,
      }}>
        ▸ Game
      </p>

      <div style={{ padding: isCompact ? '0.4rem 0' : '0.7rem 0', borderBottom: '1px solid rgba(200,144,42,0.08)' }}>
        <label
          htmlFor="story-mode-checkbox"
          title={isCompact ? storyModeDescription : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            userSelect: 'none',
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.65rem',
            color: 'var(--cream)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <input
            id="story-mode-checkbox"
            type="checkbox"
            checked={storyMode}
            onChange={toggleStoryMode}
            style={{ accentColor: 'var(--amber)' }}
          />
          Story Mode
        </label>
        {!isCompact && (
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.55rem',
            color: 'var(--muted)',
            marginTop: '0.15rem',
            letterSpacing: '0.04em',
          }}>
            {storyModeDescription}
          </p>
        )}
        {!isCompact && (
          <p style={{
            fontFamily: "'IM Fell English', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '0.7rem',
            color: 'var(--muted)',
            opacity: 0.5,
            marginTop: '0.3rem',
          }}>
            {storyMode ? 'Story Mode is on.' : 'Story Mode is off.'}
          </p>
        )}
      </div>

      <Toggle
        label="Memory Hints"
        description={isCompact ? undefined : 'After a choice, note who will remember it. Never shows numbers.'}
        checked={memoryHints}
        onChange={toggleMemoryHints}
        compact={isCompact}
      />

      <Toggle
        label="Auto-Advance"
        description={isCompact ? undefined : 'Lines move on by themselves after a reading pause. Press A in a scene to toggle.'}
        checked={autoAdvance}
        onChange={toggleAutoAdvance}
        compact={isCompact}
      />

      <Toggle
        label="Ironman Mode"
        description={isCompact ? undefined : ironmanDescription}
        checked={ironmanMode}
        onChange={toggleIronmanMode}
        disabled={!isNewGame}
        compact={isCompact}
      />
      {!isNewGame && !isCompact && (
        <p style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '0.7rem',
          color: 'var(--muted)',
          opacity: 0.5,
          marginTop: '-0.3rem',
          marginBottom: '0.5rem',
        }}>
          {ironmanMode ? 'Ironman mode is currently active.' : 'Ironman mode is currently disabled.'}
        </p>
      )}
    </>
  )

  const returnToMenuButton = (
    <button
      onClick={handleReturnToMenu}
      style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '11px',
        letterSpacing: '2px',
        color: confirming ? '#c9a84c' : 'rgba(201,168,76,0.8)',
        background: 'transparent',
        border: confirming ? '1px solid #c9a84c' : '1px solid rgba(201,168,76,0.3)',
        padding: isCompact ? '7px 16px' : '10px 24px',
        marginTop: isCompact ? '0.6rem' : undefined,
        cursor: 'pointer',
        width: '100%',
        borderRadius: '2px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#c9a84c'
        e.currentTarget.style.color = '#c9a84c'
      }}
      onMouseLeave={e => {
        if (!confirming) {
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'
          e.currentTarget.style.color = 'rgba(201,168,76,0.8)'
        }
      }}
    >
      {confirming ? 'CONFIRM — PROGRESS WILL BE AUTOSAVED' : 'RETURN TO MAIN MENU'}
    </button>
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '2px',
          width: isCompact ? 'min(820px, calc(100vw - 24px))' : '480px',
          maxHeight: isCompact ? 'calc(100dvh - 16px)' : '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: barPadding,
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <span style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.68rem',
            letterSpacing: '0.18em',
            color: 'var(--amber-dim)',
            textTransform: 'uppercase',
          }}>
            ▸ Settings
          </span>
          <button
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontFamily: "'Special Elite', monospace",
              fontSize: '1rem',
              padding: '0',
              lineHeight: 1,
              flexShrink: 0,
              ...(isCompact ? {
                minWidth: 40,
                minHeight: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                marginRight: '-0.5rem',
              } : {}),
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: bodyPadding,
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--amber-dim) transparent',
          }}
        >
          {isCompact ? (
            <div
              data-testid="settings-columns"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: '1.75rem',
                alignItems: 'start',
              }}
            >
              <div>
                {audioSection}
                <div style={{ marginTop: '0.6rem' }}>{gameSection}</div>
              </div>
              <div>
                {accessibilitySection}
                {returnToMenuButton}
              </div>
            </div>
          ) : (
            <>
              {audioSection}
              {sectionDivider}
              {accessibilitySection}
              {sectionDivider}
              {gameSection}
              {sectionDivider}

              {/* ── Info ───────────────────────────────────────────────────────── */}
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.55rem',
                color: 'var(--muted)',
                letterSpacing: '0.06em',
                lineHeight: 1.5,
              }}>
                All audio is synthesized in real-time using the Web Audio API.
                No audio files are downloaded. Ambient sounds include a ticking clock,
                muffled city ambience, and a sparse piano in personal scenes.
                UI sounds include typewriter clicks, paper shuffles, and confirmation tones.
                Music is streamed from MP3 tracks composed for each scene type.
              </p>

              <div style={{
                height: '1px',
                background: 'rgba(201,168,76,0.15)',
                margin: '24px 0 20px',
              }} />

              {returnToMenuButton}
            </>
          )}
        </div>

        {/* Footer: desktop only. Compact drops it; the header ✕ closes the panel. */}
        {!isCompact && (
          <div
            style={{
              padding: barPadding,
              borderTop: '1px solid var(--border)',
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            <button
              className="choice-btn"
              onClick={() => setSettingsOpen(false)}
              style={{
                width: 'auto',
                minWidth: '140px',
                display: 'inline-flex',
                justifyContent: 'center',
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
