'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * A slim brand-gradient progress bar pinned to the top of the viewport that
 * tracks page scroll. A small, premium touch on long marketing pages.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="from-brand to-brand-2 fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r"
    />
  );
}
