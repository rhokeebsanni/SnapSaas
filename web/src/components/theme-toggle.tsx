'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {/* Icons swap purely via the `dark` class, so there is no hydration mismatch. */}
      <Sun className="size-4 scale-100 transition-all dark:scale-0" />
      <Moon className="absolute size-4 scale-0 transition-all dark:scale-100" />
    </Button>
  );
}
