import React, { useState } from 'react';

/**
 * Predefined color presets for characters in the virtual office
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
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    model: '',
    active: true,
    shirtColor: '#38bdf8',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Statistics
  const totalCount = teamMembers.length;
  const activeCount = teamMembers.filter(m => m.active !== false).length;
  const inactiveCount = totalCount - activeCount;

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
      model: member.model || '',
      active: member.active !== false,
      shirtColor: member.shirtColor || '#38bdf8',
    });
    setError(null);
    setModalOpen(true);
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
          <h2>👥 Pengaturan Tim & Agen AI</h2>
          <p>
            Kelola keanggotaan kantor virtual, status aktif, spesifikasi model LLM tiap agent,
            serta sinkronisasi avatar di visualisasi 3D.
          </p>
        </div>
        <button
          type="button"
          className="btn-add-agent"
          onClick={openAddModal}
        >
          <span>➕</span> Tambah Anggota Baru
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="settings-alert-success" role="status">
          <span>✅</span> {successMessage}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="settings-stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Roster</div>
          <div className="stat-val">{totalCount} Orang</div>
        </div>
        <div className="stat-card stat-card-active">
          <div className="stat-label">Aktif di Kantor 3D</div>
          <div className="stat-val">🟢 {activeCount} Orang</div>
        </div>
        <div className="stat-card stat-card-inactive">
          <div className="stat-label">Non-Aktif</div>
          <div className="stat-val">⚪ {inactiveCount} Orang</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Model AI Tersedia</div>
          <div className="stat-val">🤖 {availableModels.length} Model</div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="agents-grid">
        {teamMembers.map((member) => {
          const isActive = member.active !== false;
          const isDefault = member.isDefault || ['arif', 'rina', 'dimas', 'bayu', 'sinta', 'mira', 'eko'].includes(member.id);

          return (
            <div key={member.id} className={`agent-card ${isActive ? 'card-active' : 'card-inactive'}`}>
              <div className="agent-card-header">
                <div
                  className="agent-avatar"
                  style={{ backgroundColor: member.shirtColor || '#4a5fc1' }}
                  title={`Warna Karakter: ${member.shirtColor || '#4a5fc1'}`}
                >
                  {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="agent-title-block">
                  <div className="agent-name-row">
                    <span className="agent-name">{member.name}</span>
                    {isDefault && <span className="badge-default">Default</span>}
                  </div>
                  <div className="agent-role">{member.role}</div>
                </div>
                <button
                  type="button"
                  className={`status-toggle-pill ${isActive ? 'pill-active' : 'pill-inactive'}`}
                  onClick={() => handleToggleActive(member)}
                  title={isActive ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                >
                  {isActive ? '🟢 Aktif' : '⚪ Non-Aktif'}
                </button>
              </div>

              <div className="agent-description">
                {member.description || 'Tidak ada deskripsi spesifik.'}
              </div>

              {/* Per-Agent Model Selector */}
              <div className="agent-model-box">
                <label htmlFor={`model-select-${member.id}`} className="agent-model-label">
                  <span>🤖 Model AI:</span>
                </label>
                <select
                  id={`model-select-${member.id}`}
                  className="agent-model-select"
                  value={member.model || ''}
                  onChange={(e) => handleModelChangeQuick(member, e.target.value)}
                >
                  <option value="">🌐 Default (Ikuti Pilihan Chat)</option>
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
                  className="btn-card-action btn-edit"
                  onClick={() => openEditModal(member)}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  className="btn-card-action btn-delete"
                  onClick={() => handleDeleteMember(member)}
                  title={isDefault ? 'Non-aktifkan agent' : 'Hapus agent permanen'}
                >
                  {isDefault ? '⏹️ Non-aktifkan' : '🗑️ Hapus'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog: Add / Edit Agent */}
      {modalOpen && (
        <div className="settings-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMember ? `✏️ Edit Agen: ${editingMember.name}` : '➕ Tambah Anggota / Agen Baru'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {error && <div className="modal-error-box">⚠️ {error}</div>}

            <form onSubmit={handleSubmitForm} className="modal-form">
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
                <label htmlFor="agent-form-model">Model AI Khusus (Opsional)</label>
                <select
                  id="agent-form-model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                >
                  <option value="">🌐 Default (Ikuti Pilihan Global)</option>
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
                  <span>Status Aktif (muncul di ruang 3D & dapat didelegasikan tugas)</span>
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
    </div>
  );
}

export default TeamSettingsPage;
