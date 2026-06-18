import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <p className="text-gradient text-6xl font-bold tracking-tight">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Button variant="brand" className="mt-6" asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
