import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OfficeHeader } from './OfficeHeader';
import { OfficeCanvas } from './three/OfficeCanvas';
import { ChatPanel } from './ChatPanel';
import { TeamSettingsPage } from './TeamSettingsPage';

/**
 * Virtual Office page shell
 * Supports seamless switching between:
 * 1. 3D Virtual Office & Chat Coordination
 * 2. Dedicated Team & Agent Settings (Roster, Status, Model per Agent)
 */
export function VirtualOfficePage() {
  const stageRef = useRef(null);
  const [activeTab, setActiveTab] = useState('office'); // 'office' | 'settings'
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  // Fetch team roster from backend
  const fetchTeam = useCallback(async () => {
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await response.json();
          if (Array.isArray(data.members)) {
            setTeamMembers(data.members);
          }
        }
      }
    } catch (err) {
      console.error('Error loading team roster:', err);
    }
  }, []);

  // Fetch available LLM models from backend
  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await response.json();
          if (Array.isArray(data.models)) {
            setAvailableModels(data.models);
          }
        }
      }
    } catch (err) {
      console.error('Error loading models:', err);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
    fetchModels();
  }, [fetchTeam, fetchModels]);

  const activeMemberCount = teamMembers.filter(m => m.active !== false).length;

  return (
    <div className="virtual-office-root">
      <OfficeHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeMemberCount={activeMemberCount || 7}
      />

      {activeTab === 'office' ? (
        <>
          <main className="stage" ref={stageRef}>
            <OfficeCanvas teamMembers={teamMembers} />
          </main>
          <ChatPanel
            externalTeamMembers={teamMembers}
            onRefreshTeam={fetchTeam}
          />
        </>
      ) : (
        <main className="settings-stage">
          <TeamSettingsPage
            teamMembers={teamMembers}
            onUpdateTeam={fetchTeam}
            availableModels={availableModels}
          />
        </main>
      )}
    </div>
  );
}

export default VirtualOfficePage;
