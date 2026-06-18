'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Password input with a show/hide toggle. */
export function PasswordField({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
