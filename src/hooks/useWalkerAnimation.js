import { useEffect } from 'react';

/**
 * Manages walker character animation along a path
 * Animates position and direction over a 12-second cycle
 * Respects prefers-reduced-motion preference
 */
export function useWalkerAnimation(svgRef, prefersReducedMotion) {
  useEffect(() => {
    if (prefersReducedMotion) return;

    const walkerElement = document.getElementById('walker');
    if (!walkerElement) return;

    const A = [4.1, 3.4];
    const B = [3.0, 8.0];

    let t0;
    let animFrameId;

    const fr = (ts) => {
      t0 = t0 || ts;
      const u = ((ts - t0) / 1000) % 12;
      let f, d, m = true;

      if (u < 5) {
        f = u / 5;
        d = 1;
      } else if (u < 6) {
        f = 1;
        d = 1;
        m = false;
      } else if (u < 11) {
        f = 1 - (u - 6) / 5;
        d = -1;
      } else {
        f = 0;
        d = -1;
        m = false;
      }

      const newX = A[0] + (B[0] - A[0]) * f;
      const newY = A[1] + (B[1] - A[1]) * f;

      // Apply transform to walker element
      walkerElement.setAttribute(
        'transform',
        `translate(${newX * 100} ${newY * 100})${d === -1 ? ' scale(-1 1)' : ''}`
      );

      animFrameId = requestAnimationFrame(fr);
    };

    animFrameId = requestAnimationFrame(fr);

    return () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [prefersReducedMotion, svgRef]);
}
