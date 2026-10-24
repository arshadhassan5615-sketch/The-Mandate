// Top-left corner of the HUD: the Veltrian flag in a thin gold frame, which opens the nation overview.
import { getFlagArt } from '../../assets/flags'
import { Z } from '../../constants/zIndex'
import { HUD_SIZES, SAFE_LEFT, type HudScale } from './hudSizes'

/** Soft vertical folds over the flag, so it reads as cloth instead of a flat picture. */
const CLOTH_SHEEN = 'linear-gradient(100deg, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0.14) 22%, rgba(255,255,255,0.12) 45%, rgba(0,0,0,0.12) 68%, rgba(255,255,255,0.08) 88%, rgba(0,0,0,0.10) 100%)'
const FRAME_GOLD = '#c9a84c'

interface HudCrestProps {
  scale: HudScale
  onOpenOverview: () => void
}

export default function HudCrest({ scale, onOpenOverview }: HudCrestProps) {
  const sizes = HUD_SIZES[scale]
  const flag = getFlagArt('Veltria.jpg')
  return (
    <button
      type="button"
      aria-label="Nation overview"
      data-testid="hud-crest"
      className="hud-crest"
      onClick={onOpenOverview}
      style={{
        position: 'fixed', top: 2, left: SAFE_LEFT, marginLeft: 2,
        width: sizes.flagW - 4, height: sizes.flagH, padding: 0,
        border: `1.5px solid ${FRAME_GOLD}`, borderRadius: 4, boxSizing: 'border-box',
        background: flag === null ? '#062a60' : `${CLOTH_SHEEN}, url("${flag}") center / cover no-repeat`,
        boxShadow: '0 6px 12px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.35)',
        cursor: 'pointer', zIndex: Z.topBar + 1,
      }}
    >
      <span data-testid="national-flag" aria-hidden="true" />
    </button>
  )
}
