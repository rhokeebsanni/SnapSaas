import { Clock, Download, Layers, Palette, ShieldCheck, Zap } from 'lucide-react';

import { FadeIn } from '@/components/motion/fade-in';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const FEATURES = [
  {
    icon: Zap,
    title: 'One-click capture',
    body: 'Paste a URL and we launch a real browser, wait for the page to settle, and grab a crisp retina screenshot.',
  },
  {
    icon: Layers,
    title: 'Device frames',
    body: 'Drop your site into a browser window, iPhone, or MacBook — pixel-perfect chrome, every time.',
  },
  {
    icon: Palette,
    title: 'Beautiful backgrounds',
    body: 'Gradients, mesh, solids, and padding with soft shadows and rounded corners. It just looks expensive.',
  },
  {
    icon: Download,
    title: 'Export anywhere',
    body: 'PNG, JPG, or WebP at 1×, 2×, or 3×. Perfect for launches, App Store, social, and landing pages.',
  },
  {
    icon: Clock,
    title: 'Async & fast',
    body: 'Captures run on a dedicated worker queue, so big full-page shots never block your browser.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe by design',
    body: 'URL validation and SSRF protection mean we only ever fetch real, public websites.',
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to look launch-ready
        </h2>
        <p className="text-muted-foreground mt-4">
          SnapSaas replaces the tedious screenshot → design-tool → mockup workflow with a single
          paste-and-go machine.
        </p>
      </FadeIn>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.05} className="h-full">
            <SpotlightCard className="p-6">
              <div className="from-brand/20 to-brand-2/10 text-brand ring-brand/10 mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.body}</p>
            </SpotlightCard>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
