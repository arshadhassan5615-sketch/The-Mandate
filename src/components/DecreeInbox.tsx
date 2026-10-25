import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useDecreeStore } from '../stores/decreeStore'
import { useGameStore } from '../stores/gameStore'
import { useCabinetStore } from '../stores/cabinetStore'
import type { Decree, DecreeCategory } from '../types/decree'
import { getPortrait } from '../assets/potraits'
import { playStamp } from '../engine/audioEngine'
import { rem } from '../constants/typography'
import { formalGivenDate, weekToDate } from '../engine/dates'
import FiscalNote from './ui/FiscalNote'
import { decreeBudgetCost } from './ui/decreeFiscal'
import { SignatureLine } from './ui/StateDocument'
import CabinetDocument, { PaperTab } from './ui/cabinet/CabinetDocument'
import { DocumentPager } from './ui/cabinet/DocumentPager'
import { PaperSection, PaperSheet } from './ui/cabinet/PaperParts'
import type { PaperStampProps } from './ui/cabinet/PaperParts'
import { CabinetButton, NationalSeal } from './ui/cabinet/CabinetParts'
import { CAB_BODY, CAB_FONT } from './ui/cabinet/cabinetStyles'
import { proposalPhrase } from './decree/decreeWording'

const CATEGORY_ORDER: DecreeCategory[] = ['economic', 'judicial', 'religious', 'welfare', 'development']

const CATEGORY_LABELS: Record<DecreeCategory, string> = {
  economic: 'Economic',
  judicial: 'Judicial',
  religious: 'Religious',
  welfare: 'Welfare',
  development: 'Development',
}

const MINISTER_NAMES: Record<string, string> = {
  gregor_maric: 'Gregor Marić',
  elara_vostane: 'Elara Vostane',
  aldric_theron: 'Aldric Theron',
  irina_dusek: 'Col. Irina Dusek',
  danika_oberlin: 'Danika Oberlin',
  vyktor_reznik: 'Vyktor Reznik',
  stanislov_renek: 'Archbishop Renek',
  benedikt_varro: 'Benedikt Varro',
  drazen_kolvar: 'Dražen Kolvar',
  stefan_morvec: 'Stefan Morvec',
}

const SIGN_ANIMATION_MS = 1500
const STAMP_RED = '#7a2a2a'
const REJECTED_RED = '#a04040'
const SIGNATURE_WIDTH = 320
const SIGNATURE_MAX_WIDTH = 360

/** The week's month and year for the registry line: "WEEK 3 · JANUARY 1963". */
function registryWeekLabel(week: number): string {
  const [, month, year] = weekToDate(week).split(' ')
  return `WEEK ${week} · ${month} ${year}`.toUpperCase()
}

/** A short stamp date: "15 JAN 1963". */
function stampDate(week: number): string {
  const [day, month, year] = weekToDate(week).split(' ')
  return `${day} ${month.slice(0, 3)} ${year}`.toUpperCase()
}

/** A pending decree is received; a signed one is signed; a rejected one carries the RejectedStamp instead. */
function decreeStamp(isSigned: boolean, isRejected: boolean, week: number): PaperStampProps | undefined {
  if (isSigned) return { label: 'Signed', tone: 'green' }
  if (isRejected) return undefined
  return { label: 'Received', sub: `Chancellery · ${stampDate(week)}` }
}

const DUE_STAMP_STYLE: CSSProperties = {
  display: 'inline-block',
  fontFamily: CAB_FONT.label,
  fontWeight: 700,
  fontSize: rem(10),
  letterSpacing: '0.2em',
  color: STAMP_RED,
  border: `1.5px solid ${STAMP_RED}`,
  padding: '2px 10px',
  transform: 'rotate(-2deg)',
}

const CONFLICT_STYLE: CSSProperties = {
  border: `1px solid ${STAMP_RED}`,
  color: STAMP_RED,
  padding: '6px 10px',
  textAlign: 'center',
  fontFamily: CAB_FONT.body,
  fontSize: rem(14),
  margin: '8px 0',
}

const EMPTY_STYLE: CSSProperties = {
  ...CAB_BODY,
  margin: 0,
  padding: '40px 20px',
  textAlign: 'center',
  fontStyle: 'italic',
  color: 'var(--cab-muted)',
}

type DecreeTab = 'all' | 'rejected' | DecreeCategory

/** The decrees a tab shows: pending ones for a category or for all, or the rejected ones. */
function decreesInTab(tab: DecreeTab, pending: Decree[], rejected: Decree[]): Decree[] {
  if (tab === 'rejected') return rejected
  if (tab === 'all') return pending
  return pending.filter(d => d.category === tab)
}

function MinisterThumbnail({ ministerId, size = 40 }: { ministerId: string; size?: number }) {
  const imgSrc = getPortrait(ministerId)
  const name = MINISTER_NAMES[ministerId] ?? ministerId.replace(/_/g, ' ')
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '1.5px solid rgba(107,79,42,0.45)',
        background: 'rgba(245,240,224,0.9)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={name}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      ) : (
        <span style={{
          fontFamily: CAB_FONT.label,
          fontSize: size * 0.28,
          color: '#6b4f2a',
          fontWeight: 'bold',
        }}>
          {initials}
        </span>
      )}
    </div>
  )
}

interface DecreeInboxProps {
  onClose: () => void
}

export default function DecreeInbox({ onClose }: DecreeInboxProps) {
  const {
    pendingDecrees, signedDecrees, rejectedDecrees, tabledDecrees,
    selectedDecree, selectDecree, signDecree, rejectDecree, tableDecree,
  } = useDecreeStore()

  const currentWeek = useGameStore(s => s.currentWeek)
  const [activeTab, setActiveTab] = useState<DecreeTab>('all')
  // The decree whose signature is being written; it resets itself when another decree is shown.
  const [signingId, setSigningId] = useState<string | null>(null)

  const inView = decreesInTab(activeTab, pendingDecrees, rejectedDecrees)
  const selectedIndex = selectedDecree ? inView.findIndex(d => d.id === selectedDecree.id) : -1
  // A decree just signed or rejected leaves the pending list but stays on the page until another is chosen.
  const isDecided = selectedDecree !== null && (
    signedDecrees.some(d => d.id === selectedDecree.id) || rejectedDecrees.some(d => d.id === selectedDecree.id)
  )
  const isSelectionShown = selectedDecree !== null && (selectedIndex >= 0 || isDecided)
  const shownDecree: Decree | undefined = selectedDecree && isSelectionShown ? selectedDecree : inView[0]
  const pageIndex = Math.max(selectedIndex, 0)
  // Registry number: a stable position in the id-sorted list of every decree this session, so it holds while viewing.
  const registryOrder = [...pendingDecrees, ...signedDecrees, ...rejectedDecrees].map(d => d.id).sort()
  const regNo = shownDecree ? registryOrder.indexOf(shownDecree.id) + 1 : 0

  const isPending = !!shownDecree && pendingDecrees.some(d => d.id === shownDecree.id)
  const isRejected = !!shownDecree && rejectedDecrees.some(d => d.id === shownDecree.id)
  const isSigned = !!shownDecree?.signed
  const isDueThisWeek = isPending && shownDecree?.weekDeadline === currentWeek
  const wasPostponed = !!shownDecree && tabledDecrees.some(t => t.id === shownDecree.id)
  const showSignature = !!shownDecree && signingId === shownDecree.id
  // Reject and postpone are open only while the decree is undecided.
  const isUndecided = !isSigned && !isRejected
  // A decree cannot be signed while a decree it conflicts with is in force.
  const conflictIds = shownDecree?.conflictsWith
  const conflictingDecree = conflictIds
    ? signedDecrees.find(s => conflictIds.includes(s.id))
    : undefined
  const isConflict = conflictingDecree !== undefined

  const selectTab = (tab: DecreeTab) => {
    setActiveTab(tab)
    // Each tab opens on its first decree
    selectDecree(decreesInTab(tab, pendingDecrees, rejectedDecrees)[0] ?? null)
  }

  const stepTo = (index: number) => {
    if (index < 0 || index >= inView.length) return
    selectDecree(inView[index])
  }

  const handleSignClick = () => {
    if (!shownDecree || isConflict || showSignature || !isUndecided) return
    const { id } = shownDecree
    setSigningId(id)
    playStamp()
    setTimeout(() => {
      signDecree(id)
    }, SIGN_ANIMATION_MS)
  }

  const tabs = (
    <>
      <PaperTab
        id="decree-tab-all"
        controls="decree-doc-scroll"
        label="All"
        count={pendingDecrees.length}
        active={activeTab === 'all'}
        onSelect={() => selectTab('all')}
      />
      {CATEGORY_ORDER.map(category => (
        <PaperTab
          key={category}
          id={`decree-tab-${category}`}
          controls="decree-doc-scroll"
          label={CATEGORY_LABELS[category]}
          count={pendingDecrees.filter(d => d.category === category).length}
          active={activeTab === category}
          onSelect={() => selectTab(category)}
        />
      ))}
      {rejectedDecrees.length > 0 && (
        <PaperTab
          id="decree-tab-rejected"
          controls="decree-doc-scroll"
          label="Rejected"
          count={rejectedDecrees.length}
          active={activeTab === 'rejected'}
          onSelect={() => selectTab('rejected')}
        />
      )}
    </>
  )

  const nav = inView.length > 1 ? (
    <DocumentPager
      index={pageIndex}
      total={inView.length}
      noun="Decree"
      onPrevious={() => stepTo(pageIndex - 1)}
      onNext={() => stepTo(pageIndex + 1)}
    />
  ) : undefined

  const actions = shownDecree && isUndecided && !showSignature ? (
    <div data-testid="decree-actions" style={{ display: 'contents' }}>
      <CabinetButton
        variant="primary"
        onClick={handleSignClick}
        disabled={isConflict}
        aria-label={isConflict ? 'Sign decree (blocked by a conflicting decree)' : 'Sign decree'}
      >
        Sign decree
      </CabinetButton>
      <CabinetButton variant="secondary" onClick={() => { rejectDecree(shownDecree.id) }}>
        Reject
      </CabinetButton>
      <CabinetButton
        variant="secondary"
        disabled={wasPostponed}
        // A postponed decree leaves the list until next week; show the next one
        onClick={() => { tableDecree(shownDecree.id); selectDecree(null) }}
      >
        {wasPostponed ? 'Already postponed once' : 'Postpone a week'}
      </CabinetButton>
    </div>
  ) : undefined

  const emptyMessage = pendingDecrees.length === 0 && rejectedDecrees.length === 0
    ? 'No decrees available this week'
    : 'Select a decree to review'

  return (
    <CabinetDocument
      testId="decree-inbox-overlay"
      titleId="decree-inbox-title"
      overline="Chancellery"
      title="Decrees for Signature"
      closeLabel="Close decree inbox"
      onClose={onClose}
      maxWidth={620}
      tabs={tabs}
      tabsLabel="Decree categories"
      nav={nav}
      actions={actions}
    >
      {shownDecree ? (
        <DecreeDetail
          decree={shownDecree}
          isDueThisWeek={isDueThisWeek}
          isConflict={isConflict}
          conflictTitle={conflictingDecree?.title}
          isRejected={isRejected}
          isSigned={isSigned}
          showSignature={showSignature}
          regNo={regNo}
          currentWeek={currentWeek}
        />
      ) : (
        <p style={EMPTY_STYLE}>{emptyMessage}</p>
      )}
    </CabinetDocument>
  )
}

// ─── Decree Detail (cream state document) ───────────────────────────────────

interface DecreeDetailProps {
  decree: Decree
  isDueThisWeek: boolean
  isConflict: boolean
  conflictTitle: string | undefined
  isRejected: boolean
  isSigned: boolean
  showSignature: boolean
  regNo: number
  currentWeek: number
}

const ORNAMENT_INK = '#6e5634'
const DECREE_INK = '#2a2118'
const DECREE_SUB_INK = '#5d4a30'
const ENTRY_INTO_FORCE = 'This decree enters into force on the day of its publication in the Official Gazette.'

/** The decree's articles in order: the summary, each paragraph of the provisions, then the entry-into-force clause. */
function decreeArticles(decree: Decree): string[] {
  const provisions = decree.description
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
  return [decree.summary, ...provisions, ENTRY_INTO_FORCE]
}

/** The year printed in the decree number: the last token of "8 January 1963". */
function decreeYear(week: number): string {
  const parts = weekToDate(week).split(' ')
  return parts[parts.length - 1]
}

const DECREE_NUMBER_STYLE: CSSProperties = {
  fontFamily: CAB_FONT.label,
  fontSize: rem(12),
  letterSpacing: '0.25em',
  textAlign: 'center',
  color: '#3b2c1c',
  margin: '2px 0 6px',
}

const ORNAMENT_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '60%',
  margin: '0 auto 8px',
  gap: 8,
}

const ORNAMENT_LINE_STYLE: CSSProperties = { flex: 1, height: 1, background: ORNAMENT_INK }

const DECREE_TITLE_STYLE: CSSProperties = {
  margin: '6px 0 2px',
  textAlign: 'center',
  fontFamily: CAB_FONT.title,
  fontWeight: 600,
  fontSize: rem(24),
  color: DECREE_INK,
}

const DECREE_SUB_STYLE: CSSProperties = {
  margin: '0 0 10px',
  textAlign: 'center',
  fontStyle: 'italic',
  fontSize: rem(13.5),
  color: DECREE_SUB_INK,
}

const PREAMBLE_STYLE: CSSProperties = {
  margin: '14px 0 10px',
  fontFamily: CAB_FONT.body,
  fontSize: rem(16),
  lineHeight: 1.55,
  textAlign: 'justify',
}

const HEREBY_STYLE: CSSProperties = {
  margin: '12px 0',
  textAlign: 'center',
  fontFamily: CAB_FONT.label,
  fontWeight: 700,
  fontSize: rem(14),
  letterSpacing: '0.4em',
}

const ARTICLE_LABEL_STYLE: CSSProperties = {
  fontFamily: CAB_FONT.label,
  fontSize: rem(11.5),
  fontWeight: 700,
  letterSpacing: '0.12em',
  paddingTop: 3,
}

const ARTICLE_TEXT_STYLE: CSSProperties = {
  fontFamily: CAB_FONT.body,
  fontSize: rem(16),
  lineHeight: 1.55,
  whiteSpace: 'pre-line',
}

const GIVEN_STYLE: CSSProperties = {
  margin: '18px 0 0',
  fontStyle: 'italic',
  fontFamily: CAB_FONT.body,
  fontSize: rem(15.5),
}

const SEAL_SLOT_STYLE: CSSProperties = {
  width: 140,
  minHeight: 120,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const LOCUS_SIGILLI_STYLE: CSSProperties = {
  width: 104,
  height: 104,
  borderRadius: '50%',
  border: '1.5px dashed rgba(110,86,52,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: CAB_FONT.label,
  fontSize: rem(12),
  letterSpacing: '0.2em',
  color: 'rgba(110,86,52,0.7)',
}

const PRINTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 20,
  fontFamily: "'Special Elite', monospace",
  fontSize: rem(9.5),
  letterSpacing: '0.14em',
  color: ORNAMENT_INK,
}

function DecreeSealSlot({ isRejected, isSealed }: { isRejected: boolean; isSealed: boolean }) {
  let seal
  if (isRejected) {
    seal = <RejectedStamp />
  } else if (isSealed) {
    seal = (
      <div data-testid="decree-emblem" style={{ flexShrink: 0, transform: 'rotate(-6deg)', opacity: 0.88 }}>
        <NationalSeal surface="paper" size={112} />
      </div>
    )
  } else {
    seal = (
      <div data-testid="decree-locus-sigilli" title="Place of the seal" style={LOCUS_SIGILLI_STYLE}>L.S.</div>
    )
  }
  return <div data-testid="decree-seal-slot" style={SEAL_SLOT_STYLE}>{seal}</div>
}

function DecreeDetail({
  decree, isDueThisWeek, isConflict, conflictTitle, isRejected, isSigned, showSignature, regNo, currentWeek,
}: DecreeDetailProps) {
  const formationComplete = useCabinetStore(s => s.formation_complete)
  const registry = {
    left: `REG. No. 1963/${String(regNo).padStart(3, '0')}`,
    right: registryWeekLabel(currentWeek),
  }
  const clause = decree.proposedBy === 'Chancellor Ashavel'
    ? 'acting on her own motion'
    : proposalPhrase(decree.proposedBy)

  return (
    <div data-testid="decree-doc-scroll">
      <PaperSheet
        testId="decree-detail"
        securityBorder
        letterhead={{ subtitle: 'Office of the Chancellor' }}
        registry={registry}
        stamp={decreeStamp(isSigned, isRejected, currentWeek)}
      >
        <div data-testid="decree-number" style={DECREE_NUMBER_STYLE}>
          {`DECREE No. ${regNo} OF ${decreeYear(currentWeek)}`}
        </div>
        <div aria-hidden="true" style={ORNAMENT_ROW_STYLE}>
          <div style={ORNAMENT_LINE_STYLE} />
          <span style={{ fontSize: rem(9), color: ORNAMENT_INK }}>◆</span>
          <div style={ORNAMENT_LINE_STYLE} />
        </div>

        {isDueThisWeek && (
          <div style={{ textAlign: 'center', margin: '0 0 8px' }}>
            <span style={DUE_STAMP_STYLE}>DUE THIS WEEK</span>
          </div>
        )}

        <h3 style={DECREE_TITLE_STYLE}>
          <span data-testid="decree-detail-title">{decree.title}</span>
        </h3>
        <p data-testid="decree-sub" style={DECREE_SUB_STYLE}>
          {`A decree of the ${CATEGORY_LABELS[decree.category]} order, ${proposalPhrase(decree.proposedBy)}`}
        </p>

        <FiscalNote budgetCost={decreeBudgetCost(decree)} />

        {isConflict && (
          <p role="note" data-testid="decree-conflict" style={CONFLICT_STYLE}>
            Cannot be signed: it conflicts with the {conflictTitle ?? 'decree'} already in force.
          </p>
        )}

        <p data-testid="decree-preamble" style={PREAMBLE_STYLE}>
          {`The Chancellor of the Republic of Veltria, having regard to the Constitution of the Republic, ${clause}, and having heard the Council of Ministers,`}
        </p>
        <div data-testid="decree-hereby" style={HEREBY_STYLE}>HEREBY DECREES</div>

        <ol data-testid="decree-articles" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {decreeArticles(decree).map((text, index) => (
            <li key={index} style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: 8, margin: '0 0 8px' }}>
              <span style={ARTICLE_LABEL_STYLE}>{`ARTICLE ${index + 1}`}</span>
              <span style={ARTICLE_TEXT_STYLE}>{text}</span>
            </li>
          ))}
        </ol>

        {formationComplete && (
          <PaperSection heading="Opinions of the Council of Ministers">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {decree.ministerPositions.map(pos => (
                <div key={pos.ministerId} style={{ position: 'relative' }}>
                  <MinisterThumbnail ministerId={pos.ministerId} size={40} />
                  <div style={{
                    position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%',
                    background: pos.stance === 'favor' ? '#4CAF50' : pos.stance === 'against' ? '#e53935' : '#999',
                    border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '9px', fontWeight: 'bold',
                  }}>
                    {pos.stance === 'favor' ? '✓' : pos.stance === 'against' ? '✗' : '—'}
                  </div>
                </div>
              ))}
            </div>
          </PaperSection>
        )}

        <p data-testid="decree-given" style={GIVEN_STYLE}>
          {`Given at Ashenmere, ${formalGivenDate(currentWeek)}.`}
        </p>

        <div
          data-testid="decree-signature-row"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 18, marginTop: 16,
          }}
        >
          <DecreeSealSlot isRejected={isRejected} isSealed={isSigned || showSignature} />
          <SignatureLine
            isSigned={showSignature}
            caption="Chancellor of Veltria"
            width={SIGNATURE_WIDTH}
            signatureMaxWidth={SIGNATURE_MAX_WIDTH}
            cropToInk
          />
        </div>

        <div data-testid="decree-printer" aria-hidden="true" style={PRINTER_STYLE}>
          <span>PRINTED BY THE STATE PRESS · ASHENMERE</span>
          <span>SHEET 1 OF 1</span>
        </div>
      </PaperSheet>
    </div>
  )
}

function RejectedStamp() {
  return (
    <div
      data-testid="decree-rejected-stamp"
      style={{
        flexShrink: 0,
        padding: '6px 12px',
        border: `2px solid ${REJECTED_RED}`,
        color: REJECTED_RED,
        fontFamily: CAB_FONT.label,
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        transform: 'rotate(-6deg)',
      }}
    >
      Rejected
    </div>
  )
}
