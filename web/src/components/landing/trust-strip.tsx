import { Gauge, ImageIcon, Layers, ShieldCheck, Sparkles } from 'lucide-react';

const POINTS = [
  { icon: Sparkles, label: 'No design tools' },
  { icon: Gauge, label: 'Ready in seconds' },
  { icon: ImageIcon, label: 'Up to 3× retina' },
  { icon: Layers, label: '3 frames · 21 backgrounds' },
  { icon: ShieldCheck, label: 'SSRF-safe captures' },
];

/**
 * An honest credibility strip under the hero. Rather than fabricate customer
 * logos, it surfaces what the product actually delivers — quietly, in a single
 * understated band.
 */
export function TrustStrip() {
  return (
    <div className="bg-muted/20 border-y">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 sm:px-6">
        {POINTS.map((p) => (
          <div
            key={p.label}
            className="text-muted-foreground flex items-center gap-2 text-sm font-medium"
          >
            <p.icon className="text-brand size-4" />
            {p.label}
          </div>
        ))}
      </div>
    </div>
  );
}
