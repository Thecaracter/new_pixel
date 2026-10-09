import React, { useRef } from 'react';
import { OfficeHeader } from './OfficeHeader';
import { OfficeScene } from './OfficeScene';
import { ResponsiveNotes } from './ResponsiveNotes';
import { ChatPanel } from './ChatPanel';

/**
 * Virtual Office page shell
 * Composes header, stage, and notes sections
 */
export function VirtualOfficePage() {
  const stageRef = useRef(null);

  return (
    <div>
      <div className="bg" id="bg">
        <i></i>
        <i></i>
        <i></i>
      </div>

      <OfficeHeader />

      <main className="stage" ref={stageRef}>
        <OfficeScene stageRef={stageRef} />
      </main>

      <ResponsiveNotes />

      <ChatPanel />
    </div>
  );
}
