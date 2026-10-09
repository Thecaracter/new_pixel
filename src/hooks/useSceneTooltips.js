import { useEffect, useState } from 'react';

/**
 * Manages tooltip visibility and positioning based on interactive SVG elements
 * Responds to pointer over/down/leave events on elements with data-tip attribute
 */
export function useSceneTooltips(svgRef, stageRef) {
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!stageRef.current || !svgRef.current) return;
      const target = e.target.closest('[data-tip]');
      if (!target) {
        setTooltip(null);
        return;
      }

      const tipText = target.dataset.tip;
      const [title, desc] = tipText.split('|');
      const rect = target.getBoundingClientRect();
      const stageRect = stageRef.current.getBoundingClientRect();

      setTooltip({ title, desc });
      setTooltipPos({
        x: rect.left + rect.width / 2 - stageRect.left,
        y: rect.top - stageRect.top,
      });
    };

    const handlePointerDown = (e) => {
      if (!stageRef.current || !svgRef.current) return;
      const target = e.target.closest('[data-tip]');
      if (target) {
        const tipText = target.dataset.tip;
        const [title, desc] = tipText.split('|');
        const rect = target.getBoundingClientRect();
        const stageRect = stageRef.current.getBoundingClientRect();

        setTooltip({ title, desc });
        setTooltipPos({
          x: rect.left + rect.width / 2 - stageRect.left,
          y: rect.top - stageRect.top,
        });
      }
    };

    const handlePointerLeave = () => {
      setTooltip(null);
    };

    if (svgRef.current) {
      svgRef.current.addEventListener('pointerover', handlePointerMove);
      svgRef.current.addEventListener('pointerdown', handlePointerDown);
      svgRef.current.addEventListener('pointerleave', handlePointerLeave);

      return () => {
        svgRef.current?.removeEventListener('pointerover', handlePointerMove);
        svgRef.current?.removeEventListener('pointerdown', handlePointerDown);
        svgRef.current?.removeEventListener('pointerleave', handlePointerLeave);
      };
    }
  }, [svgRef, stageRef]);

  return { tooltip, tooltipPos };
}
