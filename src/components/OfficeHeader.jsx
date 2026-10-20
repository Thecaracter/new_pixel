import React from 'react';

/**
 * Office page header with title, tab navigation, and live status badge
 */
export function OfficeHeader({ activeTab = 'office', onSelectTab, activeMemberCount = 7 }) {
  return (
    <header className="office-header-main">
      <div className="header-brand-block">
        <h1>Kantor Virtual — Pixel Works</h1>
        <p>Tim kecil yang sibuk. Koordinasikan proyek bersama Arif dan agen AI.</p>
      </div>

      {/* Main Top Navigation Tabs */}
      <nav className="header-nav-tabs" aria-label="Navigasi Halaman Utama">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'office' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('office')}
          aria-current={activeTab === 'office' ? 'page' : undefined}
        >
          <span className="nav-tab-icon" aria-hidden="true">🏢</span>
          <span className="nav-tab-label">Virtual Office & Chat</span>
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('settings')}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <span className="nav-tab-icon" aria-hidden="true">👥</span>
          <span className="nav-tab-label">Pengaturan Tim & Model</span>
          <span className="nav-tab-count" title={`${activeMemberCount} anggota aktif`}>
            {activeMemberCount}
          </span>
        </button>
      </nav>

      <div className="chip header-status-chip">
        <b>🟢</b> Live — Senin 09.41
      </div>
    </header>
  );
}

export default OfficeHeader;
