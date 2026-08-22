import { useEffect, useRef, useCallback, useState } from 'react'
import { useWeekStore } from '../stores/weekStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useNewsStore } from '../stores/newsStore'
import { saveGame, loadGame } from '../engine/SaveManager'
import { startAmbient, stopAmbient, resumeAudioContext } from '../engine/audioEngine'
import { audioManager } from '../engine/AudioManager'
import { loadAllBills } from '../engine/BillEngine'
import { loadAllParliamentBills, billFromParliamentResult } from '../engine/ParliamentEngine'
import { useBillStore } from '../stores/billStore'
import { useParliamentStore } from '../stores/parliamentStore'
import type { ParliamentBillResult } from '../types/parliament'
import { useAudio } from '../hooks/useAudio'
import MainMenu from './MainMenu'
import CharacterCustomization from './CharacterCustomization'
import ChildhoodPrologue from './ChildhoodPrologue'
import CinematicOpening from './CinematicOpening'
import KaterinHUD from './KaterinHUD'
import TopBar from './TopBar'
import RightSidebar from './RightSidebar'
import LeftSidebar from './LeftSidebar'
import ProjectsPanel from './ProjectsPanel'
import ProjectMidpointModal from './ProjectMidpointModal'
import NewsOverlay from './NewsOverlay'
import LegislationOverlay from './LegislationOverlay'
import ParliamentOverlay from './ParliamentOverlay'
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
import DiplomaticLetterPanel from './panels/DiplomaticLetterPanel'
import InvestmentPanel from './InvestmentPanel'
import RadioAddressView from './RadioAddressView'
import LegacyScreen from './LegacyScreen'
import TransitionOverlay from './TransitionOverlay'
import DiaryScreen from './DiaryScreen'
import CliffhangerScreen from './CliffhangerScreen'
import DecreeInbox from './DecreeInbox'
import MapInteractionLayer from './MapInteractionLayer'
import MapChromeFrame from './MapChromeFrame'
import ActTransition from './ActTransition'
import { ErrorBoundary } from './ErrorBoundary'
import SaveSlotScreen from './SaveSlotScreen'
import { useSettingsStore } from '../stores/settingsStore'
import { CabinetFormation } from './CabinetFormation'
import { CabinetMeeting } from './CabinetMeeting'
import { useCabinetStore } from '../stores/cabinetStore'
import DebugPanel from './DebugPanel'

function SceneRouter() {
  const currentScene = useNarrativeStore(s => s.currentScene)
  if (!currentScene) return <NarrativeScene />
  return <NarrativeScene />
}

export default function GameLayout() {
  const { phase, pendingMidpointProjectId, resolveMidpoint, showTermReport, showLegacy, setRadioOpen, radioOpen, diaryEntry, closeDiary, cliffhangerText, closeCliffhanger, endPress, showCabinetFormation, showCabinetMeeting, dismissCabinetMeeting, reshuffleMinistry, reshuffleMode } = useWeekStore()
  const journalOpen = useSettingsStore(s => s.journalOpen)
  const letterOpen = useSettingsStore(s => s.letterOpen)
  const decreeInboxOpen = useSettingsStore(s => s.decreeInboxOpen)
  const investmentOpen = useSettingsStore(s => s.investmentOpen)
  const setDecreeInboxOpen = useSettingsStore(s => s.setDecreeInboxOpen)
  const pendingRequests = useCabinetStore(s => s.pending_requests)
  // const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds) // unused — Act transition reads store directly via getState()
  const ambientStarted = useRef(false)
  const [showActTransition, setShowActTransition] = useState(false)
  const [actShown, setActShown] = useState(false)
  const [slotScreenMode, setSlotScreenMode] = useState<'load' | 'save' | null>(null)
  const [menuConfirmOpen, setMenuConfirmOpen] = useState(false)
  const parliamentResults = useParliamentStore(s => s.currentSittingResults) ?? []

  useAudio()

  // Load bills on mount
  useEffect(() => {
    loadAllBills().then(bills => {
      useBillStore.getState().loadBills(bills)
    })
    loadAllParliamentBills().then(bills => {
      useParliamentStore.getState().loadParliamentBills(bills)
    })
  }, [])

  /** Parliament sitting finished — inject passed bills, finalize, route phase. */
  const handleParliamentComplete = useCallback((results: ParliamentBillResult[]) => {
    const passedResults = results.filter(r => r.passed)
    for (const result of passedResults) {
      useBillStore.getState().injectRuntimeBill(billFromParliamentResult(result))
    }
    useParliamentStore.getState().finalizeSitting(useGameStore.getState().currentWeek)

    if (passedResults.length > 0) {
      useWeekStore.setState({ phase: 'legislation' })
    } else {
      useWeekStore.setState({ phase: 'map' })
    }
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
    // Don't start ambient audio if we are in the prologue
    if (phase === 'prologue') return

    const handler = () => {
      if (ambientStarted.current) return
      resumeAudioContext()
      audioManager.resume()
      audioManager.setUserInteracted()
      startAmbient()
      ambientStarted.current = true
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }

    document.addEventListener('click', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [startAmbientOnce, phase])

  // Stop ambient when entering epilogue
  useEffect(() => {
    if (phase === 'epilogue') stopAmbient()
  }, [phase])

  // Show Act I transition after inauguration scene completes
  useEffect(() => {
    if (phase !== 'map' || actShown) return
    const t = setTimeout(() => {
      const { visitedSceneIds: vs } = useNarrativeStore.getState()
      if (vs.includes('act1_week1_inauguration')) {
        setShowActTransition(true)
        setActShown(true)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [phase, actShown])

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
          reshuffleMinistry={reshuffleMinistry}
          reshuffleMode={reshuffleMode}
          onComplete={() => {
            useWeekStore.setState({ showCabinetFormation: false, reshuffleMinistry: undefined, reshuffleMode: false })
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
      {phase === 'cinematic'     && <CinematicOpening />}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '11px',
                letterSpacing: '2px',
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.4)',
                color: 'rgba(201,168,76,0.7)',
                padding: '8px 20px',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
              onClick={() => setMenuConfirmOpen(true)}
            >
              MENU
            </button>
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
          </div>
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

      {/* Cinematic vignette + film grain overlay */}
      {phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue' && (
        <>
          <div style={{
            position: 'fixed', inset: 0, zIndex: 150,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.6) 100%)',
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 151,
            pointerEvents: 'none',
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }} />
        </>
      )}

      {phase === 'agenda'   && <AgendaSelector />}
      {phase === 'map'      && <MapInteractionLayer />}
      {phase === 'map'      && <MapChromeFrame />}
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

      {/* Left GOV + right REGISTRY icon sidebars — visible during gameplay */}
      {phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue' && (
        <>
          <LeftSidebar />
          <RightSidebar />
        </>
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

      {/* Parliament sitting — only when phase is set with non-empty prepareSitting results */}
      {phase === 'parliament' && (
        <ParliamentOverlay
          results={parliamentResults}
          onComplete={handleParliamentComplete}
        />
      )}

      {/* Settings modal */}
      <SettingsPanel />

      {/* Journal modal */}
      {journalOpen && <JournalView onClose={() => useSettingsStore.getState().setJournalOpen(false)} />}

      {/* Letter composing modal */}
      {letterOpen && <LetterView onClose={() => useSettingsStore.getState().setLetterOpen(false)} />}

      {/* Investment panel */}
      {investmentOpen && <InvestmentPanel onClose={() => useSettingsStore.getState().setInvestmentOpen(false)} />}

      {/* Incoming Letter Inbox */}
      <DiplomaticLetterPanel />

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

      {/* Developer debug panel — fixed overlay, Ctrl+D to toggle */}
      <DebugPanel />
    </>
  )
}
