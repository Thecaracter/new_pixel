import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OfficeHeader } from './OfficeHeader';
import { OfficeCanvas } from './three/OfficeCanvas';
import { ChatPanel } from './ChatPanel';
import { TeamSettingsPage } from './TeamSettingsPage';
import { KanbanBoard } from './KanbanBoard';

/**
 * Virtual Office page shell
 * Supports seamless switching between:
 * 1. 3D Virtual Office & Chat Coordination
 * 2. Interactive Kanban Board (Plan & Task Tracking)
 * 3. Dedicated Team & Agent Settings (Roster, Status, Model per Agent)
 */
export function VirtualOfficePage() {
  const stageRef = useRef(null);
  const [activeTab, setActiveTab] = useState('office'); // 'office' | 'kanban' | 'settings'
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [kanbanTaskCount, setKanbanTaskCount] = useState(0);

  const [selectedKanbanProject, setSelectedKanbanProject] = useState('all');

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

  // Fetch Kanban task count
  const fetchKanbanCount = useCallback(async () => {
    try {
      const response = await fetch('/api/kanban/tasks');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.tasks)) {
          setKanbanTaskCount(data.tasks.length);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchTeam();
    fetchModels();
    fetchKanbanCount();
  }, [fetchTeam, fetchModels, fetchKanbanCount]);

  const activeMemberCount = teamMembers.filter(m => m.active !== false).length;

  const handleOpenKanbanProject = (projectId) => {
    if (projectId) {
      setSelectedKanbanProject(projectId);
    }
    fetchKanbanCount();
    setActiveTab('kanban');
  };

  return (
    <div className="virtual-office-root">
      <OfficeHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeMemberCount={activeMemberCount || 7}
        kanbanTaskCount={kanbanTaskCount}
      />

      {activeTab === 'office' ? (
        <>
          <main className="stage" ref={stageRef}>
            <OfficeCanvas teamMembers={teamMembers} />
          </main>
          <ChatPanel
            externalTeamMembers={teamMembers}
            onRefreshTeam={fetchTeam}
            onOpenKanban={handleOpenKanbanProject}
          />
        </>
      ) : activeTab === 'kanban' ? (
        <main className="kanban-stage">
          <KanbanBoard
            teamMembers={teamMembers}
            selectedProjectId={selectedKanbanProject}
            onSelectProjectId={setSelectedKanbanProject}
            onNavigateToChat={() => setActiveTab('office')}
          />
        </main>
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

