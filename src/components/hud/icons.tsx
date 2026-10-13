// Line-art icons for the command bar tools (stroke only, 24-unit grid).
const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const MapIcon = () => (
  <svg {...ICON_PROPS}><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" /><path d="M9 4v13.5M15 6.5V20" /></svg>
)
export const NewsIcon = () => (
  <svg {...ICON_PROPS}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M7 8h5v4.5H7z" /><path d="M14.5 8.5h3M14.5 11h3M7 15.5h10.5" /></svg>
)
export const BriefsIcon = () => (
  <svg {...ICON_PROPS}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5V5.5M20 18v3H6.5" /><path d="M8 7h8M8 10.5h8" /></svg>
)
export const DecreeIcon = () => (
  <svg {...ICON_PROPS}><path d="M7 3h10v18l-2.5-1.6L12 21l-2.5-1.6L7 21z" /><path d="M10 8h4M10 11.5h4M10 15h2.5" /></svg>
)
export const StateIcon = () => (
  <svg {...ICON_PROPS}><path d="M3 9.5L12 4l9 5.5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20.5h18" /></svg>
)
export const JournalIcon = () => (
  <svg {...ICON_PROPS}><path d="M20 4c-6 0-11 4-13 10l-3 6 6-3c6-2 10-7 10-13z" /><path d="M6 18l8-8" /></svg>
)
export const LetterIcon = () => (
  <svg {...ICON_PROPS}><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="M3.5 7l8.5 6 8.5-6" /></svg>
)
export const NotesIcon = () => (
  <svg {...ICON_PROPS}><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 2.5v3M15 2.5v3M8.5 10h7M8.5 13.5h7M8.5 17h4" /></svg>
)
export const MoreIcon = () => (
  <svg {...ICON_PROPS}><circle cx="5.5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18.5" cy="12" r="1.3" /></svg>
)
export const GearIcon = () => (
  <svg {...ICON_PROPS}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></svg>
)
