import { useSettingsStore, TEXT_SPEED_MS } from '../stores/settingsStore'
import { useWeekStore } from '../stores/weekStore'
import type { TextSpeed, FontSize } from '../stores/settingsStore'

function Slider({ label, value, onChange, min = 0, max = 100 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.65rem',
          color: 'var(--muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.62rem',
          color: 'var(--amber)',
          letterSpacing: '0.08em',
        }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="budget-slider"
        style={{ width: '100%' }}
      />
    </div>
  )
}

function Toggle({ label, description, checked, onChange, disabled }: {
  label: string; description?: string; checked: boolean; onChange: () => void; disabled?: boolean
}) {
  const opacity = disabled ? 0.4 : 1
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.7rem 0',
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

function SegmentedPicker<T extends string>({ label, options, value, onChange }: {
  label: string; options: readonly T[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
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
    textSpeed, highContrast, fontSize, ironmanMode,
    setMasterVolume, setAmbientVolume, setUiVolume, setMusicVolume, toggleMute,
    setTextSpeed, toggleHighContrast, setFontSize, toggleIronmanMode,
    settingsOpen, setSettingsOpen,
  } = useSettingsStore()
  const phase = useWeekStore(s => s.phase)
  const isNewGame = phase === 'title'

  if (!settingsOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
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
          width: '480px',
          maxHeight: '85vh',
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
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
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
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontFamily: "'Special Elite', monospace",
              fontSize: '1rem',
              padding: '0',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--amber-dim) transparent',
          }}
        >
          {/* ── Audio ──────────────────────────────────────────────────────── */}
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.22em',
            color: 'var(--amber)',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            ▸ Audio
          </p>

          <Slider label="Master Volume" value={masterVolume} onChange={setMasterVolume} />
          <Slider label="Music Volume" value={musicVolume} onChange={setMusicVolume} />
          <Slider label="Ambient Volume" value={ambientVolume} onChange={setAmbientVolume} />
          <Slider label="UI Sound Volume" value={uiVolume} onChange={setUiVolume} />

          <Toggle
            label="Mute All Audio"
            checked={masterMuted}
            onChange={toggleMute}
          />

          <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }} />

          {/* ── Accessibility ──────────────────────────────────────────────── */}
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.22em',
            color: 'var(--amber)',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            ▸ Accessibility
          </p>

          <SegmentedPicker
            label="Text Speed"
            options={['slow', 'medium', 'fast', 'instant'] as const}
            value={textSpeed}
            onChange={setTextSpeed}
          />

          <SegmentedPicker
            label="Font Size"
            options={['normal', 'large', 'xlarge'] as const}
            value={fontSize}
            onChange={setFontSize}
          />

          <Toggle
            label="High Contrast Mode"
            description="Increases contrast ratios and adds focus indicators"
            checked={highContrast}
            onChange={toggleHighContrast}
          />

          <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }} />

          {/* ── Game ──────────────────────────────────────────────────────────── */}
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.22em',
            color: 'var(--amber)',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            ▸ Game
          </p>

          <Toggle
            label="Ironman Mode"
            description={isNewGame
              ? 'No manual saves. Your decisions are final. Autosave only.'
              : 'Ironman mode can only be toggled from the main menu before starting a new game.'
            }
            checked={ironmanMode}
            onChange={toggleIronmanMode}
            disabled={!isNewGame}
          />
          {!isNewGame && (
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

          <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }} />

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
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            textAlign: 'right',
          }}
        >
          <button
            className="choice-btn"
            onClick={() => setSettingsOpen(false)}
            style={{ width: 'auto', minWidth: '140px', display: 'inline-flex', justifyContent: 'center' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
