import { useEffect, useRef } from 'react'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { audioManager } from '../engine/AudioManager'

export function useAudio() {
  const phase = useWeekStore(s => s.phase)
  const currentScene = useNarrativeStore(s => s.currentScene)
  const activeFlags = useNarrativeStore(s => s.activeFlags)
  const currentWeek = useGameStore(s => s.currentWeek)
  const { musicVolume, masterMuted } = useSettingsStore()

  useEffect(() => {
    audioManager.setVolume(musicVolume / 100)
    audioManager.setMuted(masterMuted)
  }, [musicVolume, masterMuted])

  // Determine intensity based on scene urgency
  useEffect(() => {
    if (phase === 'scene' && currentScene) {
      if (currentScene.id.includes('coup') || currentScene.id.includes('crisis') || currentScene.id.includes('urgent')) {
        audioManager.setIntensity('high')
      } else if (currentScene.id.includes('family') || currentScene.id.includes('jonas') || currentScene.id.includes('dinner')) {
        audioManager.setIntensity('low')
      } else {
        audioManager.setIntensity('medium')
      }
    }
  }, [phase, currentScene?.id])

  // Play music for current phase/scene
  useEffect(() => {
    if (phase === 'scene' && currentScene) {
      const track = audioManager.getTrackForScene(
        currentScene.type,
        currentScene.id,
        activeFlags,
      )
      audioManager.playTrack(track)
    } else if (phase === 'epilogue') {
      audioManager.playTrack('theme_epilogue', 3000)
    } else {
      const track = audioManager.getTrackForPhase(phase)
      audioManager.playTrack(track)
    }
  }, [phase, currentScene?.id])

  // Preview meeting music when agenda selection changes
  const prevSelectedIds = useRef<string[]>([])
  useEffect(() => {
    if (phase !== 'agenda') {
      prevSelectedIds.current = []
      return
    }

    const { selectedIds, agendaPool } = useWeekStore.getState()
    const idsChanged = JSON.stringify(selectedIds) !== JSON.stringify(prevSelectedIds.current)
    prevSelectedIds.current = [...selectedIds]

    if (idsChanged && selectedIds.length > 0) {
      const lastSelectedId = selectedIds[selectedIds.length - 1]
      const item = agendaPool.find(a => a.id === lastSelectedId)
      if (item?.category) {
        const track = audioManager.getTrackForMeetingType(item.category)
        audioManager.playTrack(track)
      }
    } else if (selectedIds.length === 0) {
      audioManager.playTrack('theme_main')
    }
  }, [phase])

  const prevWeek = useRef(currentWeek)
  useEffect(() => {
    if (prevWeek.current !== currentWeek && prevWeek.current > 0) {
      audioManager.dipVolume(800)
    }
    prevWeek.current = currentWeek
  }, [currentWeek])
}
