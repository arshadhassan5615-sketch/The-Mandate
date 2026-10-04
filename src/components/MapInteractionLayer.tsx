import { useMemo, useEffect, useState } from 'react'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useNewsStore } from '../stores/newsStore'
import { groupByProvince, type ProvinceId } from '../engine/LocationResolver'
import MapScenePin from './MapScenePin'
import type { AgendaItem } from '../types/week'
import { isAgendaItemDone, isWeekComplete } from '../engine/weekCompletion'

// ─── MapPins: renders scene pins as absolute children of the pannable map div ──

interface MapPinsProps {
  onFocusProvince?: (id: string) => void
  onUnfocusProvince?: () => void
}

export function MapPins({ onFocusProvince, onUnfocusProvince }: MapPinsProps = {}) {
  const agendaPool = useWeekStore(s => s.agendaPool)
  const launchSingleScene = useWeekStore(s => s.launchSingleScene)
  const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds)
  const currentWeek = useGameStore(s => s.currentWeek)

  const groups = useMemo(() => {
    const allGroups = groupByProvince(agendaPool)
    const nextPerProvince: Partial<Record<ProvinceId, AgendaItem>> = {}
    for (const provinceId of Object.keys(allGroups) as ProvinceId[]) {
      const items = allGroups[provinceId]!
      const sorted = [...items].sort((a, b) => a.executionOrder - b.executionOrder)
      const next = sorted.find(item => !isAgendaItemDone(item, visitedSceneIds))
      if (next) nextPerProvince[provinceId] = next
    }
    return nextPerProvince
  }, [agendaPool, visitedSceneIds])

  return (
    <>
      {Object.entries(groups).map(([provinceId, item]) => (
        <MapScenePin
          key={provinceId}
          provinceId={provinceId as ProvinceId}
          items={[item]}
          currentWeek={currentWeek}
          onSelectScene={(selected: AgendaItem) => launchSingleScene(selected)}
          onFocusProvince={onFocusProvince}
          onUnfocusProvince={onUnfocusProvince}
        />
      ))}
    </>
  )
}

// ─── MapInteractionLayer: End Week button only (rendered outside transform) ────

export default function MapInteractionLayer() {
  const agendaPool = useWeekStore(s => s.agendaPool)
  const completeWeek = useWeekStore(s => s.completeWeek)
  const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds)

  const newsOpen = useNewsStore(s => s.isOpen)
  const decreeInboxOpen = useSettingsStore(s => s.decreeInboxOpen)
  const settingsOpen = useSettingsStore(s => s.settingsOpen)

  const allVisited = useMemo(
    () => isWeekComplete(agendaPool, visitedSceneIds),
    [agendaPool, visitedSceneIds],
  )

  const [showTransition, setShowTransition] = useState(false)

  useEffect(() => {
    // If all scenes are visited and no overlays are open, trigger the transition
    if (allVisited && !newsOpen && !decreeInboxOpen && !settingsOpen) {
      setShowTransition(true)
      const timer = setTimeout(() => {
        completeWeek()
      }, 1500) // 1.5 second delay for the cinematic transition
      
      return () => {
        clearTimeout(timer)
        setShowTransition(false)
      }
    }
  }, [allVisited, newsOpen, decreeInboxOpen, settingsOpen, completeWeek])

  if (!allVisited || newsOpen || decreeInboxOpen || settingsOpen) return null

  if (!showTransition) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      animation: 'panel-fade-in 0.5s ease forwards',
      pointerEvents: 'none',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#c9a84c', margin: 0, textShadow: '0 0 20px rgba(201,168,76,0.4)' }}>
          Dispatches Concluded
        </h3>
        <p style={{ fontFamily: "'IM Fell English', serif", fontSize: '1rem', color: '#b8a890', marginTop: '0.5rem', fontStyle: 'italic' }}>
          The week advances...
        </p>
      </div>
    </div>
  )
}
