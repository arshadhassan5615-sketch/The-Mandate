import CabinetDrawer from '../ui/cabinet/CabinetDrawer'
import { cabPillSegment } from '../ui/cabinet/cabinetStyles'

// The shared shell of the state panels. It renders through the Cabinet drawer, which
// owns the placement, focus, Escape and tablist behaviour. Panels supply their own body,
// and optionally a tablist through `tabs`.

export interface PaperTabButtonProps {
  id: string
  /** Id of the tabpanel this tab controls. Omit it when that tabpanel is not rendered. */
  controls?: string
  label: string
  count?: number
  active: boolean
  onSelect: () => void
  className?: string
}

export function PaperTabButton({ id, controls, label, count, active, onSelect, className }: PaperTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={() => onSelect()}
      className={['cabinet-pill-seg', 'touch-target', className].filter(Boolean).join(' ')}
      style={cabPillSegment(active)}
    >
      {label}
      {count !== undefined && <span style={{ marginLeft: 6, opacity: 0.75, letterSpacing: 0 }}>({count})</span>}
    </button>
  )
}

export interface PaperPanelProps {
  testId: string
  titleId: string
  overline: string
  title: string
  standfirst?: string
  closeLabel: string
  onClose: () => void
  desktopWidth?: string
  /** @deprecated no effect since the cabinet drawer */
  headerPadding?: string
  tabs?: React.ReactNode
  tabsLabel?: string
  children: React.ReactNode
}

export default function PaperPanel({
  testId,
  titleId,
  overline,
  title,
  standfirst,
  closeLabel,
  onClose,
  desktopWidth,
  tabs,
  tabsLabel,
  children,
}: PaperPanelProps) {
  return (
    <CabinetDrawer
      testId={testId}
      titleId={titleId}
      overline={overline}
      title={title}
      standfirst={standfirst}
      closeLabel={closeLabel}
      onClose={onClose}
      width={desktopWidth}
      tabs={tabs}
      tabsLabel={tabsLabel}
      className="paper-panel"
    >
      {children}
    </CabinetDrawer>
  )
}
