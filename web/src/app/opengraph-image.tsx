import { ImageResponse } from 'next/og';

export const alt = 'SnapSaas — Turn any URL into launch-ready screenshots';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0b1020 0%, #1b1140 55%, #07242b 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            fontSize: 38,
          }}
        >
          📸
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>SnapSaas</div>
      </div>
      <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
        Turn any URL into gorgeous marketing screenshots
      </div>
      <div style={{ fontSize: 30, marginTop: 28, color: '#c7cad1', maxWidth: 820 }}>
        Paste a link, pick a frame and background, export share-ready assets in seconds.
      </div>
    </div>,
    { ...size },
  );
}
