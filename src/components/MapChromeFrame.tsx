import type React from 'react'

// Decorative war-room chrome frame over the map viewport.
// Pure overlay: pointer-events none everywhere — cannot affect
// panning, zooming, pins, or popovers.

export default function MapChromeFrame() {
  const gold = 'rgba(201,168,76,0.55)'
  const goldDim = 'rgba(201,168,76,0.28)'

  const cornerStyle = (pos: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties => ({
    position: 'absolute',
    width: 44, height: 44,
    ...(pos === 'tl' && { top: 10, left: 10, borderTop: `2px solid ${gold}`, borderLeft: `2px solid ${gold}` }),
    ...(pos === 'tr' && { top: 10, right: 10, borderTop: `2px solid ${gold}`, borderRight: `2px solid ${gold}` }),
    ...(pos === 'bl' && { bottom: 10, left: 10, borderBottom: `2px solid ${gold}`, borderLeft: `2px solid ${gold}` }),
    ...(pos === 'br' && { bottom: 10, right: 10, borderBottom: `2px solid ${gold}`, borderRight: `2px solid ${gold}` }),
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      {/* Inner hairline frame */}
      <div style={{
        position: 'absolute', inset: 18,
        border: `1px solid ${goldDim}`,
        boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.35)`,
      }}/>

      {/* Corner flourishes */}
      <div style={cornerStyle('tl')}/>
      <div style={cornerStyle('tr')}/>
      <div style={cornerStyle('bl')}/>
      <div style={cornerStyle('br')}/>

      {/* Edge vignette — grounds the map like a table surface */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 85% 80% at 50% 48%, transparent 55%, rgba(10,8,5,0.42) 100%)',
      }}/>

      {/* Top and bottom gradient rails for HUD legibility */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 64,
        background: 'linear-gradient(180deg, rgba(10,8,5,0.55) 0%, transparent 100%)',
      }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
        background: 'linear-gradient(0deg, rgba(10,8,5,0.5) 0%, transparent 100%)',
      }}/>
    </div>
  )
}
