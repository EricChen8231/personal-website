import { ImageResponse } from 'next/og';

// Generated at build time and emitted as a static PNG asset.
// Next.js auto-wires this into og:image, twitter:image, and the image dimensions.

// Required for `output: "export"` — tells Next to materialize the PNG at build time
// rather than treating this as a runtime-dynamic route.
export const dynamic = 'force-static';
export const alt = 'Eric Chen — L1 → L7';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          background: '#0d1117',
          color: '#e6edf3',
          display: 'flex',
          flexDirection: 'column',
          padding: '70px 80px',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        {/* Terminal-style prompt line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 22, color: '#8b949e' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: '#f59e0b' }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: '#22c55e' }} />
          </div>
          <div style={{ display: 'flex' }}>~ % ./eric_chen --trace-execution</div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: -5,
            lineHeight: 1,
            marginTop: 38,
            display: 'flex',
          }}
        >
          Eric Chen
        </div>

        <div
          style={{
            fontSize: 30,
            color: '#8b949e',
            marginTop: 22,
            lineHeight: 1.35,
            maxWidth: 880,
            display: 'flex',
          }}
        >
          From 45nm CMOS cells to production APIs.
        </div>

        {/* L1 → L7 strip */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            gap: 18,
            fontSize: 18,
            color: '#6e7681',
            flexWrap: 'wrap',
          }}
        >
          {[
            ['L7', 'Application'],
            ['L6', 'Network'],
            ['L5', 'Compiler'],
            ['L4', 'Arch'],
            ['L3', 'RTL'],
            ['L2', 'Circuit'],
            ['L1', 'Physics'],
          ].map(([id, name]) => (
            <div key={id} style={{ display: 'flex', gap: 6 }}>
              <span style={{ color: '#e6edf3' }}>{id}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>

        {/* Status badge top-right */}
        <div
          style={{
            position: 'absolute',
            right: 80,
            top: 84,
            fontSize: 18,
            color: '#3fb950',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ width: 10, height: 10, background: '#3fb950', borderRadius: 999 }} />
          <div style={{ display: 'flex' }}>available for full-time</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
