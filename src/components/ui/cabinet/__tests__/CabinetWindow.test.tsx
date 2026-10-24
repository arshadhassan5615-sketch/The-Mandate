import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CabinetWindow from '../CabinetWindow'

const TITLE = 'Window test'
const CLOSE_LABEL = 'Close window test'

function renderWindow(overrides: Partial<Parameters<typeof CabinetWindow>[0]> = {}) {
  const onClose = vi.fn()
  render(
    <CabinetWindow
      testId="cabinet-window"
      titleId="cabinet-window-title"
      title={TITLE}
      closeLabel={CLOSE_LABEL}
      onClose={onClose}
      {...overrides}
    >
      <p>Window body</p>
    </CabinetWindow>,
  )
  return { onClose }
}

// jsdom's CSS parser drops min() values, so read the value React hands to the size setters.
function spyOnSizeSetter(property: 'width' | 'height') {
  const styleProto = Object.getPrototypeOf(document.createElement('div').style)
  return vi.spyOn(styleProto, property, 'set')
}

describe('CabinetWindow shell', () => {
  it('renders a modal dialog labelled by the title', () => {
    renderWindow()
    const dialog = screen.getByRole('dialog', { name: TITLE })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Window body')).toBeInTheDocument()
  })

  it('sizes to 760 by 560 by default, capped by the viewport', () => {
    const widthSetter = spyOnSizeSetter('width')
    const heightSetter = spyOnSizeSetter('height')
    try {
      renderWindow()
      expect(widthSetter).toHaveBeenCalledWith('min(760px, 100%)')
      expect(heightSetter).toHaveBeenCalledWith('min(560px, 100%)')
    } finally {
      widthSetter.mockRestore()
      heightSetter.mockRestore()
    }
  })

  it('uses the given width and height', () => {
    const widthSetter = spyOnSizeSetter('width')
    const heightSetter = spyOnSizeSetter('height')
    try {
      renderWindow({ width: 500, height: 320 })
      expect(widthSetter).toHaveBeenCalledWith('min(500px, 100%)')
      expect(heightSetter).toHaveBeenCalledWith('min(320px, 100%)')
    } finally {
      widthSetter.mockRestore()
      heightSetter.mockRestore()
    }
  })

  it('shows the default overline Chancellery and a given overline in its place', () => {
    const { unmount } = render(
      <CabinetWindow testId="cabinet-window" titleId="t" title={TITLE} closeLabel={CLOSE_LABEL} onClose={() => {}}>
        <p>body</p>
      </CabinetWindow>,
    )
    expect(screen.getByText('Chancellery')).toBeInTheDocument()
    unmount()

    renderWindow({ overline: 'Decrees' })
    expect(screen.getByText('Decrees')).toBeInTheDocument()
    expect(screen.queryByText('Chancellery')).toBeNull()
  })

  it('focuses the heading on open', () => {
    renderWindow()
    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus()
  })

  it('fades the backdrop in and pops the window in when opened', () => {
    renderWindow()
    expect(screen.getByTestId('cabinet-window-backdrop')).toHaveClass('anim-fade-in')
    expect(screen.getByRole('dialog')).toHaveClass('anim-pop-in')
  })
})

describe('CabinetWindow behaviour', () => {
  it('calls onClose on Escape', () => {
    const { onClose } = renderWindow()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the close button is clicked', () => {
    const { onClose } = renderWindow()
    fireEvent.click(screen.getByRole('button', { name: CLOSE_LABEL }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is pressed', () => {
    const { onClose } = renderWindow()
    fireEvent.mouseDown(screen.getByTestId('cabinet-window-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the press lands inside the window', () => {
    const { onClose } = renderWindow()
    fireEvent.mouseDown(screen.getByText('Window body'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('CabinetWindow tabs and footer', () => {
  it('renders the tabs inside a tablist with the given label', () => {
    renderWindow({
      tabsLabel: 'Sections',
      tabs: (
        <>
          <button type="button" role="tab" aria-selected="true">One</button>
          <button type="button" role="tab" aria-selected="false">Two</button>
        </>
      ),
    })
    const tablist = screen.getByRole('tablist', { name: 'Sections' })
    expect(tablist).toContainElement(screen.getByRole('tab', { name: 'One' }))
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('renders both footer groups in the pinned footer, outside the body', () => {
    renderWindow({
      footerStart: <button type="button">Restore</button>,
      footerEnd: <button type="button">Leave</button>,
    })
    const footer = screen.getByTestId('cabinet-window-footer')
    expect(footer).toContainElement(screen.getByRole('button', { name: 'Restore' }))
    expect(footer).toContainElement(screen.getByRole('button', { name: 'Leave' }))
    expect(screen.getByTestId('cabinet-window-body')).not.toContainElement(footer)
  })

  it('renders no footer when neither group is given', () => {
    renderWindow()
    expect(screen.queryByTestId('cabinet-window-footer')).toBeNull()
  })
})

describe('CabinetWindow dense layout on short screens', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  afterEach(() => {
    window.innerWidth = originalWidth
    window.innerHeight = originalHeight
  })

  it('hides the national seal in compact mode and shows it on desktop', () => {
    window.innerWidth = 844
    window.innerHeight = 390
    const { unmount } = render(
      <CabinetWindow testId="cabinet-window" titleId="t" title={TITLE} closeLabel={CLOSE_LABEL} onClose={() => {}}>
        <p>body</p>
      </CabinetWindow>,
    )
    expect(screen.queryByTestId('national-seal')).toBeNull()
    unmount()

    window.innerWidth = 1440
    window.innerHeight = 900
    renderWindow()
    expect(screen.getByTestId('national-seal')).toBeInTheDocument()
  })
})
