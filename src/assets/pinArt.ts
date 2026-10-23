// Optional painted map pins, like Suzerain's two kinds: save src/assets/images/map-pins/pin_meeting.png
// (meetings) and pin_update.png (province news and updates) and the map uses them instead of the drawn pins.
import { pickArt } from './sealArt'
import type { PinKind } from '../components/map/NotificationPin'

const PIN_ART = import.meta.glob('./images/map-pins/*.png', { eager: true, import: 'default' }) as Record<string, string>

const PIN_FILES: Record<PinKind, string> = {
  event: 'pin_meeting.png',
  news: 'pin_update.png',
  alert: 'pin_update.png',
}

/** The painted pin for a kind, or null when none has been added. */
export function getPinArt(kind: PinKind): string | null {
  return pickArt(PIN_ART, PIN_FILES[kind])
}
