import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { AgendaItem } from '../types/week'
import type { ProvinceId } from '../engine/LocationResolver'
import { PROVINCE_PIN_POSITIONS, PROVINCE_NAMES } from '../engine/LocationResolver'
import { getScene } from '../engine/NarrativeEngine'
import { getSealArt } from '../assets/sealArt'
import { HOME_PROVINCES, provinceFeed, unseenItems, type HomeProvinceId } from '../engine/provinceNews'
import { PROVINCES } from '../data/provinces'
import { useWeekStore } from '../stores/weekStore'
import { useNewsStore } from '../stores/newsStore'
import { useProvinceNewsStore } from '../stores/provinceNewsStore'
import NotificationPin from './map/NotificationPin'
import ProvinceChoiceMenu, { type ProvinceChoice } from './map/ProvinceChoiceMenu'
import ProvinceNewsPopover from './map/ProvinceNewsPopover'
import { PROVINCE_SEALS, SEAL_TILT_RATIO, sealLift, sealSizeFor, type SealProvinceId } from './map/seals/provinceSeals'

const BADGE_OFFSET_X = 0
const EVENT_PIN_SIZE = 66
const FALLBACK_BADGE_OFFSET_Y = -40
const UPDATES_CHOICE_ID = '__updates'

/** Pin bottom sits on the upper face of the province seal. */
function badgeOffsetY(provinceId: ProvinceId): number {
  if (!(provinceId in PROVINCE_SEALS)) return FALLBACK_BADGE_OFFSET_Y
  const sealHeight = sealSizeFor(provinceId as SealProvinceId) * SEAL_TILT_RATIO
  return -Math.round(sealHeight * 0.46) - sealLift(provinceId as SealProvinceId)
}

function sceneExists(item: AgendaItem): boolean {
  return item.sceneId.startsWith('__') || !!getScene(item.sceneId)
}

interface MapScenePinProps {
  provinceId: ProvinceId
  items: AgendaItem[]
  currentWeek: number
  onSelectScene: (item: AgendaItem) => void
  onFocusProvince?: (id: string) => void
  onUnfocusProvince?: () => void
}

export default function MapScenePin({ provinceId, items, currentWeek, onSelectScene, onFocusProvince, onUnfocusProvince }: MapScenePinProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [newsOpen, setNewsOpen] = useState(false)
  const pos = PROVINCE_PIN_POSITIONS[provinceId]

  const phase = useWeekStore(s => s.phase)
  const articles = useNewsStore(s => s.articles)
  const seenIds = useProvinceNewsStore(s => s.seenIds)
  const markSeen = useProvinceNewsStore(s => s.markSeen)

  // A scene starting closes the menu (adjusted during render, not in an effect)...
  const [prevPhase, setPrevPhase] = useState(phase)
  if (prevPhase !== phase) {
    setPrevPhase(phase)
    if (phase === 'scene') setOpen(false)
  }
  // ...and tells the map to unfocus. The latest callback is kept in a ref so a new
  // function from the parent does not re-run this.
  const unfocusRef = useRef(onUnfocusProvince)
  useEffect(() => { unfocusRef.current = onUnfocusProvince })
  useEffect(() => {
    if (phase === 'scene') unfocusRef.current?.()
  }, [phase])

  const hasMandatory = items.some(i => i.slotCost === 0)
  const hasUrgent = items.some(i => i.weekDeadline === currentWeek)

  const provinceName = PROVINCE_NAMES[provinceId] ?? provinceId
  const isHome = (HOME_PROVINCES as readonly string[]).includes(provinceId)
  const feed = isHome ? provinceFeed(articles, provinceId as HomeProvinceId, currentWeek) : []
  const unseen = unseenItems(feed, seenIds)

  const choices: ProvinceChoice[] = [
    ...(unseen.length > 0
      ? [{
          id: UPDATES_CHOICE_ID,
          title: 'Read the latest updates',
          detail: `${unseen.length} new ${unseen.length === 1 ? 'update' : 'updates'} from ${provinceName}`,
          icon: unseen.some(i => i.isAlert) ? 'urgent' as const : 'updates' as const,
          variant: 'info' as const,
        }]
      : []),
    ...items.map((item): ProvinceChoice => ({
      id: item.id,
      title: item.title,
      detail: item.description,
      icon: 'meeting',
      variant: 'action',
      disabled: !sceneExists(item),
    })),
  ]

  const closeMenu = () => {
    setOpen(false)
    onUnfocusProvince?.()
  }

  const closeNews = () => {
    setNewsOpen(false)
    onUnfocusProvince?.()
  }

  const handleSelect = (id: string) => {
    if (id === UPDATES_CHOICE_ID) {
      setOpen(false)
      markSeen(feed.map(item => item.article.id))
      setNewsOpen(true)
      return
    }
    const item = items.find(candidate => candidate.id === id)
    if (!item) return
    closeMenu()
    onSelectScene(item)
  }

  const isPulsing = hasMandatory
  const pinFilter = hasUrgent
    ? 'drop-shadow(0 0 12px rgba(220,60,60,0.9))'
    : isPulsing
      ? 'drop-shadow(0 0 12px rgba(201,168,76,0.9))'
      : 'drop-shadow(0 0 6px rgba(201,168,76,0.5))'

  const pinAnimation = hasUrgent
    ? 'medallion-pulse-red 2s ease-in-out infinite'
    : isPulsing
      ? 'medallion-pulse 2s ease-in-out infinite'
      : undefined

  return (
    <div style={{
      position: 'absolute',
      left: pos.x + BADGE_OFFSET_X,
      top: pos.y + badgeOffsetY(provinceId),
      transform: `translate(-50%, -100%) scale(${hovered ? 1.15 : 1.0})`,
      transition: 'transform 0.15s ease, filter 0.15s ease',
      zIndex: open ? 600 : 300,
      cursor: 'pointer',
      filter: pinFilter,
      animation: pinAnimation,
    }}
    onClick={(e) => {
      e.stopPropagation()
      setOpen(prev => {
        const next = !prev
        if (next) onFocusProvince?.(provinceId)
        else onUnfocusProvince?.()
        return next
      })
    }}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'relative', display: 'inline-block', pointerEvents: 'none' }}>
        {!open && (
          <NotificationPin
            kind="event"
            size={EVENT_PIN_SIZE}
            label={`${provinceName}: meeting`}
          />
        )}
      </div>

      {/* Portal clicks bubble through React to the pin's onClick, so stop them here. */}
      {(open || newsOpen) && createPortal(
        <div onClick={e => e.stopPropagation()}>
          {open && (
            <ProvinceChoiceMenu
              title={provinceName}
              subtitle={PROVINCES[provinceId]?.subtitle}
              medalSrc={getSealArt(provinceId)}
              choices={choices}
              onSelect={handleSelect}
              onClose={closeMenu}
            />
          )}
          {newsOpen && (
            <ProvinceNewsPopover
              provinceName={provinceName}
              items={feed}
              onClose={closeNews}
              onOpenPapers={() => {
                setNewsOpen(false)
                onUnfocusProvince?.()
                useNewsStore.getState().setOpen(true)
              }}
            />
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
