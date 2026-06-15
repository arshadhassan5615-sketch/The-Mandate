import { useMemo } from 'react'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useNewsStore } from '../stores/newsStore'
import { groupByProvince, type ProvinceId } from '../engine/LocationResolver'
import MapScenePin from './MapScenePin'
import type { AgendaItem } from '../types/week'

// ─── MapPins: renders scene pins as absolute children of the pannable map div ──

export function MapPins() {
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
      const next = sorted.find(item => !visitedSceneIds.includes(item.sceneId))
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

  const visitedThisWeek = useMemo(() => {
    return agendaPool.some(item =>
      visitedSceneIds.includes(item.sceneId)
    ) || visitedSceneIds.length > 0
  }, [agendaPool, visitedSceneIds])

  if (!visitedThisWeek || newsOpen || decreeInboxOpen || settingsOpen) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 400,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
    }}>
      <button
        onClick={completeWeek}
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.72rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding: '12px 40px',
          background: 'rgba(10,8,6,0.85)',
          border: '2px solid #c9a84c',
          color: '#c9a84c',
          cursor: 'pointer',
          borderRadius: '3px',
          transition: 'all 0.15s ease',
          boxShadow: '0 0 24px rgba(200,168,76,0.35), inset 0 0 12px rgba(200,168,76,0.05)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(10,8,6,0.95)'
          e.currentTarget.style.borderColor = '#e8d5a3'
          e.currentTarget.style.color = '#e8d5a3'
          e.currentTarget.style.boxShadow = '0 0 32px rgba(200,168,76,0.5), inset 0 0 16px rgba(200,168,76,0.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(10,8,6,0.85)'
          e.currentTarget.style.borderColor = '#c9a84c'
          e.currentTarget.style.color = '#c9a84c'
          e.currentTarget.style.boxShadow = '0 0 24px rgba(200,168,76,0.35), inset 0 0 12px rgba(200,168,76,0.05)'
        }}
      >
        End Week →
      </button>
    </div>
  )
}
