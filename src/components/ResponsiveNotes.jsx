import React from 'react';

const NOTES_DATA = [
  {
    title: 'Desktop ≥ 1024px',
    description: 'Seluruh ruangan dengan 7 karakter, label meja saat hover, parallax kursor dan scroll.',
  },
  {
    title: 'Tablet 640–1023px',
    description: 'Adegan penuh. Label muncul saat ketuk, parallax hanya dari scroll.',
  },
  {
    title: 'Mobile < 640px',
    description: 'Ruangan disederhanakan: lounge, pantry, dan 2 karakter disembunyikan (sisa 5), kamera lebih dekat.',
  },
  {
    title: 'prefers-reduced-motion',
    description: 'Semua loop berhenti. Adegan jadi statis, tanpa parallax. Gelembung bicara tetap terlihat.',
  },
];

/**
 * Reusable note card component
 */
function NoteCard({ title, description }) {
  return (
    <div className="card">
      <b>{title}</b>
      {description}
    </div>
  );
}

/**
 * Responsive notes section with data-driven cards
 * Displays accessibility and responsive behavior notes
 */
export function ResponsiveNotes() {
  return (
    <section className="notes">
      <h2>Perilaku responsif &amp; aksesibilitas</h2>
      <div className="grid">
        {NOTES_DATA.map((note, index) => (
          <NoteCard
            key={index}
            title={note.title}
            description={note.description}
          />
        ))}
      </div>
    </section>
  );
}
