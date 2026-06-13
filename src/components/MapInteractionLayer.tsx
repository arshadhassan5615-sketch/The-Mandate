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

  const visitedThisWeek = useMemo(() => {
    return agendaPool.some(item =>
      visitedSceneIds.includes(item.sceneId)
    ) || visitedSceneIds.length > 0
  }, [agendaPool, visitedSceneIds])

  const hasUnvisitedMandatory = useMemo(() => {
    return agendaPool.some(item =>
      item.slotCost === 0 &&
      !visitedSceneIds.includes(item.sceneId)
    )
  }, [agendaPool, visitedSceneIds])

  if (!visitedThisWeek || newsOpen || decreeInboxOpen) return null

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
        disabled={hasUnvisitedMandatory}
        title={hasUnvisitedMandatory ? 'Complete all mandatory scenes first' : undefined}
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '10px 32px',
          background: hasUnvisitedMandatory ? 'rgba(200,168,76,0.08)' : 'rgba(200,168,76,0.18)',
          border: `1.5px solid ${hasUnvisitedMandatory ? 'rgba(200,168,76,0.2)' : 'rgba(200,168,76,0.6)'}`,
          color: hasUnvisitedMandatory ? 'rgba(200,168,76,0.3)' : '#c9a84c',
          cursor: hasUnvisitedMandatory ? 'not-allowed' : 'pointer',
          borderRadius: '3px',
          transition: 'all 0.15s ease',
          boxShadow: hasUnvisitedMandatory ? 'none' : '0 0 16px rgba(200,168,76,0.15)',
        }}
      >
        End Week →
      </button>
      {hasUnvisitedMandatory && (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.06em',
          color: 'rgba(139,46,46,0.7)',
        }}>
          Complete all mandatory scenes first
        </span>
      )}
    </div>
  )
}
