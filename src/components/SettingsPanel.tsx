import { useState } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useWeekStore } from '../stores/weekStore'
import { saveGame } from '../engine/SaveManager'
import { useGameStore } from '../stores/gameStore'
import { usePageInsets } from '../hooks/usePageInsets'
import { rem } from '../constants/typography'
import CabinetWindow from './ui/cabinet/CabinetWindow'
import { CabinetButton } from './ui/cabinet/CabinetParts'
import { CAB_BODY, CAB_FONT, CAB_PILL_GROUP, cabPillSegment } from './ui/cabinet/cabinetStyles'
import { PaperTabButton } from './panels/PaperPanel'

type SettingsTab = 'audio' | 'display' | 'game'

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'audio', label: 'Audio' },
  { id: 'display', label: 'Display & Accessibility' },
  { id: 'game', label: 'Game' },
]

const SETTINGS_COLUMNS_ID = 'settings-columns'
const SLIDER_TRACK_WIDTH = 230
const SLIDER_CONTROL_WIDTH = 300
const ROW_BORDER = '1px solid rgba(201,168,76,0.14)'

const ROW_DESKTOP: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `1fr ${SLIDER_CONTROL_WIDTH}px`,
  alignItems: 'center',
  gap: 24,
  padding: '13px 0',
  borderBottom: ROW_BORDER,
}

const ROW_DENSE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  alignItems: 'start',
  gap: 6,
  padding: '9px 0',
  borderBottom: ROW_BORDER,
}

const NAME_STYLE: CSSProperties = {
  fontFamily: CAB_FONT.title,
  fontWeight: 700,
  fontSize: rem(16),
  lineHeight: 1.3,
  color: 'var(--cab-title)',
}

const DESCRIPTION_STYLE: CSSProperties = {
  ...CAB_BODY,
  fontStyle: 'italic',
  fontSize: rem(13.5),
  lineHeight: 1.35,
  color: 'var(--cab-muted)',
  margin: '3px 0 0',
}

const NOTE_STYLE: CSSProperties = { ...DESCRIPTION_STYLE, margin: '4px 0 0' }

const AUDIO_NOTE_STYLE: CSSProperties = {
  ...CAB_BODY,
  fontSize: rem(12.5),
  fontStyle: 'italic',
  color: 'var(--cab-muted)',
  margin: '10px 0 0',
  lineHeight: 1.5,
}

const VALUE_STYLE: CSSProperties = {
  fontFamily: CAB_FONT.title,
  fontWeight: 700,
  fontSize: rem(15),
  lineHeight: 1,
  color: 'var(--cab-title)',
  width: 44,
  textAlign: 'right',
  flexShrink: 0,
}

const SWITCH_STATE_STYLE: CSSProperties = {
  width: 30,
  fontFamily: CAB_FONT.label,
  fontWeight: 500,
  fontSize: rem(10),
  letterSpacing: '0.14em',
}

function Slider({ label, value, onChange, dense, min = 0, max = 100 }: {
  label: string; value: number; onChange: (v: number) => void; dense: boolean; min?: number; max?: number
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: dense ? '100%' : SLIDER_CONTROL_WIDTH }}>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="budget-slider"
        style={{
          flex: dense ? '1 1 auto' : `0 0 ${SLIDER_TRACK_WIDTH}px`,
          accentColor: 'var(--cab-gold)',
          background: `linear-gradient(90deg, var(--cab-gold) ${pct}%, #3a3020 ${pct}%)`,
          height: 3,
          borderRadius: 2,
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      />
      <span style={VALUE_STYLE}>{value}%</span>
    </div>
  )
}

function Toggle({ label, checked, onChange, disabled }: {
  label: string; checked: boolean; onChange: () => void; disabled?: boolean
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.repeat) return
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.key === ' ') e.preventDefault()
      onChange()
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: disabled ? 0.45 : 1 }}>
      <div
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onChange}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          boxSizing: 'border-box',
          width: 46,
          height: 24,
          borderRadius: 12,
          flexShrink: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          background: checked ? 'linear-gradient(#3a2e16,#241c0e)' : '#2a2318',
          border: `1px solid ${checked ? 'var(--cab-gold)' : 'rgba(201,168,76,0.4)'}`,
          transition: 'background 0.15s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 25 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: checked
              ? 'radial-gradient(circle at 40% 35%, #f3dfa8, #b58a32 70%)'
              : '#6b5a3a',
            transition: 'left .15s',
          }}
        />
      </div>
      <span style={{ ...SWITCH_STATE_STYLE, color: checked ? 'var(--cab-gold-bright)' : 'var(--cab-muted)' }}>
        {checked ? 'On' : 'Off'}
      </span>
    </div>
  )
}

function SegmentedPicker<T extends string>({ options, value, onChange }: {
  options: readonly T[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div style={CAB_PILL_GROUP}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          className="cabinet-pill-seg"
          onClick={() => onChange(opt)}
          style={{ ...cabPillSegment(value === opt), fontSize: rem(10), padding: '4px 10px' }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

interface SettingRowProps {
  name: ReactNode
  description?: string
  note?: string
  dense: boolean
  /** Clicking the name runs this (used by toggles so the label works as before). */
  onNameClick?: () => void
  children?: ReactNode
}

/** One setting: name and description on the left, its control on the right (stacked when dense). */
function SettingRow({ name, description, note, dense, onNameClick, children }: SettingRowProps) {
  return (
    <div data-testid="settings-row" style={dense ? ROW_DENSE : ROW_DESKTOP}>
      <div
        onClick={onNameClick ? () => onNameClick() : undefined}
        style={{ minWidth: 0, cursor: onNameClick ? 'pointer' : undefined }}
      >
        <div style={NAME_STYLE}>{name}</div>
        {description && <p style={DESCRIPTION_STYLE}>{description}</p>}
        {note && <p style={NOTE_STYLE}>{note}</p>}
      </div>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: dense ? 'flex-start' : 'flex-end', minWidth: 0 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function SettingsPanel() {
  const {
    masterVolume, ambientVolume, uiVolume, musicVolume, masterMuted,
    textSpeed, highContrast, fontSize, ironmanMode, storyMode, memoryHints, autoAdvance,
    setMasterVolume, setAmbientVolume, setUiVolume, setMusicVolume, toggleMute,
    setTextSpeed, toggleHighContrast, setFontSize, toggleIronmanMode, toggleStoryMode, toggleMemoryHints, toggleAutoAdvance,
    restoreDefaults, settingsOpen, setSettingsOpen,
  } = useSettingsStore()
  const phase = useWeekStore(s => s.phase)
  const transitionLabel = useWeekStore(s => s.transitionLabel)
  const isNewGame = phase === 'title'
  const [confirming, setConfirming] = useState(false)
  const [tab, setTab] = useState<SettingsTab>('audio')
  const { mode, isCompact } = usePageInsets()
  const dense = mode !== 'desktop'

  const closePanel = () => setSettingsOpen(false)

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

  const audioRows = (
    <>
      <SettingRow name="Master Volume" dense={dense}>
        <Slider label="Master Volume" value={masterVolume} onChange={setMasterVolume} dense={dense} />
      </SettingRow>
      <SettingRow name="Music Volume" dense={dense}>
        <Slider label="Music Volume" value={musicVolume} onChange={setMusicVolume} dense={dense} />
      </SettingRow>
      <SettingRow name="Ambient Volume" dense={dense}>
        <Slider label="Ambient Volume" value={ambientVolume} onChange={setAmbientVolume} dense={dense} />
      </SettingRow>
      <SettingRow name="UI Sound Volume" dense={dense}>
        <Slider label="UI Sound Volume" value={uiVolume} onChange={setUiVolume} dense={dense} />
      </SettingRow>
      <SettingRow name="Mute All Audio" dense={dense} onNameClick={() => toggleMute()}>
        <Toggle label="Mute All Audio" checked={masterMuted} onChange={toggleMute} />
      </SettingRow>

      {!isCompact && (
        <p style={AUDIO_NOTE_STYLE}>
          All audio is synthesized in real-time using the Web Audio API.
          No audio files are downloaded. Ambient sounds include a ticking clock,
          muffled city ambience, and a sparse piano in personal scenes.
          UI sounds include typewriter clicks, paper shuffles, and confirmation tones.
          Music is streamed from MP3 tracks composed for each scene type.
        </p>
      )}
    </>
  )

  const displayRows = (
    <>
      <SettingRow name="Text Speed" dense={dense}>
        <SegmentedPicker
          options={['slow', 'medium', 'fast', 'instant'] as const}
          value={textSpeed}
          onChange={setTextSpeed}
        />
      </SettingRow>

      <SettingRow name="Font Size" dense={dense}>
        <SegmentedPicker
          options={['normal', 'large', 'xlarge'] as const}
          value={fontSize}
          onChange={setFontSize}
        />
      </SettingRow>

      <SettingRow
        name="High Contrast Mode"
        description={isCompact ? undefined : 'Increases contrast ratios and adds focus indicators'}
        dense={dense}
        onNameClick={() => toggleHighContrast()}
      >
        <Toggle label="High Contrast Mode" checked={highContrast} onChange={toggleHighContrast} />
      </SettingRow>
    </>
  )

  const gameRows = (
    <>
      <SettingRow
        name={(
          <label
            htmlFor="story-mode-checkbox"
            title={isCompact ? storyModeDescription : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
          >
            <input
              id="story-mode-checkbox"
              type="checkbox"
              checked={storyMode}
              onChange={toggleStoryMode}
              style={{ accentColor: 'var(--cab-gold)' }}
            />
            Story Mode
          </label>
        )}
        description={isCompact ? undefined : storyModeDescription}
        note={isCompact ? undefined : (storyMode ? 'Story Mode is on.' : 'Story Mode is off.')}
        dense={dense}
      />

      <SettingRow
        name="Memory Hints"
        description={isCompact ? undefined : 'After a choice, note who will remember it. Never shows numbers.'}
        dense={dense}
        onNameClick={() => toggleMemoryHints()}
      >
        <Toggle label="Memory Hints" checked={memoryHints} onChange={toggleMemoryHints} />
      </SettingRow>

      <SettingRow
        name="Auto-Advance"
        description={isCompact ? undefined : 'Lines move on by themselves after a reading pause. Press A in a scene to toggle.'}
        dense={dense}
        onNameClick={() => toggleAutoAdvance()}
      >
        <Toggle label="Auto-Advance" checked={autoAdvance} onChange={toggleAutoAdvance} />
      </SettingRow>

      <SettingRow
        name="Ironman Mode"
        description={isCompact ? undefined : ironmanDescription}
        note={!isNewGame && !isCompact
          ? (ironmanMode ? 'Ironman mode is currently active.' : 'Ironman mode is currently disabled.')
          : undefined}
        dense={dense}
        onNameClick={isNewGame ? () => toggleIronmanMode() : undefined}
      >
        <Toggle label="Ironman Mode" checked={ironmanMode} onChange={toggleIronmanMode} disabled={!isNewGame} />
      </SettingRow>
    </>
  )

  const tabRows = tab === 'audio' ? audioRows : tab === 'display' ? displayRows : gameRows

  const tabButtons = SETTINGS_TABS.map(({ id, label }) => (
    <PaperTabButton
      key={id}
      id={`settings-tab-${id}`}
      controls={SETTINGS_COLUMNS_ID}
      label={label}
      active={tab === id}
      onSelect={() => setTab(id)}
    />
  ))

  return (
    <CabinetWindow
      testId="settings-panel"
      titleId="settings-title"
      title="Settings"
      overline="Chancellery"
      closeLabel="Close settings"
      onClose={closePanel}
      tabs={tabButtons}
      tabsLabel="Settings sections"
      footerStart={(
        <CabinetButton variant="secondary" size={isCompact ? 'small' : 'regular'} onClick={restoreDefaults}>
          Restore defaults
        </CabinetButton>
      )}
      footerEnd={(
        <>
          <CabinetButton onClick={handleReturnToMenu}>
            {confirming ? 'CONFIRM — PROGRESS WILL BE AUTOSAVED' : 'RETURN TO MAIN MENU'}
          </CabinetButton>
          {/* Compact drops the bottom Close: the window's header ✕ closes the panel. */}
          {!isCompact && (
            <CabinetButton variant="primary" onClick={closePanel}>
              Close
            </CabinetButton>
          )}
        </>
      )}
    >
      <div
        id={SETTINGS_COLUMNS_ID}
        data-testid={SETTINGS_COLUMNS_ID}
        role="tabpanel"
        aria-labelledby={`settings-tab-${tab}`}
      >
        {tabRows}
      </div>
    </CabinetWindow>
  )
}
