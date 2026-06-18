import Link from 'next/link';

import { Logo } from '@/components/brand/logo';

const LINKS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    items: [
      { href: '/#features', label: 'Features' },
      { href: '/#gallery', label: 'Gallery' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/sign-up', label: 'Get started' },
    ],
  },
  {
    title: 'Company',
    items: [
      { href: '/#', label: 'About' },
      { href: '/#', label: 'Blog' },
      { href: '/#', label: 'Changelog' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { href: '/#', label: 'Privacy' },
      { href: '/#', label: 'Terms' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="text-muted-foreground max-w-xs text-sm">
              Turn any website URL into launch-ready marketing screenshots in seconds.
            </p>
          </div>
          {LINKS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-medium">{col.title}</h3>
              <ul className="space-y-2">
                {col.items.map((item, i) => (
                  <li key={`${item.label}-${i}`}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} SnapSaas. All rights reserved.</p>
          <p>Built for founders, devs &amp; indie hackers.</p>
        </div>
      </div>
    </footer>
  );
}
