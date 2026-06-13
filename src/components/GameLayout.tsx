import { useEffect, useRef, useCallback, useState } from 'react'
import { useWeekStore } from '../stores/weekStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useNewsStore } from '../stores/newsStore'
import { saveGame, loadGame } from '../engine/SaveManager'
import { startAmbient, stopAmbient, resumeAudioContext } from '../engine/audioEngine'
import { audioManager } from '../engine/AudioManager'
import { loadAllBills } from '../engine/BillEngine'
import { useBillStore } from '../stores/billStore'
import { useAudio } from '../hooks/useAudio'
import MainMenu from './MainMenu'
import CharacterCustomization from './CharacterCustomization'
import ChildhoodPrologue from './ChildhoodPrologue'
import KaterinHUD from './KaterinHUD'
import TopBar from './TopBar'
import RightSidebar from './RightSidebar'
import ProjectsPanel from './ProjectsPanel'
import ProjectMidpointModal from './ProjectMidpointModal'
import NewsOverlay from './NewsOverlay'
import LegislationOverlay from './LegislationOverlay'
import SocialEvent from './SocialEvent'
import MorningBriefing from './MorningBriefing'
import AgendaSelector from './AgendaSelector'
import NarrativeScene from './NarrativeScene'
import BudgetInterface from './BudgetInterface'
import ConstitutionalReform from './ConstitutionalReform'
import LobbyingInterface from './LobbyingInterface'
import VoteResult from './VoteResult'
import EveningReview from './EveningReview'
import EpilogueScreen from './EpilogueScreen'
import TermReportScreen from './TermReportScreen'
import SettingsPanel from './SettingsPanel'
import JournalView from './JournalView'
import LetterView from './LetterView'
import RadioAddressView from './RadioAddressView'
import LegacyScreen from './LegacyScreen'
import TransitionOverlay from './TransitionOverlay'
import DiaryScreen from './DiaryScreen'
import CliffhangerScreen from './CliffhangerScreen'
import DecreeInbox from './DecreeInbox'
import MapInteractionLayer from './MapInteractionLayer'
import ActTransition from './ActTransition'
import { ErrorBoundary } from './ErrorBoundary'
import SaveSlotScreen from './SaveSlotScreen'
import { useSettingsStore } from '../stores/settingsStore'
import { CabinetFormation } from './CabinetFormation'
import { CabinetMeeting } from './CabinetMeeting'
import { useCabinetStore } from '../stores/cabinetStore'

function SceneRouter() {
  const currentScene = useNarrativeStore(s => s.currentScene)
  if (!currentScene) return <NarrativeScene />
  if (currentScene.type === 'social_event') return <SocialEvent />
  return <NarrativeScene />
}

export default function GameLayout() {
  const { phase, pendingMidpointProjectId, resolveMidpoint, showTermReport, showLegacy, setRadioOpen, radioOpen, diaryEntry, closeDiary, cliffhangerText, closeCliffhanger, endPress, showCabinetFormation, showCabinetMeeting, dismissCabinetMeeting } = useWeekStore()
  const journalOpen = useSettingsStore(s => s.journalOpen)
  const letterOpen = useSettingsStore(s => s.letterOpen)
  const decreeInboxOpen = useSettingsStore(s => s.decreeInboxOpen)
  const setDecreeInboxOpen = useSettingsStore(s => s.setDecreeInboxOpen)
  const pendingRequests = useCabinetStore(s => s.pending_requests)
  const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds)
  const ambientStarted = useRef(false)
  const [showActTransition, setShowActTransition] = useState(false)
  const [actShown, setActShown] = useState(false)
  const [slotScreenMode, setSlotScreenMode] = useState<'load' | 'save' | null>(null)
  const [menuConfirmOpen, setMenuConfirmOpen] = useState(false)

  useAudio()

  // Load bills on mount
  useEffect(() => {
    loadAllBills().then(bills => {
      useBillStore.getState().loadBills(bills)
    })
  }, [])

  // Start ambient audio on first user interaction anywhere in the game
  const startAmbientOnce = useCallback(() => {
    if (ambientStarted.current) return
    resumeAudioContext()
    audioManager.resume()
    audioManager.setUserInteracted()
    startAmbient()
    ambientStarted.current = true
    document.removeEventListener('click', startAmbientOnce)
    document.removeEventListener('keydown', startAmbientOnce)
  }, [])

  useEffect(() => {
    document.addEventListener('click', startAmbientOnce, { once: true })
    document.addEventListener('keydown', startAmbientOnce, { once: true })
    return () => {
      document.removeEventListener('click', startAmbientOnce)
      document.removeEventListener('keydown', startAmbientOnce)
    }
  }, [startAmbientOnce])

  // Stop ambient when entering epilogue
  useEffect(() => {
    if (phase === 'epilogue') stopAmbient()
  }, [phase])

  // Show Act I transition after inauguration scene completes
  useEffect(() => {
    if (
      phase === 'map' &&
      visitedSceneIds.includes('act1_week1_inauguration') &&
      !actShown
    ) {
      setShowActTransition(true)
      setActShown(true)
    }
  }, [phase, visitedSceneIds, actShown])

  // Auto-open news overlay when entering press phase
  useEffect(() => {
    if (phase === 'press') {
      useNewsStore.getState().setOpen(true)
    }
    return () => {
      if (phase === 'press') {
        useNewsStore.getState().setOpen(false)
      }
    }
  }, [phase])

  return (
    <>
      {/* Act transition — appears on first entry to briefing */}
      {showActTransition && (
        <ActTransition
          actNumber={1}
          actTitle="The Beginning"
          onComplete={() => setShowActTransition(false)}
        />
      )}

      {/* Cliffhanger screen — plays before diary, after week transition */}
      {cliffhangerText && <CliffhangerScreen text={cliffhangerText} onContinue={closeCliffhanger} />}

      {/* Diary entry screen — appears before briefing, no chrome */}
      {diaryEntry && <DiaryScreen entry={diaryEntry} onContinue={closeDiary} />}

      {/* Cabinet Formation — full-screen ministry appointment */}
      {showCabinetFormation && (
        <CabinetFormation
          onComplete={() => {
            useWeekStore.setState({ showCabinetFormation: false })
            useWeekStore.getState().advanceQueue()
          }}
        />
      )}

      {/* Cabinet Meeting — weekly minister reports */}
      {showCabinetMeeting && pendingRequests.length > 0 && (
        <CabinetMeeting
          requests={pendingRequests}
          onComplete={dismissCabinetMeeting}
        />
      )}

      {phase === 'title'         && <MainMenu />}
      {phase === 'customization' && <CharacterCustomization />}
      {phase === 'prologue'      && <ChildhoodPrologue />}
      {phase === 'briefing' && <MorningBriefing />}

      {/* Press phase — newspaper overlays with footer */}
      {phase === 'press' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: '52px',
          zIndex: 220,
          background: 'rgba(10,8,6,0.98)',
          borderTop: '2px solid #c9a84c',
          padding: '0.8rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: "'Georgia', serif",
            fontWeight: 700,
            letterSpacing: '3px',
            fontSize: '12px',
            color: '#ffffff',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(255,255,255,0.2)',
          }}>
            Review the press coverage, then proceed to the agenda
          </span>
          <button
            style={{
              color: '#c9a84c',
              border: '1.5px solid #c9a84c',
              padding: '8px 24px',
              background: 'rgba(201,168,76,0.08)',
              fontFamily: "'Georgia', serif",
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '2px',
              cursor: 'pointer',
              borderRadius: '2px',
              boxShadow: '-4px -4px 0 -2px #c9a84c, 4px -4px 0 -2px #c9a84c, -4px 4px 0 -2px #c9a84c, 4px 4px 0 -2px #c9a84c',
            }}
            onClick={() => { useNewsStore.getState().setOpen(false); endPress() }}
          >
            Continue to Agenda →
          </button>
        </div>
      )}

      {phase === 'agenda'   && <AgendaSelector />}
      {phase === 'map'      && <MapInteractionLayer />}
      {phase === 'scene'    && <ErrorBoundary><SceneRouter /></ErrorBoundary>}
      {phase === 'budget'       && <BudgetInterface />}
      {phase === 'constitution' && <ConstitutionalReform />}
      {phase === 'lobbying'     && <LobbyingInterface />}
      {phase === 'vote_result'  && <VoteResult />}
      {phase === 'review'       && <EveningReview />}
      {phase === 'epilogue' && !showTermReport && !showLegacy && <EpilogueScreen />}
      {showTermReport && !showLegacy && (
        <TermReportScreen />
      )}
      {showTermReport && !showLegacy && (
        <div style={{ position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
          <button
            onClick={() => useWeekStore.getState().openLegacy()}
            style={{
              fontFamily: "'Special Elite', monospace", fontSize: '0.55rem', letterSpacing: '0.1em',
              background: 'var(--amber)', border: 'none', color: 'var(--ink)', padding: '0.5rem 1.5rem',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            Continue to Historical Assessment →
          </button>
        </div>
      )}
      {showLegacy && <LegacyScreen onContinue={() => { useWeekStore.setState({ showLegacy: false, phase: 'title' }) }} />}

      {/* Right icon sidebar — visible during gameplay */}
      {phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue' && (
        <RightSidebar />
      )}

      {/* In-game save & menu buttons — bottom left during gameplay */}
      {phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue' && (
        <div style={{ position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 100, display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSlotScreenMode('save')}
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.5rem',
              letterSpacing: '0.1em',
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: 'rgba(201,168,76,0.7)',
              padding: '0.35rem 0.8rem',
              cursor: 'pointer',
              borderRadius: '2px',
              textTransform: 'uppercase' as const,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.color = '#c9a84c' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = 'rgba(201,168,76,0.7)' }}
          >
            SAVE
          </button>
          <button
            onClick={() => setMenuConfirmOpen(true)}
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.5rem',
              letterSpacing: '0.1em',
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: 'rgba(201,168,76,0.7)',
              padding: '0.35rem 0.8rem',
              cursor: 'pointer',
              borderRadius: '2px',
              textTransform: 'uppercase' as const,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.color = '#c9a84c' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = 'rgba(201,168,76,0.7)' }}
          >
            MENU
          </button>
        </div>
      )}

      {/* Return-to-menu confirmation modal */}
      {menuConfirmOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,8,6,0.97)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9000,
          }}
          onClick={() => setMenuConfirmOpen(false)}
        >
          <div
            style={{
              background: '#0a0806',
              border: '1px solid rgba(201,168,76,0.4)',
              padding: '2.5rem 3rem',
              borderRadius: '2px',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '1rem',
              letterSpacing: '0.15em',
              color: '#c9a84c',
              marginBottom: '1rem',
            }}>
              RETURN TO MAIN MENU?
            </div>
            <div style={{
              fontFamily: "'Crimson Text', serif",
              fontSize: '0.9rem',
              color: 'rgba(180,170,150,0.8)',
              marginBottom: '2rem',
              lineHeight: '1.5',
            }}>
              Your progress has been autosaved.
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setMenuConfirmOpen(false)}
                style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  background: 'transparent',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: 'rgba(201,168,76,0.5)',
                  padding: '0.6rem 1.4rem',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)'; e.currentTarget.style.color = 'rgba(201,168,76,0.8)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.color = 'rgba(201,168,76,0.5)' }}
              >
                STAY
              </button>
              <button
                onClick={async () => {
                  const slot = useWeekStore.getState().activeSlot
                  await saveGame(slot, 'AUTOSAVE')
                  useGameStore.getState().resetToInitial()
                  useWeekStore.setState({ phase: 'title' })
                  setMenuConfirmOpen(false)
                }}
                style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.6)',
                  color: '#c9a84c',
                  padding: '0.6rem 1.4rem',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.25)'; e.currentTarget.style.borderColor = '#c9a84c' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.15)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)' }}
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar — visible during gameplay */}
      {phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue' && (
        <TopBar />
      )}

      {/* Katerin portrait HUD — visible during gameplay */}
      {phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue' && (
        <KaterinHUD />
      )}

      {/* Projects panel — active development projects */}
      {phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue' && (
        <ProjectsPanel />
      )}

      {/* Project midpoint decision modal */}
      {pendingMidpointProjectId && (
        <ProjectMidpointModal
          projectId={pendingMidpointProjectId}
          onResolved={() => resolveMidpoint()}
        />
      )}

      {/* News overlay */}
      <NewsOverlay />

      {/* Legislation overlay */}
      <LegislationOverlay />

      {/* Settings modal */}
      <SettingsPanel />

      {/* Journal modal */}
      {journalOpen && <JournalView onClose={() => useSettingsStore.getState().setJournalOpen(false)} />}

      {/* Letter composing modal */}
      {letterOpen && <LetterView onClose={() => useSettingsStore.getState().setLetterOpen(false)} />}

      {/* Radio address modal */}
      {radioOpen && <RadioAddressView onClose={() => setRadioOpen(false)} />}

      {/* Decree inbox */}
      {decreeInboxOpen && <DecreeInbox onClose={() => setDecreeInboxOpen(false)} />}

      {/* Scene / week transition overlay */}
      <TransitionOverlay />

      {/* Save slot screen */}
      {slotScreenMode && (
        <SaveSlotScreen
          mode={slotScreenMode}
          onClose={() => setSlotScreenMode(null)}
          onSlotSelected={(slot: number) => {
            if (slotScreenMode === 'save') {
              saveGame(slot, `Playthrough ${slot}`).catch(() => {})
            } else {
              loadGame(slot).then(() => setSlotScreenMode(null))
            }
            setSlotScreenMode(null)
          }}
        />
      )}
    </>
  )
}
