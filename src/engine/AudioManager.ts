import theme_main from '../assets/audio/music/theme_main.mp3'
import theme_briefing from '../assets/audio/music/theme_briefing.mp3'
import theme_cabinet from '../assets/audio/music/theme_cabinet.mp3'
import theme_crisis from '../assets/audio/music/theme_crisis.mp3'
import theme_family from '../assets/audio/music/theme_family.mp3'
import theme_oligarch from '../assets/audio/music/theme_oligarch.mp3'
import theme_tyvaren from '../assets/audio/music/theme_tyvaren.mp3'
import theme_epilogue from '../assets/audio/music/theme_epilogue.mp3'
import theme_optimism from '../assets/audio/music/theme_optimism.mp3'
import theme_optimism_short from '../assets/audio/music/theme_optimism_short.mp3'
import theme_reform_victory from '../assets/audio/music/theme_reform_victory.mp3'
import theme_scandal from '../assets/audio/music/theme_scandal.mp3'
import theme_scandal_short from '../assets/audio/music/theme_scandal_short.mp3'
import theme_spy from '../assets/audio/music/theme_spy.mp3'
import theme_corruption from '../assets/audio/music/theme_corruption.mp3'

const musicUrls = new Map<string, string>([
  ['theme_main', theme_main],
  ['theme_briefing', theme_briefing],
  ['theme_cabinet', theme_cabinet],
  ['theme_crisis', theme_crisis],
  ['theme_family', theme_family],
  ['theme_oligarch', theme_oligarch],
  ['theme_tyvaren', theme_tyvaren],
  ['theme_epilogue', theme_epilogue],
  ['theme_optimism', theme_optimism],
  ['theme_optimism_short', theme_optimism_short],
  ['theme_reform_victory', theme_reform_victory],
  ['theme_scandal', theme_scandal],
  ['theme_scandal_short', theme_scandal_short],
  ['theme_spy', theme_spy],
  ['theme_corruption', theme_corruption],
])

const flaggedSceneMap: Record<string, string[]> = {
  'theme_crisis': [
    'act3_week37_coup_attempt',
    'act3_week_variable_assassination',
    'act4_week40_war_begins',
    'act3_brenner_negotiation',
  ],
  'theme_oligarch': [
    'act1_week8_vael_offer',
    'act2_week18_vael_oligarch',
    'act3_week35_vael_demands',
    'act1_chain_kravenstal_escalation',
  ],
  'theme_scandal': [
    'act3_week36_nadia_publishes',
    'act3_week29_vyktor_exposed',
    'act2_week22_nadia_investigation',
    'act1_chain_nadia_investigation',
  ],
  'theme_spy': [
    'act3_week42_mole_confrontation',
    'act2_week24_spy_clue',
    'act3_week38_defector',
  ],
  'theme_corruption': [
    'act2_week18_vael_private_meeting',
    'act1_chain_budget_revision',
  ],
  'theme_tyvaren': [
    'act1_week7_tyvaren_airspace',
    'act2_week32_tyvaren_ultimatum',
    'act3_week33_war_preparations',
    'act4_week40_war_begins',
    'act1_chain_tyvaren_border_standoff',
    'act1_chain_tyvaren_blind_spot',
  ],
  'theme_family': [
    'act1_chain_jonas_advisor',
    'act1_chain_liora_archive',
    'act1_chain_liora_radicalized',
    'act2_week23_family_crisis',
    'act3_week38_family_reckoning',
    'act1_week2_serida_introduction',
  ],
  'theme_optimism': [
    'act1_week1_inauguration',
    'act2_week26_referendum',
    'act4_week52_ending',
  ],
  'theme_reform_victory': [
    'act2_week26_referendum_passed',
    'act3_reform_triumph',
  ],
}

class AudioManager {
  private currentTrack: HTMLAudioElement | null = null
  private currentTrackName: string | null = null
  private masterVolume: number = 0.35
  private isMuted: boolean = false
  private fadeInterval: ReturnType<typeof setInterval> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private userHasInteracted: boolean = false

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          setTimeout(() => {
            if (this.currentTrack && this.currentTrack.paused) {
              this.currentTrack.play().catch(() => {})
            }
          }, 300)
        }
      })

      window.addEventListener('focus', () => {
        setTimeout(() => {
          if (this.currentTrack && this.currentTrack.paused) {
            this.currentTrack.play().catch(() => {})
          }
        }, 300)
      })
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        setTimeout(() => {
          if (this.currentTrack && this.currentTrack.paused) {
            this.currentTrack.volume = 0
            this.currentTrack.play().catch(() => {})
            this.fadeIn(this.currentTrack, 1000)
          }
        }, 500)
      })
    }

    this.startHeartbeat()
  }

  private sceneTrackMap: Record<string, string> = {
    'main_menu': 'theme_main',
    'prologue': 'theme_optimism',
    'briefing': 'theme_briefing',
    'agenda': 'theme_briefing',
    'cabinet': 'theme_cabinet',
    'dialogue': 'theme_cabinet',
    'meeting': 'theme_cabinet',
    'ceremony': 'theme_cabinet',
    'event': 'theme_cabinet',
    'crisis': 'theme_crisis',
    'emergency': 'theme_crisis',
    'family': 'theme_family',
    'personal': 'theme_family',
    'social_event': 'theme_cabinet',
    'diplomacy': 'theme_cabinet',
    'epilogue': 'theme_epilogue',
    'legacy': 'theme_epilogue',
  }

  private phaseTrackMap: Record<string, string> = {
    'title': 'theme_main',
    'customization': 'theme_main',
    'prologue': 'theme_optimism',
    'map': 'theme_main',
    'briefing': 'theme_briefing',
    'press': 'theme_briefing',
    'agenda': 'theme_main',
    'conversation': 'theme_cabinet',
    'budget': 'theme_cabinet',
    'constitution': 'theme_cabinet',
    'lobbying': 'theme_cabinet',
    'vote_result': 'theme_cabinet',
    'review': 'theme_main',
    'evening': 'theme_main',
    'diary': 'theme_family',
    'epilogue': 'theme_epilogue',
  }

  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.currentTrack && !this.isMuted) {
      this.currentTrack.volume = this.masterVolume
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.currentTrack) {
      this.currentTrack.volume = muted ? 0 : this.masterVolume
    }
  }

  setUserInteracted() {
    this.userHasInteracted = true
  }

  private fadeOut(duration: number = 1500): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentTrack) { resolve(); return }

      const track = this.currentTrack
      const startVolume = track.volume
      const steps = 30
      const stepTime = duration / steps
      const volumeStep = startVolume / steps
      let currentStep = 0

      if (this.fadeInterval) clearInterval(this.fadeInterval)

      this.fadeInterval = setInterval(() => {
        currentStep++
        track.volume = Math.max(0, startVolume - (volumeStep * currentStep))

        if (currentStep >= steps) {
          if (this.fadeInterval) clearInterval(this.fadeInterval)
          track.pause()
          track.currentTime = 0
          resolve()
        }
      }, stepTime)
    })
  }

  private fadeIn(track: HTMLAudioElement, duration: number = 2000, targetVolume?: number) {
    track.volume = 0
    track.play().catch(() => {})

    const vol = targetVolume ?? (this.isMuted ? 0 : this.masterVolume)
    const intensityMultiplier = this.intensityVolumeMultiplier[this.currentIntensity]
    const finalTarget = Math.min(1, vol * intensityMultiplier)
    const steps = 40
    const stepTime = duration / steps
    const volumeStep = finalTarget / steps
    let currentStep = 0

    if (this.fadeInterval) clearInterval(this.fadeInterval)

    this.fadeInterval = setInterval(() => {
      currentStep++
      track.volume = Math.min(finalTarget, volumeStep * currentStep)

      if (currentStep >= steps) {
        if (this.fadeInterval) clearInterval(this.fadeInterval)
      }
    }, stepTime)
  }

  public fadeInTrack(trackName: string, duration: number = 2000, targetVolume: number = 0.4) {
    if (this.currentTrackName === trackName && this.currentTrack && !this.currentTrack.paused) {
      return
    }

    if (this.currentTrack && !this.currentTrack.paused) {
      this.fadeOut(1500).then(() => {
        this.startNewTrack(trackName, duration, targetVolume)
      })
    } else {
      this.startNewTrack(trackName, duration, targetVolume)
    }
  }

  private startNewTrack(trackName: string, duration: number, targetVolume: number) {
    try {
      const url = musicUrls.get(trackName)
      if (!url) {
        console.warn(`[AudioManager] Track not found: ${trackName}`)
        return
      }

      const audio = new Audio(url)
      audio.loop = true
      audio.preload = 'auto'

      audio.onended = () => {
        if (this.currentTrackName) {
          audio.play().catch(() => {})
        }
      }

      audio.onpause = () => {
        setTimeout(() => {
          if (
            this.currentTrack === audio &&
            audio.paused &&
            this.userHasInteracted &&
            !this.isMuted
          ) {
            audio.play().catch(() => {})
          }
        }, 500)
      }

      this.currentTrack = audio
      this.currentTrackName = trackName

      this.fadeIn(audio, duration, targetVolume)
    } catch (error) {
      console.warn(`[AudioManager] Failed to load track: ${trackName}`)
    }
  }

  async playTrack(trackName: string, fadeInDuration?: number) {
    if (this.currentTrackName === trackName &&
        this.currentTrack &&
        !this.currentTrack.paused) {
      return
    }

    if (this.currentTrack && !this.currentTrack.paused) {
      await this.fadeOut(1500)
    }

    try {
      const url = musicUrls.get(trackName)
      if (!url) {
        console.warn(`[AudioManager] Track not found: ${trackName}`)
        return
      }

      const audio = new Audio(url)
      audio.loop = true
      audio.preload = 'auto'

      audio.onended = () => {
        if (this.currentTrackName) {
          audio.play().catch(() => {})
        }
      }

      audio.onpause = () => {
        setTimeout(() => {
          if (
            this.currentTrack === audio &&
            audio.paused &&
            this.userHasInteracted &&
            !this.isMuted
          ) {
            audio.play().catch(() => {})
          }
        }, 500)
      }

      this.currentTrack = audio
      this.currentTrackName = trackName

      this.fadeIn(audio, fadeInDuration ?? 1500)
    } catch (error) {
      console.warn(`[AudioManager] Failed to load track: ${trackName}`)
    }
  }

  private sceneKeywordMap: Array<{ patterns: string[]; track: string }> = [
    { patterns: ['inaugur', 'oath'], track: 'theme_optimism' },
    { patterns: ['budget', 'finance'], track: 'theme_cabinet' },
    { patterns: ['bni', 'bureau', 'intel'], track: 'theme_spy' },
    { patterns: ['labor', 'worker', 'union'], track: 'theme_cabinet' },
    { patterns: ['tyvaren', 'airspace', 'border'], track: 'theme_tyvaren' },
    { patterns: ['vael', 'oligarch'], track: 'theme_oligarch' },
    { patterns: ['church', 'education', 'renek'], track: 'theme_cabinet' },
    { patterns: ['convention', 'constitution'], track: 'theme_reform_victory' },
    { patterns: ['referendum'], track: 'theme_reform_victory' },
    { patterns: ['coup'], track: 'theme_crisis' },
    { patterns: ['family', 'jonas', 'dinner'], track: 'theme_family' },
    { patterns: ['mole', 'investigation', 'spy'], track: 'theme_spy' },
    { patterns: ['scandal', 'corruption'], track: 'theme_scandal' },
    { patterns: ['crisis', 'urgent'], track: 'theme_crisis' },
    { patterns: ['victory', 'reform_victory'], track: 'theme_reform_victory' },
    { patterns: ['epilogue'], track: 'theme_epilogue' },
  ]

  private meetingTypeTrackMap: Record<string, string> = {
    'security': 'theme_spy',
    'cabinet': 'theme_cabinet',
    'diplomacy': 'theme_tyvaren',
    'finance': 'theme_cabinet',
    'personal': 'theme_family',
    'parliament': 'theme_cabinet',
    'crisis': 'theme_crisis',
    'infrastructure': 'theme_cabinet',
  }

  private intensityVolumeMultiplier: Record<string, number> = {
    'low': 0.6,
    'medium': 0.8,
    'high': 1.0,
  }

  private currentIntensity: 'low' | 'medium' | 'high' = 'medium'

  getTrackForScene(sceneType: string, sceneId: string, _activeFlags?: string[]): string {
    // 1. Exact scene ID match in flaggedSceneMap
    for (const [track, scenes] of Object.entries(flaggedSceneMap)) {
      if (scenes.includes(sceneId)) {
        return track
      }
    }

    // 2. Keyword-based matching on scene ID
    const lowerId = sceneId.toLowerCase()
    for (const { patterns, track } of this.sceneKeywordMap) {
      if (patterns.some(p => lowerId.includes(p))) {
        return track
      }
    }

    // 3. Fallback to scene type map
    return this.sceneTrackMap[sceneType] ?? 'theme_cabinet'
  }

  getTrackForPhase(phase: string): string {
    return this.phaseTrackMap[phase] ?? 'theme_cabinet'
  }

  getTrackForMeetingType(category: string): string {
    return this.meetingTypeTrackMap[category.toLowerCase()] ?? 'theme_cabinet'
  }

  setIntensity(level: 'low' | 'medium' | 'high') {
    this.currentIntensity = level
    if (this.currentTrack && !this.isMuted) {
      const multiplier = this.intensityVolumeMultiplier[level]
      this.currentTrack.volume = Math.min(1, this.masterVolume * multiplier)
    }
  }

  getIntensity(): 'low' | 'medium' | 'high' {
    return this.currentIntensity
  }

  fadeToTrack(trackName: string, duration: number = 1500, targetVolume?: number) {
    const vol = targetVolume ?? (this.isMuted ? 0 : this.masterVolume)
    this.fadeToTrackWithVolume(trackName, duration, vol)
  }

  private async fadeToTrackWithVolume(trackName: string, duration: number, targetVolume: number) {
    if (this.currentTrackName === trackName && this.currentTrack && !this.currentTrack.paused) {
      return
    }

    if (this.currentTrack && !this.currentTrack.paused) {
      await this.fadeOut(duration)
    }

    try {
      const url = musicUrls.get(trackName)
      if (!url) {
        console.warn(`[AudioManager] Track not found: ${trackName}`)
        return
      }

      const audio = new Audio(url)
      audio.loop = true
      audio.preload = 'auto'

      audio.onended = () => {
        if (this.currentTrackName) {
          audio.play().catch(() => {})
        }
      }

      audio.onpause = () => {
        setTimeout(() => {
          if (
            this.currentTrack === audio &&
            audio.paused &&
            this.userHasInteracted &&
            !this.isMuted
          ) {
            audio.play().catch(() => {})
          }
        }, 500)
      }

      this.currentTrack = audio
      this.currentTrackName = trackName

      this.fadeIn(audio, duration, targetVolume)
    } catch (error) {
      console.warn(`[AudioManager] Failed to load track: ${trackName}`)
    }
  }

  pause() {
    if (this.currentTrack && !this.currentTrack.paused) {
      this.currentTrack.pause()
    }
  }

  resume() {
    if (this.currentTrack && this.currentTrack.paused) {
      this.currentTrack.play().catch(() => {})
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (
        this.currentTrack &&
        this.currentTrack.paused &&
        this.currentTrackName &&
        !this.isMuted &&
        this.userHasInteracted
      ) {
        if (import.meta.env.DEV) console.log('[AudioManager] Heartbeat detected stopped music, resuming...')
        this.currentTrack.play().catch(() => {})
      }
    }, 3000)
  }

  async dipVolume(duration: number = 800): Promise<void> {
    if (!this.currentTrack || this.currentTrack.paused) return
    const originalVolume = this.currentTrack.volume
    const targetVolume = originalVolume * 0.3
    const halfDuration = duration / 2
    const steps = 20
    const stepTime = halfDuration / steps

    for (let i = 0; i < steps; i++) {
      await new Promise(r => setTimeout(r, stepTime))
      if (this.currentTrack) {
        this.currentTrack.volume = originalVolume - ((originalVolume - targetVolume) * (i + 1) / steps)
      }
    }

    for (let i = 0; i < steps; i++) {
      await new Promise(r => setTimeout(r, stepTime))
      if (this.currentTrack) {
        this.currentTrack.volume = targetVolume + ((originalVolume - targetVolume) * (i + 1) / steps)
      }
    }

    if (this.currentTrack) {
      this.currentTrack.volume = originalVolume
    }
  }

  stopAll() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = null
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.currentTrack) {
      this.currentTrack.onended = null
      this.currentTrack.onpause = null
      this.currentTrack.pause()
      this.currentTrack.currentTime = 0
      this.currentTrack = null
      this.currentTrackName = null
    }
  }
}

export const audioManager = new AudioManager()
