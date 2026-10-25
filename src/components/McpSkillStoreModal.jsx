import React, { useState, useEffect } from 'react';

// Clean SVG Icons
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function McpSkillStoreModal({ isOpen, onClose, teamMembers = [], initialAgentId = null, onUpdateTeam }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId || '');
  const [installingId, setInstallingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Config modal state for tools with parameters
  const [configModalItem, setConfigModalItem] = useState(null);
  const [configValues, setConfigValues] = useState({});

  useEffect(() => {
    if (initialAgentId) {
      setSelectedAgentId(initialAgentId);
    }
  }, [initialAgentId]);

  // Live registry fetch debounced on query & category
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('query', searchQuery.trim());
        if (activeCategory !== 'all') params.append('category', activeCategory);

        const res = await fetch(`/api/mcp/catalog?${params.toString()}`);
        if (res.ok && active) {
          const data = await res.json();
          if (Array.isArray(data.catalog)) {
            setCatalog(data.catalog);
          }
        }
      } catch (err) {
        console.error('Failed to load live MCP catalog:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, searchQuery, activeCategory]);

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Check if an item is installed on a specific agent
  const isInstalledOnAgent = (itemId, agentId) => {
    if (!agentId) return false;
    const member = teamMembers.find(m => m.id === agentId);
    if (!member) return false;
    const hasMcp = Array.isArray(member.installedMCPs) && member.installedMCPs.some(m => m.id === itemId);
    const hasSkill = Array.isArray(member.installedSkills) && member.installedSkills.some(s => s.id === itemId);
    return hasMcp || hasSkill;
  };

  // Find which agents currently have this tool installed
  const getInstalledAgents = (itemId) => {
    return teamMembers.filter(m => {
      const hasMcp = Array.isArray(m.installedMCPs) && m.installedMCPs.some(item => item.id === itemId);
      const hasSkill = Array.isArray(m.installedSkills) && m.installedSkills.some(item => item.id === itemId);
      return hasMcp || hasSkill;
    });
  };

  const handleInstallClick = (item) => {
    const targetAgentId = selectedAgentId || (item.recommendedAgents && item.recommendedAgents[0]) || (teamMembers[0] && teamMembers[0].id);

    if (item.configFields && item.configFields.length > 0) {
      setConfigModalItem({ item, targetAgentId });
      const initialConfigs = {};
      item.configFields.forEach(f => {
        initialConfigs[f.key] = f.default || '';
      });
      setConfigValues(initialConfigs);
    } else {
      executeInstall(item.id, targetAgentId, {});
    }
  };

  const executeInstall = async (mcpId, agentId, config) => {
    if (!agentId) {
      alert('Pilih target agent terlebih dahulu!');
      return;
    }
    setInstallingId(mcpId);
    try {
      const res = await fetch(`/api/team/${agentId}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcpId, config })
      });
      if (!res.ok) {
        throw new Error('Gagal memasang tool ke agent');
      }
      const data = await res.json();
      const targetMember = teamMembers.find(m => m.id === agentId);
      showNotification(`Berhasil memasang ${data.installed?.name || mcpId} ke ${targetMember?.name || agentId}!`);
      if (onUpdateTeam) onUpdateTeam();
      setConfigModalItem(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async (mcpId, agentId) => {
    const member = teamMembers.find(m => m.id === agentId);
    if (!window.confirm(`Lepas tool ini dari ${member?.name || agentId}?`)) return;

    setInstallingId(mcpId);
    try {
      const res = await fetch(`/api/team/${agentId}/mcp/${mcpId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Gagal mencopot tool');
      }
      showNotification(`Tool berhasil dilepas dari ${member?.name || agentId}`);
      if (onUpdateTeam) onUpdateTeam();
    } catch (err) {
      alert(err.message);
    } finally {
      setInstallingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="store-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="store-modal-header">
          <div className="store-title-wrap">
            <span className="store-title-icon">🔌</span>
            <div>
              <h3>Hub & Katalog MCP Server Real-Time</h3>
              <p>Cari paket MCP server resmi dan terbitan NPM langsung untuk dipasang ke agen kantor virtual.</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            <IconClose />
          </button>
        </div>

        {/* Action toast */}
        {actionMessage && (
          <div className="store-alert-toast" role="status">
            <IconCheck />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Toolbar: Live Search & Target Agent selector */}
        <div className="store-toolbar-row">
          <div className="store-search-box">
            <span className="search-icon"><IconSearch /></span>
            <input
              type="text"
              placeholder="Cari paket MCP (misal: github, playwright, docker, postgres, figma, slack, redis)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <IconClose />
              </button>
            )}
          </div>

          <div className="store-agent-selector-wrap">
            <label htmlFor="store-target-agent">Fokus Agent:</label>
            <select
              id="store-target-agent"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="">Semua Agent (Pilih Saat Pasang)</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role.split('/')[0].trim()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="store-category-pills">
          <button
            type="button"
            className={`store-cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Semua
          </button>
          <button
            type="button"
            className={`store-cat-pill ${activeCategory === 'engineering' ? 'active' : ''}`}
            onClick={() => setActiveCategory('engineering')}
          >
            💻 Engineering
          </button>
          <button
            type="button"
            className={`store-cat-pill ${activeCategory === 'qa' ? 'active' : ''}`}
            onClick={() => setActiveCategory('qa')}
          >
            🧪 QA & Testing
          </button>
          <button
            type="button"
            className={`store-cat-pill ${activeCategory === 'devops' ? 'active' : ''}`}
            onClick={() => setActiveCategory('devops')}
          >
            ☁️ DevOps & Cloud
          </button>
          <button
            type="button"
            className={`store-cat-pill ${activeCategory === 'design' ? 'active' : ''}`}
            onClick={() => setActiveCategory('design')}
          >
            🎨 Design
          </button>
          <button
            type="button"
            className={`store-cat-pill ${activeCategory === 'management' ? 'active' : ''}`}
            onClick={() => setActiveCategory('management')}
          >
            📋 Management & Ops
          </button>
          <button
            type="button"
            className={`store-cat-pill ${activeCategory === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveCategory('skills')}
          >
            ✨ Agent Skills
          </button>
        </div>

        {/* Grid List */}
        <div className="store-catalog-grid">
          {loading ? (
            <div className="store-loading-state">
              <span className="live-radar-ping" style={{ display: 'inline-block', width: '12px', height: '12px', background: '#0284c7', borderRadius: '50%', marginRight: '8px' }}></span>
              Sedang mencari paket MCP di NPM Registry & Official Catalog...
            </div>
          ) : catalog.length === 0 ? (
            <div className="store-empty-state">
              <span className="empty-icon">🔍</span>
              <h4>Tidak ada paket MCP yang cocok dengan kata kunci "{searchQuery}"</h4>
              <p>Coba kata kunci lain (misal: <code>github</code>, <code>playwright</code>, <code>docker</code>, <code>figma</code>) atau pilih kategori "Semua".</p>
            </div>
          ) : (
            catalog.map(item => {
              const installedAgents = getInstalledAgents(item.id);
              const isInstalledOnCurrent = selectedAgentId ? isInstalledOnAgent(item.id, selectedAgentId) : false;
              const isBusy = installingId === item.id;

              return (
                <div key={item.id} className="store-item-card">
                  <div className="store-card-top">
                    <div className="store-card-icon-wrap">
                      <span className="store-card-icon">{item.icon || '📦'}</span>
                    </div>
                    <div className="store-card-title-block">
                      <div className="store-card-header-row">
                        <span className="store-card-name" title={item.name}>{item.name}</span>
                        {item.version && (
                          <span className="store-version-badge">v{item.version}</span>
                        )}
                        <span className={`store-type-badge type-${item.type || 'mcp'}`}>
                          {item.type === 'skill' ? 'Skill' : 'MCP'}
                        </span>
                      </div>
                      <div className="store-source-row">
                        <span className="store-card-source">
                          {item.source}
                          {item.publisher ? ` • oleh @${item.publisher}` : ''}
                        </span>
                        {item.repo && (
                          <a href={item.repo} target="_blank" rel="noreferrer" className="store-repo-link" title="Buka tautan repository / NPM">
                            <IconExternal />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="store-card-desc">{item.description}</p>

                  {/* Command box */}
                  {item.command && (
                    <div className="store-cmd-box" title="Perintah eksekusi runtime">
                      <span className="cmd-label">Command:</span>
                      <code>{item.command}</code>
                    </div>
                  )}

                  {/* Exposed Tools */}
                  {Array.isArray(item.tools) && item.tools.length > 0 && (
                    <div className="store-tools-box">
                      <span className="store-tools-label">Tools yang Disediakan ({item.tools.length}):</span>
                      <div className="store-tools-list">
                        {item.tools.map((t, idx) => (
                          <span key={idx} className="tool-chip" title={t.description}>
                            <code>{t.name}</code>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Installed presence indicator */}
                  {installedAgents.length > 0 && (
                    <div className="store-installed-strip">
                      <span className="installed-dot"></span>
                      <span>Terpasang di: <strong>{installedAgents.map(a => a.name).join(', ')}</strong></span>
                    </div>
                  )}

                  {/* Card Action */}
                  <div className="store-card-footer">
                    {selectedAgentId && isInstalledOnCurrent ? (
                      <button
                        type="button"
                        className="btn-store-uninstall"
                        onClick={() => handleUninstall(item.id, selectedAgentId)}
                        disabled={isBusy}
                      >
                        <IconTrash />
                        <span>{isBusy ? 'Memproses...' : 'Lepas dari Agent'}</span>
                      </button>
                    ) : (
                      <div className="store-install-action-row">
                        <select
                          className="store-quick-agent-select"
                          value={selectedAgentId || (item.recommendedAgents && item.recommendedAgents[0]) || ''}
                          onChange={(e) => setSelectedAgentId(e.target.value)}
                        >
                          <option value="">Pilih Agent...</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role.split('/')[0].trim()})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-store-install"
                          onClick={() => handleInstallClick(item)}
                          disabled={isBusy}
                        >
                          <span>{isBusy ? 'Memasang...' : 'Pasang'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Config Modal for tools requiring parameters */}
        {configModalItem && (
          <div className="settings-modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setConfigModalItem(null)}>
            <div className="settings-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <span className="modal-title-icon">{configModalItem.item.icon || '⚙️'}</span>
                  <h3>Konfigurasi {configModalItem.item.name}</h3>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setConfigModalItem(null)}>
                  <IconClose />
                </button>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
                  Pasang ke <strong>{teamMembers.find(m => m.id === configModalItem.targetAgentId)?.name || 'Agent'}</strong>. Anda dapat mengosongkan token jika ingin menggunakan nilai bawaan.
                </p>

                {configModalItem.item.configFields?.map(field => (
                  <div key={field.key} className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={configValues[field.key] || ''}
                        onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      >
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        placeholder={field.placeholder || ''}
                        value={configValues[field.key] || ''}
                        onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    )}
                  </div>
                ))}

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setConfigModalItem(null)}>
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => executeInstall(configModalItem.item.id, configModalItem.targetAgentId, configValues)}
                  >
                    Konfirmasi & Pasang
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default McpSkillStoreModal;
