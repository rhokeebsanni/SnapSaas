'use client';

import * as React from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Counts up from 0 to `value` once on mount. Honors prefers-reduced-motion. */
export function AnimatedNumber({
  value,
  duration = 1,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  // Start at the final value when reduced-motion; otherwise count up from 0.
  const [display, setDisplay] = React.useState(reduce ? value : 0);

  React.useEffect(() => {
    if (reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span className={className}>{(reduce ? value : display).toLocaleString()}</span>;
}
