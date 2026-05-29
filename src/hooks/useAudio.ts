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

  const prevWeek = useRef(currentWeek)
  useEffect(() => {
    if (prevWeek.current !== currentWeek && prevWeek.current > 0) {
      audioManager.dipVolume(800)
    }
    prevWeek.current = currentWeek
  }, [currentWeek])
}
