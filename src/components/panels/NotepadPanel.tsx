import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { CHARACTERS } from '../../data/characters/roster'
import { rem } from '../../constants/typography'
import CabinetDrawer from '../ui/cabinet/CabinetDrawer'
import { CabinetButton } from '../ui/cabinet/CabinetParts'
import { CAB_BODY, CAB_FONT, CAB_LABEL, cabPillSegment } from '../ui/cabinet/cabinetStyles'

const PLACEHOLDER = `── Week 1 ──
▸ Inauguration
- Must decide on BNI early
- Vyktor seems to know more than he says
- Watch Kolvar — he's already counting votes

▸ First Briefing
- Deficit is 65M ₭ — worse than campaign intel
- Tyvaren troop movements near Gravenmark
- VYKTOR: 'Some of those BNI operations are producing actionable intelligence'

── Week 2 ──
▸ Cabinet Appointments
- Vostane vs Marić — can't please both
- Remember: Church controls 30% of rural schools`

const NOTES_CHAR_LIMIT = 50000
const NOTES_WIDTH = 'min(560px, calc(100vw - 220px))'
const NOTES_FONT = "'Caveat', cursive"
// The one deliberate paper surface in the drawer: ivory notepad sheet.
const NOTEPAD_SHEET_BACKGROUND = '#ece6d3'
// Ruled lines live on the textarea so they scroll with the text.
const NOTEPAD_RULED_BACKGROUND =
  'repeating-linear-gradient(transparent 0 27px, rgba(43,74,111,0.18) 27px 28px)'
const NOTEPAD_MARGIN_LINE_LEFT = 34
const TOOLBAR_PILL_STYLE: CSSProperties = {
  ...cabPillSegment(false),
  fontSize: rem(10),
  padding: '3px 10px',
  border: '1px solid rgba(201,168,76,0.3)',
}
const DROPDOWN_ITEM_STYLE: CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: CAB_FONT.body, fontSize: rem(13),
  color: '#e9dfc5', padding: '5px 12px',
  borderBottom: '1px solid rgba(201,168,76,0.12)',
}

interface NotepadPanelProps {
  onClose: () => void
  quickStampScene?: boolean
}

export default function NotepadPanel({ onClose, quickStampScene }: NotepadPanelProps) {
  const notes = useGameStore(s => s.personalNotes)
  const setPersonalNotes = useGameStore(s => s.setPersonalNotes)
  const currentWeek = useGameStore(s => s.currentWeek)
  const currentScene = useNarrativeStore(s => s.currentScene)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [localText, setLocalText] = useState(notes)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showCharDropdown, setShowCharDropdown] = useState(false)

  useEffect(() => {
    setLocalText(notes)
  }, [notes])

  // Quick-stamp scene title on open if requested
  useEffect(() => {
    if (quickStampScene && currentScene?.title && !notes) {
      const stamp = `▸ ${currentScene.title}\n`
      const updated = stamp
      setLocalText(updated)
      setPersonalNotes(updated)
    }
  }, [quickStampScene, currentScene, notes, setPersonalNotes])

  // Debounced auto-save
  const saveNotes = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPersonalNotes(text)
    }, 2000)
  }, [setPersonalNotes])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setLocalText(text)
    saveNotes(text)
  }

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current
    if (!ta) {
      setLocalText(prev => prev + text)
      saveNotes(localText + text)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = localText.slice(0, start)
    const after = localText.slice(end)
    const updated = before + text + after
    setLocalText(updated)
    saveNotes(updated)
    // Set cursor position after insert
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + text.length
    }, 0)
  }

  const handleWeekStamp = () => insertAtCursor(`── Week ${currentWeek} ──\n`)
  const handleSceneStamp = () => {
    if (currentScene?.title) insertAtCursor(`▸ ${currentScene.title}\n`)
  }
  const handleCharStamp = (name: string) => {
    insertAtCursor(`${name}: `)
    setShowCharDropdown(false)
  }

  const handleClear = () => {
    if (!showConfirmClear) {
      setShowConfirmClear(true)
      return
    }
    setLocalText('')
    setPersonalNotes('')
    setShowConfirmClear(false)
  }

  const wordCount = localText.trim() ? localText.trim().split(/\s+/).filter(Boolean).length : 0
  const isFirstOpen = notes === ''
  const sceneChars = CHARACTERS.filter(c =>
    currentScene?.narrative?.some(s =>
      s.type === 'dialogue' && s.character === c.id,
    ) ||
    currentScene?.characters?.includes(c.id),
  )

  return (
    <CabinetDrawer
      testId="notepad-panel"
      titleId="notepad-title"
      title="Personal Notes"
      overline="Private — not for the record"
      closeLabel="Close notes"
      onClose={onClose}
      width={NOTES_WIDTH}
      footer={`${localText.length} / ${NOTES_CHAR_LIMIT} chars`}
    >
      {/* ── Smart hint ──────────────────────────────── */}
      {currentScene?.title && (
        <p style={{ ...CAB_BODY, fontSize: rem(13), color: 'var(--cab-muted)', margin: '0 20px 8px', textAlign: 'center' }}>
          Currently in: <strong>{currentScene.title}</strong>
          {sceneChars.length > 0 && (
            <> · Present: {sceneChars.map(c => c.name).join(', ')}</>
          )}
        </p>
      )}

      {/* ── Toolbar ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1 }}>
          <ToolbarButton label="Wk" title="Insert week divider" onClick={handleWeekStamp} />
          <ToolbarButton label="Sc" title="Insert scene title" onClick={handleSceneStamp} />
          <div style={{ position: 'relative' }}>
            <ToolbarButton label="Ch" title="Insert character name" onClick={() => setShowCharDropdown(p => !p)} />
            {showCharDropdown && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                background: 'var(--cab-panel)', border: '1px solid rgba(201,168,76,0.45)',
                borderRadius: 4, maxHeight: 150, overflowY: 'auto',
                minWidth: 140, zIndex: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
              }}>
                {sceneChars.length > 0 ? sceneChars.map(c => (
                  <button key={c.id} onClick={() => handleCharStamp(c.name)} style={DROPDOWN_ITEM_STYLE}>
                    {c.name}
                  </button>
                )) : (
                  <div style={{ padding: '6px 12px', fontFamily: CAB_FONT.body, fontSize: rem(13), color: 'var(--cab-muted)' }}>
                    No characters in current scene
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <span style={{ ...CAB_LABEL, fontSize: rem(10), whiteSpace: 'nowrap' }}>
          {wordCount} word{wordCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Notepad sheet ───────────────────────────── */}
      <div style={{
        position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
        margin: '0 18px 12px', background: NOTEPAD_SHEET_BACKGROUND,
        borderRadius: 2, boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
      }}>
        {/* Red margin line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: NOTEPAD_MARGIN_LINE_LEFT, top: 0, bottom: 0,
          width: 1, background: 'rgba(160,60,60,0.45)', pointerEvents: 'none',
        }} />

        <textarea
          ref={textareaRef}
          value={localText}
          onChange={handleChange}
          placeholder={isFirstOpen ? PLACEHOLDER : 'Start typing...'}
          style={{
            position: 'relative', flex: 1, minHeight: 0, width: '100%', boxSizing: 'border-box',
            background: NOTEPAD_RULED_BACKGROUND,
            backgroundAttachment: 'local',
            border: 'none', outline: 'none', resize: 'none',
            fontFamily: NOTES_FONT,
            fontSize: rem(16), lineHeight: '28px',
            color: '#2b2b3a',
            padding: '0 14px 6px 44px',
            cursor: 'crosshair',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139,106,40,0.2) transparent',
          }}
        />
      </div>

      {/* ── Clear row ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, margin: '0 18px 16px' }}>
        {showConfirmClear ? (
          <>
            <span style={{ ...CAB_LABEL, fontSize: rem(10), color: '#d0584a' }}>
              Are you sure?
            </span>
            <CabinetButton variant="primary" onClick={handleClear} style={CLEAR_BUTTON_STYLE}>
              Yes
            </CabinetButton>
            <CabinetButton variant="secondary" onClick={() => setShowConfirmClear(false)} style={CLEAR_BUTTON_STYLE}>
              No
            </CabinetButton>
          </>
        ) : (
          <CabinetButton variant="secondary" onClick={handleClear} style={CLEAR_BUTTON_STYLE}>
            Clear All
          </CabinetButton>
        )}
      </div>
    </CabinetDrawer>
  )
}

const CLEAR_BUTTON_STYLE: CSSProperties = { fontSize: rem(10), padding: '5px 14px' }

function ToolbarButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="cabinet-pill-seg"
      onClick={onClick}
      title={title}
      style={TOOLBAR_PILL_STYLE}
    >
      {label}
    </button>
  )
}
