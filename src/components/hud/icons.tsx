// Solid glyphs for the HUD tools (filled with currentColor, 24-unit grid).
const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'currentColor',
  stroke: 'none',
  'aria-hidden': true,
}

export const MapIcon = () => (
  <svg {...ICON_PROPS}><path d="M2.5 6.2 8.5 4v15.8l-6 2.2zM9.8 4l4.4 2v15.8l-4.4-2zM15.5 6l6-2.2v15.8l-6 2.2z" /></svg>
)
export const NewsIcon = () => (
  <svg {...ICON_PROPS}><path fillRule="evenodd" d="M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4zM6 7v5h6V7zm8 .5V9h4V7.5zm0 3V12h4v-1.5zM6 14.5V16h12v-1.5z" /></svg>
)
export const BriefsIcon = () => (
  <svg {...ICON_PROPS}><path d="M2 5.5c3-1.4 6.6-1.3 9.2.6v14c-2.6-1.8-6.2-1.9-9.2-.6z" /><path d="M22 5.5c-3-1.4-6.6-1.3-9.2.6v14c2.6-1.8 6.2-1.9 9.2-.6z" /></svg>
)
export const DecreeIcon = () => (
  <svg {...ICON_PROPS}><path fillRule="evenodd" d="M5 3h12v14l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3zM8 6.5V8h6V6.5zm0 3.5v1.5h6V10zm0 3.5V15h4v-1.5z" /><circle cx="17" cy="18" r="3.5" /></svg>
)
export const StateIcon = () => (
  <svg {...ICON_PROPS}><path d="M12 2.5 2.5 8h19z" /><rect x="3.5" y="9" width="17" height="1.8" /><rect x="5" y="11.5" width="2.4" height="7" /><rect x="9" y="11.5" width="2.4" height="7" /><rect x="13" y="11.5" width="2.4" height="7" /><rect x="17" y="11.5" width="2.4" height="7" /><rect x="2.5" y="19.2" width="19" height="2.3" /></svg>
)
export const JournalIcon = () => (
  <svg {...ICON_PROPS}><path d="M20.5 3c-7 .3-12 5-13.6 11.3L5 20.5l1.6.5 1.7-3.8C14.8 16 20 11 20.5 3z" /></svg>
)
export const LetterIcon = () => (
  <svg {...ICON_PROPS}><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v.4l-9 6-9-6z" /><path d="M3 9.2l9 6 9-6v8.3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /></svg>
)
export const NotesIcon = () => (
  <svg {...ICON_PROPS}><path fillRule="evenodd" d="M7 4h2a3 3 0 0 1 6 0h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm1.5 6v1.6h7V10zm0 3.5v1.6h7v-1.6zm0 3.5v1.6H13V17z" /></svg>
)
export const MoreIcon = () => (
  <svg {...ICON_PROPS}><circle cx="5.5" cy="12" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="18.5" cy="12" r="1.9" /></svg>
)
export const GearIcon = () => (
  <svg {...ICON_PROPS}><path fillRule="evenodd" d="M10.3 2h3.4l.5 2.6 1.7.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.7 2.6.5v3.4l-2.6.5-.7 1.7 1.5 2.2-2.4 2.4-2.2-1.5-1.7.7-.5 2.6h-3.4l-.5-2.6-1.7-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.7L2 13.7v-3.4l2.6-.5.7-1.7-1.5-2.2 2.4-2.4 2.2 1.5 1.7-.7zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" /></svg>
)
