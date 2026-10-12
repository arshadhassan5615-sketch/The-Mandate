import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
import { audioManager } from '../engine/AudioManager'
import veltriaSeal from '../assets/images/veltria_seal.png'
import katerinSignature from '../assets/images/katerin_signature.jpeg'
import { Z } from '../constants/zIndex'
import { useIsMobile } from '../hooks/useIsMobile'
import FiscalNote from './ui/FiscalNote'

const FACTION_NAMES: Record<string, string> = {
  reformists: 'Civic Renewal',
  halvekists: 'Halvekists',
  workersCoalition: "Workers' Coalition",
  ironCovenant: 'Iron Covenant',
  church: 'Church of the Eternal Flame',
  businessClass: 'Business Community',
  dravenni: 'Dravenni Liberation Front',
}

void FACTION_NAMES // exposed for downstream overlays; keep the map for label reuse

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
  const [, setShowStamp] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout)
    }
  }, [])

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
      setShowStamp(false)
      setShowSignature(false)
    }
  }, [phase])

  if (phase !== 'legislation' || !currentBill) return null

  const bill = currentBill

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
    if (documentRef.current) documentRef.current.scrollTop = 0
    setChosenAction('signed')
    setDecisionState('deciding')
    setShowSignature(true)
    playStamp()
    audioManager.fadeToTrack('theme_reform_victory', 1500)

    // Apply bill effects immediately (behind the animation)
    applyBillEffects(bill.signEffects, bill.signFlags)

    // Stamp slams at 600ms
    timeoutRefs.current.push(setTimeout(() => {
      setShowStamp(true)
    }, 600))

    // Panel closes at 3000ms
    timeoutRefs.current.push(setTimeout(() => {
      const reactTexts = generateReactionText(bill, 'signed')
      setReactions(reactTexts)
      setDecisionState('decided')
      setShowSignature(false)
      setShowStamp(false)
    }, 3000))
  }

  const handleVeto = () => {
    if (decisionState !== 'pending') return
    if (documentRef.current) documentRef.current.scrollTop = 0
    setChosenAction('vetoed')
    setDecisionState('deciding')
    setShowStamp(true)
    playStamp()
    audioManager.fadeToTrack('theme_scandal_short', 1500)

    // Check for assembly override
    if (assemblyCanOverride) {
      const result = calculateVetoOverrideChance(bill, gameState)
      if (result.overridden) {
        timeoutRefs.current.push(setTimeout(() => {
          setOverrideResult({ overridden: true, assemblyVote: result.assemblyVote })
          applyBillEffects(bill.signEffects, bill.signFlags)
          const reactTexts = generateReactionText(bill, 'overridden')
          setReactions([
            { speaker: 'National Assembly', text: `The Assembly has overridden your veto by a vote of ${result.assemblyVote}%. The bill becomes law despite your objection.` },
            ...reactTexts,
          ])
          setDecisionState('overridden')
          setShowStamp(false)
        }, 2000))
        return
      }
    }

    applyBillEffects(bill.vetoEffects, bill.vetoFlags)
    timeoutRefs.current.push(setTimeout(() => {
      const reactTexts = generateReactionText(bill, 'vetoed')
      setReactions(reactTexts)
      setDecisionState('decided')
      setShowStamp(false)
    }, 2200))
  }

  const handleAutoPass = () => {
    if (decisionState !== 'pending') return
    setDecisionState('auto_passed')
    playStamp()

    timeoutRefs.current.push(setTimeout(() => {
      applyBillEffects(bill.signEffects, bill.signFlags)
      setReactions([
        { speaker: 'Vyktor Reznik', text: 'Under the reformed constitution, the Chancellor\'s signature is automatic. The Assembly has spoken.' },
      ])
    }, 400))
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
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: Z.overlay,
    }}>
      {decisionState !== 'decided' && decisionState !== 'overridden' ? (
        <>
          {/* THE DOCUMENT */}
          <div style={{
            background: '#f5f0e0',
            width: 'min(680px, 100vw)',
            height: '100vh',
            boxShadow: '0 0 80px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            padding: isMobile ? '16px 16px 0' : '16px 44px 0',
          }}>
            {/* SEAL */}
            <div style={{
              textAlign: 'center',
              marginBottom: '6px',
            }}>
              <img
                src={veltriaSeal}
                alt="Veltria Seal"
                style={{
                  width: '52px',
                  height: '52px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                  mixBlendMode: 'multiply',
                  opacity: 0.92,
                }}
              />
            </div>

            {/* BILL TITLE */}
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: '19px',
              fontWeight: '800',
              fontStyle: 'italic',
              color: '#0d0a06',
              textAlign: 'center',
              lineHeight: '1.25',
              marginBottom: '4px',
            }}>
              {bill.title}
            </div>

            {/* BILL CODE */}
            <div style={{
              fontSize: '9px',
              letterSpacing: '2px',
              color: '#6b4f2a',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: '12px',
            }}>
              {bill.shortName} · Week {bill.weekPresented}, 1963
            </div>

            {/* FISCAL NOTE — the budget cost, stated before signing */}
            <FiscalNote budgetCost={bill.budgetCost} />

            {/* BILL TEXT - scrollable internally */}
            <div
              ref={documentRef}
              className="bill-text-area"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: '13.5px',
                lineHeight: '1.55',
                color: '#0d0a06',
                fontWeight: 400,
                textAlign: isMobile ? 'left' : 'justify',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                whiteSpace: 'pre-line',
                overflowWrap: 'break-word',
                paddingRight: '8px',
                padding: isMobile ? '0 4px' : '0 44px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(139,115,85,0.2) transparent',
              }}
            >
              {bill.fullText}
            </div>

            {/* SIGNATURE BLOCK */}
            <div style={{
              flexShrink: 0,
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{
                width: '280px',
                height: '126px',
                borderBottom: '1px solid #333',
                position: 'relative',
                marginBottom: '6px',
              }}>
                {showSignature && chosenAction === 'signed' && (
                  <img
                    src={katerinSignature}
                    alt="Signature"
                    style={{
                      position: 'absolute',
                      bottom: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      height: '126px',
                      width: 'auto',
                      maxWidth: '585px',
                      objectFit: 'contain',
                      mixBlendMode: 'multiply',
                      filter: 'contrast(1.2)',
                      animation: 'signatureWrite 900ms ease-out forwards',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
              <div style={{
                fontSize: '8px',
                letterSpacing: '3px',
                color: '#666',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}>
                Chancellor of the Republic
              </div>
            </div>

            {/* BUTTONS - inside document at bottom */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 32px 12px',
              borderTop: '1px solid #e0d5c0',
              marginTop: '16px',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              {bill.isVetoable && (
                <button
                  onClick={handleVeto}
                  disabled={decisionState !== 'pending'}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 32%, #e06868, #8b1515)',
                  border: '3px solid rgba(255,255,255,0.12)',
                  color: 'white',
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: decisionState !== 'pending' ? 'default' : 'pointer',
                    boxShadow: '0 6px 28px rgba(139,21,21,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    transition: 'all 0.15s ease',
                    opacity: decisionState !== 'pending' ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    if (decisionState !== 'pending') return
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 36px rgba(139,21,21,0.85), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,21,21,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)'
                  }}
                  onMouseDown={e => {
                    if (decisionState !== 'pending') return
                    e.currentTarget.style.transform = 'scale(0.97)'
                  }}
                >
                  Veto
                </button>
              )}
              <button
                onClick={handleSign}
                disabled={decisionState !== 'pending'}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 32%, #5dc470, #1a6b2a)',
                  border: '3px solid rgba(255,255,255,0.12)',
                  color: 'white',
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: decisionState !== 'pending' ? 'default' : 'pointer',
                  boxShadow: '0 6px 28px rgba(26,107,42,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  transition: 'all 0.15s ease',
                  opacity: decisionState !== 'pending' ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => {
                  if (decisionState !== 'pending') return
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 10px 36px rgba(26,107,42,0.85), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(26,107,42,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)'
                }}
                onMouseDown={e => {
                  if (decisionState !== 'pending') return
                  e.currentTarget.style.transform = 'scale(0.97)'
                }}
              >
                {bill.isVetoable ? 'Sign' : 'Enact'}
              </button>
            </div>
          </div>
        </>
      ) : (decisionState as DecisionState) === 'auto_passed' ? (
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
      ) : (
        /* Reactions screen */
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
    </div>
  )
}
