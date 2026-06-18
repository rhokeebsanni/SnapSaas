'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        An unexpected error occurred. Please try again — if it keeps happening, come back soon.
      </p>
      <Button variant="brand" className="mt-6" onClick={reset}>
        <RotateCcw className="size-4" /> Try again
      </Button>
    </div>
  );
}
