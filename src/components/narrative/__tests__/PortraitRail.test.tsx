import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PortraitRail from '../PortraitRail'
import { medallionStates } from '../medallionStates'

function medallions(): HTMLElement[] {
  return screen.getAllByTestId('portrait-medallion')
}

describe('PortraitRail character cards', () => {
  it('shows the character card when a medallion is hovered', () => {
    render(<PortraitRail ids={['vyktor_reznik']} currentId={null} layout="column" />)
    fireEvent.mouseEnter(medallions()[0])
    const card = screen.getByTestId('character-card')
    expect(card).toHaveTextContent('Vyktor Reznik')
    expect(card).toHaveTextContent('Chief of Staff')
  })

  it('hides the character card when the pointer leaves the medallion', () => {
    render(<PortraitRail ids={['vyktor_reznik']} currentId={null} layout="column" />)
    fireEvent.mouseEnter(medallions()[0])
    fireEvent.mouseLeave(medallions()[0])
    expect(screen.queryByTestId('character-card')).toBeNull()
  })

  it('shows the character card when a medallion is focused and hides it on blur', () => {
    render(<PortraitRail ids={['vyktor_reznik']} currentId={null} layout="column" />)
    fireEvent.focus(medallions()[0])
    expect(screen.getByTestId('character-card')).toHaveTextContent('Vyktor Reznik')
    fireEvent.blur(medallions()[0])
    expect(screen.queryByTestId('character-card')).toBeNull()
  })

  it('makes each medallion focusable and drops the native title tooltip', () => {
    render(<PortraitRail ids={['vyktor_reznik']} currentId={null} layout="column" />)
    const [medallion] = medallions()
    expect(medallion).toHaveAttribute('tabindex', '0')
    expect(medallion).not.toHaveAttribute('title')
    expect(medallion).toHaveAttribute('aria-label', 'Vyktor Reznik, Chief of Staff')
  })

  it('shows no card for a medallion whose character is not in the roster', () => {
    render(<PortraitRail ids={['zz_unknown_person']} currentId={null} layout="column" />)
    fireEvent.mouseEnter(medallions()[0])
    expect(screen.queryByTestId('character-card')).toBeNull()
  })
})

describe('medallionStates', () => {
  it('marks the current speaker as speaking and everyone else as present', () => {
    expect(medallionStates(['b', 'a'], 'b')).toEqual({ b: 'speaking', a: 'present' })
  })

  it('allows the speaking character to be any participant', () => {
    expect(medallionStates(['b', 'a'], 'a')).toEqual({ a: 'speaking', b: 'present' })
  })

  it('marks everyone present when nobody is speaking now', () => {
    expect(medallionStates(['c', 'b', 'a'], null)).toEqual({ c: 'present', b: 'present', a: 'present' })
  })

  it('returns an empty map when there are no participants', () => {
    expect(medallionStates([], null)).toEqual({})
  })
})

describe('PortraitRail', () => {
  it('renders nothing when there are no participants', () => {
    const { container } = render(<PortraitRail ids={[]} currentId={null} layout="column" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders medallions in the order given', () => {
    render(<PortraitRail ids={['c', 'b', 'a']} currentId={null} layout="column" />)
    const labels = medallions().map(el => el.getAttribute('aria-label'))
    expect(labels).toEqual(['c', 'b', 'a'])
  })

  it('does not reorder the ids it is given', () => {
    const ids = ['c', 'b', 'a']
    render(<PortraitRail ids={ids} currentId={null} layout="column" />)
    expect(ids).toEqual(['c', 'b', 'a'])
  })

  it('marks only the current speaker as speaking', () => {
    render(
      <PortraitRail ids={['danika_oberlin', 'vyktor_reznik']} currentId="vyktor_reznik" layout="column" />,
    )
    expect(screen.getByLabelText('Vyktor Reznik, Chief of Staff')).toHaveAttribute('data-speaking', 'true')
    expect(screen.getByLabelText('Danika Oberlin, Minister of the Interior')).toHaveAttribute(
      'data-speaking',
      'false',
    )
  })

  it('gives each medallion its state in the given order, with the speaker large and marked current', () => {
    render(<PortraitRail ids={['c', 'b', 'a']} currentId="b" layout="column" />)
    const items = medallions()
    expect(items.map(el => el.getAttribute('data-state'))).toEqual(['present', 'speaking', 'present'])

    const [first, speaking, last] = items
    expect(first.style.width).toBe('var(--rail-small, 58px)')
    expect(speaking.style.width).toBe('var(--rail-big, 112px)')
    expect(last.style.width).toBe('var(--rail-small, 58px)')
    expect(speaking).toHaveAttribute('aria-current', 'true')
    expect(first).not.toHaveAttribute('aria-current')
    expect(last).not.toHaveAttribute('aria-current')
  })

  it('aligns column medallions to the right edge', () => {
    render(<PortraitRail ids={['c', 'b', 'a']} currentId="b" layout="column" />)
    const list = medallions()[0].parentElement as HTMLElement
    expect(list.style.alignItems).toBe('flex-end')
  })

  it('overlaps each column medallion after the first by 3px', () => {
    render(<PortraitRail ids={['c', 'b', 'a']} currentId="b" layout="column" />)
    const [first, second, third] = medallions()
    expect(first.style.marginTop).toBe('')
    expect(second.style.marginTop).toBe('-3px')
    expect(third.style.marginTop).toBe('-3px')
  })

  it('keeps every medallion and the rail at full opacity', () => {
    render(<PortraitRail ids={['c', 'b', 'a']} currentId="b" layout="column" />)
    medallions().forEach(item => expect(item.style.opacity).toBe('1'))

    const rail = screen.getByTestId('portrait-rail')
    const dimmed = Array.from(rail.querySelectorAll<HTMLElement>('*')).filter(
      el => el.style.opacity !== '' && Number(el.style.opacity) < 1,
    )
    expect(dimmed).toEqual([])
  })

  it('uses the row sizes in row layout', () => {
    render(<PortraitRail ids={['b', 'a']} currentId="b" layout="row" />)
    const [speaking, present] = medallions()
    expect(speaking.style.width).toBe('46px')
    expect(present.style.width).toBe('32px')
  })

  it('does not overlap row medallions', () => {
    render(<PortraitRail ids={['b', 'a']} currentId="b" layout="row" />)
    const [, present] = medallions()
    expect(present.style.marginTop).toBe('')
  })

  it('shows initials for a character with no portrait', () => {
    render(<PortraitRail ids={['zz_unknown_person']} currentId={null} layout="column" />)
    expect(screen.getByTestId('portrait-initials')).toHaveTextContent('ZU')
  })

  it('shows a portrait image instead of initials when one exists', () => {
    const { container } = render(
      <PortraitRail ids={['vyktor_reznik']} currentId={null} layout="column" />,
    )
    expect(screen.queryByTestId('portrait-initials')).toBeNull()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('labels each medallion with the character name', () => {
    render(<PortraitRail ids={['vyktor_reznik']} currentId={null} layout="column" />)
    expect(medallions()[0]).toHaveAttribute('aria-label', expect.stringContaining('Vyktor Reznik'))
  })

  it('rims every medallion, speaker included, in the same neutral grey', () => {
    render(<PortraitRail ids={['b', 'a']} currentId="a" layout="column" />)
    const [present, speaking] = medallions()
    expect(present.style.borderColor).toBe('rgb(54, 55, 58)')
    expect(speaking.style.borderColor).toBe('rgb(54, 55, 58)')
    expect(speaking.style.boxShadow).not.toContain('#8a6a3a')
  })

  it('sets the row layout on the rail', () => {
    render(<PortraitRail ids={['vyktor_reznik']} currentId={null} layout="row" />)
    expect(screen.getByTestId('portrait-rail')).toHaveAttribute('data-layout', 'row')
  })
})
