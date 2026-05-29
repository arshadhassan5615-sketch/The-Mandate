import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Bill } from '../types/bills'
import { useBillStore } from '../stores/billStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import {
  isVetoPowerRemoved,
  canAssemblyOverride,
  calculateVetoOverrideChance,
  evaluateBillPrerequisites,
} from '../engine/BillEngine'
import { playStamp } from '../engine/audioEngine'
import BillSignAnimation from './ui/BillSignAnimation'

const FACTION_NAMES: Record<string, string> = {
  reformists: 'Civic Renewal',
  halvekists: 'Halvekists',
  workersCoalition: "Workers' Coalition",
  ironCovenant: 'Iron Covenant',
  church: 'Church of the Eternal Flame',
  businessClass: 'Business Community',
  dravenni: 'Dravenni Liberation Front',
}

function getFactionSupport(bill: Bill): { support: string[]; oppose: string[] } {
  const support: string[] = []
  const oppose: string[] = []
  for (const effect of bill.signEffects) {
    const parts = effect.stat.split('.')
    if (parts[0] === 'factions' && parts[1]) {
      const name = FACTION_NAMES[parts[1]] || parts[1]
      if (effect.value > 0) support.push(name)
      else if (effect.value < 0) oppose.push(name)
    }
  }
  return { support, oppose }
}

function generateReactionText(
  bill: Bill,
  decision: 'signed' | 'vetoed' | 'overridden' | 'auto_passed',
): { speaker: string; text: string }[] {
  const reactions: { speaker: string; text: string }[] = []

  const factionReactions: Record<string, { name: string; signPositive: string; signNegative: string; vetoPositive: string; vetoNegative: string }> = {
    reformists: {
      name: 'Vyktor Reznik',
      signPositive: 'A victory for our mandate, Chancellor. The coalition will be pleased.',
      signNegative: 'Chancellor... our own base may not understand this decision.',
      vetoPositive: 'A wise restraint, Chancellor. Not every bill deserves ink.',
      vetoNegative: 'The reformist press is already drafting their editorials, Chancellor.',
    },
    halvekists: {
      name: 'Dražen Kolvar',
      signPositive: 'A sensible measure. Perhaps the new government understands governance after all.',
      signNegative: 'Another assault on tradition. The Halvekists will remember this.',
      vetoPositive: 'For once, the Chancellor shows prudence. We are... cautiously impressed.',
      vetoNegative: 'The opposition expected nothing less from this administration.',
    },
    workersCoalition: {
      name: 'Soraya Khaled',
      signPositive: 'The workers will remember this day, Chancellor. This is justice.',
      signNegative: "The workers' coalition expected better. Strikes may follow.",
      vetoPositive: 'You protected working families from bad legislation today.',
      vetoNegative: 'You turned your back on the workers who put you in office.',
    },
    ironCovenant: {
      name: 'General Brenner',
      signPositive: 'The military recognizes strength in this decision.',
      signNegative: 'Weakness. The Iron Covenant takes note.',
      vetoPositive: 'A strong Chancellor knows when to say no. Respect.',
      vetoNegative: 'The military establishment will not forget this slight.',
    },
    church: {
      name: 'Archbishop Renek',
      signPositive: 'A moral choice, blessed by the Flame. The Church is pleased.',
      signNegative: 'The faithful will pray for guidance... and for new leadership.',
      vetoPositive: 'The Church thanks the Chancellor for preserving our moral fabric.',
      vetoNegative: "The Archbishop's sermon this Sunday will address this... disappointment.",
    },
    businessClass: {
      name: 'Elara Vostane',
      signPositive: 'Sound fiscal policy, Chancellor. The markets will respond.',
      signNegative: 'This will cost us in investor confidence. I hope it was worth it.',
      vetoPositive: 'The business community breathes easier today.',
      vetoNegative: "You've spooked the markets. Capital is already moving.",
    },
    dravenni: {
      name: 'Idris Kaelen',
      signPositive: 'For the first time, the Dravenni people feel seen by their government.',
      signNegative: 'The Dravenni hoped for better. We have been disappointed before.',
      vetoPositive: 'At least the Chancellor did not make things worse today.',
      vetoNegative: 'Dravenhollow will not forget this. Every veto has a cost.',
    },
  }

  const effects = decision === 'vetoed' ? bill.vetoEffects : bill.signEffects
  for (const effect of effects) {
    const parts = effect.stat.split('.')
    if (parts[0] === 'factions' && parts[1]) {
      const reaction = factionReactions[parts[1]]
      if (reaction && Math.abs(effect.value) >= 10) {
        if (decision === 'signed' || decision === 'auto_passed' || decision === 'overridden') {
          reactions.push({
            speaker: reaction.name,
            text: effect.value > 0 ? reaction.signPositive : reaction.signNegative,
          })
        } else {
          reactions.push({
            speaker: reaction.name,
            text: effect.value > 0 ? reaction.vetoPositive : reaction.vetoNegative,
          })
        }
      }
    }
  }

  const proposerMap: Record<string, { sign: string; veto: string }> = {
    'Vyktor Reznik': { sign: 'The party thanks you for your signature, Chancellor.', veto: 'A difficult choice, Chancellor. The party will need to recalibrate.' },
    'Gregor Marić': { sign: 'Thirty years I waited for this day. Thank you, Chancellor.', veto: 'I will not forget this. The workers will not forget this.' },
    'Independent MPs + journalist lobby': { sign: 'A free press is the guardian of democracy. You chose wisely.', veto: 'The journalists\' union has issued a statement condemning this veto.' },
    'Business-class MPs from Aldenmoor': { sign: 'Aldenmoor celebrates tonight, Chancellor. Prosperity follows.', veto: 'A missed opportunity. Our competitors will not wait for us.' },
    'Church-allied conservative MPs': { sign: 'The faithful nation thanks you. Morality has prevailed.', veto: 'The Church will not remain silent on this. Expect sermons.' },
    "Vostane's allies in business community": { sign: 'The markets are surging on the news, Chancellor.', veto: 'Disappointing. Capital will find friendlier shores.' },
    'Iron Covenant allied MPs': { sign: 'Strength. Finally, a Chancellor who understands security.', veto: 'You have shown your true colors to the military establishment.' },
    'Danika Oberlin': { sign: 'Transparency wins. The people have a right to know.', veto: 'A dark day for accountability. The journalists are watching.' },
    'Reform/progressive coalition': { sign: 'Humanity first. This is the Veltria we voted for.', veto: 'The refugees will not disappear because you vetoed a bill.' },
    'Dusek via defense committee': { sign: 'The armed forces are grateful, Chancellor. We will not waste this.', veto: 'The military is concerned. Readiness is a matter of national survival.' },
    'Reform coalition + Dravenni sympathizers': { sign: 'A historic day for civil rights in Veltria.', veto: 'History will record this veto. It will not be kind.' },
    'Conservative rural MPs': { sign: 'Rural Veltria thanks the Chancellor for this lifeline.', veto: 'The farms will not forget this abandonment.' },
    'Reformists + Dravenni': { sign: 'Today, Veltria chose equality over fear. Justice has a long memory.', veto: 'The Dravenni community expected more from a reformist Chancellor.' },
    'Progressive coalition inspired by Jonas': { sign: 'Jonas will be proud. This is the Veltria you both dreamed of.', veto: 'Jonas is asking why. The children are asking why.' },
  }

  const proposerReaction = proposerMap[bill.proposer]
  if (proposerReaction && !reactions.some(r => r.speaker === bill.proposer)) {
    reactions.push({
      speaker: bill.proposer,
      text: decision === 'signed' || decision === 'auto_passed' || decision === 'overridden' ? proposerReaction.sign : proposerReaction.veto,
    })
  }

  const seen = new Set<string>()
  return reactions.filter(r => {
    if (seen.has(r.speaker)) return false
    seen.add(r.speaker)
    return true
  }).slice(0, 3)
}

type DecisionState = 'pending' | 'deciding' | 'decided' | 'overridden' | 'auto_passed'

export default function LegislationOverlay() {
  const { bills, history, recordDecision } = useBillStore()
  const gameState = useGameStore()
  const { activeFlags } = useNarrativeStore()
  const phase = useWeekStore(s => s.phase)

  const [billIndex, setBillIndex] = useState(0)
  const [decisionState, setDecisionState] = useState<DecisionState>('pending')
  const [chosenAction, setChosenAction] = useState<'signed' | 'vetoed'>('signed')
  const [reactions, setReactions] = useState<{ speaker: string; text: string }[]>([])
  const [overrideResult, setOverrideResult] = useState<{ overridden: boolean; assemblyVote: number } | null>(null)

  const vetoRemoved = useMemo(() => isVetoPowerRemoved(activeFlags), [activeFlags])
  const assemblyCanOverride = useMemo(() => canAssemblyOverride(activeFlags), [activeFlags])

  // Get pending bills for this week
  const pendingBills = useMemo(() => {
    if (phase !== 'legislation') return []
    return bills.filter(b => {
      if (b.weekPresented !== gameState.currentWeek) return false
      if (history.some(h => h.billId === b.id)) return false
      if (b.prerequisites?.length) {
        if (!evaluateBillPrerequisites(b, gameState, activeFlags)) return false
      }
      return true
    })
  }, [phase, bills, gameState.currentWeek, history, gameState, activeFlags])

  const currentBill = pendingBills[billIndex] ?? null

  // Reset state when entering legislation phase
  useEffect(() => {
    if (phase === 'legislation') {
      setBillIndex(0)
      setDecisionState('pending')
      setReactions([])
      setOverrideResult(null)
    }
  }, [phase])

  if (phase !== 'legislation' || !currentBill) return null

  const bill = currentBill

  const factionInfo = getFactionSupport(bill)

  const applyBillEffects = (
    modifiers: Array<{ stat: string; operation: 'add' | 'set' | 'multiply'; value: number }>,
    flags: string[],
  ) => {
    gameState.applyModifiers(modifiers)
    useNarrativeStore.getState().addFlags(flags)

    // Bill budget cost affects national debt directly
    // Negative budgetCost = spending (adds debt), positive = revenue (reduces debt)
    if (bill.budgetCost !== 0) {
      gameState.applyModifiers([
        { stat: 'nation.nationalDebt', operation: 'add', value: -bill.budgetCost },
      ])
    }
  }

  const handleSign = () => {
    if (decisionState !== 'pending') return
    setChosenAction('signed')
    setDecisionState('deciding')
    playStamp()

    setTimeout(() => {
      applyBillEffects(bill.signEffects, bill.signFlags)
      const reactTexts = generateReactionText(bill, 'signed')
      setReactions(reactTexts)
      setDecisionState('decided')
    }, 600)
  }

  const handleVeto = () => {
    if (decisionState !== 'pending') return
    setChosenAction('vetoed')
    setDecisionState('deciding')
    playStamp()

    setTimeout(() => {
      // Check for assembly override
      if (assemblyCanOverride) {
        const result = calculateVetoOverrideChance(bill, gameState)
        if (result.overridden) {
          setOverrideResult({ overridden: true, assemblyVote: result.assemblyVote })
          applyBillEffects(bill.signEffects, bill.signFlags)
          const reactTexts = generateReactionText(bill, 'overridden')
          setReactions([
            { speaker: 'National Assembly', text: `The Assembly has overridden your veto by a vote of ${result.assemblyVote}%. The bill becomes law despite your objection.` },
            ...reactTexts,
          ])
          setDecisionState('overridden')
          return
        }
      }

      applyBillEffects(bill.vetoEffects, bill.vetoFlags)
      const reactTexts = generateReactionText(bill, 'vetoed')
      setReactions(reactTexts)
      setDecisionState('decided')
    }, 600)
  }

  const handleAutoPass = () => {
    if (decisionState !== 'pending') return
    setDecisionState('auto_passed')
    playStamp()

    setTimeout(() => {
      applyBillEffects(bill.signEffects, bill.signFlags)
      setReactions([
        { speaker: 'Vyktor Reznik', text: 'Under the reformed constitution, the Chancellor\'s signature is automatic. The Assembly has spoken.' },
      ])
    }, 400)
  }

  const advanceToNextBill = () => {
    const entry = {
      billId: bill.id,
      weekPresented: bill.weekPresented,
      decision: decisionState === 'overridden' ? 'overridden' as const
        : decisionState === 'auto_passed' ? 'auto_passed' as const
        : chosenAction === 'signed' ? 'signed' as const
        : 'vetoed' as const,
      weekDecided: gameState.currentWeek,
    }
    recordDecision(entry)

    if (billIndex + 1 < pendingBills.length) {
      setBillIndex(billIndex + 1)
      setDecisionState('pending')
      setReactions([])
      setOverrideResult(null)
    } else {
      // All bills processed — transition to agenda
      useWeekStore.getState().endLegislation()
    }
  }

  // Auto-pass immediately if veto power removed
  if (vetoRemoved && decisionState === 'pending') {
    handleAutoPass()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <AnimatePresence mode="wait">
        {decisionState === 'pending' && (
          <motion.div
            key={`bill-${bill.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-3xl mx-4"
            style={{
              background: '#1e1b15',
              border: '2px solid var(--border-raised)',
              borderRadius: '2px',
              padding: '3rem 3.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--amber-dim) transparent',
            }}
          >
            {/* Official seal watermark */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.035,
              pointerEvents: 'none',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '16rem',
              color: 'var(--amber)',
            }}>
              {'⚜'}
            </div>

            {/* Bill counter */}
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.15em',
              color: 'var(--muted)',
              textAlign: 'right',
              marginBottom: '0.5rem',
              position: 'relative',
              zIndex: 1,
            }}>
              Bill {billIndex + 1} of {pendingBills.length}
            </p>

            {/* Document header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.58rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--amber-dim)',
                marginBottom: '0.8rem',
              }}>
                Republic of Veltria · National Assembly · 1963
              </p>
              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.2rem' }} />
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '0.6rem',
              }}>
                Legislation Awaiting Executive Action
              </p>
              <h1 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--cream)',
                lineHeight: 1.3,
                marginBottom: '0.3rem',
              }}>
                {bill.title}
              </h1>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.7rem',
                color: 'var(--amber-dim)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {bill.shortName} · Week {bill.weekPresented}
              </p>
            </div>

            {/* Proposer */}
            <div style={{
              marginBottom: '2rem',
              padding: '0.8rem 1.2rem',
              background: 'rgba(200,144,42,0.06)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              position: 'relative',
              zIndex: 1,
            }}>
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.55rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '0.25rem',
              }}>
                Proposed by
              </p>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                color: 'var(--cream)',
              }}>
                {bill.proposer}
                <span style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.55rem',
                  color: 'var(--muted)',
                  marginLeft: '0.6rem',
                  letterSpacing: '0.08em',
                }}>
                  · {FACTION_NAMES[bill.faction] || bill.faction}
                </span>
              </p>
            </div>

            {/* Full text */}
            <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.55rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '1rem',
              }}>
                Full Text of the Act
              </p>
              <div style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '0.88rem',
                color: 'var(--cream)',
                lineHeight: 1.85,
                whiteSpace: 'pre-line',
                padding: '0 0.5rem',
              }}>
                {bill.fullText}
              </div>
            </div>

            {/* Budget note */}
            {bill.budgetCost !== 0 && (
              <div style={{
                marginBottom: '2rem',
                padding: '0.6rem 1rem',
                background: bill.budgetCost > 0 ? 'rgba(74,107,58,0.12)' : 'rgba(139,46,46,0.1)',
                border: `1px solid ${bill.budgetCost > 0 ? 'rgba(74,107,58,0.3)' : 'rgba(139,46,46,0.25)'}`,
                borderRadius: '2px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.7rem',
                  color: bill.budgetCost > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  letterSpacing: '0.05em',
                }}>
                  {bill.budgetCost > 0
                    ? `Treasury Revenue: +${bill.budgetCost}M VK`
                    : `Budget Cost: ${Math.abs(bill.budgetCost)}M VK`}
                </p>
              </div>
            )}

            {/* Faction supporters/opponents */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              {factionInfo.support.length > 0 && (
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.5rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-green)',
                    marginBottom: '0.4rem',
                  }}>
                    Support
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {factionInfo.support.map(f => (
                      <span key={f} style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '0.55rem',
                        padding: '0.15rem 0.45rem',
                        background: 'rgba(74,107,58,0.12)',
                        border: '1px solid rgba(74,107,58,0.25)',
                        borderRadius: '2px',
                        color: 'var(--accent-green)',
                        letterSpacing: '0.06em',
                      }}>
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {factionInfo.oppose.length > 0 && (
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.5rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-red)',
                    marginBottom: '0.4rem',
                  }}>
                    Oppose
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {factionInfo.oppose.map(f => (
                      <span key={f} style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '0.55rem',
                        padding: '0.15rem 0.45rem',
                        background: 'rgba(139,46,46,0.1)',
                        border: '1px solid rgba(139,46,46,0.25)',
                        borderRadius: '2px',
                        color: 'var(--accent-red)',
                        letterSpacing: '0.06em',
                      }}>
                        ✗ {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              <button
                onClick={handleSign}
                className="choice-btn"
                style={{
                  width: 'auto',
                  minWidth: bill.isVetoable ? '200px' : '260px',
                  background: 'rgba(74,107,58,0.15)',
                  borderColor: 'rgba(74,107,58,0.4)',
                  color: 'var(--accent-green)',
                  fontSize: '0.82rem',
                  padding: '0.8rem 1.8rem',
                }}
              >
                {bill.isVetoable ? 'SIGN INTO LAW' : 'ACKNOWLEDGE & ENACT'}
                <span style={{
                  display: 'block',
                  fontSize: '0.55rem',
                  color: 'var(--muted)',
                  letterSpacing: '0.1em',
                  marginTop: '0.2rem',
                }}>
                  {bill.isVetoable ? 'Executive Approval' : 'Constitutional Requirement'}
                </span>
              </button>
              {bill.isVetoable && (
                <button
                  onClick={handleVeto}
                  className="choice-btn"
                  style={{
                    width: 'auto',
                    minWidth: '200px',
                    background: 'rgba(139,46,46,0.12)',
                    borderColor: 'rgba(139,46,46,0.4)',
                    color: 'var(--accent-red)',
                    fontSize: '0.82rem',
                    padding: '0.8rem 1.8rem',
                  }}
                >
                  EXERCISE VETO
                  <span style={{
                    display: 'block',
                    fontSize: '0.55rem',
                    color: 'var(--muted)',
                    letterSpacing: '0.1em',
                    marginTop: '0.2rem',
                  }}>
                    {assemblyCanOverride ? 'Assembly May Override' : 'Final Rejection'}
                  </span>
                </button>
              )}
            </div>

            {assemblyCanOverride && bill.isVetoable && (
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.55rem',
                color: 'var(--muted)',
                textAlign: 'center',
                marginTop: '1rem',
                letterSpacing: '0.06em',
                position: 'relative',
                zIndex: 1,
              }}>
                Under the current constitution, the National Assembly may override a veto with sufficient support.
              </p>
            )}

            {!bill.isVetoable && (
              <p style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.55rem',
                color: 'var(--muted)',
                textAlign: 'center',
                marginTop: '1rem',
                letterSpacing: '0.06em',
                fontStyle: 'italic',
                position: 'relative',
                zIndex: 1,
              }}>
                Under the reformed constitution, the Chancellor's signature is automatic.
              </p>
            )}
          </motion.div>
        )}

        {decisionState === 'deciding' && (
          <motion.div
            key="bill-stamp"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '3rem',
              color: chosenAction === 'signed' ? 'var(--accent-green)' : 'var(--accent-red)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '2rem 3rem',
              border: `3px solid ${chosenAction === 'signed' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
              borderRadius: '4px',
              transform: 'rotate(-3deg)',
              background: chosenAction === 'signed'
                ? 'rgba(74,107,58,0.08)'
                : 'rgba(139,46,46,0.08)',
            }}>
              {chosenAction === 'signed' ? 'Signed into Law' : 'VETOED'}
            </div>

            {/* Bill signature/stamp animation */}
            {decisionState === 'deciding' && (
              <BillSignAnimation type={chosenAction === 'signed' ? 'approval' : 'veto'} />
            )}
          </motion.div>
        )}

        {decisionState === 'auto_passed' && (
          <motion.div
            key="bill-auto"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '1.5rem',
              color: 'var(--amber-dim)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '1.5rem 2.5rem',
              border: '2px solid var(--border)',
              borderRadius: '4px',
              background: 'rgba(200,144,42,0.06)',
            }}>
              Bill {billIndex + 1} of {pendingBills.length} Enacted
              <span style={{
                display: 'block',
                fontSize: '0.6rem',
                color: 'var(--muted)',
                marginTop: '0.5rem',
              }}>
                Automatic under reformed constitution
              </span>
            </div>
          </motion.div>
        )}

        {(decisionState === 'decided' || decisionState === 'overridden') && (
          <motion.div
            key="bill-reactions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-2xl mx-4"
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              padding: '2.5rem 3rem',
            }}
          >
            {/* Veto Override Banner */}
            {overrideResult?.overridden && (
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(139,46,46,0.12)',
                border: '1px solid rgba(139,46,46,0.3)',
                borderRadius: '2px',
              }}>
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  color: 'var(--accent-red)',
                  textTransform: 'uppercase',
                  marginBottom: '0.3rem',
                }}>
                  Veto Overridden
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  color: 'var(--muted)',
                  fontStyle: 'italic',
                }}>
                  The National Assembly has exercised its constitutional authority to override your veto.
                </p>
              </div>
            )}

            <h3 style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--amber-dim)',
              marginBottom: '1.2rem',
            }}>
              Reactions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {reactions.map((r, i) => (
                <div key={i} style={{
                  padding: '0.8rem 1rem',
                  background: 'rgba(200,144,42,0.04)',
                  borderLeft: '2px solid var(--border)',
                }}>
                  <p style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.58rem',
                    letterSpacing: '0.1em',
                    color: 'var(--amber)',
                    marginBottom: '0.15rem',
                    textTransform: 'uppercase',
                  }}>
                    {r.speaker}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem',
                    color: 'var(--cream)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}>
                    "{r.text}"
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className="choice-btn"
                onClick={advanceToNextBill}
                style={{ width: 'auto', minWidth: '220px' }}
              >
                {billIndex + 1 < pendingBills.length ? 'Next Bill →' : 'Proceed to Agenda'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
