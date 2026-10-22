// Top-left corner of the desktop and landscape HUD: a framed Veltria flag that
// opens the nation overview.
import veltriaFlag from '../../assets/images/Flags/Veltria.jpg'
import { Z } from '../../constants/zIndex'
import { HUD_SIZES, SAFE_LEFT, type HudScale } from './hudSizes'

interface HudCrestProps {
  scale: HudScale
  onOpenOverview: () => void
}

const FLAG_SHEEN = 'linear-gradient(115deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)'

export default function HudCrest({ scale, onOpenOverview }: HudCrestProps) {
  const sizes = HUD_SIZES[scale]
  return (
    <button
      type="button"
      aria-label="Nation overview"
      data-testid="hud-crest"
      className="hud-crest"
      onClick={onOpenOverview}
      style={{
        position: 'fixed', top: 0, left: SAFE_LEFT,
        width: sizes.flagW, height: sizes.flagH, padding: 0,
        border: '1px solid #c9a84c', borderTop: 'none', borderLeft: 'none',
        borderRadius: '0 0 0 4px', overflow: 'hidden',
        background: '#000',
        boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(0,0,0,0.6)',
        cursor: 'pointer', zIndex: Z.topBar + 1,
      }}
    >
      <img src={veltriaFlag} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <span aria-hidden style={{ position: 'absolute', inset: 0, background: FLAG_SHEEN }} />
    </button>
  )
}
