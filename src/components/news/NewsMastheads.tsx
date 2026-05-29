import type { NewspaperDef } from '../../data/newspapers'

function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function HeraldMasthead({ paper, week, mediaDeal }: { paper: NewspaperDef; week: number; mediaDeal: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '18px 40px 10px', borderBottom: '3px double #1a1a2e', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' }}>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', letterSpacing: '0.08em', color: '#5a5040', textTransform: 'uppercase' }}>
          ASHENMERE, VELTRIA
        </span>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', letterSpacing: '0.08em', color: '#5a5040', textTransform: 'uppercase' }}>
          EST. 1891 · PRICE: {paper.price} KRONE
        </span>
      </div>
      <div style={{ borderTop: '1px solid #1a1a2e', marginBottom: '6px' }} />
      <h1 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '2.6rem',
        fontWeight: 800,
        letterSpacing: '0.06em',
        margin: 0,
        lineHeight: 1.1,
        color: '#1a1a2e',
        textTransform: 'uppercase',
      }}>
        {mediaDeal ? 'The Ashenmere Champion' : 'The Ashenmere Herald'}
      </h1>
      <p style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: 'italic',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        color: '#5a5040',
        margin: '2px 0 0',
        fontVariant: 'small-caps',
      }}>
        {paper.tagline}
      </p>
      <div style={{ borderBottom: '1px solid #1a1a2e', marginTop: '6px' }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '4px', fontFamily: "'Special Elite', monospace", fontSize: '0.48rem', color: '#5a5040', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span>{weekToDate(week)}</span>
        <span>EDITION NO. {week}</span>
      </div>
    </div>
  )
}

export function StandardMasthead({ paper, week }: { paper: NewspaperDef; week: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 40px 8px', borderBottom: '3px solid #8b1a1a', position: 'relative', zIndex: 1 }}>
      <div style={{ background: '#8b1a1a', color: '#f5f0e8', padding: '6px 0', marginBottom: '8px' }}>
        <h1 style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontSize: '1.9rem',
          fontWeight: 900,
          letterSpacing: '0.04em',
          margin: 0,
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}>
          The People's Standard
        </h1>
      </div>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.52rem',
        letterSpacing: '0.1em',
        color: '#8b1a1a',
        margin: '4px 0 0',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>
        {paper.tagline}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontFamily: "'Special Elite', monospace", fontSize: '0.45rem', color: '#7a5040', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span>{weekToDate(week)}</span>
        <span>{paper.price} KRONE · EST. 1921</span>
      </div>
    </div>
  )
}

export function WorkerMasthead({ paper, week }: { paper: NewspaperDef; week: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 40px 8px', borderBottom: '4px solid #c0392b', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '2px' }}>
        <span style={{ fontSize: '1.2rem', opacity: 0.6 }}>⚙</span>
        <h1 style={{
          fontFamily: "'IBM Plex Serif', Georgia, serif",
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          margin: 0,
          lineHeight: 1.1,
          color: '#1c1410',
          textTransform: 'uppercase',
        }}>
          Kravenstal Worker
        </h1>
        <span style={{ fontSize: '1.2rem', opacity: 0.6 }}>⚙</span>
      </div>
      <p style={{
        fontFamily: "'IBM Plex Serif', Georgia, serif",
        fontSize: '0.55rem',
        letterSpacing: '0.15em',
        color: '#c0392b',
        margin: '2px 0 0',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>
        {paper.tagline}
      </p>
      <div style={{ height: '1px', background: '#ccc', margin: '6px 0 2px' }} />
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.42rem', color: '#6a5a40', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {weekToDate(week)} · {paper.price} KRONE
      </div>
    </div>
  )
}

export function TimesMasthead({ paper, week, nadiaActive }: { paper: NewspaperDef; week: number; nadiaActive: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 40px 10px', borderBottom: '2px solid #2c3e50', position: 'relative', zIndex: 1 }}>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.42rem',
        letterSpacing: '0.2em',
        color: '#5a5040',
        textTransform: 'uppercase',
        margin: '0 0 8px',
      }}>
        Independent
      </p>
      <h1 style={{
        fontFamily: "'Crimson Text', Georgia, serif",
        fontSize: '2.3rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        margin: 0,
        lineHeight: 1.1,
        color: '#2c3e50',
      }}>
        The Veltrian Times
      </h1>
      <p style={{
        fontFamily: "'Crimson Text', Georgia, serif",
        fontStyle: 'italic',
        fontSize: '0.62rem',
        letterSpacing: '0.08em',
        color: '#4a5a6a',
        margin: '4px 0 0',
      }}>
        {paper.tagline}
      </p>
      {nadiaActive && (
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.45rem',
          letterSpacing: '0.1em',
          color: '#7a7060',
          textTransform: 'uppercase',
          margin: '4px 0 0',
        }}>
          Editor: N. Voss
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontFamily: "'Special Elite', monospace", fontSize: '0.42rem', color: '#6a6050', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span>{weekToDate(week)}</span>
        <span>EST. 1958 · {paper.price} KRONE</span>
      </div>
    </div>
  )
}

export function GazetteMasthead({ paper, week }: { paper: NewspaperDef; week: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 40px 10px', borderBottom: '2px solid #4a4a2a', position: 'relative', zIndex: 1, background: 'linear-gradient(180deg, rgba(74,74,42,0.04) 0%, transparent 100%)' }}>
      <h1 style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontSize: '2.4rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        margin: 0,
        lineHeight: 1.1,
        color: '#4a4a2a',
        fontStyle: 'italic',
      }}>
        The Thornfeld Gazette
      </h1>
      <p style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        color: '#6a5a3a',
        margin: '2px 0 0',
        fontVariant: 'small-caps',
      }}>
        {paper.tagline}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '6px', fontFamily: "'Special Elite', monospace", fontSize: '0.42rem', color: '#5a4a3a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span>{weekToDate(week)}</span>
        <span>EST. 1923 · {paper.price} KRONE</span>
      </div>
      <div style={{ height: '1px', background: '#4a4a2a', opacity: 0.3, marginTop: '4px' }} />
    </div>
  )
}
