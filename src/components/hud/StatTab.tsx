// Compact dark stat tab docked to the right of the flag: a labelled approval
// gauge and cream number chips for the treasury (and the privy purse on desktop).
import treasuryIcon from '../../assets/images/ui/icon_treasury.png'
import wealthIcon from '../../assets/images/ui/icon_wealth.png'
import { Z } from '../../constants/zIndex'
import { HUD_SIZES, SAFE_LEFT, type HudScale } from './hudSizes'

type FlashState = 'positive' | 'negative' | null

interface FlashInfo {
  flash: FlashState
  delta: number
}

interface StatTabProps {
  scale: HudScale
  balance: number
  personalWealth: number
  publicImage: number
  investigation: boolean
  treasuryFlash: FlashInfo
  approvalFlash: FlashInfo
  showPrivyPurse: boolean
  /** Desktop only: a conversation column covers the centre, so the tab shrinks to fit the left gap. */
  besideColumn?: boolean
}

const CREAM = '#e8dcc0'
const PLEX = "'IBM Plex Mono', monospace"
const SERIF = "'Playfair Display', serif"
const DELTA_UP = '#2e9e4f'
const DELTA_DOWN = '#c94a3a'
const APPROVAL_GOOD = '#5f8a4e'
const APPROVAL_BAD = '#a8402f'

function formatDelta(delta: number): string {
  const rounded = Math.round(delta)
  return rounded > 0 ? `+${rounded.toLocaleString()}` : rounded.toLocaleString()
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function FlashDelta({ flash, delta }: FlashInfo) {
  if (flash === null || delta === 0) return null
  return (
    <span style={{ fontFamily: SERIF, fontSize: '11px', fontWeight: 700, color: delta > 0 ? DELTA_UP : DELTA_DOWN }}>
      {formatDelta(delta)}
    </span>
  )
}

function ApprovalGauge({ scale, publicImage, approval }: { scale: HudScale; publicImage: number; approval: FlashInfo }) {
  const sizes = HUD_SIZES[scale]
  const compact = scale === 'compact'
  const level = clampPercent(publicImage)
  return (
    <div data-testid="stat-approval" title="Approval" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <span style={{
        fontFamily: PLEX, fontSize: compact ? '8px' : '9px', letterSpacing: '0.25em', lineHeight: 1.4,
        color: CREAM, background: '#161616', border: '1px solid rgba(181,154,94,0.5)',
        borderRadius: '3px', padding: '1px 8px',
      }}>
        APPROVAL
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: sizes.gaugeWidth, height: compact ? 8 : 10, overflow: 'hidden',
          background: '#e9e2cf', border: '1px solid #6b5a34', borderRadius: '3px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)',
        }}>
          <div style={{
            width: `${level}%`, height: '100%',
            background: level >= 50 ? APPROVAL_GOOD : APPROVAL_BAD,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginLeft: '6px' }}>
          <span style={{
            fontFamily: SERIF, fontSize: compact ? '11px' : '13px', fontWeight: 700, lineHeight: 1, color: CREAM,
            animation: approval.flash ? `stat-flash-${approval.flash} 0.6s ease-out` : undefined,
          }}>
            {`${Math.round(publicImage)}%`}
          </span>
          <FlashDelta {...approval} />
        </span>
      </div>
    </div>
  )
}

interface ChipStatProps {
  scale: HudScale
  testId: string
  title: string
  icon: string
  value: string
  negative?: boolean
  flash?: FlashInfo
}

function ChipStat({ scale, testId, title, icon, value, negative = false, flash }: ChipStatProps) {
  const sizes = HUD_SIZES[scale]
  return (
    <div data-testid={testId} title={title} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <img
        src={icon} alt="" width={sizes.icon} height={sizes.icon}
        style={{
          display: 'block', flexShrink: 0, objectFit: 'contain',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))', margin: '-4px -2px',
        }}
      />
      <span style={{
        fontFamily: SERIF, fontWeight: 700, fontSize: `${sizes.chipFont}px`, lineHeight: 1.2,
        color: negative ? '#8a2a1f' : '#111111', background: '#e9e2cf',
        border: '1px solid #6b5a34', borderRadius: '3px', padding: '1px 8px',
        minWidth: '30px', textAlign: 'center', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.15)',
        animation: flash?.flash ? `stat-flash-${flash.flash} 0.6s ease-out` : undefined,
      }}>
        {value}
      </span>
      {flash && <FlashDelta {...flash} />}
    </div>
  )
}

export default function StatTab({
  scale, balance, personalWealth, publicImage, investigation, treasuryFlash, approvalFlash, showPrivyPurse, besideColumn = false,
}: StatTabProps) {
  const narrow = besideColumn && scale === 'desktop'
  // Beside the column the desktop tab is drawn with the compact size set, but keeps the desktop left offset.
  const sizeScale: HudScale = narrow ? 'compact' : scale
  const sizes = HUD_SIZES[sizeScale]
  const compact = sizeScale === 'compact'
  return (
    <div
      data-testid="command-bar"
      data-layout={scale}
      data-beside-column={narrow ? 'true' : undefined}
      style={{
        position: 'fixed', top: 0,
        left: `calc(${HUD_SIZES[scale].flagW}px + ${SAFE_LEFT})`,
        height: sizes.strip,
        display: 'flex', alignItems: 'center', gap: compact ? '10px' : '16px',
        padding: compact ? '0 10px 0 10px' : '0 14px 0 16px',
        background: 'linear-gradient(180deg,#0d0d0d 0%,#030303 100%)',
        border: '1px solid rgba(181,154,94,0.45)', borderTop: 'none', borderLeft: 'none',
        borderRadius: '0 0 10px 0',
        boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
        zIndex: Z.topBar,
        maxWidth: narrow
          ? 'calc((100vw - clamp(218px, 36.3vw, 1094px)) / 2 - 0.3vw - 128px)'
          : 'calc(100vw - 240px)',
        overflow: narrow ? 'hidden' : undefined,
      }}
    >
      <ApprovalGauge scale={sizeScale} publicImage={publicImage} approval={approvalFlash} />
      <ChipStat
        scale={sizeScale} testId="stat-treasury" title="Treasury" icon={treasuryIcon}
        value={`₭${balance.toLocaleString()}`} negative={balance < 0} flash={treasuryFlash}
      />
      {showPrivyPurse && !narrow && (
        <ChipStat scale={sizeScale} testId="stat-privy-purse" title="Privy Purse" icon={wealthIcon} value={personalWealth.toLocaleString()} />
      )}
      {investigation && (
        <span title="Active investigation — classified" style={{
          alignSelf: 'center', padding: '2px 6px', border: '1px solid rgba(200,80,60,0.6)', color: '#e85a44',
          fontFamily: 'var(--font-ui)', fontSize: '9px', letterSpacing: '0.14em', animation: 'event-pulse-urgent 2s ease-in-out infinite',
        }}>
          CLASSIFIED
        </span>
      )}
    </div>
  )
}
