import React, { useState, useMemo } from 'react';
import { McpSkillStoreModal } from './McpSkillStoreModal';

// Clean, high-craft SVG icons replacing AI-slop emojis
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconCpu() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconPower() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * 3D Office Location Mapping for each team agent
 */
const AGENT_LOCATION_MAP = {
  arif: 'Ruang Rapat • Whiteboard & Meja Rapat',
  rina: 'Meja 01 • Workstation Barat',
  dimas: 'Meja 02 • Workstation Timur',
  bayu: 'Meja 03 • Workstation Barat',
  eko: 'Patroli Koridor Utama',
  sinta: 'Breakout Lounge & Pantry',
  mira: 'Ruang Rapat • Meja Utama',
  doni: 'Meja 04 • QA & Testing Lab',
  fajar: 'Server Rack & DevOps Station',
};

/**
 * Helper to parse and present clean model metadata
 */
function formatModelMeta(modelStr) {
  if (!modelStr) {
    return {
      provider: 'Sistem',
      cleanName: 'Mengikuti Model Global (Chat)',
      isCustom: false,
    };
  }

  const parts = modelStr.split('/');
  const rawModel = parts[parts.length - 1];
  let provider = parts.length > 1 ? parts[0] : 'AI';

  if (provider === '9router' && parts.length > 2) {
    provider = parts[1].toUpperCase();
  }

  const cleanName = rawModel
    .replace(/^kr-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    provider,
    cleanName,
    isCustom: true,
  };
}

/**
 * Predefined role presets for quick onboarding
 */
const COMMON_ROLE_PRESETS = [
  { role: 'DevOps & Cloud Engineer', desc: 'Setup CI/CD pipeline, automasi server, dan monitoring infrastruktur cloud.' },
  { role: 'Backend / Database Engineer', desc: 'Merancang arsitektur API, skema database, dan integrasi microservices.' },
  { role: 'QA & Test Automation', desc: 'Menulis skenario pengujian unit & integration test untuk memastikan reliabilitas fitur.' },
  { role: 'Copywriter & Content Lead', desc: 'Menulis copy pemasaran, newsletter, dan dokumentasi release notes produk.' },
  { role: 'Security & Compliance Specialist', desc: 'Audit keamanan sistem, vulnerability scanning, dan kepatuhan data.' },
];

/**
 * Predefined character outfit color presets
 */
const SHIRT_PRESETS = [
  { label: 'Navy Blue', color: '#4a5fc1' },
  { label: 'Teal Green', color: '#2fa7a0' },
  { label: 'Purple', color: '#8a63d2' },
  { label: 'Coral Red', color: '#f26a5b' },
  { label: 'Golden Yellow', color: '#f2b84b' },
  { label: 'Mint Aqua', color: '#2f9a92' },
  { label: 'Sky Blue', color: '#38bdf8' },
  { label: 'Emerald', color: '#10b981' },
];

/**
 * Team & Agent Management Page
 * Allows adding new agents, deactivating/activating agents,
 * assigning individual LLM models per agent, and configuring character appearances.
 */
export function TeamSettingsPage({ teamMembers = [], onUpdateTeam, availableModels = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [expandedPromptAgentId, setExpandedPromptAgentId] = useState(null);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeTargetAgentId, setStoreTargetAgentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    systemPrompt: '',
    model: '',
    active: true,
    shirtColor: '#38bdf8',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'

  // Statistics
  const totalCount = teamMembers.length;
  const activeCount = teamMembers.filter(m => m.active !== false).length;
  const inactiveCount = totalCount - activeCount;

  // Filtered members list based on status and search query
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const isActive = member.active !== false;
      if (filterStatus === 'active' && !isActive) return false;
      if (filterStatus === 'inactive' && isActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (member.name || '').toLowerCase().includes(q);
        const matchRole = (member.role || '').toLowerCase().includes(q);
        const matchDesc = (member.description || '').toLowerCase().includes(q);
        const matchModel = (member.model || '').toLowerCase().includes(q);
        return matchName || matchRole || matchDesc || matchModel;
      }
      return true;
    });
  }, [teamMembers, filterStatus, searchQuery]);

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      role: '',
      description: '',
      systemPrompt: '',
      model: '',
      active: true,
      shirtColor: '#38bdf8',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      role: member.role || '',
      description: member.description || '',
      systemPrompt: member.systemPrompt || '',
      model: member.model || '',
      active: member.active !== false,
      shirtColor: member.shirtColor || '#38bdf8',
    });
    setError(null);
    setModalOpen(true);
  };

  const applyRolePreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      role: preset.role,
      description: preset.desc,
      systemPrompt: preset.systemPrompt || prev.systemPrompt,
    }));
  };

  const handleToggleActive = async (member) => {
    try {
      const nextActive = member.active === false ? true : false;
      const res = await fetch(`/api/team/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text.includes('<!DOCTYPE') ? 'Backend belum siap/perlu direstart' : 'Gagal mengubah status agent');
      }
      if (onUpdateTeam) onUpdateTeam();
      showNotification(`${member.name} sekarang ${nextActive ? 'Aktif' : 'Non-Aktif'}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleModelChangeQuick = async (member, newModel) => {
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel || null }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text.includes('<!DOCTYPE') ? 'Backend belum siap/perlu direstart' : 'Gagal mengubah model AI');
      }
      if (onUpdateTeam) onUpdateTeam();
      showNotification(`Model untuk ${member.name} diperbarui: ${newModel || 'Default'}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMember = async (member) => {
    const isDefault = member.isDefault || ['arif', 'rina', 'dimas', 'bayu', 'sinta', 'mira', 'eko'].includes(member.id);
    const confirmText = isDefault
      ? `Non-aktifkan ${member.name}? (Agent bawaan tidak dihapus permanen, hanya dinonaktifkan)`
      : `Hapus agent ${member.name} secara permanen?`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text.includes('<!DOCTYPE') ? 'Backend belum siap/perlu direstart' : 'Gagal menghapus agent');
      }
      if (onUpdateTeam) onUpdateTeam();
      showNotification(`${member.name} berhasil dinonaktifkan/dihapus`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMcp = async (agentId, mcpId) => {
    try {
      const res = await fetch(`/api/team/${agentId}/mcp/${mcpId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal mencopot tool');
      showNotification('Tool berhasil dilepas dari agent');
      if (onUpdateTeam) onUpdateTeam();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      setError('Nama dan Role wajib diisi');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingMember) {
        // Update existing member
        const res = await fetch(`/api/team/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            role: formData.role.trim(),
            description: formData.description.trim(),
            systemPrompt: formData.systemPrompt.trim() || null,
            model: formData.model.trim() || null,
            active: formData.active,
            shirtColor: formData.shirtColor,
          }),
        });

        if (!res.ok) {
          const contentType = res.headers.get('content-type') || '';
          let errDetail = 'Gagal menyimpan perubahan';
          if (contentType.includes('application/json')) {
            const errData = await res.json().catch(() => ({}));
            errDetail = errData.details || errData.error || errDetail;
          } else {
            const text = await res.text().catch(() => '');
            errDetail = text.includes('<!DOCTYPE') ? 'Backend server tidak merespons JSON (pastikan backend direstart)' : text;
          }
          throw new Error(errDetail);
        }

        showNotification(`Data ${formData.name} berhasil diperbarui!`);
      } else {
        // Create new member
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            role: formData.role.trim(),
            description: formData.description.trim(),
            systemPrompt: formData.systemPrompt.trim() || null,
            model: formData.model.trim() || null,
            active: formData.active,
            shirtColor: formData.shirtColor,
          }),
        });

        if (!res.ok) {
          const contentType = res.headers.get('content-type') || '';
          let errDetail = 'Gagal menambahkan agent';
          if (contentType.includes('application/json')) {
            const errData = await res.json().catch(() => ({}));
            errDetail = errData.details || errData.error || errDetail;
          } else {
            const text = await res.text().catch(() => '');
            errDetail = text.includes('<!DOCTYPE') ? 'Backend server tidak merespons JSON (pastikan backend direstart)' : text;
          }
          throw new Error(errDetail);
        }

        showNotification(`Agent baru ${formData.name} berhasil ditambahkan!`);
      }

      setModalOpen(false);
      if (onUpdateTeam) onUpdateTeam();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="team-settings-container">
      {/* Top Banner & Title */}
      <div className="settings-header-card">
        <div className="settings-header-info">
          <div className="settings-title-row">
            <span className="settings-header-icon"><IconUsers /></span>
            <h2>Roster Tim & Model AI</h2>
          </div>
          <p>
            Kelola agen kantor virtual, tetapkan model LLM spesifik per peran kerja, dan pantau posisi karakter di ruang 3D.
          </p>
        </div>
        <div className="settings-header-actions-group">
          <button
            type="button"
            className="btn-open-mcp-store"
            onClick={() => {
              setStoreTargetAgentId(null);
              setStoreModalOpen(true);
            }}
            title="Buka Hub Katalog MCP & Skills untuk memasang tools ke agent"
          >
            <span className="btn-store-icon">🔌</span>
            <span>Katalog MCP & Skills</span>
          </button>
          <button
            type="button"
            className="btn-add-agent"
            onClick={openAddModal}
          >
            <IconPlus />
            <span>Tambah Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="settings-alert-success" role="status">
          <span className="alert-icon"><IconCheck /></span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary KPI Metrics Strip */}
      <div className="settings-stats-row">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Roster</span>
            <span className="stat-icon-wrapper"><IconUsers /></span>
          </div>
          <div className="stat-val">{totalCount} Anggota</div>
          <div className="stat-subtext">Roster agen terdaftar</div>
        </div>
        <div className="stat-card stat-card-active">
          <div className="stat-header">
            <span className="stat-label">Aktif di Kantor 3D</span>
            <span className="stat-presence-dot dot-active" aria-hidden="true"></span>
          </div>
          <div className="stat-val">{activeCount} Online</div>
          <div className="stat-subtext">Hadir dalam simulasi ruangan</div>
        </div>
        <div className="stat-card stat-card-inactive">
          <div className="stat-header">
            <span className="stat-label">Non-Aktif</span>
            <span className="stat-presence-dot dot-inactive" aria-hidden="true"></span>
          </div>
          <div className="stat-val">{inactiveCount} Standby</div>
          <div className="stat-subtext">Sedang diistirahatkan</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Model AI Terkoneksi</span>
            <span className="stat-icon-wrapper"><IconCpu /></span>
          </div>
          <div className="stat-val">{availableModels.length} Model</div>
          <div className="stat-subtext">LLM backend gateway siap</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="settings-toolbar">
        <div className="settings-filter-pills" role="tablist" aria-label="Filter status agen">
          <button
            type="button"
            className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Aktif di 3D ({activeCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Non-Aktif ({inactiveCount})
          </button>
        </div>

        <div className="settings-search-box">
          <span className="search-icon"><IconSearch /></span>
          <input
            type="text"
            className="settings-search-input"
            placeholder="Cari nama, role, atau model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
            >
              <IconClose />
            </button>
          )}
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="agents-grid">
        {filteredMembers.length === 0 ? (
          <div className="agents-empty-search">
            <span className="empty-search-icon"><IconSearch /></span>
            <h4>Tidak ada anggota tim yang cocok</h4>
            <p>Coba kata kunci pencarian lain atau pilih tab filter yang berbeda.</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isActive = member.active !== false;
            const isDefault = member.isDefault || ['arif', 'rina', 'dimas', 'bayu', 'sinta', 'mira', 'eko'].includes(member.id);
            const locationLabel = AGENT_LOCATION_MAP[member.id.toLowerCase()] || 'Area Kantor 3D • Siap Bertugas';
            const modelMeta = formatModelMeta(member.model);

            return (
              <div key={member.id} className={`agent-card ${isActive ? 'card-active' : 'card-inactive'}`}>
                {/* Agent Card Header */}
                <div className="agent-card-header">
                  <div
                    className="agent-avatar"
                    style={{
                      backgroundColor: member.shirtColor || '#4a5fc1',
                      border: `2px solid ${member.shirtColor || '#4a5fc1'}`,
                    }}
                    title={`Warna Karakter: ${member.shirtColor || '#4a5fc1'}`}
                  >
                    <span className="avatar-letter">{member.name ? member.name.charAt(0).toUpperCase() : '?'}</span>
                    <span className={`avatar-status-pip ${isActive ? 'pip-active' : 'pip-inactive'}`} />
                  </div>
                  <div className="agent-title-block">
                    <div className="agent-name-row">
                      <span className="agent-name">{member.name}</span>
                      <span className={`badge-tier ${isDefault ? 'badge-default' : 'badge-custom-agent'}`}>
                        {isDefault ? 'Bawaan' : 'Kustom'}
                      </span>
                    </div>
                    <div className="agent-role">{member.role}</div>
                  </div>
                  <button
                    type="button"
                    className={`status-toggle-pill ${isActive ? 'pill-active' : 'pill-inactive'}`}
                    onClick={() => handleToggleActive(member)}
                    title={isActive ? 'Klik untuk non-aktifkan dari ruang 3D' : 'Klik untuk aktifkan di ruang 3D'}
                  >
                    <span className={`status-dot ${isActive ? 'dot-active' : 'dot-inactive'}`} aria-hidden="true"></span>
                    <span>{isActive ? 'Aktif' : 'Non-Aktif'}</span>
                  </button>
                </div>

                {/* 3D Office Location Tag */}
                <div className="agent-location-tag" title="Posisi keberadaan di kantor virtual 3D">
                  <span className="location-icon"><IconMapPin /></span>
                  <span className="location-text">{locationLabel}</span>
                </div>

                {/* Capabilities Badges */}
                <div className="agent-capabilities-strip">
                  {member.systemPrompt && (
                    <span className="cap-pill cap-pill-op" title="Agent dibekali System Prompt Overpowered (OP)">
                      ⚡ OP Prompt
                    </span>
                  )}
                  {(['bayu', 'doni', 'fajar'].includes(member.id) || (member.role && /engineer|devops|qa|software|testing|cloud/i.test(member.role))) && (
                    <>
                      <span className="cap-pill cap-pill-ast" title="Koneksi otomatis ke AST Codebase Indexer (~520 tokens)">
                        🔍 AST Index
                      </span>
                      <span className="cap-pill cap-pill-mcp" title="Tools Codebase MCP: get_codebase_map, read_file_content, search_codebase">
                        🛠️ MCP Tools
                      </span>
                    </>
                  )}
                </div>

                {/* Scope & Responsibilities */}
                <div className="agent-description">
                  {member.description || 'Tidak ada deskripsi spesifik.'}
                </div>

                {/* OP System Prompt Collapsible Preview (if available) */}
                {member.systemPrompt && (
                  <div className="agent-prompt-section">
                    <button
                      type="button"
                      className="btn-toggle-prompt"
                      onClick={() => setExpandedPromptAgentId(expandedPromptAgentId === member.id ? null : member.id)}
                    >
                      <span>{expandedPromptAgentId === member.id ? 'Tutup OP Prompt' : 'Lihat OP System Prompt'}</span>
                      <span className="prompt-toggle-chevron">{expandedPromptAgentId === member.id ? '▲' : '▼'}</span>
                    </button>
                    {expandedPromptAgentId === member.id && (
                      <div className="agent-prompt-drawer">
                        <pre className="prompt-pre-content">{member.systemPrompt}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Installed MCPs & Skills */}
                {((Array.isArray(member.installedMCPs) && member.installedMCPs.length > 0) || (Array.isArray(member.installedSkills) && member.installedSkills.length > 0)) && (
                  <div className="agent-installed-tools-box">
                    <span className="installed-tools-label">Tools & Skills Terpasang:</span>
                    <div className="installed-tools-pills">
                      {member.installedMCPs?.map(mcp => (
                        <span key={mcp.id} className="installed-tool-chip chip-mcp" title={mcp.name}>
                          <span>{mcp.icon || '📦'} {mcp.name.replace(' MCP Server', '').replace(' MCP', '')}</span>
                          <button
                            type="button"
                            className="btn-chip-remove"
                            onClick={() => handleRemoveMcp(member.id, mcp.id)}
                            title={`Copot ${mcp.name} dari ${member.name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {member.installedSkills?.map(sk => (
                        <span key={sk.id} className="installed-tool-chip chip-skill" title={sk.name}>
                          <span>{sk.icon || '✨'} {sk.name.replace(' Skill', '')}</span>
                          <button
                            type="button"
                            className="btn-chip-remove"
                            onClick={() => handleRemoveMcp(member.id, sk.id)}
                            title={`Copot ${sk.name} dari ${member.name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model AI Engineering Console Section */}
                <div className="agent-model-box">
                  <div className="model-box-header">
                    <div className="model-header-left">
                      <span className="model-label-icon"><IconCpu /></span>
                      <span className="model-label-text">Model LLM</span>
                    </div>
                    <span className={`model-status-chip ${modelMeta.isCustom ? 'chip-custom' : 'chip-inherited'}`}>
                      {modelMeta.isCustom ? 'Dedicated' : 'Global Default'}
                    </span>
                  </div>

                  <div className="model-active-display">
                    <span className="model-provider-tag">{modelMeta.provider}</span>
                    <span className="model-name-text">{modelMeta.cleanName}</span>
                  </div>

                  <select
                    id={`model-select-${member.id}`}
                    className="agent-model-select"
                    value={member.model || ''}
                    onChange={(e) => handleModelChangeQuick(member, e.target.value)}
                    aria-label={`Pilih model AI untuk ${member.name}`}
                  >
                    <option value="">Default (Ikuti Pilihan Chat Global)</option>
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Card Footer Actions */}
                <div className="agent-card-actions">
                  <button
                    type="button"
                    className="btn-card-action btn-add-tool"
                    onClick={() => {
                      setStoreTargetAgentId(member.id);
                      setStoreModalOpen(true);
                    }}
                    title={`Pasang MCP tool atau skill khusus untuk ${member.name}`}
                  >
                    <span>🔌 + Tool</span>
                  </button>
                  <button
                    type="button"
                    className="btn-card-action btn-edit"
                    onClick={() => openEditModal(member)}
                  >
                    <IconEdit />
                    <span>Edit Profil</span>
                  </button>
                  <button
                    type="button"
                    className="btn-card-action btn-delete"
                    onClick={() => handleDeleteMember(member)}
                    title={isDefault ? 'Non-aktifkan agen dari roster' : 'Hapus agen permanen'}
                  >
                    {isDefault ? <IconPower /> : <IconTrash />}
                    <span>{isDefault ? 'Non-aktifkan' : 'Hapus'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog: Add / Edit Agent */}
      {modalOpen && (
        <div className="settings-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-title-icon">{editingMember ? <IconEdit /> : <IconPlus />}</span>
                <h3>{editingMember ? `Edit Profil: ${editingMember.name}` : 'Tambah Anggota Tim Baru'}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup dialog"
              >
                <IconClose />
              </button>
            </div>

            {error && <div className="modal-error-box">{error}</div>}

            <form onSubmit={handleSubmitForm} className="modal-form">
              {/* Quick Live Preview Card */}
              <div className="modal-preview-strip">
                <div
                  className="preview-avatar"
                  style={{ backgroundColor: formData.shirtColor || '#38bdf8' }}
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="preview-meta">
                  <div className="preview-name">{formData.name || 'Nama Agen'}</div>
                  <div className="preview-role">{formData.role || 'Role / Jabatan'}</div>
                </div>
                <span className={`preview-badge ${formData.active ? 'badge-active' : 'badge-inactive'}`}>
                  {formData.active ? 'Aktif di 3D' : 'Non-Aktif'}
                </span>
              </div>

              {/* Quick Role Presets (only when adding new) */}
              {!editingMember && (
                <div className="form-group">
                  <label className="form-label-sub">Pilih Role Siap Pakai (Opsional):</label>
                  <div className="preset-roles-list">
                    {COMMON_ROLE_PRESETS.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className="preset-role-chip"
                        onClick={() => applyRolePreset(p)}
                      >
                        {p.role.split('/')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="agent-form-name">Nama Anggota / Agent *</label>
                <input
                  id="agent-form-name"
                  type="text"
                  placeholder="Contoh: Farhan, Nadia, Kevin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="agent-form-role">Jabatan / Role *</label>
                <input
                  id="agent-form-role"
                  type="text"
                  placeholder="Contoh: DevOps Engineer, QA Analyst, Copywriter"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="agent-form-desc">Deskripsi Keahlian & Tanggung Jawab</label>
                <textarea
                  id="agent-form-desc"
                  rows="3"
                  placeholder="Contoh: Mengatur deployment server, pipeline CI/CD, dan monitoring performa."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label htmlFor="agent-form-prompt" style={{ margin: 0 }}>OP System Prompt / Instruksi Khusus (Opsional)</label>
                  <span className="cap-pill cap-pill-op" style={{ fontSize: '10px' }}>⚡ OP Prompt</span>
                </div>
                <textarea
                  id="agent-form-prompt"
                  rows="4"
                  style={{ fontFamily: 'monospace', fontSize: '11.5px', lineHeight: '1.4' }}
                  placeholder="Instruksi sistem khusus untuk agent ini (misal: standar kualitas kode, testing kriteria, aturan pelaporan)..."
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                />
                <small className="form-help">
                  Petunjuk sistem ini akan diprioritaskan saat agent mengeksekusi tugas.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="agent-form-model">Model AI Khusus (Opsional)</label>
                <select
                  id="agent-form-model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                >
                  <option value="">Default (Ikuti Pilihan Global)</option>
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <small className="form-help">
                  Jika dipilih, tugas yang didelegasikan ke agent ini akan dieksekusi dengan model ini.
                </small>
              </div>

              <div className="form-group">
                <label>Warna Pakaian Karakter 3D</label>
                <div className="color-presets-row">
                  {SHIRT_PRESETS.map((p) => (
                    <button
                      type="button"
                      key={p.color}
                      className={`color-preset-circle ${formData.shirtColor === p.color ? 'selected' : ''}`}
                      style={{ backgroundColor: p.color }}
                      onClick={() => setFormData({ ...formData, shirtColor: p.color })}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group form-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Status Kehadiran (Muncul di ruang 3D dan siap didelegasikan tugas)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : editingMember ? 'Simpan Perubahan' : 'Tambahkan ke Tim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MCP & Skill Store Modal */}
      <McpSkillStoreModal
        isOpen={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        teamMembers={teamMembers}
        initialAgentId={storeTargetAgentId}
        onUpdateTeam={onUpdateTeam}
      />
    </div>
  );
}

export default TeamSettingsPage;
