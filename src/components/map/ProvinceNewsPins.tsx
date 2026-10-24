// News and alert pins on home provinces with unseen recent reports; a click opens that province's dispatches.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import NotificationPin from './NotificationPin'
import ProvinceNewsPopover from './ProvinceNewsPopover'
import { PROVINCE_PIN_POSITIONS } from '../../engine/LocationResolver'
import {
  HOME_PROVINCES,
  provinceFeed,
  unseenItems,
  type HomeProvinceId,
} from '../../engine/provinceNews'
import { PROVINCE_SEALS } from './seals/provinceSeals'
import { PIN_TIP_OFFSET_X, pinTipOffsetY } from './pinPlacement'
import { useGameStore } from '../../stores/gameStore'
import { useNewsStore } from '../../stores/newsStore'
import { useProvinceNewsStore } from '../../stores/provinceNewsStore'

const NEWS_PIN_SIZE = 58
const PIN_BASE_Z_INDEX = 320

interface ProvinceNewsPinsProps {
  /** Provinces that show a meeting pin; their news is offered from the meeting pin's menu instead. */
  meetingProvinces?: ReadonlySet<string>
}

export default function ProvinceNewsPins({ meetingProvinces = new Set() }: ProvinceNewsPinsProps) {
  const articles = useNewsStore(s => s.articles)
  const currentWeek = useGameStore(s => s.currentWeek)
  const seenIds = useProvinceNewsStore(s => s.seenIds)
  const markSeen = useProvinceNewsStore(s => s.markSeen)
  const [openId, setOpenId] = useState<HomeProvinceId | null>(null)

  const openProvince = (id: HomeProvinceId) => {
    setOpenId(id)
    markSeen(provinceFeed(articles, id, currentWeek).map(item => item.article.id))
  }

  return (
    <>
      {HOME_PROVINCES.map(id => {
        const unseen = unseenItems(provinceFeed(articles, id, currentWeek), seenIds)
        if (unseen.length === 0 || meetingProvinces.has(id)) return null
        const seal = PROVINCE_SEALS[id]
        const anchor = PROVINCE_PIN_POSITIONS[id]
        const updateWord = unseen.length === 1 ? 'update' : 'updates'
        return (
          <div key={id} data-testid={`province-news-${id}`} style={{ position: 'absolute', left: 0, top: 0 }}>
            <div
              style={{
                position: 'absolute',
                left: anchor.x + PIN_TIP_OFFSET_X,
                top: anchor.y + pinTipOffsetY(id),
                transform: 'translate(-50%, -100%)',
                zIndex: PIN_BASE_Z_INDEX,
              }}
            >
              <NotificationPin
                kind="news"
                size={NEWS_PIN_SIZE}
                count={unseen.length}
                label={`${seal.name}: ${unseen.length} new ${updateWord}`}
                onClick={e => {
                  e.stopPropagation()
                  openProvince(id)
                }}
              />
            </div>
          </div>
        )
      })}
      {openId !== null && createPortal(
        <ProvinceNewsPopover
          provinceName={PROVINCE_SEALS[openId].name}
          items={provinceFeed(articles, openId, currentWeek)}
          onClose={() => setOpenId(null)}
          onOpenPapers={() => {
            setOpenId(null)
            useNewsStore.getState().setOpen(true)
          }}
        />,
        document.body,
      )}
    </>
  )
}
