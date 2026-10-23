import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationPin from '../NotificationPin'

// The drawn pins are the fallback when no painted pin image exists; tests choose which.
const pinArt = vi.hoisted(() => ({ url: null as string | null }))
vi.mock('../../../assets/pinArt', () => ({ getPinArt: () => pinArt.url }))

const LABEL = 'Kravenstal: 2 new reports'

describe('NotificationPin', () => {
  afterEach(() => { pinArt.url = null })

  it('shows the painted pin image when one has been added', () => {
    pinArt.url = 'url:pin'
    render(<NotificationPin kind="event" label={LABEL} />)
    expect(screen.getByTestId('pin-art')).toHaveAttribute('src', 'url:pin')
    expect(screen.queryByTestId('glyph-meeting')).toBeNull()
  })

  it('keeps the count badge on a painted update pin', () => {
    pinArt.url = 'url:pin'
    render(<NotificationPin kind="news" label={LABEL} count={4} />)
    expect(screen.getByTestId('pin-count')).toHaveTextContent('4')
  })

  it('is a button named by its label', () => {
    render(<NotificationPin kind="news" label={LABEL} />)
    expect(screen.getByRole('button', { name: LABEL })).toBeInTheDocument()
  })

  it('calls onClick when pressed', () => {
    const onClick = vi.fn()
    render(<NotificationPin kind="news" label={LABEL} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: LABEL }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('draws a tail on news and alert pins but not on event pins', () => {
    const { unmount: unmountNews } = render(<NotificationPin kind="news" label={LABEL} />)
    expect(screen.getByTestId('pin-tail')).toBeInTheDocument()
    unmountNews()

    const { unmount: unmountAlert } = render(<NotificationPin kind="alert" label={LABEL} />)
    expect(screen.getByTestId('pin-tail')).toBeInTheDocument()
    unmountAlert()

    render(<NotificationPin kind="event" label={LABEL} />)
    expect(screen.queryByTestId('pin-tail')).toBeNull()
  })

  it('gives the event pin a downward point', () => {
    const { unmount: unmountEvent } = render(<NotificationPin kind="event" label={LABEL} />)
    expect(screen.getByTestId('pin-point')).toBeInTheDocument()
    unmountEvent()

    render(<NotificationPin kind="news" label={LABEL} />)
    expect(screen.queryByTestId('pin-point')).toBeNull()
  })

  it('shows ! on alert pins', () => {
    const { unmount } = render(<NotificationPin kind="alert" label={LABEL} />)
    expect(screen.getByTestId('glyph-alert')).toHaveTextContent('!')
    unmount()

    render(<NotificationPin kind="news" label={LABEL} />)
    expect(screen.queryByTestId('glyph-alert')).toBeNull()
  })

  it('shows a conversation glyph on event pins and a newspaper on news pins', () => {
    const { unmount } = render(<NotificationPin kind="event" label={LABEL} />)
    expect(screen.getByTestId('glyph-meeting')).toBeInTheDocument()
    expect(screen.queryByTestId('glyph-news')).toBeNull()
    unmount()

    render(<NotificationPin kind="news" label={LABEL} />)
    expect(screen.getByTestId('glyph-news')).toBeInTheDocument()
    expect(screen.queryByTestId('glyph-meeting')).toBeNull()
  })

  it('shows a count badge only for news and alert pins with more than one item', () => {
    const { unmount: unmountThree } = render(<NotificationPin kind="news" label={LABEL} count={3} />)
    expect(screen.getByTestId('pin-count')).toHaveTextContent('3')
    unmountThree()

    const { unmount: unmountOne } = render(<NotificationPin kind="news" label={LABEL} count={1} />)
    expect(screen.queryByTestId('pin-count')).toBeNull()
    unmountOne()

    const { unmount: unmountMany } = render(<NotificationPin kind="news" label={LABEL} count={12} />)
    expect(screen.getByTestId('pin-count')).toHaveTextContent('9+')
    unmountMany()

    render(<NotificationPin kind="event" label={LABEL} count={3} />)
    expect(screen.queryByTestId('pin-count')).toBeNull()
  })

  it('reports its kind', () => {
    const { unmount } = render(<NotificationPin kind="event" label={LABEL} />)
    expect(screen.getByTestId('notification-pin')).toHaveAttribute('data-kind', 'event')
    unmount()

    render(<NotificationPin kind="alert" label={LABEL} />)
    expect(screen.getByTestId('notification-pin')).toHaveAttribute('data-kind', 'alert')
  })

  it('uses the default sizes', () => {
    const { unmount } = render(<NotificationPin kind="news" label={LABEL} />)
    expect(screen.getByTestId('notification-pin').style.width).toBe('30px')
    unmount()

    render(<NotificationPin kind="event" label={LABEL} />)
    expect(screen.getByTestId('notification-pin').style.width).toBe('34px')
  })
})
