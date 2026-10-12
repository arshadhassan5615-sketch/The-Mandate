import { useState, type CSSProperties, type ReactNode } from 'react'
import veltriaSeal from '../../assets/images/veltria_seal.png'
import ImageButton from '../common/ImageButton'
import EconomyPanel from './EconomyPanel'
import DebtPanel from './DebtPanel'
import InflationPanel from './InflationPanel'
import PublicOrderPanel from './PublicOrderPanel'
import { Z } from '../../constants/zIndex'

export type StatsTab = 'economy' | 'debt' | 'inflation' | 'publicOrder'

/**
 * Expected asset basenames under src/assets/images/buttons/ once generated:
 *   tab_economy.png, tab_debt.png, tab_inflation.png, tab_public_order.png
 *
 * IMPORTANT: Vite/rolldown hard-fails at BUILD time on missing static
 * `import x from '...png'` (UNRESOLVED_IMPORT). ImageButton's onError
 * fallback only helps when the import resolves but the image fails at
 * runtime. Until the four PNGs exist on disk, do NOT static-import them.
 * Empty src forces immediate onError → text fallback (build stays green).
 * When assets land, replace TAB_IMAGE_SRC values with static imports.
 */
const TAB_IMAGE_SRC: Record<StatsTab, string> = {
  economy: '', // → '../../assets/images/buttons/tab_economy.png' when file exists
  debt: '',
  inflation: '',
  publicOrder: '',
}

/** Text-tab fallback look — copied from the pre-ImageButton CSS tab buttons. */
function tabFallbackStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: '6px 4px',
    background: active ? 'rgba(201,168,76,0.2)' : 'transparent',
    border: active
      ? '1px solid rgba(201,168,76,0.5)'
      : '1px solid rgba(201,168,76,0.15)',
    borderRadius: '3px',
    color: active ? '#c9a84c' : 'rgba(201,168,76,0.6)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '9px',
    letterSpacing: '0.05em',
    boxSizing: 'border-box',
  }
}

function TabFallback({ label, active }: { label: string; active: boolean }): ReactNode {
  return <span style={tabFallbackStyle(active)}>{label}</span>
}

const TABS: { key: StatsTab; label: string }[] = [
  { key: 'economy', label: 'Economy' },
  { key: 'debt', label: 'Debt' },
  { key: 'inflation', label: 'Inflation' },
  { key: 'publicOrder', label: 'Public Order' },
]

interface StatsPanelProps {
  onClose: () => void
}

/**
 * Shared shell for nation stats: one fixed panel, seal + close, tab row,
 * and embedded body of the selected stat (no nested fixed shells).
 * Outer chrome copied verbatim from EconomyPanel standalone shell.
 */
export default function StatsPanel({ onClose }: StatsPanelProps) {
  const [activeTab, setActiveTab] = useState<StatsTab>('economy')

  return (
    <div
      data-testid="stats-panel"
      style={{
        position: 'fixed', left: '52px', top: '50px', width: '320px',
        height: 'calc(100vh - 110px)', zIndex: Z.panel,
        background: 'rgba(12,10,8,0.96)',
        border: '1px solid rgba(196,148,58,0.25)', borderRight: 'none',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 4px 24px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid rgba(196,148,58,0.15)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          <img
            src={veltriaSeal}
            alt=""
            style={{
              width: '48px',
              height: '48px',
              display: 'block',
              margin: '0 auto 8px auto',
              opacity: 0.9,
            }}
          />
          {/* Tab row — ImageButton; text fallback until tab_*.png assets exist */}
          <div
            data-testid="stats-tabs"
            style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '4px',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            {TABS.map(tab => (
              <ImageButton
                key={tab.key}
                data-testid={`stats-tab-${tab.key}`}
                src={TAB_IMAGE_SRC[tab.key]}
                fallback={
                  <TabFallback
                    label={tab.label}
                    active={activeTab === tab.key}
                  />
                }
                alt={tab.label}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                width={110}
                height={32}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          data-testid="stats-panel-close"
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1,
            marginLeft: '8px', alignSelf: 'flex-start',
          }}
        >
          ✕
        </button>
      </div>

      {activeTab === 'economy' && <EconomyPanel embedded />}
      {activeTab === 'debt' && <DebtPanel embedded />}
      {activeTab === 'inflation' && <InflationPanel embedded />}
      {activeTab === 'publicOrder' && <PublicOrderPanel embedded />}
    </div>
  )
}
