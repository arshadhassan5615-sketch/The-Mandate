import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProvinceChoiceMenu, { type ProvinceChoice } from '../ProvinceChoiceMenu'

const CHOICES: ProvinceChoice[] = [
  { id: 'read', title: 'Read the dispatches', detail: 'Three reports from the last fortnight', icon: 'updates', variant: 'info' },
  { id: 'meet', title: 'Hold a meeting', detail: 'Meet the provincial governor', icon: 'meeting', variant: 'action' },
  { id: 'alert', title: 'Respond to the alert', icon: 'urgent', variant: 'action', disabled: true },
]

function renderMenu(overrides: Partial<Parameters<typeof ProvinceChoiceMenu>[0]> = {}) {
  const props = {
    title: 'Kravenstal',
    subtitle: 'Industrial Heartland',
    choices: CHOICES,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  render(<ProvinceChoiceMenu {...props} />)
  return props
}

describe('ProvinceChoiceMenu', () => {
  it('renders the title, subtitle and one button per choice with its title and detail', () => {
    renderMenu()
    expect(screen.getByText('Kravenstal')).toBeInTheDocument()
    expect(screen.getByText('Industrial Heartland')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(CHOICES.length)
    const readButton = screen.getByTestId('choice-read')
    expect(readButton).toHaveTextContent('Read the dispatches')
    expect(readButton).toHaveTextContent('Three reports from the last fortnight')
    expect(screen.getByTestId('choice-meet')).toHaveTextContent('Hold a meeting')
  })

  it('calls onSelect with the id of a clicked choice', () => {
    const { onSelect } = renderMenu()
    fireEvent.click(screen.getByTestId('choice-meet'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('meet')
  })

  it('does not call onSelect for a disabled choice', () => {
    const { onSelect } = renderMenu()
    const disabledButton = screen.getByTestId('choice-alert')
    expect(disabledButton).toBeDisabled()
    fireEvent.click(disabledButton)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('gives info rows and action rows their variant classes', () => {
    renderMenu()
    expect(screen.getByTestId('choice-read')).toHaveClass('province-choice--info')
    expect(screen.getByTestId('choice-read')).not.toHaveClass('province-choice--action')
    expect(screen.getByTestId('choice-meet')).toHaveClass('province-choice--action')
    expect(screen.getByTestId('choice-meet')).not.toHaveClass('province-choice--info')
  })

  it('renders the icon for each icon kind', () => {
    renderMenu({
      choices: [
        { id: 'a', title: 'Updates', icon: 'updates', variant: 'info' },
        { id: 'b', title: 'Meeting', icon: 'meeting', variant: 'action' },
        { id: 'c', title: 'Urgent', icon: 'urgent', variant: 'action' },
      ],
    })
    expect(screen.getByTestId('choice-icon-updates')).toBeInTheDocument()
    expect(screen.getByTestId('choice-icon-meeting')).toBeInTheDocument()
    expect(screen.getByTestId('choice-icon-urgent')).toBeInTheDocument()
  })

  it('calls onClose on Escape', () => {
    const { onClose } = renderMenu()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on a backdrop click', () => {
    const { onClose } = renderMenu()
    fireEvent.click(screen.getByTestId('province-choice-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for a click inside the panel', () => {
    const { onClose } = renderMenu()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('names the dialog after the province', () => {
    renderMenu()
    expect(screen.getByRole('dialog', { name: 'Kravenstal: choose an action' })).toBeInTheDocument()
  })

  it('keeps the title tab in normal flow so it cannot overlap the options', () => {
    renderMenu()
    const tab = screen.getByTestId('province-choice-tab')
    expect(tab).toContainElement(screen.getByText('Kravenstal'))
    expect(tab.style.position).not.toBe('absolute')
  })

  it('keeps the title tab above the options instead of on top of them', () => {
    renderMenu()
    const panel = screen.getByRole('dialog')
    const tab = screen.getByTestId('province-choice-tab')
    expect(panel.firstElementChild).toBe(tab)
    expect(tab.nextElementSibling?.contains(screen.getByTestId(`choice-${CHOICES[0].id}`))).toBe(true)
  })
})
