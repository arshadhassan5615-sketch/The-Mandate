import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { CHARACTERS } from '../../data/characters/roster'
import { rem } from '../../constants/typography'
import { Z } from '../../constants/zIndex'
import { usePageInsets } from '../../hooks/usePageInsets'
import { MedallionClose } from '../ui/cabinet/CabinetParts'
import { useFocusOnOpen, useEscapeToClose } from '../ui/cabinet/panelBehaviour'
import veltriaSeal from '../../assets/images/veltria_seal.png'
import {
  INK, HAND_STYLE, LEATHER_BACKGROUND, paperBackground, sortedNoteWeeks, adjacentNoteWeek,
} from './journalPaper'
import {
  InkHeading, InkTextButton, PagerButton, MeetingsContent, PageTab,
} from './journalBook'

const NOTES_CHAR_LIMIT = 50000
const BOOK_WIDTH = 'min(940px, calc(100vw - 24px))'
const BOOK_HEIGHT = 'min(580px, calc(100vh - 70px))'
const DROPDOWN_ITEM_STYLE: CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: "'La Belle Aurore', cursive", fontSize: rem(15),
  color: INK, padding: '4px 12px',
  borderBottom: '1px solid rgba(58,42,26,0.15)',
}
const TEAR_TEXT_STYLE: CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: "'Cinzel', Georgia, serif", fontWeight: 500,
  fontSize: rem(11), letterSpacing: '.14em', color: '#b7a882', whiteSpace: 'nowrap',
}
const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: 'absolute', width: 1, height: 1, margin: -1, padding: 0,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}
const SEAL_STYLE: CSSProperties = {
  position: 'absolute', right: 30, bottom: 30, width: 110, height: 'auto',
  mixBlendMode: 'multiply', opacity: 0.3, filter: 'sepia(1) contrast(0.9)',
  transform: 'rotate(-6deg)', pointerEvents: 'none',
}

interface NotepadPanelProps {
  onClose: () => void
  quickStampScene?: boolean
}

export default function NotepadPanel({ onClose, quickStampScene }: NotepadPanelProps) {
  const notes = useGameStore(s => s.personalNotes)
  const setPersonalNotes = useGameStore(s => s.setPersonalNotes)
  const currentWeek = useGameStore(s => s.currentWeek)
  const meetingNotes = useGameStore(s => s.meetingNotes)
  const currentScene = useNarrativeStore(s => s.currentScene)
  const { mode } = usePageInsets()
  const isPaged = mode !== 'desktop'

  const titleRef = useRef<HTMLHeadingElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const noteWeeks = sortedNoteWeeks(meetingNotes)
  const [shownWeek, setShownWeek] = useState<number>(() =>
    noteWeeks.length > 0 ? noteWeeks[noteWeeks.length - 1] : currentWeek,
  )
  const [pageTab, setPageTab] = useState<'meetings' | 'notes'>('meetings')
  const [localText, setLocalText] = useState(notes)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showCharDropdown, setShowCharDropdown] = useState(false)

  useFocusOnOpen([titleRef])
  useEscapeToClose(onClose)

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

  const handleBackdropMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const wordCount = localText.trim() ? localText.trim().split(/\s+/).filter(Boolean).length : 0
  const sceneChars = CHARACTERS.filter(c =>
    currentScene?.narrative?.some(s =>
      s.type === 'dialogue' && s.character === c.id,
    ) ||
    currentScene?.characters?.includes(c.id),
  )
  const previousWeek = adjacentNoteWeek(noteWeeks, shownWeek, -1)
  const nextWeek = adjacentNoteWeek(noteWeeks, shownWeek, 1)

  const showMeetingsPage = !isPaged || pageTab === 'meetings'
  const showNotesPage = !isPaged || pageTab === 'notes'
  const pageRadius = (side: 'left' | 'right'): string => {
    if (isPaged) return '4px'
    return side === 'left' ? '4px 0 0 4px' : '0 4px 4px 0'
  }

  return (
    <div
      className="anim-fade-in"
      data-testid="journal-backdrop"
      onMouseDown={handleBackdropMouseDown}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.modal,
        background: 'rgba(8,8,6,0.55)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}
    >
      {isPaged && (
        <div role="group" aria-label="Journal pages" style={{ display: 'flex', gap: 8 }}>
          <PageTab label="Meetings" isActive={pageTab === 'meetings'} onClick={() => setPageTab('meetings')} />
          <PageTab label="My notes" isActive={pageTab === 'notes'} onClick={() => setPageTab('notes')} />
        </div>
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-title"
        data-testid="notepad-panel"
        className="anim-pop-in"
        style={{
          position: 'relative', width: BOOK_WIDTH, height: BOOK_HEIGHT,
          borderRadius: 8, background: LEATHER_BACKGROUND, boxShadow: '0 30px 70px rgba(0,0,0,0.75)',
        }}
      >
        <h2 id="journal-title" ref={titleRef} tabIndex={-1} style={VISUALLY_HIDDEN_STYLE}>
          Katerin&apos;s Journal
        </h2>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 6, border: '1px dashed rgba(210,170,110,0.35)',
          borderRadius: 4, pointerEvents: 'none',
        }} />
        <MedallionClose
          label="Close journal"
          onClick={onClose}
          size={34}
          style={{ position: 'absolute', top: -14, right: -14, zIndex: 2 }}
        />

        <div style={{ position: 'absolute', top: 14, right: 14, bottom: 14, left: 14, display: 'flex' }}>
          {showMeetingsPage && (
            <section aria-label="Meetings" style={{
              position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
              padding: '34px 30px', overflow: 'hidden', color: INK,
              borderRadius: pageRadius('left'),
              background: paperBackground('right', [[18, 28, 62], [80, 72, 90], [64, 14, 40], [30, 88, 70]]),
            }}>
              <MeetingsContent week={shownWeek} notes={meetingNotes} />
              <img src={veltriaSeal} alt="" aria-hidden="true" style={SEAL_STYLE} />
            </section>
          )}

          {showNotesPage && (
            <section aria-label="My notes page" style={{
              position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
              padding: '34px 30px', overflow: 'hidden', color: INK,
              borderRadius: pageRadius('right'),
              background: paperBackground('left', [[22, 66, 66], [76, 20, 84], [46, 92, 52], [88, 56, 36]]),
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <InkHeading>My notes</InkHeading>
                <div style={{ position: 'relative', display: 'flex', gap: 10 }}>
                  <InkTextButton label="Wk" title="Insert week divider" onClick={handleWeekStamp} />
                  <InkTextButton label="Sc" title="Insert scene title" onClick={handleSceneStamp} />
                  <InkTextButton label="Ch" title="Insert character name" onClick={() => setShowCharDropdown(p => !p)} />
                  {showCharDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 6,
                      background: '#e9dcbc', border: '1px solid rgba(58,42,26,0.35)',
                      borderRadius: 2, maxHeight: 150, overflowY: 'auto',
                      minWidth: 150, zIndex: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                    }}>
                      {sceneChars.length > 0 ? sceneChars.map(c => (
                        <button key={c.id} type="button" onClick={() => handleCharStamp(c.name)} style={DROPDOWN_ITEM_STYLE}>
                          {c.name}
                        </button>
                      )) : (
                        <div style={{ padding: '4px 12px', ...HAND_STYLE, fontSize: rem(15) }}>
                          No characters in current scene
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {currentScene?.title && (
                <p style={{ ...HAND_STYLE, fontSize: rem(15), opacity: 0.75, margin: '6px 0 0' }}>
                  Currently in: {currentScene.title}
                  {sceneChars.length > 0 && <> · Present: {sceneChars.map(c => c.name).join(', ')}</>}
                </p>
              )}

              <textarea
                ref={textareaRef}
                aria-label="My notes"
                value={localText}
                onChange={handleChange}
                placeholder="Start typing..."
                style={{
                  flex: 1, minHeight: 0, width: '100%', boxSizing: 'border-box', margin: '10px 0 0',
                  background: 'transparent', border: 'none', outline: 'none', resize: 'none', padding: 0,
                  ...HAND_STYLE,
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(58,42,26,0.25) transparent',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <span style={{ fontFamily: "'La Belle Aurore', cursive", fontSize: rem(14), color: 'rgba(58,42,26,0.6)' }}>
                  {wordCount} word{wordCount !== 1 ? 's' : ''} · {localText.length} / {NOTES_CHAR_LIMIT}
                </span>
              </div>
            </section>
          )}

          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 30%, rgba(255,220,160,0.10), transparent 60%)' }} />
        </div>
      </div>

      <div style={{ position: 'relative', width: BOOK_WIDTH, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PagerButton
            glyph="◀"
            ariaLabel="Previous week"
            disabled={previousWeek === undefined}
            onClick={() => { if (previousWeek !== undefined) setShownWeek(previousWeek) }}
          />
          <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 500, fontSize: rem(11), color: '#cfc6b0', margin: '0 4px' }}>
            Week {shownWeek}
          </span>
          <PagerButton
            glyph="▶"
            ariaLabel="Next week"
            disabled={nextWeek === undefined}
            onClick={() => { if (nextWeek !== undefined) setShownWeek(nextWeek) }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          {showConfirmClear ? (
            <>
              <span style={{ ...TEAR_TEXT_STYLE, cursor: 'default' }}>Tear them out?</span>
              <button type="button" onClick={handleClear} style={TEAR_TEXT_STYLE}>Yes</button>
              <button type="button" onClick={() => setShowConfirmClear(false)} style={TEAR_TEXT_STYLE}>No</button>
            </>
          ) : (
            <button type="button" onClick={handleClear} style={TEAR_TEXT_STYLE}>Tear out my notes</button>
          )}
        </div>
      </div>
    </div>
  )
}
