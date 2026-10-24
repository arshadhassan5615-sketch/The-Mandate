import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PaperPanel, { PaperTabButton } from '../PaperPanel'
import { HUD_LEFT_GUTTER } from '../../../constants/layout'

const PAPER_TITLE = 'Test paper'
const CLOSE_LABEL = 'Close test paper'

function TestPaper({ onClose }: { onClose: () => void }) {
  return (
    <PaperPanel
      testId="test-paper"
      titleId="test-paper-title"
      overline="Test"
      title={PAPER_TITLE}
      closeLabel={CLOSE_LABEL}
      onClose={onClose}
    >
      <p>Paper body</p>
    </PaperPanel>
  )
}

/** The opener stays on the page while the panel is open. */
function ToggleHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open paper</button>
      {open && <TestPaper onClose={() => setOpen(false)} />}
    </>
  )
}

/** The opener leaves the page while the panel is open, and the TopBar More button is there. */
function RemovedOpenerHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" aria-label="More">More</button>
      {!open && <button type="button" onClick={() => setOpen(true)}>Open paper</button>}
      {open && <TestPaper onClose={() => setOpen(false)} />}
    </>
  )
}

type TabId = 'one' | 'two' | 'three'

function TabbedHarness() {
  const [tab, setTab] = useState<TabId>('one')
  return (
    <PaperPanel
      testId="tabbed-paper"
      titleId="tabbed-paper-title"
      overline="Test"
      title="Tabbed paper"
      closeLabel="Close tabbed paper"
      onClose={() => {}}
      tabsLabel="Sections"
      tabs={
        <>
          <PaperTabButton id="tab-one" label="One" active={tab === 'one'} onSelect={() => setTab('one')} />
          <PaperTabButton id="tab-two" label="Two" active={tab === 'two'} onSelect={() => setTab('two')} />
          <PaperTabButton id="tab-three" label="Three" active={tab === 'three'} onSelect={() => setTab('three')} />
        </>
      }
    >
      <p>{`${tab} body`}</p>
    </PaperPanel>
  )
}

describe('PaperPanel focus', () => {
  it('focuses the heading when the panel opens', () => {
    render(<ToggleHarness />)
    const opener = screen.getByRole('button', { name: 'Open paper' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('heading', { name: PAPER_TITLE })).toHaveFocus()
  })

  it('returns focus to the element that opened it when the panel closes', () => {
    render(<ToggleHarness />)
    const opener = screen.getByRole('button', { name: 'Open paper' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: CLOSE_LABEL }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('returns focus to the opener when the panel closes on Escape', () => {
    render(<ToggleHarness />)
    const opener = screen.getByRole('button', { name: 'Open paper' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('falls back to the More button when the opener has left the page', () => {
    render(<RemovedOpenerHarness />)
    const opener = screen.getByRole('button', { name: 'Open paper' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: CLOSE_LABEL }))
    expect(screen.getByRole('button', { name: 'More' })).toHaveFocus()
  })

  it('does not mark itself modal', () => {
    render(<TabbedHarness />)
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal')
  })

  it('clears the HUD crest on desktop', () => {
    render(<TabbedHarness />)
    expect(screen.getByRole('dialog')).toHaveStyle({ left: `${HUD_LEFT_GUTTER}px` })
  })
})

describe('PaperPanel tabs', () => {
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

  it('ignores keys that are not tab navigation keys', () => {
    const onClose = vi.fn()
    render(
      <PaperPanel
        testId="tabbed-paper"
        titleId="tabbed-paper-title"
        overline="Test"
        title="Tabbed paper"
        closeLabel="Close tabbed paper"
        onClose={onClose}
        tabs={<PaperTabButton id="tab-one" label="One" active onSelect={() => {}} />}
      >
        <p>body</p>
      </PaperPanel>,
    )
    const one = screen.getByRole('tab', { name: 'One' })
    one.focus()
    fireEvent.keyDown(one, { key: 'a' })
    expect(one).toHaveFocus()
    expect(onClose).not.toHaveBeenCalled()
  })
})
