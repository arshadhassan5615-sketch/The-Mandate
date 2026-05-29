import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { CHARACTERS } from '../../data/characters/roster'

const PLACEHOLDER = `── Week 1 ──
▸ Inauguration
- Must decide on BNI early
- Vyktor seems to know more than he says
- Watch Kolvar — he's already counting votes

▸ First Briefing
- Deficit is 65M VK — worse than campaign intel
- Tyvaren troop movements near Gravenmark
- VYKTOR: 'Some of those BNI operations are producing actionable intelligence'

── Week 2 ──
▸ Cabinet Appointments
- Vostane vs Marić — can't please both
- Remember: Church controls 30% of rural schools`

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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

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
    currentScene?.narrativeSegments?.some(s =>
      s.type === 'dialogue' && s.character === c.id,
    ) ||
    currentScene?.sceneCharacters?.includes(c.id),
  )

  return (
    <div style={{
      position: 'fixed', right: '60px', top: '50px', zIndex: 170,
      width: '360px', height: 'calc(100vh - 120px)',
      background: '#f0e6d0',
      border: '1px solid rgba(139,106,40,0.3)',
      borderRight: 'none',
      boxShadow: '-4px 6px 32px rgba(0,0,0,0.55)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Caveat', 'Comic Sans MS', cursive",
      color: '#1a1a3a',
    }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px 8px',
        borderBottom: '1px solid rgba(139,106,40,0.15)',
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Caveat', cursive", fontSize: '1.4rem', fontWeight: 600,
            color: '#2a2a4a', margin: 0, lineHeight: 1,
          }}>
            Personal Notes
          </h2>
          <span style={{
            fontFamily: "'Caveat', cursive", fontSize: '0.75rem', color: '#8a7060',
            fontStyle: 'italic',
          }}>
            Private — Not for official record
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#8a7060',
          cursor: 'pointer', fontSize: '1rem', padding: '2px 6px', lineHeight: 1,
        }}>✕</button>
      </div>

      {/* ── Smart hint ──────────────────────────────── */}
      {currentScene?.title && (
        <div style={{
          padding: '6px 16px', flexShrink: 0,
          borderBottom: '1px solid rgba(139,106,40,0.08)',
          background: 'rgba(139,106,40,0.04)',
        }}>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: '0.75rem', color: '#6a5a4a' }}>
            Currently in: <strong>{currentScene.title}</strong>
            {sceneChars.length > 0 && (
              <> · Present: {sceneChars.map(c => c.name).join(', ')}</>
            )}
          </span>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '6px 12px', flexShrink: 0,
        borderBottom: '1px solid rgba(139,106,40,0.1)',
        position: 'relative',
      }}>
        <ToolbarButton label="Wk" title="Insert week divider" onClick={handleWeekStamp} />
        <ToolbarButton label="Sc" title="Insert scene title" onClick={handleSceneStamp} />
        <div style={{ position: 'relative' }}>
          <ToolbarButton label="Ch" title="Insert character name" onClick={() => setShowCharDropdown(p => !p)} />
          {showCharDropdown && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: '2px',
              background: '#f5f0e8', border: '1px solid rgba(139,106,40,0.25)',
              borderRadius: '2px', maxHeight: '150px', overflowY: 'auto',
              minWidth: '140px', zIndex: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}>
              {sceneChars.length > 0 ? sceneChars.map(c => (
                <button key={c.id} onClick={() => handleCharStamp(c.name)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Caveat', cursive", fontSize: '0.85rem',
                  color: '#2a2a4a', padding: '3px 10px',
                  borderBottom: '1px solid rgba(139,106,40,0.08)',
                }}>
                  {c.name}
                </button>
              )) : (
                <div style={{
                  padding: '6px 10px', fontFamily: "'Caveat', cursive",
                  fontSize: '0.8rem', color: '#8a7060',
                }}>
                  No characters in current scene
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: '0.75rem', color: '#8a7060',
        }}>
          {wordCount} word{wordCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Textarea body ───────────────────────────── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
      }}>
        {/* Ruled lines background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(139,106,40,0.12) 27px, rgba(139,106,40,0.12) 28px)',
        }} />
        {/* Red margin line */}
        <div style={{
          position: 'absolute', left: '28px', top: 0, bottom: 0,
          width: '1px', background: 'rgba(200,80,60,0.3)', zIndex: 0,
          pointerEvents: 'none',
        }} />

        <textarea
          ref={textareaRef}
          value={localText}
          onChange={handleChange}
          placeholder={isFirstOpen ? PLACEHOLDER : 'Start typing...'}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', height: '100%',
            background: 'transparent',
            border: 'none', outline: 'none', resize: 'none',
            fontFamily: "'Caveat', cursive",
            fontSize: '16px', lineHeight: '28px',
            color: '#1a1a3a',
            padding: '10px 16px 10px 36px',
            cursor: 'crosshair',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139,106,40,0.2) transparent',
          }}
        />
      </div>

      {/* ── Bottom bar ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 12px', flexShrink: 0,
        borderTop: '1px solid rgba(139,106,40,0.15)',
      }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: '0.7rem', color: '#8a7060',
        }}>
          {localText.length} / 50000 chars
        </span>
        {showConfirmClear ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '0.7rem', color: '#8a2020' }}>
              Are you sure?
            </span>
            <button onClick={handleClear} style={{
              background: '#8a2020', border: 'none', color: '#f0e6d0',
              cursor: 'pointer', fontFamily: "'Caveat', cursive", fontSize: '0.7rem',
              padding: '2px 8px', borderRadius: '2px',
            }}>
              Yes
            </button>
            <button onClick={() => setShowConfirmClear(false)} style={{
              background: 'none', border: '1px solid rgba(139,106,40,0.3)',
              color: '#6a5a4a', cursor: 'pointer',
              fontFamily: "'Caveat', cursive", fontSize: '0.7rem',
              padding: '2px 8px', borderRadius: '2px',
            }}>
              No
            </button>
          </div>
        ) : (
          <button onClick={handleClear} style={{
            background: 'none', border: '1px solid rgba(139,106,40,0.2)',
            color: '#8a7060', cursor: 'pointer',
            fontFamily: "'Caveat', cursive", fontSize: '0.75rem',
            padding: '2px 10px', borderRadius: '2px',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,80,60,0.4)'; e.currentTarget.style.color = '#8a2020' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,106,40,0.2)'; e.currentTarget.style.color = '#8a7060' }}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}

function ToolbarButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        fontFamily: "'Caveat', cursive", fontSize: '0.8rem', fontWeight: 600,
        color: '#5a4a3a', background: 'rgba(139,106,40,0.08)',
        border: '1px solid rgba(139,106,40,0.2)',
        borderRadius: '2px', padding: '2px 8px', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,106,40,0.2)'; e.currentTarget.style.borderColor = 'rgba(139,106,40,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,106,40,0.08)'; e.currentTarget.style.borderColor = 'rgba(139,106,40,0.2)' }}
    >
      {label}
    </button>
  )
}
