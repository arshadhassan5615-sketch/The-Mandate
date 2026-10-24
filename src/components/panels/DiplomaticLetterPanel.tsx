import { useEffect } from 'react'
import type { CSSProperties, JSX } from 'react'
import { useLetterStore } from '../../stores/letterStore'
import { useGameStore } from '../../stores/gameStore'
import { renderWithEntities } from '../news/EntityLinker'
import { rem } from '../../constants/typography'
import { weekToDate } from '../../engine/dates'
import CabinetDocument from '../ui/cabinet/CabinetDocument'
import { DocumentPager } from '../ui/cabinet/DocumentPager'
import { PaperHeading, PaperSheet } from '../ui/cabinet/PaperParts'
import { CAB_FONT } from '../ui/cabinet/cabinetStyles'

const SEAL_SVGS: Record<string, JSX.Element> = {
  arcturian: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#3a5a7c" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#3a5a7c" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#3a5a7c" fontFamily="serif" fontWeight="bold">ARCTURIAN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#3a5a7c" fontFamily="serif">COMMONWEALTH</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(58,90,124,0.5)" fontFamily="serif" fontStyle="italic">Est. 1804</text>
    </svg>
  ),
  orythian: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#8b2e2e" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#8b2e2e" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#8b2e2e" fontFamily="serif" fontWeight="bold">ORYTHIAN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#8b2e2e" fontFamily="serif">DOMINION</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(139,46,46,0.5)" fontFamily="serif" fontStyle="italic">For the People</text>
    </svg>
  ),
  lytheirian: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#6a5a3a" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#6a5a3a" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#6a5a3a" fontFamily="serif" fontWeight="bold">REPUBLIC OF</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#6a5a3a" fontFamily="serif">LYTHEIRA</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(106,90,58,0.5)" fontFamily="serif" fontStyle="italic">Liberté · Égalité</text>
    </svg>
  ),
  tyvaren: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#6a6a7a" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#6a6a7a" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#6a6a7a" fontFamily="serif" fontWeight="bold">TYVAREN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#6a6a7a" fontFamily="serif">CONFEDERATION</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(106,106,122,0.5)" fontFamily="serif" fontStyle="italic">Strength Through Unity</text>
    </svg>
  ),
  asturien: (
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#9b7b3a" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#9b7b3a" strokeWidth="1" opacity="0.6" />
      <text x="50" y="45" textAnchor="middle" fontSize="7" fill="#9b7b3a" fontFamily="serif" fontWeight="bold">ASTURIEN</text>
      <text x="50" y="58" textAnchor="middle" fontSize="6" fill="#9b7b3a" fontFamily="serif">FORUM</text>
      <text x="50" y="72" textAnchor="middle" fontSize="5" fill="rgba(155,123,58,0.5)" fontFamily="serif" fontStyle="italic">Justice · Peace</text>
    </svg>
  ),
}

const INK = '#2a241c'
const MINISTRY_LINE: CSSProperties = {
  fontFamily: CAB_FONT.label,
  fontWeight: 700,
  fontSize: rem(10.5),
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#5a4a3a',
  margin: 0,
  lineHeight: 1.4,
}
const SENDER_TITLE_LINE: CSSProperties = {
  fontFamily: CAB_FONT.label,
  fontWeight: 700,
  fontSize: rem(10),
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#6a5040',
  margin: '6px 0 12px',
}
const BODY_PARAGRAPH: CSSProperties = {
  fontFamily: CAB_FONT.body,
  fontSize: rem(15.5),
  lineHeight: 1.65,
  color: '#2a2218',
  textAlign: 'justify',
  margin: '0 0 12px',
}
const SIGN_OFF: CSSProperties = {
  marginTop: 18,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
}

/** A short date for the pouch line: "15 JAN 1963". */
function pouchDate(week: number): string {
  const [day, month, year] = weekToDate(week).split(' ')
  return `${day} ${month.slice(0, 3)} ${year}`.toUpperCase()
}

export default function DiplomaticLetterPanel() {
  const { letters, currentIndex, isOpen, setOpen, setIndex, markRead } = useLetterStore()
  const currentWeek = useGameStore(s => s.currentWeek)

  const letter = letters[currentIndex]
  const total = letters.length
  const letterId = letter?.id

  // Reading a letter marks it read as soon as it is on screen.
  useEffect(() => {
    if (isOpen && letterId) markRead(letterId)
  }, [isOpen, letterId, markRead])

  const seal = letter ? SEAL_SVGS[letter.seal] ?? SEAL_SVGS.arcturian : null

  if (!isOpen || !letter) return null

  // A letter arrives in the week it was triggered; fall back to the current week if it has none.
  const receivedWeek = letter.weekTriggered > 0 ? letter.weekTriggered : currentWeek

  return (
    <CabinetDocument
      testId="diplomatic-letter"
      titleId="diplomatic-letter-title"
      overline="Foreign correspondence"
      title="Diplomatic Letters"
      closeLabel="Close letters"
      onClose={() => setOpen(false)}
      nav={total > 1 ? (
        <DocumentPager
          index={currentIndex}
          total={total}
          noun="Letter"
          onPrevious={() => setIndex(currentIndex - 1)}
          onNext={() => setIndex(currentIndex + 1)}
        />
      ) : undefined}
    >
      <PaperSheet
        letterhead={false}
        watermark={false}
        registry={{ left: `DIPLOMATIC POUCH · RECEIVED ${pouchDate(receivedWeek)}` }}
        footnote="Translated by the Foreign Ministry"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 6 }}>{seal}</div>
          <p style={MINISTRY_LINE}>{letter.ministry}</p>
          <p style={{ ...MINISTRY_LINE, marginTop: 2 }}>REPUBLIC OF VELTRIA</p>
          <p style={SENDER_TITLE_LINE}>{letter.senderTitle}</p>
        </div>

        <PaperHeading>{letter.headline}</PaperHeading>

        <div style={{ marginTop: 14 }}>
          {letter.body.split('\n\n').map((para, i) => (
            <p key={i} style={BODY_PARAGRAPH}>
              {renderWithEntities(para)}
            </p>
          ))}
        </div>

        <div style={SIGN_OFF}>
          <p style={{ fontFamily: CAB_FONT.signature, fontSize: rem(28), lineHeight: 1.2, color: INK, margin: 0 }}>
            {letter.sender}
          </p>
          <div style={{ width: 180, height: 1, background: INK, margin: '2px 0 4px' }} />
          <p style={{ fontFamily: CAB_FONT.body, fontStyle: 'italic', fontSize: rem(12), color: '#5a4d3a', margin: 0 }}>
            {letter.senderTitle}
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, opacity: 0.25 }}>
          {seal}
        </div>
      </PaperSheet>
    </CabinetDocument>
  )
}
