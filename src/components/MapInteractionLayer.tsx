import { useMemo } from 'react'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useNewsStore } from '../stores/newsStore'
import { groupByProvince, type ProvinceId } from '../engine/LocationResolver'
import { getScene } from '../engine/NarrativeEngine'
import MapScenePin from './MapScenePin'
import type { AgendaItem } from '../types/week'

export default function MapInteractionLayer() {
  const agendaPool = useWeekStore(s => s.agendaPool)
  const launchSingleScene = useWeekStore(s => s.launchSingleScene)
  const completeWeek = useWeekStore(s => s.completeWeek)
  const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds)
  const currentWeek = useGameStore(s => s.currentWeek)

  const groups = useMemo(() => {
    const allGroups = groupByProvince(agendaPool)
    const nextPerProvince: Partial<Record<ProvinceId, AgendaItem>> = {}
    for (const provinceId of Object.keys(allGroups) as ProvinceId[]) {
      const items = allGroups[provinceId]!
      const sorted = [...items].sort((a, b) => a.executionOrder - b.executionOrder)
      const next = sorted.find(item => !visitedSceneIds.includes(item.sceneId))
      if (next) {
        nextPerProvince[provinceId] = next
      }
    }
    return nextPerProvince
  }, [agendaPool, visitedSceneIds])

  const newsOpen = useNewsStore(s => s.isOpen)
  const decreeInboxOpen = useSettingsStore(s => s.decreeInboxOpen)

  const isWeekBlocked = useMemo(() => {
    return agendaPool.some(item => {
      const scene = getScene(item.sceneId)
      return scene?.isWeekGate === true && !visitedSceneIds.includes(item.sceneId)
    })
  }, [agendaPool, visitedSceneIds])

  const canShowEndWeek = useMemo(() => {
    const weekSceneCount = agendaPool.length
    const visitedThisWeek = agendaPool.filter(
      item => visitedSceneIds.includes(item.sceneId)
    ).length
    return visitedThisWeek > 0 || weekSceneCount === 0
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

      {canShowEndWeek && !newsOpen && !decreeInboxOpen && agendaPool.length > 0 && (
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
            disabled={isWeekBlocked}
            title={isWeekBlocked ? 'Complete all mandatory scenes before ending the week' : undefined}
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '10px 32px',
              background: isWeekBlocked ? 'rgba(200,168,76,0.08)' : 'rgba(200,168,76,0.18)',
              border: `1.5px solid ${isWeekBlocked ? 'rgba(200,168,76,0.2)' : 'rgba(200,168,76,0.6)'}`,
              color: isWeekBlocked ? 'rgba(200,168,76,0.3)' : '#c9a84c',
              cursor: isWeekBlocked ? 'not-allowed' : 'pointer',
              borderRadius: '3px',
              transition: 'all 0.15s ease',
              boxShadow: isWeekBlocked ? 'none' : '0 0 16px rgba(200,168,76,0.15)',
            }}
          >
            End Week →
          </button>
          {isWeekBlocked && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.06em',
              color: 'rgba(139,46,46,0.7)',
            }}>
              Mandatory scenes remain
            </span>
          )}
        </div>
      )}
    </>
  )
}
