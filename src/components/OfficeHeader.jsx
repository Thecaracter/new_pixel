import React, { useState, useEffect } from 'react';

/**
 * Modern, tactile Office Header Component
 * Features:
 * - Real-time dynamic Indonesian clock & calendar (updates every second)
 * - Pulsing live presence radar indicator
 * - Non-AI-slop bespoke segmented tabs with clean SVG icons
 * - Cohesive brand identity with logo badge
 */
export function OfficeHeader({ activeTab = 'office', onSelectTab, activeMemberCount = 7 }) {
  // Real dynamic date and time updated every second
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time according to Indonesian locale
  const formattedDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(currentDate);
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(currentDate);
  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(currentDate).replace(/\./g, ':');

  return (
    <header className="office-header-main" role="banner">
      {/* 1. Brand & Workspace Identity */}
      <div className="header-brand-block">
        <div className="brand-badge-container">
          <div className="brand-logo-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2.5 7.5L12 13L21.5 7.5L12 2Z"
                fill="currentColor"
                className="logo-cube-top"
              />
              <path
                d="M2.5 7.5V16.5L12 22V13L2.5 7.5Z"
                fill="currentColor"
                fillOpacity="0.8"
                className="logo-cube-left"
              />
              <path
                d="M12 13V22L21.5 16.5V7.5L12 13Z"
                fill="currentColor"
                fillOpacity="0.6"
                className="logo-cube-right"
              />
            </svg>
          </div>
          <div className="brand-text-meta">
            <div className="brand-title-row">
              <h1 className="brand-title">Kantor Virtual</h1>
              <span className="brand-tag">Pixel Works</span>
            </div>
            <p className="brand-subtitle">
              Ruang kerja 3D kolaboratif bersama Arif & tim agen
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Tabs (Tactile Segmented Bar) */}
      <nav className="header-nav-tabs" aria-label="Navigasi Halaman Utama">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'office' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('office')}
          aria-current={activeTab === 'office' ? 'page' : undefined}
        >
          <span className="nav-tab-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </span>
          <span className="nav-tab-label">Virtual Office & Chat</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('settings')}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <span className="nav-tab-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="nav-tab-label">Tim & Model AI</span>
          <span className="nav-tab-count" title={`${activeMemberCount} anggota aktif`}>
            <span className="count-dot" aria-hidden="true"></span>
            {activeMemberCount} Aktif
          </span>
        </button>
      </nav>

      {/* 3. Real-Time Dynamic Live Status Widget */}
      <div className="header-live-widget" aria-label="Status Waktu Real-Time">
        <div className="live-indicator-pill" title="Status server kantor virtual aktif">
          <span className="live-radar-box" aria-hidden="true">
            <span className="live-radar-ping"></span>
            <span className="live-radar-dot"></span>
          </span>
          <span className="live-pill-text">LIVE</span>
        </div>

        <div className="live-clock-details">
          <div className="live-time-row">
            <span className="live-time-value">{formattedTime}</span>
            <span className="live-time-zone">WIB</span>
          </div>
          <div className="live-date-row">
            <span className="live-day-text">{formattedDay},</span>
            <span className="live-date-text">{formattedDate}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default OfficeHeader;
