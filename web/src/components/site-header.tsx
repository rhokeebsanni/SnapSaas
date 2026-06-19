'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/#features', label: 'Features' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Help' },
];

export function SiteHeader() {
  const { data: session } = useSession();
  const signedIn = Boolean(session);
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className={cn(
          'mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl px-3 transition-all duration-300 sm:px-4',
          scrolled
            ? 'bg-background/70 supports-[backdrop-filter]:bg-background/55 border shadow-lg backdrop-blur-xl'
            : 'border border-transparent',
        )}
      >
        <Link href="/" aria-label="SnapSaas home" className="shrink-0">
          <Logo />
        </Link>

        {/* Pill nav */}
        <nav className="bg-muted/40 absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border p-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground hover:bg-background rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            {signedIn ? (
              <Button variant="brand" size="sm" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button variant="brand" size="sm" asChild>
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="bg-background/90 mx-auto mt-2 max-w-5xl rounded-2xl border p-3 shadow-lg backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-accent rounded-md px-3 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {signedIn ? (
                <Button variant="brand" size="sm" className="flex-1" asChild>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    Go to dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/sign-in" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button variant="brand" size="sm" className="flex-1" asChild>
                    <Link href="/sign-up" onClick={() => setOpen(false)}>
                      Get started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
