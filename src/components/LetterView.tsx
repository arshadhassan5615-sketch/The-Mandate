import { useState } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useChainStore } from '../stores/chainStore'
import { getAvailableLetters, generateLetterContent, createSentLetter, LETTER_OPTIONS } from '../engine/LetterEngine'
import type { LetterOption } from '../engine/LetterEngine'
import type { LetterTone } from '../types/gameState'
import { rem } from '../constants/typography'
import { SignatureLine } from './ui/StateDocument'
import CabinetDocument from './ui/cabinet/CabinetDocument'
import { CabinetButton, CabinetCard } from './ui/cabinet/CabinetParts'
import { PaperHeading, PaperMeta, PaperSheet } from './ui/cabinet/PaperParts'
import { CAB_BODY, CAB_FONT } from './ui/cabinet/cabinetStyles'

/** Time for the signature to write in before the letter is sent. */
const SIGN_BEFORE_SEND_MS = 1000

const TONES: { value: LetterTone; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Measured, official, the voice of the Chancellor.' },
  { value: 'personal', label: 'Personal', description: 'Warm, direct, the voice of Katerin.' },
  { value: 'threatening', label: 'Direct', description: 'Blunt, unambiguous, no room for misinterpretation.' },
  { value: 'conciliatory', label: 'Conciliatory', description: 'Gentle, diplomatic, seeking common ground.' },
]

const OFFICE_LETTERHEAD = { subtitle: 'Office of the Chancellor' }
const PROMPT_TEXT: CSSProperties = { ...CAB_BODY, fontSize: rem(14.5), padding: '12px 16px 4px', margin: 0 }
const EMPTY_TEXT: CSSProperties = { ...CAB_BODY, fontStyle: 'italic', color: 'var(--cab-muted)', padding: 14, margin: 0 }
const TONE_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px 8px' }
const TONE_ROW: CSSProperties = {
  display: 'flex', gap: 10, padding: '8px 16px', borderRadius: 3, cursor: 'pointer',
  border: '1px solid transparent', background: 'transparent',
}
const TONE_ROW_SELECTED: CSSProperties = {
  border: '1px solid var(--cab-gold)', background: 'rgba(201,168,76,0.06)',
}
const PREVIEW_TEXT: CSSProperties = {
  fontFamily: CAB_FONT.body, fontStyle: 'italic', fontSize: rem(15.5), lineHeight: 1.7,
  whiteSpace: 'pre-wrap', color: '#3a2510',
}
const SIGNATURE_ROW: CSSProperties = { marginTop: 20, display: 'flex', justifyContent: 'flex-end' }

function recipientRowStyle(index: number): CSSProperties {
  return {
    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
    background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--cab-text)',
    borderTop: index > 0 ? '1px solid var(--cab-card-edge)' : 'none',
  }
}

function radioCircleStyle(selected: boolean): CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
    width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
    border: `2px solid ${selected ? 'var(--cab-gold)' : 'var(--cab-muted)'}`,
  }
}

interface RecipientStepProps {
  options: LetterOption[]
  onSelect: (id: string) => void
}

function RecipientStep({ options, onSelect }: RecipientStepProps) {
  return (
    <CabinetCard title="Choose a Recipient">
      {options.length === 0 ? (
        <p style={EMPTY_TEXT}>No letters are available to write at this time. Check back as events unfold.</p>
      ) : (
        options.map((o, index) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            style={recipientRowStyle(index)}
          >
            <span style={{ display: 'block', fontFamily: CAB_FONT.title, fontWeight: 700, fontSize: rem(15), color: 'var(--cab-title)' }}>
              {o.title}
            </span>
            <span style={{ ...CAB_BODY, display: 'block', marginTop: 3, fontStyle: 'italic', fontSize: rem(13.5), color: 'var(--cab-muted)' }}>
              {o.prompt.slice(0, 120)}...
            </span>
          </button>
        ))
      )}
    </CabinetCard>
  )
}

interface ToneRowProps {
  tone: (typeof TONES)[number]
  selected: boolean
  onSelect: () => void
}

function ToneRow({ tone, selected, onSelect }: ToneRowProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect()
  }

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      style={{ ...TONE_ROW, ...(selected ? TONE_ROW_SELECTED : {}) }}
    >
      <span aria-hidden="true" style={radioCircleStyle(selected)}>
        {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cab-gold)' }} />}
      </span>
      <div>
        <div style={{
          fontFamily: CAB_FONT.label, fontWeight: 700, fontSize: rem(11), letterSpacing: '0.14em', textTransform: 'uppercase',
          color: selected ? 'var(--cab-gold-bright)' : 'var(--cab-text)',
        }}>
          {tone.label}
        </div>
        <div style={{ ...CAB_BODY, fontStyle: 'italic', fontSize: rem(13), color: 'var(--cab-muted)' }}>
          {tone.description}
        </div>
      </div>
    </div>
  )
}

interface ToneStepProps {
  option: LetterOption
  selectedTone: LetterTone
  onSelectTone: (tone: LetterTone) => void
}

function ToneStep({ option, selectedTone, onSelectTone }: ToneStepProps) {
  return (
    <CabinetCard title={option.title}>
      <p style={PROMPT_TEXT}>{option.prompt}</p>
      <div role="radiogroup" aria-label="Tone" style={TONE_GROUP}>
        {TONES.map(t => (
          <ToneRow
            key={t.value}
            tone={t}
            selected={selectedTone === t.value}
            onSelect={() => onSelectTone(t.value)}
          />
        ))}
      </div>
    </CabinetCard>
  )
}

interface PreviewStepProps {
  text: string
  tone: LetterTone
  isSigning: boolean
}

function PreviewStep({ text, tone, isSigning }: PreviewStepProps) {
  // Personal letters go out as Katerin, not under the state letterhead.
  const isPersonal = tone === 'personal'
  return (
    <PaperSheet
      testId="letter-preview"
      letterhead={isPersonal ? false : OFFICE_LETTERHEAD}
      watermark={!isPersonal}
    >
      <div style={PREVIEW_TEXT}>{text}</div>
      <div style={SIGNATURE_ROW}>
        <SignatureLine
          isSigned={isSigning}
          caption={isPersonal ? 'Katerin Ashavel' : 'Office of the Chancellor'}
          width={220}
          height={90}
        />
      </div>
    </PaperSheet>
  )
}

function SentStep({ recipient }: { recipient: string | undefined }) {
  return (
    <PaperSheet letterhead={false} watermark={false}>
      <PaperHeading>Letter Sent</PaperHeading>
      <PaperMeta>Your letter to {recipient} will arrive in one week.</PaperMeta>
    </PaperSheet>
  )
}

export default function LetterView({ onClose }: { onClose: () => void }) {
  const gameState = useGameStore()
  const { currentWeek } = gameState
  const actualIds = gameState.sentLetters.map(l => {
    const opt = LETTER_OPTIONS.find(o => l.title === o.title)
    return opt?.id ?? ''
  }).filter(Boolean)

  const available = getAvailableLetters(
    currentWeek, gameState.personal.marriageHealth, gameState.personal.lioraRelationship,
    gameState.factions.halvekists, gameState.factions.workersCoalition, gameState.nation.economyHealth,
    gameState.sorenFilesRevealed, actualIds,
  )

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [selectedTone, setSelectedTone] = useState<LetterTone>('personal')
  const [preview, setPreview] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [sent, setSent] = useState(false)

  const opt = LETTER_OPTIONS.find(o => o.id === selectedLetter)

  const handlePreview = () => {
    if (!opt) return
    const { body } = generateLetterContent(opt.recipient, selectedTone, currentWeek)
    setPreview(body)
  }

  const handleSend = () => {
    if (!opt || isSigning) return
    // Sign first, then send once the signature has written in.
    setIsSigning(true)
    setTimeout(() => {
      const letter = createSentLetter(opt, selectedTone, currentWeek)
      useGameStore.getState().sendLetter(letter)
      useChainStore.getState().schedule(
        [{ targetNodeId: opt.responseSceneId, delayWeeks: 1 }],
        currentWeek, opt.id, 'letter_system',
      )
      setSent(true)
      setTimeout(onClose, 2000)
    }, SIGN_BEFORE_SEND_MS)
  }

  const renderStep = (): { body: ReactNode; actions?: ReactNode } => {
    if (sent) return { body: <SentStep recipient={opt?.recipient} /> }
    if (!opt) return { body: <RecipientStep options={available} onSelect={setSelectedLetter} /> }
    if (preview) {
      return {
        body: <PreviewStep text={preview} tone={selectedTone} isSigning={isSigning} />,
        actions: (
          <>
            <CabinetButton variant="secondary" onClick={() => setPreview(null)} disabled={isSigning}>Edit</CabinetButton>
            <CabinetButton variant="primary" onClick={handleSend} disabled={isSigning}>Sign &amp; send</CabinetButton>
          </>
        ),
      }
    }
    return {
      body: <ToneStep option={opt} selectedTone={selectedTone} onSelectTone={setSelectedTone} />,
      actions: (
        <>
          <CabinetButton variant="secondary" onClick={() => setSelectedLetter(null)}>Back</CabinetButton>
          <CabinetButton variant="primary" onClick={handlePreview}>Preview letter</CabinetButton>
        </>
      ),
    }
  }

  const { body, actions } = renderStep()

  return (
    <CabinetDocument
      testId="letter-composer"
      titleId="letter-composer-title"
      overline="Chancellery — Correspondence"
      title="Compose a Letter"
      closeLabel="Close letter"
      onClose={onClose}
      actions={actions}
    >
      {body}
    </CabinetDocument>
  )
}
