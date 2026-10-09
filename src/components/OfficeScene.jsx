import React, { useEffect, useRef } from 'react';
import { generateScene } from '../utils/sceneGenerator';
import { useWalkerAnimation } from '../hooks/useWalkerAnimation';
import { useResponsiveViewBox } from '../hooks/useResponsiveViewBox';
import { useSpeechBubbles } from '../hooks/useSpeechBubbles';
import { useSceneTooltips } from '../hooks/useSceneTooltips';
import { useParallaxEffect } from '../hooks/useParallaxEffect';
import { SceneTooltip } from './SceneTooltip';

/**
 * Main office scene component
 * Manages SVG rendering, animations, tooltips, and interactive behaviors
 */
export function OfficeScene({ stageRef }) {
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  // Generate scene SVG content
  useEffect(() => {
    if (svgRef.current) {
      const sceneSvg = generateScene();
      svgRef.current.innerHTML = sceneSvg;
    }
  }, []);

  // Attach all behavior hooks
  useWalkerAnimation(svgRef, prefersReducedMotion);
  useResponsiveViewBox(svgRef);
  useSpeechBubbles(svgRef, prefersReducedMotion);
  const { tooltip, tooltipPos } = useSceneTooltips(svgRef, stageRef);
  const svgTransform = useParallaxEffect(prefersReducedMotion);

  return (
    <>
      <svg
        id="svg"
        ref={svgRef}
        viewBox="60 0 900 650"
        role="img"
        aria-label="Ilustrasi isometrik kantor virtual dengan karyawan yang sedang bekerja"
        style={{
          transform: `translate(${svgTransform.x}px, ${svgTransform.y}px)`,
        }}
      />
      <SceneTooltip tooltip={tooltip} tooltipPos={tooltipPos} tipRef={tipRef} />
    </>
  );
}
