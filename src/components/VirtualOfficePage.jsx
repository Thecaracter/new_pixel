import React, { useRef } from 'react';
import { OfficeHeader } from './OfficeHeader';
import { OfficeCanvas } from './three/OfficeCanvas';
import { ChatPanel } from './ChatPanel';

/**
 * Virtual Office page shell
 * Renders the 3D Three.js office directly and beautifully.
 */
export function VirtualOfficePage() {
  const stageRef = useRef(null);

  return (
    <div>
      <OfficeHeader />

      <main className="stage" ref={stageRef}>
        <OfficeCanvas />
      </main>

      <ChatPanel />
    </div>
  );
}

export default VirtualOfficePage;
