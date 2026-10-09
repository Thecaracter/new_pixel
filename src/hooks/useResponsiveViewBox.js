import { useEffect } from 'react';

/**
 * Manages responsive SVG viewBox based on screen size
 * Crops scene for mobile devices to show only essential area
 */
export function useResponsiveViewBox(svgRef) {
  useEffect(() => {
    const updateViewBox = () => {
      if (svgRef.current) {
        const isMobile = window.matchMedia('(max-width:640px)').matches;
        svgRef.current.setAttribute('viewBox', isMobile ? '130 10 760 640' : '60 0 900 650');
      }
    };

    const mq = window.matchMedia('(max-width:640px)');
    updateViewBox();
    mq.addEventListener('change', updateViewBox);

    return () => mq.removeEventListener('change', updateViewBox);
  }, [svgRef]);
}
