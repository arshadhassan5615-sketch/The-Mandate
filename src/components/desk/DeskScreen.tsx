// The desk (Suzerain-style home screen): between meetings the Chancellor sits
// at her desk with this week's meetings in front of her, not on the map. Each
// meeting starts exactly as a map pin would start it (launchSingleScene with
// the province's next meeting), so week sequencing is unchanged. The map is a
// tool in the command bar.
import { useMemo } from 'react'
import { useWeekStore } from '../../stores/weekStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useGameStore } from '../../stores/gameStore'
import { useDecreeStore } from '../../stores/decreeStore'
import { useNewsStore } from '../../stores/newsStore'
import { useLetterStore } from '../../stores/letterStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePageInsets } from '../../hooks/usePageInsets'
import { PROVINCES } from '../../data/provinces'
import { CATEGORY_LABELS, CATEGORY_COLORS, type AgendaCategory } from '../../types/week'
import { buildSituations } from '../panels/situations'
import { nextMeetings, doneMeetings, type MeetingSlot } from './nextMeetings'
import deskBackdrop from '../../assets/images/provinces/ashenmere_banner.jpeg'

const SERIF = "'Playfair Display', Georgia, serif"
const BODY = "'Crimson Text', Georgia, serif"
const UI = 'var(--font-ui)'

function weekToLongDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const provinceName = (id: string) => PROVINCES[id]?.name ?? (id === 'foreign' ? 'Abroad' : id.charAt(0).toUpperCase() + id.slice(1))

export default function DeskScreen() {
  const insets = usePageInsets()
  const agendaPool = useWeekStore(s => s.agendaPool)
  const completedItemIds = useWeekStore(s => s.completedItemIds)
  const launchSingleScene = useWeekStore(s => s.launchSingleScene)
  const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds)
  const currentWeek = useGameStore(s => s.currentWeek)
  const nation = useGameStore(s => s.nation)
  const economyHistory = useGameStore(s => s.economyHistory)
  const debtHistory = useGameStore(s => s.debtHistory)
  const inflationHistory = useGameStore(s => s.inflationHistory)
  const publicOrderHistory = useGameStore(s => s.publicOrderHistory)
  const pendingDecrees = useDecreeStore(s => s.pendingDecrees.length)
  const newsUnread = useNewsStore(s => Math.max(0, s.articles.length - (s.lastReadIndex + 1)))
  const setNewsOpen = useNewsStore(s => s.setOpen)
  const letterUnread = useLetterStore(s => s.unreadCount)
  const openLetters = useLetterStore(s => s.setOpen)
  const setDecreeInboxOpen = useSettingsStore(s => s.setDecreeInboxOpen)

  const upcoming = useMemo(() => nextMeetings(agendaPool, visitedSceneIds, completedItemIds), [agendaPool, visitedSceneIds, completedItemIds])
  const done = useMemo(() => doneMeetings(agendaPool, visitedSceneIds, completedItemIds), [agendaPool, visitedSceneIds, completedItemIds])
  const pressing = useMemo(
    () => buildSituations({ nation, currentWeek, economyHistory, debtHistory, inflationHistory, publicOrderHistory })
      .filter(s => s.severity !== 'Calm').slice(0, 3),
    [nation, currentWeek, economyHistory, debtHistory, inflationHistory, publicOrderHistory],
  )

  return (
    <main
      data-testid="desk-screen"
      style={{
        position: 'fixed', inset: 0, zIndex: 1, overflowY: 'auto',
        paddingTop: insets.top, paddingBottom: insets.bottom,
        backgroundColor: '#0b0907',
        backgroundImage: `linear-gradient(90deg, rgba(11,9,7,0.97) 0%, rgba(11,9,7,0.9) 55%, rgba(11,9,7,0.7) 100%), url(${deskBackdrop})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}
    >
      <div style={{
        maxWidth: 1180, margin: '0 auto', padding: insets.isPhone ? '20px 16px 28px' : '40px 40px 48px',
        display: 'grid', gap: insets.isPhone ? '24px' : '40px',
        gridTemplateColumns: insets.isPhone ? '1fr' : 'minmax(0, 2fr) minmax(260px, 1fr)',
      }}>
        <section aria-labelledby="desk-title">
          <p style={{ fontFamily: UI, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--brass)', margin: 0 }}>
            The Chancellery · Ashenmere
          </p>
          <h1 id="desk-title" style={{ fontFamily: SERIF, fontSize: insets.isPhone ? '26px' : '34px', fontWeight: 500, color: '#efe4c8', margin: '6px 0 2px' }}>
            {weekToLongDate(currentWeek)}
          </h1>
          <p style={{ fontFamily: BODY, fontStyle: 'italic', fontSize: '17px', color: 'var(--muted)', margin: '0 0 24px' }}>
            {upcoming.length > 0
              ? `${upcoming.length === 1 ? 'One meeting awaits' : `${upcoming.length} meetings await`} you this week.`
              : "The week's business is concluded."}
          </p>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcoming.map((slot, i) => (
              <MeetingCard key={slot.item.id} slot={slot} isNext={i === 0} onBegin={() => launchSingleScene(slot.item)} />
            ))}
          </ol>

          {done.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <h2 style={{ fontFamily: UI, fontSize: '10px', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
                Concluded this week
              </h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {done.map(item => (
                  <li key={item.id} style={{ fontFamily: BODY, fontSize: '16px', color: 'var(--muted)', padding: '4px 0' }}>
                    <span aria-hidden style={{ color: '#5a9e6b', marginRight: '8px' }}>✓</span>{item.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside aria-labelledby="desk-side-title" style={{
          alignSelf: 'start', background: 'rgba(20,17,13,0.85)', border: '1px solid rgba(181,154,94,0.3)', padding: '20px 22px',
        }}>
          <h2 id="desk-side-title" style={{ fontFamily: UI, fontSize: '10px', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brass)', margin: 0 }}>
            On your desk
          </h2>

          <div style={{ marginTop: '14px' }}>
            {pressing.length === 0 ? (
              <p style={{ fontFamily: BODY, fontStyle: 'italic', color: 'var(--muted)', margin: 0 }}>No pressing situations.</p>
            ) : pressing.map(s => (
              <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(181,154,94,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontFamily: BODY, fontSize: '16px', fontWeight: 600, color: '#e6dcc3' }}>{s.title}</span>
                  <span style={{ fontFamily: UI, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: s.severity === 'Critical' ? '#e05c4a' : '#d9a441' }}>
                    {s.severity} · {s.trend}
                  </span>
                </div>
                <p style={{ fontFamily: BODY, fontSize: '14px', color: 'var(--muted)', margin: '2px 0 0' }}>{s.summary}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '18px' }}>
            <DeskLink label="Decrees awaiting signature" count={pendingDecrees} onClick={() => setDecreeInboxOpen(true)} />
            <DeskLink label="Unread dispatches" count={newsUnread} onClick={() => setNewsOpen(true)} />
            <DeskLink label="Letters" count={letterUnread} onClick={() => openLetters(true)} />
          </div>
        </aside>
      </div>
    </main>
  )
}

function MeetingCard({ slot, isNext, onBegin }: { slot: MeetingSlot; isNext: boolean; onBegin: () => void }) {
  const { item, province } = slot
  const color = CATEGORY_COLORS[item.category as AgendaCategory] ?? 'var(--amber)'
  return (
    <li data-testid="desk-meeting" style={{
      background: 'rgba(20,17,13,0.88)', border: `1px solid ${item.isUrgent ? 'rgba(181,69,47,0.7)' : 'rgba(181,154,94,0.3)'}`,
      borderLeft: `3px solid ${color}`, padding: '16px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px 20px', alignItems: 'center',
    }}>
      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center' }}>
          <span style={{ fontFamily: UI, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color }}>
            {CATEGORY_LABELS[item.category as AgendaCategory] ?? item.category}
          </span>
          <span style={{ fontFamily: UI, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {provinceName(province)}
          </span>
          {item.isUrgent && (
            <span style={{ fontFamily: UI, fontSize: '9px', letterSpacing: '0.16em', color: '#e05c4a', border: '1px solid rgba(224,92,74,0.6)', padding: '1px 6px' }}>
              URGENT
            </span>
          )}
        </div>
        <h3 style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 500, color: '#efe4c8', margin: '6px 0 4px' }}>{item.title}</h3>
        <p style={{ fontFamily: BODY, fontSize: '16px', lineHeight: 1.45, color: '#b8ad95', margin: 0 }}>{item.description}</p>
      </div>
      <button
        type="button"
        onClick={onBegin}
        className="desk__begin"
        style={{
          flexShrink: 0, padding: '10px 18px', cursor: 'pointer',
          fontFamily: UI, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
          background: isNext ? '#c9a84c' : 'transparent', color: isNext ? '#14110d' : '#c9a84c',
          border: '1px solid #c9a84c',
        }}
      >
        Begin meeting →
      </button>
    </li>
  )
}

function DeskLink({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="desk__link"
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 10px',
        background: 'transparent', border: '1px solid rgba(181,154,94,0.25)', color: '#e6dcc3', cursor: 'pointer',
        fontFamily: BODY, fontSize: '15px', textAlign: 'left',
      }}
    >
      {label}
      <span style={{ fontFamily: UI, fontSize: '12px', color: count > 0 ? '#e8b04a' : 'var(--muted)' }}>{count}</span>
    </button>
  )
}
