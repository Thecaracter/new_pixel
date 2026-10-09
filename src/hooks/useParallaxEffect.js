import { useEffect, useState } from 'react';

/**
 * Manages parallax scrolling and pointer movement effect
 * Creates depth effect by transforming SVG based on mouse/scroll position
 * Respects prefers-reduced-motion preference
 */
export function useParallaxEffect(prefersReducedMotion) {
  const [svgTransform, setSvgTransform] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;

    let mx = 0, my = 0;

    const handlePointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      updateParallax(mx, my);
    };

    const handleScroll = () => {
      updateParallax(mx, my);
    };

    const updateParallax = (mx, my) => {
      const sc = window.scrollY * -0.04;
      setSvgTransform({
        x: mx * 10,
        y: my * 6 + sc,
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prefersReducedMotion]);

  return svgTransform;
}
