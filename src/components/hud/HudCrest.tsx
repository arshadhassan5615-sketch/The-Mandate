// Top-left corner of the HUD: a sculpted gold national medal (the Veltria compass star on blue enamel) that opens the nation overview.
import { Z } from '../../constants/zIndex'
import NationalMedal from './NationalMedal'
import { HUD_SIZES, SAFE_LEFT, type HudScale } from './hudSizes'

interface HudCrestProps {
  scale: HudScale
  onOpenOverview: () => void
}

export default function HudCrest({ scale, onOpenOverview }: HudCrestProps) {
  const sizes = HUD_SIZES[scale]
  const medalSize = sizes.flagW - 4
  return (
    <button
      type="button"
      aria-label="Nation overview"
      data-testid="hud-crest"
      className="hud-crest"
      onClick={onOpenOverview}
      style={{
        position: 'fixed', top: 2, left: SAFE_LEFT, marginLeft: 2,
        width: medalSize, height: medalSize, padding: 0,
        border: 'none', background: 'transparent', borderRadius: '50%', boxSizing: 'border-box',
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))',
        cursor: 'pointer', zIndex: Z.topBar + 1, overflow: 'visible',
      }}
    >
      <NationalMedal size={medalSize} />
    </button>
  )
}
