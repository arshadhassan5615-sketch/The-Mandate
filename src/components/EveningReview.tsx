import { useState } from 'react'
import { useWeekStore } from '../stores/weekStore'
import { useGameStore } from '../stores/gameStore'
import type { GameState, NationState, FactionState, PersonalState } from '../types/gameState'
import type { WeeklyStatChange, WeeklyEvent, WeeklyDecision, UpcomingDeadline, NarrativeReflection } from '../types/week'
import { motion, type Variants } from 'framer-motion'
import StatChange from './EveningReview/StatChange'
import FamilyStatusPanel from './EveningReview/FamilyStatusPanel'
import WeeklyHighlights from './EveningReview/WeeklyHighlights'
import MajorDecisions from './EveningReview/MajorDecisions'
import UpcomingDeadlines from './EveningReview/UpcomingDeadlines'
import { useSettingsStore } from '../stores/settingsStore'
import { saveGame } from '../engine/SaveManager'
import { playPageTurn } from '../engine/audioEngine'
import { useBillStore } from '../stores/billStore'

// ─── Summary computation ────────────────────────────────────────────────────

function computeStatChanges(before: GameState, after: GameState): WeeklyStatChange[] {
  const changes: WeeklyStatChange[] = []

  const nationLabels: Record<keyof NationState, string> = {
    economyHealth: 'Economy Health',
    unemployment: 'Unemployment',
    inflation: 'Inflation',
    nationalDebt: 'National Debt',
    corruption: 'Corruption',
    militaryReadiness: 'Military Readiness',
    militaryTech: 'Military Tech',
    publicOrder: 'Public Order',
    pressFreedom: 'Press Freedom',
    mediaControl: 'Media Control',
    civilLiberties: 'Civil Liberties',
    lawOrder: 'Law & Order',
    internationalStanding: 'Intl. Standing',
    assemblyVoteMargin: 'Assembly Margin',
    assemblyConservative: 'Conservative Bloc',
    assemblyHardliner: 'Hardliner Bloc',
    assemblyReformist: 'Reformist Bloc',
    energyIndependence: 'Energy Independence',
    conventionStability: 'Convention Stability',
    educationStandard: 'Education Standard',
    regionalSupport: 'Regional Support',
  }
  for (const [k, label] of Object.entries(nationLabels)) {
    const key = k as keyof NationState
    const oldVal = before.nation[key]
    const newVal = after.nation[key]
    const delta = newVal - oldVal
    if (delta !== 0) changes.push({ label, oldValue: oldVal, newValue: newVal, delta, category: 'nation' })
  }

  const factionLabels: Record<keyof FactionState, string> = {
    halvekists: 'Halvekists',
    workersCoalition: "Workers' Coalition",
    reformists: 'Reformists',
    ironCovenant: 'Iron Covenant',
    church: 'Church',
    businessClass: 'Business Class',
    dravenni: 'Dravenni',
    partyLoyalists: 'Party Loyalists',
  }
  for (const [k, label] of Object.entries(factionLabels)) {
    const key = k as keyof FactionState
    const oldVal = before.factions[key]
    const newVal = after.factions[key]
    const delta = newVal - oldVal
    if (delta !== 0) changes.push({ label, oldValue: oldVal, newValue: newVal, delta, category: 'faction' })
  }

  const personalLabels: Record<keyof PersonalState, string> = {
    marriageHealth: 'Marriage Health',
    lioraRelationship: 'Liora Relationship',
    tomasWellbeing: 'Tomas Wellbeing',
    personalWealth: 'Personal Wealth',
    publicImage: 'Public Image',
    moralCompass: 'Moral Compass',
    stressLevel: 'Stress Level',
    fiscalRestraint: 'Fiscal Restraint',
  }
  for (const [k, label] of Object.entries(personalLabels)) {
    const key = k as keyof PersonalState
    const oldVal = before.personal[key]
    const newVal = after.personal[key]
    const delta = newVal - oldVal
    if (delta !== 0) changes.push({ label, oldValue: oldVal, newValue: newVal, delta, category: 'personal' })
  }

  return changes
}

function buildEventsFromQueue(
  queue: ReturnType<typeof useWeekStore.getState>['sceneQueue'],
  currentWeek: number,
): WeeklyEvent[] {
  return queue.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.description,
    category: mapCategory(item.category),
    impact: 'neutral' as const,
    week: currentWeek,
  }))
}

function mapCategory(cat: string): WeeklyEvent['category'] {
  switch (cat) {
    case 'security': return 'military'
    case 'crisis': return 'crisis'
    case 'personal': return 'personal'
    case 'finance':
    case 'infrastructure': return 'economic'
    default: return 'political'
  }
}

function buildDecisionsFromQueue(
  queue: ReturnType<typeof useWeekStore.getState>['sceneQueue'],
): WeeklyDecision[] {
  return queue.map((item) => ({
    title: item.title,
    consequence: item.isUrgent
      ? 'Crisis response — consequences unfolding.'
      : 'Decision recorded. Effects will manifest over time.',
    impact: item.isUrgent ? ('negative' as const) : ('neutral' as const),
  }))
}

function buildDeadlines(
  currentWeek: number,
  agendaPool: ReturnType<typeof useWeekStore.getState>['agendaPool'],
  activeProjects: ReturnType<typeof useGameStore.getState>['activeProjects'],
): UpcomingDeadline[] {
  const deadlines: UpcomingDeadline[] = []

  for (const item of agendaPool) {
    if (item.weekDeadline && item.weekDeadline > currentWeek && item.weekDeadline <= currentWeek + 3) {
      const weeksLeft = item.weekDeadline - currentWeek
      deadlines.push({
        id: `deadline_${item.id}`,
        title: item.title,
        description: item.description.slice(0, 80) + '...',
        urgency: weeksLeft <= 1 ? 'critical' : weeksLeft <= 2 ? 'warning' : 'info',
        timeRemaining: weeksLeft === 1 ? 'This week' : `Due in ${weeksLeft} weeks`,
      })
    }
  }

  for (const project of activeProjects) {
    if (project.phase === 'active' && project.currentWeek > 0) {
      deadlines.push({
        id: `project_${project.projectId}`,
        title: `Project: ${project.projectId}`,
        description: 'Active development project in progress.',
        urgency: 'info',
        timeRemaining: `Week ${project.currentWeek}`,
      })
    }
  }

  return deadlines.slice(0, 5)
}

function buildReflection(currentWeek: number, gameState: GameState): NarrativeReflection {
  const p = gameState.personal
  const n = gameState.nation

  if (n.publicOrder < 40) {
    return { text: 'The streets grow quieter each evening. You wonder if it\'s fear or exhaustion.' }
  }
  if (p.marriageHealth < 40) {
    return { text: 'Jonas barely speaks at dinner anymore. The weight of this office costs more than you expected.' }
  }
  if (p.lioraRelationship < 40) {
    return { text: 'Liora\'s silence is louder than any argument. Your daughter is drifting somewhere you cannot follow.' }
  }
  if (n.economyHealth < -30) {
    return { text: 'The ledgers show red in every column. Outside these walls, market stalls close one by one.' }
  }
  if (n.corruption > 80) {
    return { text: 'You feel the rot beneath the marble floors. Corruption has its own gravity — it pulls everything toward it.' }
  }
  if (gameState.stateOfEmergency) {
    return { text: 'Emergency powers. You tell yourself it\'s temporary. But every week the justification comes easier.' }
  }
  if (n.internationalStanding > 70) {
    return { text: 'Foreign dispatches speak of Veltria with something almost like respect. The world is watching.' }
  }
  if (n.militaryReadiness < 30) {
    return { text: 'The generals are nervous. A nation with weak borders sleeps uneasily.' }
  }

  return { text: `Outside the palace windows, Ashenmere settles into night. The Republic continues. Week ${currentWeek} is recorded.` }
}

function generateReflectionPrompt(
  statChanges: WeeklyStatChange[],
  decisions: WeeklyDecision[],
): string {
  // Prefer a narratively significant decision over a stat number
  if (decisions.length > 0) {
    const urgent = decisions.find(d => d.impact === 'negative')
    if (urgent) return `You decided: "${urgent.title}". What does that mean to you?`
    return `This week brought: "${decisions[0].title}". What stays with you?`
  }

  // Fall back to the largest stat delta
  if (statChanges.length > 0) {
    const biggest = statChanges.reduce((a, b) => Math.abs(b.delta) > Math.abs(a.delta) ? b : a)
    const direction = biggest.delta > 0 ? 'rose' : 'fell'
    return `${biggest.label} ${direction} ${Math.abs(biggest.delta)} points this week. What are you thinking?`
  }

  return 'A quiet week. Sometimes those are the most important.'
}

// ─── Animation variants ─────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function EveningReview() {
  const { sceneQueue, weekStartSnapshot, completeWeek, gateBlocked, gateMessage, dismissGate, agendaPool } = useWeekStore()
  const gameState = useGameStore()
  const { currentWeek } = gameState
  const { setSaveMenuOpen, ironmanMode } = useSettingsStore()
  const bills = useBillStore((s) => s.bills)
  const addJournalReflection = useGameStore(s => s.addJournalReflection)
  const journalReflections = useGameStore(s => s.journalReflections)

  const statChanges = weekStartSnapshot ? computeStatChanges(weekStartSnapshot, gameState) : []
  const events = buildEventsFromQueue(sceneQueue, currentWeek)
  const decisions = buildDecisionsFromQueue(sceneQueue)
  const activeProjects = gameState.activeProjects
  const deadlines = buildDeadlines(currentWeek, agendaPool, activeProjects)
  const reflection = buildReflection(currentWeek, gameState)

  // Pre-populate with any existing entry for this week
  const existingEntry = journalReflections.find(e => e.week === currentWeek)
  const [reflectionText, setReflectionText] = useState(existingEntry?.text ?? '')
  const [reflectionSaved, setReflectionSaved] = useState(false)

  // Generate contextual prompt from the most significant change this week
  const prompt = generateReflectionPrompt(statChanges, decisions)

  const dateStr = (() => {
    const d = new Date(1963, 0, 1)
    d.setDate(d.getDate() + (currentWeek - 1) * 7)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  return (
    <div className="evening-review" style={{ paddingRight: '80px', boxSizing: 'border-box' }}>
      <motion.div
        className="evening-review-inner"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="evening-header" variants={headerVariants}>
          <h1 className="evening-title">END OF WEEK {currentWeek}</h1>
          <p className="evening-date">{dateStr} — Ashenmere, Republic of Veltria</p>
          <div className="evening-divider" />
        </motion.div>

        <div className="evening-grid">
          <motion.div className="evening-column" variants={panelVariants}>
            <div className="evening-panel">
              <h2 className="evening-panel-title">Weekly Highlights</h2>
              <WeeklyHighlights events={events} />
            </div>
            <div className="evening-panel" style={{ marginTop: '24px' }}>
              <h2 className="evening-panel-title">Family Status</h2>
              <FamilyStatusPanel />
            </div>
          </motion.div>

          <motion.div className="evening-column" variants={panelVariants}>
            <div className="evening-panel">
              <h2 className="evening-panel-title">Stat Changes</h2>
              {statChanges.length === 0 ? (
                <div className="evening-empty">
                  <p>No measurable changes this week.</p>
                </div>
              ) : (
                <div className="evening-stat-changes">
                  {statChanges.map((sc, i) => (
                    <StatChange key={`${sc.label}-${i}`} stat={sc} />
                  ))}
                </div>
              )}
            </div>
            <div className="evening-panel" style={{ marginTop: '24px' }}>
              <h2 className="evening-panel-title">Decisions Made</h2>
              <MajorDecisions decisions={decisions} />
            </div>
          </motion.div>

          <motion.div className="evening-column" variants={panelVariants}>
            <div className="evening-panel">
              <h2 className="evening-panel-title">Active Projects</h2>
              {activeProjects.filter((p) => p.phase === 'active').length === 0 ? (
                <div className="evening-empty">
                  <p>No active development projects.</p>
                </div>
              ) : (
                <div className="evening-projects">
                  {activeProjects.filter((p) => p.phase === 'active').map((p) => (
                    <div key={p.projectId} className="evening-project-item">
                      <span className="evening-project-name">{p.projectId}</span>
                      <span className="evening-project-week">Wk {p.currentWeek}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="evening-panel" style={{ marginTop: '24px' }}>
              <h2 className="evening-panel-title">Upcoming Deadlines</h2>
              <UpcomingDeadlines deadlines={deadlines} />
            </div>
            <div className="evening-panel" style={{ marginTop: '24px' }}>
              <h2 className="evening-panel-title">Pending Bills</h2>
              {bills.filter((b) => b.weekPresented === currentWeek).length === 0 ? (
                <div className="evening-empty">
                  <p>No pending legislation.</p>
                </div>
              ) : (
                <div className="evening-bills">
                  {bills.filter((b) => b.weekPresented === currentWeek).map((b) => (
                    <div key={b.id} className="evening-bill-item">
                      <span className="evening-bill-icon">{'\u2696\uFE0F'}</span>
                      <span className="evening-bill-title">{b.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div className="evening-reflection" variants={panelVariants}>
          <p>{reflection.text}</p>
        </motion.div>

        {/* ── Private Reflection ──────────────────────────────────── */}
        <motion.div variants={panelVariants} style={{
          maxWidth: '700px', margin: '0 auto', width: '100%',
          padding: '1.5rem 0',
        }}>
          <p style={{
            fontFamily: "'Special Elite', monospace", fontSize: '0.55rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--amber)', marginBottom: '0.6rem',
          }}>
            Private Reflection
          </p>
          {prompt && (
            <p style={{
              fontFamily: "'Crimson Text', Georgia, serif", fontSize: '0.8rem',
              color: 'rgba(201,168,76,0.5)', fontStyle: 'italic', marginBottom: '0.8rem',
            }}>
              {prompt}
            </p>
          )}
          <div style={{ position: 'relative' }}>
            {/* Ruled lines background */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(139,106,40,0.08) 23px, rgba(139,106,40,0.08) 24px)',
              borderRadius: '2px',
            }} />
            {/* Red margin line */}
            <div style={{
              position: 'absolute', left: '24px', top: 0, bottom: 0,
              width: '1px', background: 'rgba(200,80,60,0.2)', zIndex: 0,
              pointerEvents: 'none',
            }} />
            <textarea
              value={reflectionText}
              onChange={e => { setReflectionText(e.target.value); setReflectionSaved(false) }}
              placeholder="Write nothing, or write what you won't say aloud."
              maxLength={2000}
              style={{
                position: 'relative', zIndex: 1,
                width: '100%', minHeight: '80px', maxHeight: '160px',
                background: 'rgba(200,144,42,0.03)',
                border: '1px solid rgba(200,144,42,0.12)',
                borderRadius: '2px',
                outline: 'none', resize: 'vertical',
                fontFamily: "'Caveat', cursive",
                fontSize: '15px', lineHeight: '24px',
                color: 'var(--cream)',
                padding: '8px 14px 8px 32px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(139,106,40,0.2) transparent',
              }}
            />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '0.4rem',
          }}>
            <span style={{
              fontFamily: "'Special Elite', monospace", fontSize: '0.45rem',
              color: 'var(--muted)', letterSpacing: '0.1em',
            }}>
              {reflectionText.length} / 2000
            </span>
            {reflectionSaved && (
              <span style={{
                fontFamily: "'Special Elite', monospace", fontSize: '0.45rem',
                color: 'var(--accent-green)', letterSpacing: '0.1em',
              }}>
                Saved
              </span>
            )}
          </div>
        </motion.div>

        <motion.div className="evening-footer" variants={panelVariants}>
          {gateBlocked && (
            <div className="evening-gate-blocked">
              <div>
                <p className="evening-gate-label">REQUIRED BEFORE ADVANCING</p>
                <p className="evening-gate-message">{gateMessage}</p>
              </div>
              <button className="evening-gate-dismiss" onClick={dismissGate}>
                DISMISS
              </button>
            </div>
          )}
          <div className="evening-footer-buttons">
            <button
              className="advance-button"
              onClick={() => {
                if (!gateBlocked) {
                  // Save reflection before advancing (empty text = skip silently)
                  if (reflectionText.trim()) {
                    addJournalReflection(currentWeek, reflectionText)
                    setReflectionSaved(true)
                  }
                  playPageTurn()
                  completeWeek()
                }
              }}
              disabled={gateBlocked}
            >
              {currentWeek >= 52
                ? 'The Mandate is Complete \u2192'
                : `Advance to Week ${currentWeek + 1} \u2192`}
            </button>
            {!ironmanMode && (
              <>
                <button
                  className="evening-save-button"
                  onClick={() => setSaveMenuOpen(true)}
                >
                  Save / Load
                </button>
                <button
                  className="evening-save-button"
                  onClick={() => { saveGame(0, 'AUTOSAVE').catch(() => {}) }}
                >
                  Quick Save
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
