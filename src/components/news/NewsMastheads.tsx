import type { NewspaperDef } from '../../data/newspapers'

function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function HeraldMasthead({
  paper, week, mediaDeal
}: {
  paper: NewspaperDef
  week: number
  mediaDeal: boolean
}) {
  return (
    <div style={{
      padding: '10px 28px 0',
      borderBottom: '4px double #1a1a2e',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Top info bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
      }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.38rem',
          letterSpacing: '0.08em',
          color: '#5a5040',
          textTransform: 'uppercase',
        }}>
          Ashenmere, Veltria · Est. 1891
        </span>
        <h1 style={{
          fontFamily: "'RealityStone', 'Playfair Display', Georgia, serif",
          fontSize: '1.8rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          margin: 0,
          lineHeight: 1,
          color: '#1a1a2e',
          textTransform: 'uppercase',
          textAlign: 'center',
          flex: 1,
          padding: '0 20px',
        }}>
          {mediaDeal
            ? 'The Ashenmere Champion'
            : 'The Ashenmere Herald'}
        </h1>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.38rem',
          letterSpacing: '0.08em',
          color: '#5a5040',
          textTransform: 'uppercase',
          textAlign: 'right',
        }}>
          {weekToDate(week)}<br/>
          Edition No. {week} · {paper.price} Krone
        </span>
      </div>

      {/* Thin rule */}
      <div style={{
        height: '1px',
        background: '#1a1a2e',
        marginBottom: '2px',
      }} />

      {/* Tagline */}
      <p style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: 'italic',
        fontSize: '0.52rem',
        letterSpacing: '0.1em',
        color: '#5a5040',
        margin: '0 0 6px',
        textAlign: 'center',
        fontVariant: 'small-caps',
      }}>
        {paper.tagline}
      </p>
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
        <span style={{ fontSize: '1.2rem', color: '#c0392b' }}>⚙</span>
        <h1 style={{
          fontFamily: "'HeritageStone', Georgia, serif",
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
        <span style={{ fontSize: '1.2rem', color: '#c0392b' }}>⚙</span>
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
        fontFamily: "'Maltiner', 'Crimson Text', Georgia, serif",
        fontSize: '2.6rem',
        fontWeight: 400,
        letterSpacing: '0.08em',
        margin: 0,
        lineHeight: 1.1,
        color: '#2c3e50',
        fontStyle: 'normal',
      }}>
        The Veltrian Times
      </h1>
      <div style={{
        borderTop: '3px solid #2c3e50',
        borderBottom: '1px solid #2c3e50',
        height: '4px',
        margin: '6px 40px',
      }} />
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
    <div style={{ borderTop: '4px double #4a4a2a', borderBottom: '2px solid #4a4a2a' }}>
    <div style={{ textAlign: 'center', padding: '16px 40px 10px', position: 'relative', zIndex: 1, background: 'linear-gradient(180deg, rgba(74,74,42,0.04) 0%, transparent 100%)' }}>
      <h1 style={{
        fontFamily: "'Unique', 'EB Garamond', Georgia, serif",
        fontSize: '2.4rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        margin: 0,
        lineHeight: 1.1,
        color: '#2d4a1e',
        fontStyle: 'normal',
      }}>
        The Thornfeld Gazette
      </h1>
      <p style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        color: '#2d4a1e',
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
    </div>
  )
}
