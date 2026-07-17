import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import {
  saveGame, loadGame, deleteSave, listSaves,
  downloadSaveJson, triggerImportPicker, importSaveToSlot,
  checkLoadSafety,
  AUTOSAVE_SLOT, MANUAL_SLOT_COUNT,
} from '../engine/SaveManager'
import type { SaveRecord } from '../db/mandateDb'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatPlayTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Confirmation dialog ──────────────────────────────────────────────────────

interface ConfirmProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }}>
      <div style={{
        background: 'var(--paper-raised)',
        border: '1px solid var(--border)',
        padding: '2rem 2.5rem',
        maxWidth: '400px',
        width: '90%',
      }}>
        <p style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          color: 'var(--cream)',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          marginBottom: '1.5rem',
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="choice-btn" onClick={onConfirm} style={{ flex: 1 }}>
            Confirm
          </button>
          <button className="choice-btn" onClick={onCancel} style={{ flex: 1, opacity: 0.6 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Single save slot row ─────────────────────────────────────────────────────

interface SlotRowProps {
  slot: number
  record: SaveRecord | undefined
  ironman: boolean
  onAction: () => void  // refresh parent after any mutation
}

function SlotRow({ slot, record, ironman, onAction }: SlotRowProps) {
  const isAutosave = slot === AUTOSAVE_SLOT
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(record?.name ?? '')
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => void } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraftName(record?.name ?? '') }, [record?.name])
  useEffect(() => { if (editingName) inputRef.current?.focus() }, [editingName])

  const ask = (msg: string, fn: () => void) => setConfirm({ msg, fn })

  const handleSave = async () => {
    const doSave = async (name: string) => {
      try {
        if (import.meta.env.DEV) console.log('[SaveLoadMenu] Saving to slot:', slot, 'name:', name)
        await saveGame(slot, name)
        if (import.meta.env.DEV) console.log('[SaveLoadMenu] Save complete, refreshing list')
        setConfirm(null)
        onAction()
      } catch (e) {
        setConfirm(null)
        console.error('[SaveLoadMenu] Save failed for slot', slot, ':', e)
        setErrorMsg(`Save failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }

    if (record) {
      ask(`Overwrite "${record.name}"? This cannot be undone.`, () => {
        void doSave(draftName || `Slot ${slot}`)
      })
    } else {
      void doSave(`Slot ${slot}`)
    }
  }

  const handleLoad = () => {
    const safety = checkLoadSafety(record!)
    if (safety.safe) {
      // Forward or same-point load — proceed without friction
      sessionStorage.setItem('mandate-manual-load', '1')
      void loadGame(slot).then(() => {
        useSettingsStore.getState().setSaveMenuOpen(false)
      })
    } else {
      // Backward load — require explicit confirmation
      ask(
        `Loading this save will discard ${safety.weeksLost} week${safety.weeksLost === 1 ? '' : 's'} of progress made since this point. This cannot be undone.\n\nAre you certain you want to proceed?`,
        async () => {
          sessionStorage.setItem('mandate-manual-load', '1')
          await loadGame(slot)
          setConfirm(null)
          useSettingsStore.getState().setSaveMenuOpen(false)
        }
      )
    }
  }

  const handleDelete = () => {
    ask(`Delete "${record!.name}"? This cannot be undone.`, async () => {
      await deleteSave(slot)
      setConfirm(null)
      onAction()
    })
  }

  const handleExport = () => { downloadSaveJson(record!) }

  const slotLabel = isAutosave ? '◎ AUTO' : String(slot).padStart(2, '0')

  return (
    <>
      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={confirm.fn}
          onCancel={() => setConfirm(null)}
        />
      )}
      {errorMsg && (
        <div
          role="alert"
          onClick={() => setErrorMsg(null)}
          style={{
            position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999,
            background: '#7a1f1f', color: '#fff', padding: '0.75rem 1rem',
            border: '1px solid #c9a84c', borderRadius: '4px', cursor: 'pointer',
            maxWidth: '360px', fontFamily: "'Special Elite', monospace", fontSize: '0.8rem',
          }}
          title="Click to dismiss"
        >
          {errorMsg}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.7rem 1rem',
        borderBottom: '1px solid rgba(200,144,42,0.1)',
        background: isAutosave ? 'rgba(200,144,42,0.04)' : 'transparent',
        minHeight: '52px',
      }}>
        {/* Slot number */}
        <div style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.68rem',
          letterSpacing: '0.12em',
          color: isAutosave ? 'var(--amber)' : 'var(--amber-dim)',
          minWidth: '52px',
          flexShrink: 0,
        }}>
          {slotLabel}
        </div>

        {/* Save info / empty */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {record ? (
            <>
              {/* Editable name */}
              {editingName && !isAutosave ? (
                <input
                  ref={inputRef}
                  value={draftName}
                  maxLength={40}
                  onChange={e => setDraftName(e.target.value)}
                  onBlur={async () => {
                    setEditingName(false)
                    if (draftName.trim() && record && draftName.trim() !== record.name) {
                      try {
                        await saveGame(slot, draftName.trim())
                        onAction()
                      } catch (e) {
                        console.error('[Save] Rename failed:', e)
                        setErrorMsg(`Rename failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
                      }
                    }
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur() }}
                  style={{
                    background: 'rgba(200,144,42,0.08)',
                    border: '1px solid var(--amber-dim)',
                    color: 'var(--cream)',
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    padding: '0.2rem 0.4rem',
                    width: '200px',
                    outline: 'none',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    color: 'var(--cream)',
                    cursor: isAutosave ? 'default' : 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '220px',
                  }}
                  title={isAutosave ? undefined : 'Click to rename'}
                  onClick={() => { if (!isAutosave) setEditingName(true) }}
                >
                  {record.name}
                </div>
              )}
              {/* Meta line */}
              <div style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.55rem',
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                marginTop: '0.15rem',
                display: 'flex',
                gap: '0.8rem',
              }}>
                <span>WK {record.weekNumber} · ACT {record.actNumber}</span>
                <span>{formatPlayTime(record.playTimeMinutes)}</span>
                <span>{formatTimestamp(record.timestamp)}</span>
              </div>
            </>
          ) : (
            <span style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              color: 'rgba(107,96,80,0.4)',
              textTransform: 'uppercase',
            }}>
              — Empty —
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {/* Save — hidden in ironman + autosave slot */}
          {!isAutosave && !ironman && (
            <ActionBtn label="Save" onClick={handleSave} />
          )}
          {/* Load */}
          {record && (
            <ActionBtn label="Load" onClick={handleLoad} accent />
          )}
          {/* Delete */}
          {record && !isAutosave && !ironman && (
            <ActionBtn label="Del" onClick={handleDelete} danger />
          )}
          {/* Export */}
          {record && (
            <ActionBtn label="Export" onClick={handleExport} />
          )}
        </div>
      </div>
    </>
  )
}

function ActionBtn({
  label, onClick, accent, danger,
}: {
  label: string; onClick: () => void; accent?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.55rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        background: 'transparent',
        border: `1px solid ${danger ? 'rgba(139,46,46,0.5)' : accent ? 'var(--amber-dim)' : 'var(--border)'}`,
        color: danger ? '#c87070' : accent ? 'var(--amber)' : 'var(--muted)',
        padding: '0.3rem 0.55rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = danger
          ? 'rgba(139,46,46,0.15)'
          : accent
            ? 'var(--amber-glow)'
            : 'rgba(200,144,42,0.05)'
        el.style.borderColor = danger ? '#8b2e2e' : 'var(--amber)'
        el.style.color = danger ? '#e07070' : 'var(--amber)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'transparent'
        el.style.borderColor = danger ? 'rgba(139,46,46,0.5)' : accent ? 'var(--amber-dim)' : 'var(--border)'
        el.style.color = danger ? '#c87070' : accent ? 'var(--amber)' : 'var(--muted)'
      }}
    >
      {label}
    </button>
  )
}

// ─── Main SaveLoadMenu ────────────────────────────────────────────────────────

export default function SaveLoadMenu() {
  const { saveMenuOpen, setSaveMenuOpen, ironmanMode, toggleIronmanMode } = useSettingsStore()
  const [saves, setSaves] = useState<(SaveRecord | undefined)[]>(
    () => Array.from({ length: MANUAL_SLOT_COUNT + 1 })
  )
  const [importing, setImporting] = useState<{ record: SaveRecord } | null>(null)
  const [importTargetSlot, setImportTargetSlot] = useState(1)
  const [ironmanConfirm, setIronmanConfirm] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const result = await listSaves()
      if (import.meta.env.DEV) console.log('[SaveLoadMenu] Refreshed saves list:', result.map((s, i) => s ? `slot ${i}: "${s.name}" (WK ${s.weekNumber})` : `slot ${i}: EMPTY`).join(', '))
      setSaves(result)
    } catch (e) {
      console.error('[SaveLoadMenu] Failed to refresh saves:', e)
    }
  }, [])

  useEffect(() => {
    if (saveMenuOpen) refresh()
  }, [saveMenuOpen, refresh])

  if (!saveMenuOpen) return null

  const handleImportPick = () => {
    triggerImportPicker((record) => {
      setImporting({ record })
    })
  }

  const confirmImport = async () => {
    if (!importing) return
    await importSaveToSlot(importing.record, importTargetSlot)
    setImporting(null)
    refresh()
  }

  const handleIronmanToggle = () => {
    if (!ironmanMode) {
      setIronmanConfirm(true)
    } else {
      toggleIronmanMode()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10050,
      background: 'rgba(0,0,0,0.78)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* ── Import confirmation ──────────────────────────────────── */}
      {importing && (
        <ConfirmDialog
          message={`Import save "${importing.record.name}" (Week ${importing.record.weekNumber}, Act ${importing.record.actNumber}) into Slot ${importTargetSlot}? Any existing save in that slot will be overwritten.`}
          onConfirm={confirmImport}
          onCancel={() => setImporting(null)}
        />
      )}

      {/* ── Ironman activation warning ───────────────────────────── */}
      {ironmanConfirm && (
        <ConfirmDialog
          message="Enable Ironman Mode? Manual saves will be disabled. Only autosave remains. There are no second chances."
          onConfirm={() => { toggleIronmanMode(); setIronmanConfirm(false) }}
          onCancel={() => setIronmanConfirm(false)}
        />
      )}

      {/* ── Cabinet drawer ───────────────────────────────────────── */}
      <div style={{
        background: 'var(--paper)',
        border: '1px solid var(--border)',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--paper-raised)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--amber)',
              marginBottom: '0.15rem',
            }}>
              ▸ Save / Load
            </p>
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.5rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}>
              Republic of Veltria — Chancellor's Personnel Files
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handleImportPick} style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              padding: '0.35rem 0.7rem',
              cursor: 'pointer',
            }}>
              Import JSON
            </button>
            {importing && (
              <select
                value={importTargetSlot}
                onChange={e => setImportTargetSlot(Number(e.target.value))}
                style={{
                  background: 'var(--paper-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.55rem',
                  padding: '0.3rem',
                }}
              >
                {Array.from({ length: MANUAL_SLOT_COUNT }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Slot {n}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setSaveMenuOpen(false)}
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                padding: '0.35rem 0.7rem',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Slot list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}>
          {/* Autosave slot */}
          <SlotRow
            slot={AUTOSAVE_SLOT}
            record={saves[AUTOSAVE_SLOT]}
            ironman={ironmanMode}
            onAction={refresh}
          />

          {/* Divider */}
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(200,144,42,0.03)',
            borderBottom: '1px solid rgba(200,144,42,0.1)',
          }}>
            <span style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.5rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: ironmanMode ? 'rgba(139,46,46,0.5)' : 'rgba(107,96,80,0.4)',
            }}>
              {ironmanMode ? '⚠ Ironman — Manual saves disabled' : 'Manual Save Slots'}
            </span>
          </div>

          {/* Manual slots 1–10 */}
          {Array.from({ length: MANUAL_SLOT_COUNT }, (_, i) => i + 1).map(slot => (
            <SlotRow
              key={slot}
              slot={slot}
              record={saves[slot]}
              ironman={ironmanMode}
              onAction={refresh}
            />
          ))}
        </div>

        {/* Footer — ironman toggle */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--paper-raised)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <span style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: ironmanMode ? '#c87070' : 'var(--muted)',
              marginRight: '1rem',
            }}>
              {ironmanMode ? '⚠ Ironman Mode — Active' : 'Ironman Mode'}
            </span>
            {!ironmanMode && (
              <span style={{
                fontFamily: "'IM Fell English', Georgia, serif",
                fontSize: '0.75rem',
                color: 'rgba(107,96,80,0.6)',
                fontStyle: 'italic',
              }}>
                — Disables manual saves. Autosave only. True consequences.
              </span>
            )}
          </div>
          <button
            onClick={handleIronmanToggle}
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: ironmanMode ? 'rgba(139,46,46,0.15)' : 'transparent',
              border: `1px solid ${ironmanMode ? 'rgba(139,46,46,0.6)' : 'var(--border)'}`,
              color: ironmanMode ? '#c87070' : 'var(--muted)',
              padding: '0.35rem 0.9rem',
              cursor: 'pointer',
            }}
          >
            {ironmanMode ? 'Disable Ironman' : 'Enable Ironman'}
          </button>
        </div>
      </div>
    </div>
  )
}
