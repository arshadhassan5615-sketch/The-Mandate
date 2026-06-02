import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekStore } from '../stores/weekStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import VoteTracker from './VoteTracker'

const mono: React.CSSProperties = {
  fontFamily: "'Special Elite', monospace",
}

type Stage = 'voting' | 'counting' | 'nail_biting' | 'result' | 'done'

const ASSEMBLY_NAMES = [
  'P. Valkova', 'O. Delvin', 'T. Morzec', 'H. Drexler', 'B. Tolev',
  'K. Borik', 'I. Czernova', 'L. Voszek', 'A. Korvac', 'M. Harzen',
  'R. Zolvic', 'D. Talev', 'G. Volnik', 'V. Tatarenko', 'S. Brakmar',
  'F. Kolenic', 'N. Svenko', 'Y. Rakovsky', 'E. Brandic', 'W. Mirtuk',
]

// Patterns: 7 YES + 5 NO, threshold crossed near vote 8
const PASS_ORDER: Array<'YES' | 'NO'> = [
  'NO', 'NO', 'NO', 'YES', 'NO', 'YES', 'NO', 'YES', 'YES', 'YES', 'YES', 'YES',
]
// Pattern: 5 YES + 7 NO, YES approaches threshold but falls short
const FAIL_ORDER: Array<'YES' | 'NO'> = [
  'YES', 'NO', 'YES', 'NO', 'YES', 'NO', 'NO', 'NO', 'YES', 'NO', 'YES', 'NO',
]

function buildSwingSequence(
  finalYes: number,
  finalNo: number,
  threshold: number,
): Array<{ name: string; vote: 'YES' | 'NO' }> {
  const passed = finalYes >= threshold
  const order = passed ? PASS_ORDER : FAIL_ORDER
  // Use a deterministic shuffle keyed on the result so rerenders are stable
  const seed = finalYes * 31 + finalNo * 17
  const names = [...ASSEMBLY_NAMES]
    .map((n, i) => ({ n, sort: (seed + i * 7) % ASSEMBLY_NAMES.length }))
    .sort((a, b) => a.sort - b.sort)
    .map(x => x.n)
    .slice(0, 12)
  return order.map((vote, i) => ({ name: names[i], vote }))
}

export default function VoteResult() {
  const voteResult  = useWeekStore(s => s.voteResult)
  const voteConfig  = useWeekStore(s => s.voteConfig)
  const advanceQueue = useWeekStore(s => s.advanceQueue)

  const [stage, setStage] = useState<Stage>('voting')
  const [countedSeats, setCountedSeats] = useState(0)
  const [countedYes,   setCountedYes]   = useState(0)
  const [countedNo,    setCountedNo]    = useState(0)
  const [revealIndex,  setRevealIndex]  = useState(0)

  const totalSeats = voteConfig?.totalSeats ?? 250
  const threshold  = voteConfig?.threshold  ?? 126
  const finalYes   = voteResult?.finalYesSeats  ?? 0
  const finalNo    = voteResult?.finalNoSeats   ?? 0
  const passed     = voteResult?.passed   ?? false
  const margin     = Math.abs(voteResult?.margin ?? 0)
  const isClose    = Math.abs(finalYes - threshold) <= 5

  const voteLabel = voteConfig?.voteType === 'no_confidence'
    ? 'MOTION OF NO CONFIDENCE'
    : voteConfig?.voteType === 'referendum'
    ? 'CONSTITUTIONAL REFERENDUM'
    : voteConfig?.voteType === 'impeachment'
    ? 'ARTICLES OF IMPEACHMENT'
    : 'ASSEMBLY DIVISION'

  // Pre-computed swing sequence (stable across renders)
  const swingVotes = useMemo(
    () => buildSwingSequence(finalYes, finalNo, threshold),
    [finalYes, finalNo, threshold],
  )

  // Baseline counts before showing swing votes
  const nbStartYes = isClose ? (passed ? finalYes - 7 : finalYes - 5) : 0
  const nbStartNo  = isClose ? (passed ? finalNo  - 5 : finalNo  - 7) : 0

  // Running YES/NO counts derived from revealIndex
  const nbCurrentYes = nbStartYes +
    swingVotes.slice(0, revealIndex).filter(v => v.vote === 'YES').length
  const nbCurrentNo  = nbStartNo  +
    swingVotes.slice(0, revealIndex).filter(v => v.vote === 'NO').length

  // Stage 1 → Stage 2
  useEffect(() => {
    if (stage !== 'voting') return
    const t = setTimeout(() => setStage('counting'), 3000)
    return () => clearTimeout(t)
  }, [stage])

  // Stage 2: animated counting
  useEffect(() => {
    if (stage !== 'counting') return
    const totalDuration = 5000
    const steps = 40
    const interval = totalDuration / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentTotal = Math.floor(eased * totalSeats)
      const yesRatio = finalYes / (finalYes + finalNo || 1)
      setCountedSeats(currentTotal)
      setCountedYes(Math.floor(currentTotal * yesRatio))
      setCountedNo(currentTotal - Math.floor(currentTotal * yesRatio))

      if (step >= steps) {
        clearInterval(timer)
        setCountedSeats(finalYes + finalNo + (voteResult?.finalUndecidedSeats ?? 0))
        setCountedYes(finalYes)
        setCountedNo(finalNo)
        setTimeout(() => {
          setStage(isClose ? 'nail_biting' : 'result')
        }, 800)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [stage, finalYes, finalNo, totalSeats, voteResult?.finalUndecidedSeats, isClose])

  // Stage 3: nail-biting individual reveals (500ms per vote)
  useEffect(() => {
    if (stage !== 'nail_biting') return
    if (revealIndex >= swingVotes.length) {
      const t = setTimeout(() => setStage('result'), 900)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setRevealIndex(i => i + 1), 520)
    return () => clearTimeout(t)
  }, [stage, revealIndex, swingVotes.length])

  const handleContinue = useCallback(() => {
    if (stage !== 'result' && stage !== 'done') return
    setStage('done')
    advanceQueue()
  }, [stage, advanceQueue])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (stage === 'result' || stage === 'done') handleContinue()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, handleContinue])

  const countingProjection = {
    yesSeats: countedYes,
    noSeats: countedNo,
    undecidedSeats: totalSeats - countedYes - countedNo,
    threshold,
    totalSeats,
    willPass: countedYes >= threshold,
    margin: countedYes - threshold,
    breakdown: [],
  }

  const finalProjection = {
    yesSeats: finalYes,
    noSeats: finalNo,
    undecidedSeats: voteResult?.finalUndecidedSeats ?? 0,
    threshold,
    totalSeats,
    willPass: passed,
    margin: voteResult?.margin ?? 0,
    breakdown: [],
  }

  // Determine if threshold was just crossed at this reveal index
  const prevYes = nbStartYes + swingVotes.slice(0, revealIndex - 1).filter(v => v.vote === 'YES').length
  const thresholdJustCrossed = revealIndex > 0
    && swingVotes[revealIndex - 1]?.vote === 'YES'
    && prevYes < threshold
    && nbCurrentYes >= threshold

  return (
    <div style={overlayStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={panelStyle}
      >
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ ...mono, fontSize: '0.6rem', letterSpacing: '0.28em', color: 'var(--amber-dim)', textTransform: 'uppercase' }}>
            ▸ ASSEMBLY VOTE — {voteLabel}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'voting' && (
            <motion.div
              key="voting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={stageContentStyle}
            >
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ ...mono, fontSize: '0.85rem', color: 'var(--amber-dim)', textAlign: 'center', letterSpacing: '0.1em' }}
              >
                THE ASSEMBLY IS VOTING...
              </motion.p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
                Members are casting their ballots. The Speaker will announce the result shortly.
              </p>
              <div style={pulsingBarStyle}>
                <motion.div
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 2.8, ease: 'easeInOut' }}
                  style={{ height: 2, backgroundColor: 'var(--amber-dim)' }}
                />
              </div>
            </motion.div>
          )}

          {stage === 'counting' && (
            <motion.div
              key="counting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={stageContentStyle}
            >
              <p style={{ ...mono, fontSize: '0.7rem', color: 'var(--amber-dim)', textAlign: 'center', letterSpacing: '0.1em', marginBottom: 20 }}>
                BALLOTS BEING COUNTED...
              </p>
              <VoteTracker
                projection={countingProjection}
                animated={false}
                showThreshold
                tension={Math.abs(countedYes - threshold) <= 5 ? 0.9 : 0}
              />
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <motion.span
                  key={countedSeats}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  style={{ ...mono, fontSize: '1.2rem', color: 'var(--text)' }}
                >
                  {countedSeats} / {totalSeats}
                </motion.span>
                <p style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 4 }}>
                  SEATS COUNTED
                </p>
              </div>
              {Math.abs(countedYes - threshold) <= 8 && countedSeats > totalSeats * 0.6 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ ...mono, fontSize: '0.6rem', color: 'var(--amber-dim)', textAlign: 'center', marginTop: 12, letterSpacing: '0.1em' }}
                >
                  TOO CLOSE TO CALL...
                </motion.p>
              )}
            </motion.div>
          )}

          {stage === 'nail_biting' && (
            <motion.div
              key="nail_biting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={stageContentStyle}
            >
              {/* Running tally header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ ...mono, fontSize: '0.6rem', color: 'var(--amber-dim)', letterSpacing: '0.2em' }}
                >
                  ▸ INDIVIDUAL VOTES BEING RECORDED
                </motion.span>
                <div style={{ display: 'flex', gap: 16, ...mono, fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--accent-green)' }}>YES {nbCurrentYes}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>NEED {threshold}</span>
                  <span style={{ color: 'var(--accent-red)' }}>NO {nbCurrentNo}</span>
                </div>
              </div>

              {/* Threshold flash on crossing */}
              {thresholdJustCrossed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1.05, 1, 1] }}
                  transition={{ duration: 1.6, times: [0, 0.2, 0.7, 1] }}
                  style={{ ...mono, textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent-green)', letterSpacing: '0.2em', marginBottom: 8 }}
                >
                  ★ THRESHOLD REACHED ★
                </motion.div>
              )}

              {/* Individual vote reveals */}
              <div style={voteListStyle}>
                {swingVotes.slice(0, revealIndex).map((v, i) => {
                  const isDecisive = v.vote === 'YES'
                    && nbStartYes + swingVotes.slice(0, i + 1).filter(x => x.vote === 'YES').length === threshold
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        ...voteEntryStyle,
                        borderColor: isDecisive ? 'var(--accent-green)' : 'var(--border)',
                        backgroundColor: isDecisive ? 'rgba(64,160,64,0.08)' : 'transparent',
                      }}
                    >
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', ...mono, minWidth: 80 }}>
                        {v.name}
                      </span>
                      <span style={{
                        ...mono,
                        fontSize: '0.62rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.08em',
                        color: v.vote === 'YES' ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {v.vote}
                        {isDecisive && ' ←'}
                      </span>
                    </motion.div>
                  )
                })}
                {/* Pending indicator */}
                {revealIndex < swingVotes.length && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    style={{ ...mono, fontSize: '0.55rem', color: 'var(--amber-dim)', paddingLeft: 4, marginTop: 4 }}
                  >
                    ...
                  </motion.div>
                )}
              </div>

              {/* Live mini bar */}
              <div style={{ marginTop: 16 }}>
                <VoteTracker
                  projection={{
                    yesSeats: nbCurrentYes,
                    noSeats: nbCurrentNo,
                    undecidedSeats: totalSeats - nbCurrentYes - nbCurrentNo,
                    threshold,
                    totalSeats,
                    willPass: nbCurrentYes >= threshold,
                    margin: nbCurrentYes - threshold,
                    breakdown: [],
                  }}
                  compact
                  showThreshold
                  tension={0.9}
                />
              </div>
            </motion.div>
          )}

          {stage === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              style={stageContentStyle}
            >
              <VoteTracker
                projection={finalProjection}
                animated={false}
                showThreshold
              />

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    ...mono,
                    fontSize: '0.95rem',
                    letterSpacing: '0.1em',
                    color: passed ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}
                >
                  {passed ? 'THE MOTION PASSES' : 'THE MOTION FAILS'}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: 8 }}
                >
                  {finalYes} YES — {finalNo} NO — {voteResult?.finalUndecidedSeats ?? 0} ABSTAINED
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  style={{
                    ...mono,
                    fontSize: '0.65rem',
                    color: 'var(--muted)',
                    marginTop: 6,
                    letterSpacing: '0.05em',
                  }}
                >
                  MARGIN: {margin} SEAT{margin !== 1 ? 'S' : ''} • THRESHOLD: {threshold}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={resultDescStyle}
              >
                {passed && margin >= 20 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--accent-green)', textAlign: 'center' }}>
                    A decisive victory. Your government's agenda has a clear mandate from the Assembly.
                  </p>
                )}
                {passed && margin < 20 && margin >= 5 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--amber-dim)', textAlign: 'center' }}>
                    It passed — but not comfortably. The narrow margin will embolden your opponents.
                  </p>
                )}
                {passed && margin < 5 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--amber-dim)', textAlign: 'center' }}>
                    By a handful of votes. This was closer than anyone expected. The political cost will be measured in the weeks ahead.
                  </p>
                )}
                {!passed && margin >= 20 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--accent-red)', textAlign: 'center' }}>
                    A heavy defeat. Your opponents are emboldened. Your allies are questioning their loyalty. The government is wounded.
                  </p>
                )}
                {!passed && margin < 20 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--accent-red)', textAlign: 'center' }}>
                    A narrow defeat — somehow worse than a landslide. So close that every absent ally becomes a name you will not forget.
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {(stage === 'result' || stage === 'done') && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: stage === 'done' ? 0 : 2 }}
            onClick={handleContinue}
            style={continueBtnStyle}
          >
            CONTINUE
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  backgroundColor: 'rgba(12,10,8,0.94)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  paddingTop: '48px',
  paddingRight: '60px',
}

const panelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 700,
  backgroundColor: 'rgba(20,16,12,0.95)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '2.5rem 3rem',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--border)',
}

const stageContentStyle: React.CSSProperties = {
  minHeight: 280,
}

const pulsingBarStyle: React.CSSProperties = {
  width: '60%',
  margin: '24px auto 0',
}

const resultDescStyle: React.CSSProperties = {
  marginTop: 20,
  padding: '1rem',
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: 4,
}

const continueBtnStyle: React.CSSProperties = {
  fontFamily: "'Special Elite', monospace",
  display: 'block',
  margin: '2rem auto 0',
  padding: '0.75rem 3rem',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--text)',
  backgroundColor: 'rgba(200,144,42,0.15)',
  border: '1px solid var(--amber-dim)',
  borderRadius: 4,
  cursor: 'pointer',
}

const voteListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  maxHeight: 180,
  overflowY: 'auto',
  paddingRight: 4,
}

const voteEntryStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '3px 8px',
  border: '1px solid var(--border)',
  borderRadius: 3,
}
