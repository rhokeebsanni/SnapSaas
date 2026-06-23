import { ImageResponse } from 'next/og';

// Browser-tab favicon, generated so it always matches the in-app LogoMark:
// a violet→cyan rounded square with a viewfinder frame + focal dot.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 7,
        background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        {/* Corner brackets. */}
        <path
          d="M8 4.8H6.3A1.5 1.5 0 0 0 4.8 6.3V8M16 4.8h1.7A1.5 1.5 0 0 1 19.2 6.3V8M8 19.2H6.3A1.5 1.5 0 0 1 4.8 17.7V16M16 19.2h1.7A1.5 1.5 0 0 0 19.2 17.7V16"
          stroke="#ffffff"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Focal dot. */}
        <circle cx="12" cy="12" r="2.7" fill="#ffffff" />
      </svg>
    </div>,
    { ...size },
  );
}
