import React from 'react';

/**
 * Office page header with title, subtitle, and live status badge
 */
export function OfficeHeader() {
  return (
    <header>
      <div>
        <h1>Kantor Virtual — Pixel Works</h1>
        <p>Tim kecil yang sibuk. Lihat siapa mengerjakan apa pagi ini.</p>
      </div>
      <div className="chip">
        <b>🟢</b> Live — Senin 09.41
      </div>
    </header>
  );
}
