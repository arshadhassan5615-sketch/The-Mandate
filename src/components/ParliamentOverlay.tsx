import { useState, useEffect } from 'react'
import type {
  AssemblyBloc,
  ParliamentBillResult,
  Stance,
} from '../types/parliament'
import veltriaSeal from '../assets/images/veltria_seal.png'
import { Z } from '../constants/zIndex'

export interface ParliamentOverlayProps {
  results: ParliamentBillResult[]
  /** Called once after the player finishes every bill (or immediately if empty). */
  onComplete: (results: ParliamentBillResult[]) => void
}

type SittingStage =
  | 'announce'
  | 'stances'
  | 'speak_prompt'
  | 'speak_shown'
  | 'verdict'

const BLOCS: AssemblyBloc[] = ['conservative', 'hardliner', 'reformist']

const BLOC_LABELS: Record<AssemblyBloc, string> = {
  conservative: 'Conservative Bloc',
  hardliner: 'Hardliner Bloc',
  reformist: 'Reformist Bloc',
}

const STANCE_LABELS: Record<Stance, string> = {
  for: 'For',
  against: 'Against',
  neutral: 'Neutral',
}

export function stanceColor(stance: Stance): string {
  if (stance === 'for') return 'var(--accent-green)'
  if (stance === 'against') return 'var(--accent-red)'
  return '#c9a84c'
}

export function verdictText(result: ParliamentBillResult): string {
  if (!result.passed) {
    return 'The motion fails to carry.'
  }
  if (result.isStrongMajority) {
    return 'The motion carries by a commanding majority.'
  }
  return 'The motion carries — narrowly.'
}

export default function ParliamentOverlay({
  results,
  onComplete,
}: ParliamentOverlayProps) {
  const [billIndex, setBillIndex] = useState(0)
  const [stage, setStage] = useState<SittingStage>('announce')

  // Defensive: empty sitting should never hang the player.
  useEffect(() => {
    if (results.length === 0) {
      onComplete([])
    }
  }, [results, onComplete])

  if (results.length === 0) {
    return null
  }

  const currentResult = results[billIndex]
  const bill = currentResult.bill
  const isLastBill = billIndex >= results.length - 1

  const advanceFromStances = () => {
    if (bill.canSpeak) {
      setStage('speak_prompt')
    } else {
      setStage('verdict')
    }
  }

  const advanceFromVerdict = () => {
    if (!isLastBill) {
      setBillIndex(i => i + 1)
      setStage('announce')
      return
    }
    onComplete(results)
  }

  const continueLabel =
    stage === 'verdict'
      ? isLastBill
        ? 'Conclude Sitting'
        : 'Next Bill →'
      : 'Continue'

  const handlePrimaryContinue = () => {
    if (stage === 'announce') {
      setStage('stances')
      return
    }
    if (stage === 'stances') {
      advanceFromStances()
      return
    }
    if (stage === 'speak_shown') {
      setStage('verdict')
      return
    }
    if (stage === 'verdict') {
      advanceFromVerdict()
    }
  }

  return (
    <div
      data-testid="parliament-overlay"
      style={{
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
      }}
    >
      {/* THE DOCUMENT — matches LegislationOverlay parchment family */}
      <div
        style={{
          background: '#f5f0e0',
          width: '680px',
          maxHeight: '100vh',
          minHeight: '70vh',
          boxShadow: '0 0 80px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          padding: '16px 44px 0',
        }}
      >
        {/* SEAL */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
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

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            letterSpacing: '2px',
            color: '#6b4f2a',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          National Assembly · Sitting {billIndex + 1} of {results.length}
        </div>

        <div
          data-testid="parliament-bill-title"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '19px',
            fontWeight: 800,
            fontStyle: 'italic',
            color: '#0d0a06',
            textAlign: 'center',
            lineHeight: 1.25,
            marginBottom: '4px',
          }}
        >
          {bill.title}
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            letterSpacing: '1.5px',
            color: '#6b4f2a',
            textAlign: 'center',
            marginBottom: '16px',
            textTransform: 'uppercase',
          }}
        >
          Proposed by {BLOC_LABELS[bill.proposingBloc]}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '0 8px 12px',
          }}
        >
          {stage === 'announce' && (
            <div data-testid="parliament-stage-announce">
              <p
                style={{
                  fontFamily: "'Crimson Text', Georgia, serif",
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#0d0a06',
                  margin: 0,
                  textAlign: 'justify',
                }}
              >
                {bill.description}
              </p>
            </div>
          )}

          {stage === 'stances' && (
            <div data-testid="parliament-stage-stances">
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: '#6b4f2a',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                Bloc positions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {BLOCS.map(bloc => {
                  const stance = currentResult.computedStances[bloc]
                  return (
                    <div
                      key={bloc}
                      data-testid={`parliament-stance-${bloc}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid rgba(107,79,42,0.25)',
                        background: 'rgba(255,255,255,0.35)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#0d0a06',
                        }}
                      >
                        {BLOC_LABELS[bloc].toUpperCase()}
                      </span>
                      <span
                        data-testid={`parliament-stance-value-${bloc}`}
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '11px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: stanceColor(stance),
                        }}
                      >
                        {STANCE_LABELS[stance]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {stage === 'speak_prompt' && (
            <div data-testid="parliament-stage-speak-prompt">
              <p
                style={{
                  fontFamily: "'Crimson Text', Georgia, serif",
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#0d0a06',
                  marginBottom: '18px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                The Speaker recognizes the Chancellor. Will you address the Assembly?
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                <button
                  type="button"
                  data-testid="parliament-speak"
                  onClick={() => setStage('speak_shown')}
                  className="choice-btn"
                  style={{ width: 'auto', minWidth: '140px' }}
                >
                  Speak
                </button>
                <button
                  type="button"
                  data-testid="parliament-stay-silent"
                  onClick={() => setStage('verdict')}
                  className="choice-btn"
                  style={{ width: 'auto', minWidth: '140px' }}
                >
                  Stay Silent
                </button>
              </div>
            </div>
          )}

          {stage === 'speak_shown' && (
            <div data-testid="parliament-stage-speak-shown">
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: '#6b4f2a',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                The Chancellor addresses the chamber
              </p>
              <p
                data-testid="parliament-speak-flavor"
                style={{
                  fontFamily: "'Crimson Text', Georgia, serif",
                  fontSize: '15px',
                  lineHeight: 1.75,
                  color: '#0d0a06',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                {bill.speakFlavorText ?? ''}
              </p>
            </div>
          )}

          {stage === 'verdict' && (
            <div data-testid="parliament-stage-verdict">
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: '#6b4f2a',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                The Speaker
              </p>
              <p
                data-testid="parliament-verdict-text"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0d0a06',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {verdictText(currentResult)}
              </p>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  color: '#6b4f2a',
                  textAlign: 'center',
                  marginTop: '14px',
                  letterSpacing: '0.06em',
                }}
              >
                For {currentResult.forWeight} · Against {currentResult.againstWeight}
                {currentResult.passed
                  ? ` · Margin ${currentResult.marginPercent}`
                  : ''}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions — speak_prompt has its own buttons */}
        {stage !== 'speak_prompt' && (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '12px 32px 16px',
              borderTop: '1px solid #e0d5c0',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              data-testid="parliament-continue"
              className="choice-btn"
              onClick={handlePrimaryContinue}
              style={{ width: 'auto', minWidth: '220px' }}
            >
              {continueLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
