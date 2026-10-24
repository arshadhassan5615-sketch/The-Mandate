import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CabinetDrawer from '../CabinetDrawer'
import { HUD_RAIL_WIDTH } from '../../../../constants/layout'

const TITLE = 'Cabinet test'
const CLOSE_LABEL = 'Close cabinet test'

function renderDrawer(overrides: Partial<Parameters<typeof CabinetDrawer>[0]> = {}) {
  const onClose = vi.fn()
  render(
    <CabinetDrawer
      testId="cabinet-test"
      titleId="cabinet-test-title"
      title={TITLE}
      closeLabel={CLOSE_LABEL}
      onClose={onClose}
      {...overrides}
    >
      <p>Drawer body</p>
    </CabinetDrawer>,
  )
  return { onClose }
}

describe('CabinetDrawer shell', () => {
  it('renders a non-modal dialog labelled by the title, with the seal, ornament rule and gold corners', () => {
    renderDrawer({ overline: 'Test', standfirst: 'A standfirst' })
    const dialog = screen.getByRole('dialog', { name: TITLE })
    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(screen.getByTestId('national-seal')).toHaveAttribute('data-surface', 'dark')
    expect(screen.getByTestId('ornament-rule')).toBeInTheDocument()
    expect(screen.getAllByTestId('gold-corner')).toHaveLength(4)
    expect(screen.getByText('A standfirst')).toBeInTheDocument()
    expect(screen.getByText('Drawer body')).toBeInTheDocument()
  })

  it('applies the caller className alongside cabinet-drawer', () => {
    renderDrawer({ className: 'extra-class' })
    expect(screen.getByTestId('cabinet-test')).toHaveClass('cabinet-drawer', 'extra-class')
  })

  it('slides in from the right when opened', () => {
    renderDrawer()
    expect(screen.getByRole('dialog')).toHaveClass('anim-slide-in-right')
  })

  it('docks at the button rail on desktop', () => {
    renderDrawer()
    expect(screen.getByRole('dialog')).toHaveStyle({ right: `${HUD_RAIL_WIDTH}px`, top: '0px', bottom: '0px' })
  })

  it('renders the footer text when footer is given', () => {
    renderDrawer({ footer: 'Vol. I' })
    expect(screen.getByText('Vol. I')).toBeInTheDocument()
  })

  it('renders no footer when footer is omitted', () => {
    renderDrawer()
    expect(screen.queryByText('Vol. I')).toBeNull()
  })

  it('renders a tablist with the given aria-label when tabs are given', () => {
    renderDrawer({ tabs: <button type="button" role="tab" aria-selected="true">One</button>, tabsLabel: 'Sections' })
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
  })
})

describe('CabinetDrawer behaviour', () => {
  it('focuses the heading on open', () => {
    renderDrawer()
    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus()
  })

  it('calls onClose on Escape', () => {
    const { onClose } = renderDrawer()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the close button is clicked', () => {
    const { onClose } = renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: CLOSE_LABEL }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('CabinetDrawer placement by viewport', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  afterEach(() => {
    window.innerWidth = originalWidth
    window.innerHeight = originalHeight
  })

  it('fills the width between the phone bars', () => {
    window.innerWidth = 390
    window.innerHeight = 844
    renderDrawer()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'phone')
    expect(screen.getByRole('dialog')).toHaveStyle({ left: '0px', right: '0px', top: '52px', bottom: '60px' })
  })
})

describe('CabinetDrawer dense header on short screens', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  afterEach(() => {
    window.innerWidth = originalWidth
    window.innerHeight = originalHeight
  })

  it('drops the national seal in compact mode and keeps it on desktop', () => {
    window.innerWidth = 844
    window.innerHeight = 390
    const { unmount } = render(
      <CabinetDrawer testId="cabinet-test" titleId="cabinet-test-title" title={TITLE} closeLabel={CLOSE_LABEL} onClose={() => {}}>
        <p>Drawer body</p>
      </CabinetDrawer>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'compact')
    expect(screen.queryByTestId('national-seal')).toBeNull()
    unmount()

    window.innerWidth = 1280
    window.innerHeight = 800
    renderDrawer()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'desktop')
    expect(screen.getByTestId('national-seal')).toBeInTheDocument()
  })
})
