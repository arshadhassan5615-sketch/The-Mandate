import { describe, it, expect, vi, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CabinetDocument, { PaperTab } from '../CabinetDocument'
import { COMPACT_LEFT_GUTTER, HUD_LEFT_GUTTER, HUD_RAIL_WIDTH } from '../../../../constants/layout'

const TITLE = 'State document test'
const CLOSE_LABEL = 'Close document test'

function renderDocument(overrides: Partial<Parameters<typeof CabinetDocument>[0]> = {}) {
  const onClose = vi.fn()
  render(
    <CabinetDocument
      testId="cabinet-doc"
      titleId="cabinet-doc-title"
      title={TITLE}
      closeLabel={CLOSE_LABEL}
      onClose={onClose}
      {...overrides}
    >
      <p>Document body</p>
    </CabinetDocument>,
  )
  return { onClose }
}

type TabId = 'one' | 'two' | 'three'

/** Three tabs, each switching the body text, so selection can be checked after key presses. */
function TabbedHarness() {
  const [tab, setTab] = useState<TabId>('one')
  return (
    <CabinetDocument
      testId="cabinet-doc"
      titleId="cabinet-doc-title"
      title={TITLE}
      closeLabel={CLOSE_LABEL}
      onClose={() => {}}
      tabsLabel="Sections"
      tabs={
        <>
          <PaperTab id="tab-one" label="One" active={tab === 'one'} onSelect={() => setTab('one')} />
          <PaperTab id="tab-two" label="Two" active={tab === 'two'} onSelect={() => setTab('two')} />
          <PaperTab id="tab-three" label="Three" active={tab === 'three'} onSelect={() => setTab('three')} />
        </>
      }
    >
      <p>{`${tab} body`}</p>
    </CabinetDocument>
  )
}

describe('CabinetDocument shell', () => {
  it('renders a non-modal dialog labelled by the title', () => {
    renderDocument()
    const dialog = screen.getByRole('dialog', { name: TITLE })
    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(dialog).toHaveClass('cabinet-document')
    expect(screen.getByText('Document body')).toBeInTheDocument()
  })

  it('shows the default overline Chancellery', () => {
    renderDocument()
    expect(screen.getByText('Chancellery')).toBeInTheDocument()
  })

  it('shows a given overline in place of the default', () => {
    renderDocument({ overline: 'Decrees' })
    expect(screen.getByText('Decrees')).toBeInTheDocument()
    expect(screen.queryByText('Chancellery')).toBeNull()
  })

  it('renders the actions slot pinned below the body', () => {
    renderDocument({ actions: <button type="button">Sign state paper</button> })
    const actions = screen.getByTestId('cabinet-doc-actions')
    expect(actions).toContainElement(screen.getByRole('button', { name: 'Sign state paper' }))
    expect(screen.getByTestId('cabinet-doc-body')).not.toContainElement(actions)
  })

  it('renders no actions area when actions are omitted', () => {
    renderDocument()
    expect(screen.queryByTestId('cabinet-doc-actions')).toBeNull()
  })

  it('renders the nav slot under the title', () => {
    renderDocument({ nav: <span>Page 2 of 5</span> })
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
  })

  it('caps the column at maxWidth on desktop, defaulting to 600px', () => {
    renderDocument()
    expect(screen.getByTestId('cabinet-doc')).toHaveStyle({ maxWidth: '600px' })
  })

  it('renders a tablist with the given aria-label when tabs are given', () => {
    render(<TabbedHarness />)
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })
})

describe('CabinetDocument behaviour', () => {
  it('focuses the heading on open', () => {
    renderDocument()
    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus()
  })

  it('calls onClose on Escape', () => {
    const { onClose } = renderDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the close button is clicked', () => {
    const { onClose } = renderDocument()
    fireEvent.click(screen.getByRole('button', { name: CLOSE_LABEL }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('CabinetDocument tabs', () => {
  it('gives only the selected tab a tab stop', () => {
    render(<TabbedHarness />)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection and focus to the next tab on ArrowRight', () => {
    render(<TabbedHarness />)
    const one = screen.getByRole('tab', { name: 'One' })
    one.focus()
    fireEvent.keyDown(one, { key: 'ArrowRight' })
    const two = screen.getByRole('tab', { name: 'Two' })
    expect(two).toHaveAttribute('aria-selected', 'true')
    expect(two).toHaveAttribute('tabindex', '0')
    expect(two).toHaveFocus()
    expect(screen.getByText('two body')).toBeInTheDocument()
  })

  it('wraps with the arrow keys and jumps with Home and End', () => {
    render(<TabbedHarness />)
    const one = screen.getByRole('tab', { name: 'One' })
    one.focus()
    fireEvent.keyDown(one, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Three' }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), { key: 'End' })
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Three' }), { key: 'Home' })
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('PaperTab', () => {
  it('shows its count with an aria-label of N items', () => {
    render(
      <div role="tablist" aria-label="Letters">
        <PaperTab id="tab-letters" label="Letters" count={3} active={false} onSelect={() => {}} />
      </div>,
    )
    const badge = screen.getByLabelText('3 items')
    expect(badge).toHaveTextContent('3')
  })

  it('omits the count badge when no count is given', () => {
    render(<PaperTab id="tab-plain" label="Plain" active onSelect={() => {}} />)
    expect(screen.queryByLabelText(/items$/)).toBeNull()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<PaperTab id="tab-click" label="Click" active={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Click' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

describe('CabinetDocument placement by viewport', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  afterEach(() => {
    window.innerWidth = originalWidth
    window.innerHeight = originalHeight
  })

  it('sits between the left gutter and the button rail on desktop', () => {
    window.innerWidth = 1280
    window.innerHeight = 800
    renderDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'desktop')
    expect(screen.getByTestId('cabinet-doc-area')).toHaveStyle({
      left: `${HUD_LEFT_GUTTER}px`,
      right: `${HUD_RAIL_WIDTH}px`,
      top: '0px',
      bottom: '0px',
    })
  })

  it('uses the compact gutter on short landscape screens', () => {
    window.innerWidth = 900
    window.innerHeight = 400
    renderDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'compact')
    expect(screen.getByTestId('cabinet-doc-area')).toHaveStyle({ left: `${COMPACT_LEFT_GUTTER}px` })
  })

  it('fills the width between the phone bars', () => {
    window.innerWidth = 390
    window.innerHeight = 844
    renderDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'phone')
    expect(screen.getByTestId('cabinet-doc-area')).toHaveStyle({ left: '0px', right: '0px', top: '52px', bottom: '60px' })
  })
})

describe('CabinetDocument dense header on short screens', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  afterEach(() => {
    window.innerWidth = originalWidth
    window.innerHeight = originalHeight
  })

  it('drops the overline and ornament rule in compact mode and keeps them on desktop', () => {
    window.innerWidth = 900
    window.innerHeight = 400
    const { unmount } = render(
      <CabinetDocument testId="cabinet-doc" titleId="cabinet-doc-title" title={TITLE} closeLabel={CLOSE_LABEL} onClose={() => {}}>
        <p>Document body</p>
      </CabinetDocument>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'compact')
    expect(screen.queryByText('Chancellery')).toBeNull()
    expect(screen.queryByTestId('ornament-rule')).toBeNull()
    unmount()

    window.innerWidth = 1280
    window.innerHeight = 800
    renderDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'desktop')
    expect(screen.getByText('Chancellery')).toBeInTheDocument()
    expect(screen.getByTestId('ornament-rule')).toBeInTheDocument()
  })
})
