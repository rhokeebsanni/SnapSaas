'use client';

import * as React from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-brand absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="border-brand bg-background ring-brand/30 focus-visible:ring-brand/50 block size-4 rounded-full border-2 shadow transition-[box-shadow] hover:ring-4 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
