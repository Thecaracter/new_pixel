import React from 'react';

/**
 * Tooltip display component
 * Positioned absolutely relative to stage, shows when tooltip data is present
 */
export function SceneTooltip({ tooltip, tooltipPos, tipRef }) {
  return (
    <div
      id="tip"
      ref={tipRef}
      style={{
        opacity: tooltip ? 1 : 0,
        left: `${tooltipPos.x}px`,
        top: `${tooltipPos.y}px`,
      }}
    >
      {tooltip && (
        <>
          <b>{tooltip.title}</b>
          <span>{tooltip.desc}</span>
        </>
      )}
    </div>
  );
}
