import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listSaves, deleteSave } from '../engine/SaveManager'
import type { SaveRecord } from '../db/mandateDb'
import { useWeekStore } from '../stores/weekStore'
import { Z } from '../constants/zIndex'

const SLOT_COUNT = 5

// Flag → display tag mapping
const FLAG_TAGS: Record<string, string> = {
  address_reform_chosen: 'REFORMIST',
  address_unity_chosen: 'UNITY PATH',
  address_strength_chosen: 'STRENGTH PATH',
  hawk_network_active: 'HAWK ACTIVE',
  cabinet_reform_first: 'REFORM CABINET',
}

interface SaveSlotScreenProps {
  mode: 'load' | 'save'
  onClose: () => void
  onSlotSelected: (slot: number) => void
}

export default function SaveSlotScreen({ mode, onClose, onSlotSelected }: SaveSlotScreenProps) {
  const [saves, setSaves] = useState<(SaveRecord | undefined)[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null)
  const [editingSlot, setEditingSlot] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const activeSlot = useWeekStore(s => s.activeSlot)

  const refreshSaves = useCallback(async () => {
    setLoading(true)
    const all = await listSaves()
    setSaves(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    listSaves()
      .then(all => {
        if (cancelled) return
        setSaves(all)
        setLoading(false)
      })
      .catch(err => { console.warn('[SaveSlotScreen] could not list saves', err); if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDelete = useCallback(async (slot: number) => {
    await deleteSave(slot)
    setDeletingSlot(null)
    refreshSaves()
  }, [refreshSaves])

  const startEditName = (slot: number, currentName: string) => {
    setEditingSlot(slot)
    setEditName(currentName)
  }

  const commitEditName = () => {
    setEditingSlot(null)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const autoSave = saves[0]
  const manualSlots = saves.slice(1, SLOT_COUNT + 1)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z.modal,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem 1rem',
          overflowY: 'auto',
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '900px',
          marginBottom: '1.5rem',
          position: 'relative',
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.6rem',
            fontWeight: 600,
            color: '#c9a84c',
            letterSpacing: '0.1em',
            textAlign: 'center',
            margin: 0,
          }}>
            {mode === 'load' ? 'LOAD GAME' : 'SAVE GAME'}
          </h1>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 0,
              background: 'transparent',
              border: 'none',
              color: '#8a7a60',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8a7a60' }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.8rem',
            color: '#8a7a60',
            letterSpacing: '0.1em',
          }}>
            SCANNING SAVE SLOTS…
          </p>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            maxWidth: '900px',
          }}>
            {/* Autosave card */}
            {autoSave && (
              <div style={{
                background: 'rgba(15,12,8,0.95)',
                border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: '3px',
                padding: '1rem 1.25rem',
                position: 'relative',
              }}>
                <div style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.5rem',
                  letterSpacing: '0.2em',
                  color: '#5a5040',
                  marginBottom: '0.4rem',
                }}>
                  AUTOSAVE
                </div>
                <div style={{
                  fontFamily: "'Crimson Text', Georgia, serif",
                  fontSize: '1rem',
                  color: '#d0c8b0',
                  marginBottom: '0.25rem',
                }}>
                  Week {autoSave.weekNumber} of 52
                  {autoSave.actNumber ? ` — Act ${autoSave.actNumber}` : ''}
                </div>
                <div style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.45rem',
                  letterSpacing: '0.08em',
                  color: '#6a5a40',
                  marginBottom: '0.75rem',
                }}>
                  Last session · {formatDate(autoSave.timestamp)}
                </div>
                {mode === 'load' && (
                  <button
                    onClick={() => { sessionStorage.setItem('mandate-manual-load', '1'); onSlotSelected(0) }}
                    style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '0.55rem',
                      letterSpacing: '0.1em',
                      background: 'transparent',
                      border: '1px solid #4a8a4a',
                      color: '#4a8a4a',
                      padding: '0.4rem 1.5rem',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      textTransform: 'uppercase' as const,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,138,74,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    RESUME
                  </button>
                )}
              </div>
            )}

            {/* Manual slot cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.75rem',
            }}>
              {manualSlots.map((record, i) => {
                const slot = i + 1
                const isEmpty = !record
                const isActive = slot === activeSlot
                const tagFlags = record
                  ? record.activeFlags.filter(f => FLAG_TAGS[f])
                  : []

                return (
                  <div
                    key={slot}
                    style={{
                      background: 'rgba(15,12,8,0.95)',
                      border: `1px solid ${isActive ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
                      borderRadius: '3px',
                      padding: '1rem 1.25rem',
                      boxShadow: isActive
                        ? '0 0 16px rgba(201,168,76,0.15), inset 0 0 12px rgba(201,168,76,0.05)'
                        : 'none',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      gap: '0.35rem',
                    }}
                  >
                    {/* Slot number label */}
                    <div style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '0.45rem',
                      letterSpacing: '0.2em',
                      color: '#5a5040',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>SLOT {slot}</span>
                      {isActive && (
                        <span style={{ color: '#c9a84c' }}>● ACTIVE</span>
                      )}
                    </div>

                    {isEmpty ? (
                      <>
                        <div style={{
                          fontFamily: "'Crimson Text', Georgia, serif",
                          fontSize: '0.95rem',
                          color: '#5a4a30',
                          fontStyle: 'italic' as const,
                          marginTop: '0.5rem',
                        }}>
                          — EMPTY SLOT —
                        </div>
                        <div style={{
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '0.4rem',
                          letterSpacing: '0.08em',
                          color: '#4a3a20',
                        }}>
                          Start a new playthrough
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            onClick={() => { sessionStorage.setItem('mandate-manual-load', '1'); onSlotSelected(slot) }}
                            style={{
                              fontFamily: "'Special Elite', monospace",
                              fontSize: '0.5rem',
                              letterSpacing: '0.1em',
                              background: 'transparent',
                              border: '1px solid #c9a84c',
                              color: '#c9a84c',
                              padding: '0.35rem 1.2rem',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              textTransform: 'uppercase' as const,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.15)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                          >
                            SELECT
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Editable name */}
                        {editingSlot === slot ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={commitEditName}
                            onKeyDown={e => { if (e.key === 'Enter') commitEditName() }}
                            style={{
                              fontFamily: "'Crimson Text', Georgia, serif",
                              fontSize: '1rem',
                              color: '#d0c8b0',
                              background: 'rgba(201,168,76,0.1)',
                              border: '1px solid rgba(201,168,76,0.4)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '2px',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => startEditName(slot, record.name)}
                            style={{
                              fontFamily: "'Crimson Text', Georgia, serif",
                              fontSize: '1rem',
                              color: '#d0c8b0',
                              cursor: 'text',
                            }}
                            title="Click to rename"
                          >
                            {record.name}
                          </div>
                        )}

                        <div style={{
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '0.42rem',
                          letterSpacing: '0.1em',
                          color: '#8a7a60',
                        }}>
                          WEEK {record.weekNumber} OF 52
                        </div>
                        {record.actNumber > 0 && (
                          <div style={{
                            fontFamily: "'Special Elite', monospace",
                            fontSize: '0.42rem',
                            letterSpacing: '0.1em',
                            color: '#7a6a50',
                          }}>
                            ACT {record.actNumber}
                          </div>
                        )}
                        <div style={{
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '0.4rem',
                          letterSpacing: '0.08em',
                          color: '#5a4a30',
                        }}>
                          {formatDate(record.timestamp)}
                        </div>
                        {record.gameState?.personal?.publicImage !== undefined && (
                          <div style={{
                            fontFamily: "'Special Elite', monospace",
                            fontSize: '0.4rem',
                            letterSpacing: '0.08em',
                            color: '#6a5a40',
                          }}>
                            Approval: {record.gameState.personal.publicImage}%
                          </div>
                        )}

                        {/* Flag tags */}
                        {tagFlags.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap' as const,
                            gap: '4px',
                            marginTop: '0.25rem',
                          }}>
                            {tagFlags.map(f => (
                              <span
                                key={f}
                                style={{
                                  fontFamily: "'Special Elite', monospace",
                                  fontSize: '0.35rem',
                                  letterSpacing: '0.08em',
                                  color: '#c9a84c',
                                  border: '1px solid rgba(201,168,76,0.3)',
                                  padding: '1px 6px',
                                  borderRadius: '1px',
                                }}
                              >
                                {FLAG_TAGS[f]}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '0.5rem',
                          alignItems: 'center',
                        }}>
                          {mode === 'load' && (
                            <button
                              onClick={() => { sessionStorage.setItem('mandate-manual-load', '1'); onSlotSelected(slot) }}
                              style={{
                                fontFamily: "'Special Elite', monospace",
                                fontSize: '0.5rem',
                                letterSpacing: '0.1em',
                                background: 'transparent',
                                border: '1px solid #4a8a4a',
                                color: '#4a8a4a',
                                padding: '0.35rem 1.2rem',
                                cursor: 'pointer',
                                borderRadius: '2px',
                                textTransform: 'uppercase' as const,
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,138,74,0.15)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              LOAD
                            </button>
                          )}
                          {mode === 'save' && (
                            <button
                              onClick={() => onSlotSelected(slot)}
                              style={{
                                fontFamily: "'Special Elite', monospace",
                                fontSize: '0.5rem',
                                letterSpacing: '0.1em',
                                background: 'transparent',
                                border: '1px solid #c9a84c',
                                color: '#c9a84c',
                                padding: '0.35rem 1.2rem',
                                cursor: 'pointer',
                                borderRadius: '2px',
                                textTransform: 'uppercase' as const,
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.15)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              SAVE
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingSlot(slot)}
                            style={{
                              fontFamily: "'Special Elite', monospace",
                              fontSize: '0.4rem',
                              letterSpacing: '0.08em',
                              background: 'transparent',
                              border: '1px solid rgba(139,46,46,0.4)',
                              color: 'rgba(139,46,46,0.6)',
                              padding: '0.25rem 0.6rem',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              textTransform: 'uppercase' as const,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b2e2e'; e.currentTarget.style.color = '#8b2e2e' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,46,46,0.4)'; e.currentTarget.style.color = 'rgba(139,46,46,0.6)' }}
                          >
                            DELETE
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Delete confirmation overlay */}
        {deletingSlot !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: Z.modalRaised,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{
              background: 'rgba(20,16,12,0.98)',
              border: '1px solid rgba(139,46,46,0.5)',
              borderRadius: '3px',
              padding: '1.5rem 2rem',
              textAlign: 'center',
              maxWidth: '360px',
            }}>
              <p style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '1rem',
                color: '#d0c8b0',
                marginBottom: '0.5rem',
              }}>
                Delete this save?
              </p>
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.5rem',
                letterSpacing: '0.08em',
                color: '#8a2e2e',
                marginBottom: '1rem',
              }}>
                This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => handleDelete(deletingSlot)}
                  style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.55rem',
                    letterSpacing: '0.1em',
                    background: 'rgba(139,46,46,0.2)',
                    border: '1px solid #8b2e2e',
                    color: '#8b2e2e',
                    padding: '0.4rem 1.2rem',
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  DELETE
                </button>
                <button
                  onClick={() => setDeletingSlot(null)}
                  style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.55rem',
                    letterSpacing: '0.1em',
                    background: 'transparent',
                    border: '1px solid #5a5040',
                    color: '#8a7a60',
                    padding: '0.4rem 1.2rem',
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}