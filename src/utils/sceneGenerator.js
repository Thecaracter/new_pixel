// Scene generator - builds the complete SVG office scene
import {
  P, pts, poly, sh, box, cyl, wl, wr, fq, pl, ell, L, win,
  plant, chair, desk, steam, armTo, say, emo, hang,
} from './svgUtils';
import { head, person } from './characterUtils';

export function generateScene() {
  let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc3ff"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient></defs>`;

  s += `<ellipse cx="510" cy="632" rx="470" ry="34" fill="#1b1740" opacity=".3" style="filter:blur(12px)"/>`;

  // Floor
  s += poly([P(0, 9), P(12, 9), P(12, 9, -0.5), P(0, 9, -0.5)], '#b07a45')
    + poly([P(12, 0), P(12, 9), P(12, 9, -0.5), P(12, 0, -0.5)], '#8d5d33');
  s += poly([P(0, 0), P(12, 0), P(12, 9), P(0, 9)], '#e3b47e');

  for (let i = 1; i < 12; i++) {
    s += `<path d="M${P(i, 0)}L${P(i, 9)}" stroke="#8a5a2b" stroke-opacity=".1"/>`;
  }

  // Decorative objects
  s += ell(9.4, 4.1, 2.7, '#2fa7a0', 0.5) + ell(9.4, 4.1, 2.3, '#f6efe0', 0.35)
    + ell(2.6, 3.6, 2.2, '#d9c6f2', 0.55)
    + `<g class="opt">${ell(10, 7.5, 1.9, '#f2b84b', 0.5)}</g>`;

  // Walls
  s += poly([P(0, 0), P(0, 9), P(0, 9, 4), P(0, 0, 4)], '#e6d1ad')
    + poly([P(0, 0), P(12, 0), P(12, 0, 4), P(0, 0, 4)], '#f7ecd6');

  s += wl(0, 9, 0.25, 1, '#2f9a92') + wr(0, 12, 0.25, 1, '#3bb4ab')
    + wl(0, 9, 0, 0.25, '#bfa27a') + wr(0, 12, 0, 0.25, '#cdb28a')
    + wl(0, 9, 3.75, 3.85, '#d4bb92') + wr(0, 12, 3.75, 3.85, '#e4cfa8');

  s += win(wl, 2.2, 4.0) + win(wl, 4.8, 6.6) + win(wr, 0.8, 2.8) + win(wr, 3.4, 5.4);

  s += poly([P(0, 2.2), P(0, 4), P(4.2, 5.4), P(4.2, 3.6)], '#fff', 'opacity=".15"')
    + poly([P(0, 4.8), P(0, 6.6), P(4.2, 7.6), P(4.2, 5.8)], '#fff', 'opacity=".12"');

  s += Array.from({ length: 14 }, (_, i) => {
    const [a, b] = P(0.4 + i * 0.3, 2.6 + (i * 5 % 7) * 0.45, 1 + (i % 4) * 0.35);
    return `<circle class="mote" cx="${a}" cy="${b}" r="1.6" fill="#fff" style="animation-delay:${i * 0.6}s"/>`;
  }).join('');

  // Whiteboard
  s += wr(7.05, 10.55, 1.15, 3.45, '#c4ccd8') + wr(7.15, 10.45, 1.25, 3.35, '#fff');
  s += wr(7.4, 7.7, 1.4, 2.1, '#2fa7a0') + wr(7.8, 8.1, 1.4, 2.6, '#f26a5b')
    + wr(8.2, 8.5, 1.4, 1.9, '#f2b84b') + wr(7.4, 8.5, 2.9, 3.0, '#c9c3e8')
    + wr(7.4, 8.2, 3.05, 3.15, '#c9c3e8');
  s += wr(10.0, 10.3, 2.6, 2.9, '#ffe27a') + wr(10.0, 10.3, 2.15, 2.45, '#ff9f8a')
    + wr(9.6, 9.9, 2.9, 3.2, '#9ee3c0');
  s += `<path class="scrib" d="M${P(8.85, 0, 2.0)}L${P(9.1, 0, 2.5)}L${P(9.35, 0, 1.95)}L${P(9.6, 0, 2.5)}L${P(9.85, 0, 2.05)}" fill="none" stroke="#3b46c9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<g class="hov" data-tip="Papan Sprint|Rencana kerja minggu ini">${wr(7.05, 10.55, 1.15, 1.25, '#9aa3b4')}</g>`;

  // Clock
  const cp = [];
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * 6.283;
    cp.push(P(6.6 + 0.3 * Math.cos(a), 0, 3.05 + 0.35 * Math.sin(a)));
  }
  s += poly(cp, '#fff', 'stroke="#2d3a6b" stroke-width="2"')
    + `<path d="M${P(6.6, 0, 3.05)}L${P(6.6, 0, 3.3)}M${P(6.6, 0, 3.05)}L${P(6.78, 0, 3.05)}" stroke="#2d3a6b" stroke-width="2" stroke-linecap="round"/>`;

  // Poster
  s += wr(10.95, 11.95, 1.4, 3.0, '#fff') + wr(11.05, 11.85, 1.5, 2.9, '#ffd9c9')
    + wr(11.15, 11.55, 1.6, 2.4, '#f26a5b') + wr(11.4, 11.75, 2.1, 2.8, '#2fa7a0');

  // Objects array for depth sorting
  const O = [];
  const add = (d, x) => O.push([d, x]);

  // Bookshelf
  let bs = box(0.1, 0.3, 0, 0.7, 1.4, 2.6, '#b98048');
  const cols = ['#f26a5b', '#2fa7a0', '#f2b84b', '#4a5fc1', '#8a63d2'];
  for (let r = 0; r < 3; r++) {
    bs += pl(0.8, 0.4, 1.6, 0.2 + r * 0.8, 0.8 + r * 0.8, '#8a5a32');
    for (let i = 0; i < 8; i++) {
      const a = 0.45 + i * 0.14;
      bs += pl(0.8, a, a + 0.11, 0.2 + r * 0.8, 0.55 + r * 0.8 + ((i * 7 + r * 3) % 4) * 0.05, cols[(i + r * 2) % 5]);
    }
  }
  add(2, `<g class="hov" data-tip="Rak Arsip|Dokumen proyek">${bs}</g>`);

  // Printer
  add(8, `<g class="hov" data-tip="Printer &amp; Lemari|Cetak kontrak">${box(0.1, 6.9, 0, 0.9, 1.8, 1.1, '#d8d2c4') + pl(1, 7.5, 8.1, 0.55, 0.62, '#8a8a8a') + box(0.2, 7.3, 1.1, 0.7, 0.9, 0.3, '#fff') + box(0.25, 7.45, 1.4, 0.4, 0.5, 0.04, '#ddd')}</g>`);

  // Pantry
  add(9.8, `<g class="hov opt" data-tip="Pantry|Isi ulang air &amp; kopi">${box(1.7, 8.1, 0, 0.5, 0.5, 0.9, '#e9eef7') + cyl(1.95, 8.35, 0.9, 0.2, 0.45, '#8fd3ff')}</g>`);

  // Plants
  add(1, plant(11.4, 0.8, 1.5));
  add(19.7, `<g class="opt">${plant(11.3, 8.4, 1.3)}</g>`);
  add(14.8, plant(6.3, 8.5, 1.1));

  // Desks and typists
  const keyP = (dx, dy) => [dx + 1.1, dy + 1.55, 0.55];

  // Rina - desk 1
  add(2.3 + 1.1 + 0.6, desk(1.2, 1.1, 1, 'Rina', 'Laporan keuangan', { paper: 1 }));
  add(2.3 + 3.2, chair(2.3, 2.65));
  const r0 = keyP(1.2, 1.1);

  add(5.1, person({
    x: 2.3, y: 2.65, z: 0.55, sit: 1,
    hair: '#3a2a24', hairStyle: 'bob', shirt: '#2fa7a0', body: 'jacket',
    role: 'finance', activity: 'typing', accessory: 'glasses', expression: 'focused',
    tip: 'Rina – Akuntan|Mengetik laporan bulanan',
    extra: say('rina', 14, -54),
    arms: (sy, k) => {
      const a = L([2.3, 2.65, 0.55], [2.05, 1.7, 0.95]);
      const b = L([2.3, 2.65, 0.55], [2.55, 1.7, 0.95]);
      return armTo(-7, sy, ...a, '#2fa7a0', 'typ', 0, k) + armTo(7, sy, ...b, '#2fa7a0', 'typ b', 0, k);
    },
  }));

  // Eko - desk 2 (walking)
  add(1.2 + 1.1 + 4.4 + 0.6, desk(1.2, 4.4, 2, 'Eko', 'sedang berkeliling', { mug: '#4a5fc1' }));
  add(2.3 + 6.05, chair(2.2, 6.1, '#f2b84b'));

  // Dimas - desk 3
  add(4.7 + 1.1 + 1.7, `<g class="opt">${desk(4.7, 1.1, 3, 'Dimas', 'Mockup aplikasi', { mug: '#f2b84b', paper: 1 })}</g>`);
  add(5.8 + 3.85, `<g class="opt">${chair(5.8, 2.65, '#f26a5b')}</g>`);

  add(9.7, `<g class="opt">${person({
    x: 5.8, y: 2.65, z: 0.55, sit: 1,
    hair: '#1f1b2e', hairStyle: 'spiky', skin: '#d9a273', shirt: '#8a63d2', body: 'hoodie',
    role: 'design', activity: 'typing', accessory: 'headset', expression: 'happy', hd: 1,
    tip: 'Dimas – Desainer|Menyusun mockup',
    extra: say('dimas', 14, -54),
    arms: (sy, k) =>
      armTo(-7, sy, ...L([5.8, 2.65, 0.55], [5.55, 1.7, 0.95]), '#8a63d2', 'typ', 0, k) +
      armTo(7, sy, ...L([5.8, 2.65, 0.55], [6.05, 1.7, 0.95]), '#8a63d2', 'typ b', 0, k),
  })}</g>`);

  return s + generateMeetingArea(O) + generateLounge(O) + generateCat(O) + generateStandingChars(O) + generateWalker(O, s);
}

function generateMeetingArea(O) {
  const C = [9.4, 4.1];
  const ch = (a) => [C[0] + 1.9 * Math.cos(a * Math.PI / 180), C[1] + 1.9 * Math.sin(a * Math.PI / 180)];

  [160, 205, 250, 330, 20, 90].forEach(a => {
    const [x, y] = ch(a);
    O.push([x + y, cyl(x, y, 0, 0.1, 0.3, '#555') + cyl(x, y, 0.3, 0.38, 0.12, '#f26a5b')]);
  });

  const mi = ch(160);
  O.push([mi[0] + mi[1] + 0.05, person({
    x: mi[0], y: mi[1], z: 0.42, sit: 1,
    hair: '#4a2c2a', hairStyle: 'pony', long: 1, shirt: '#f2b84b', body: 'dress',
    role: 'sales', activity: 'phone', accessory: 'scarf', expression: 'happy', talk: 1,
    tip: 'Mira – Sales|Telepon dengan klien',
    arms: (sy, k) =>
       armTo(8, sy, 14, sy + 6, '#f2b84b', '', 0, k) +
       armTo(14, sy + 6, 9, -31, '#f2b84b', 'phone', 0, k) +
      armTo(-8, sy, ...L([mi[0], mi[1], 0.42], [8.95, 4.35, 0.88]), '#f2b84b', '', 0, k),
    extra: `<rect x="8" y="-38" width="4" height="9" rx="1.3" fill="#222"/>` + say('mira', 22, -54),
  })]);

  O.push([13.5, `<g class="hov" data-tip="Ruang Meeting|Sinkron mingguan dengan klien">${cyl(9.4, 4.1, 0, 0.7, 0.05, '#4a3a2e') + cyl(9.4, 4.1, 0.05, 0.32, 0.73, '#6b4f3a') + cyl(9.4, 4.1, 0.78, 1.3, 0.08, '#ecbf86', '#b9824f') + box(8.4, 3.8, 0.86, 0.6, 0.7, 0.04, '#c9ccd6') + box(8.35, 3.8, 0.86, 0.05, 0.7, 0.42, '#262b40', { r: '#58b9ff' }) + box(9.6, 4.4, 0.86, 0.5, 0.4, 0.02, '#fff') + cyl(10.2, 3.6, 0.86, 0.1, 0.16, '#2fa7a0') + cyl(9.9, 4.2, 0.86, 0.07, 0.1, '#d9674c')}</g>`]);

  return '';
}

function generateLounge(O) {
  O.push([17.2, `<g class="opt hov" data-tip="Area Santai|Istirahat 5 menit">${box(8.8, 7.6, 0, 2.4, 0.95, 0.45, '#4a5fc1') + box(8.8, 7.6, 0.45, 2.4, 0.3, 0.6, '#3c4faa') + box(8.75, 7.6, 0.45, 0.2, 0.95, 0.3, '#3c4faa') + box(11.05, 7.6, 0.45, 0.2, 0.95, 0.3, '#3c4faa') + box(9.1, 7.95, 0.45, 0.6, 0.5, 0.12, '#f2b84b') + cyl(10, 8.55, 0, 0.36, 0.4, '#e2ac72')}</g>`]);
  return '';
}

function generateCat(O) {
  const [cx, cy] = P(3.1, 3.9);
  O.push([7.0, `<g class="hov" data-tip="Mochi|Kucing kantor, lagi tidur siang" transform="translate(${cx},${cy})"><ellipse cy="-1" rx="13" ry="4" fill="#000" opacity=".15"/><g class="breath"><ellipse cy="-5" rx="11" ry="6" fill="#f2b84b"/><circle cx="-9" cy="-7" r="5.5" fill="#f2b84b"/><path d="M-13 -11l1 -5 3 3zM-8 -12l3 -4 1 5z" fill="#f2b84b"/><path d="M4 -8q8 -2 9 3" stroke="#e29a2a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-12 -7q2 1.5 4 0" stroke="#5a3b1a" fill="none"/></g><text class="emo" x="-4" y="-18" font-size="9" fill="#fff" font-weight="800">z</text></g>`]);
  return '';
}

function generateStandingChars(O) {
  // Arif - writing on board
  O.push([9.5, person({
    x: 8.9, y: 0.55, sit: 0, back: 1,
    hair: '#2a2236', hairStyle: 'cap', shirt: '#4a5fc1', body: 'vest', pants: '#2f3558',
    role: 'lead', activity: 'writing', accessory: 'badge', expression: 'focused',
    tip: 'Arif – Project Lead|Menulis rencana sprint di papan',
    extra: say('arif', 10, -62),
    arms: (sy, k) => {
      const t = L([8.9, 0.55, 0], [9.25, 0, 1.95]);
      return armTo(8, sy, ...t, '#4a5fc1', 'wri', 0, k) + armTo(-9, sy, -10, sy + 15, '#4a5fc1', '', 0, k);
    },
  })]);

  // Bayu - talking
  O.push([12.1, person({
    x: 5.4, y: 6.1, sit: 0,
    hair: '#2a2236', hairStyle: 'undercut', skin: '#d9a273', shirt: '#f26a5b', body: 'jacket',
    role: 'product', activity: 'talking', accessory: 'visor', expression: 'happy', talk: 1, hd: 0.4,
    tip: 'Bayu – Product|Berdiskusi soal jadwal rilis',
    arms: (sy, k) =>
      armTo(9, sy, 17, sy + 9, '#f26a5b', 'talk', 0, k) +
      armTo(-9, sy, -6, sy + 11, '#f26a5b', '', 0, k) +
      `<rect x="-10" y="${sy + 9}" width="8" height="10" rx="1.5" fill="#d9e2f5" stroke="#8aa0c8"/>`,
    extra: say('bayu', -6, -62),
  })]);

  // Sinta - talking
  O.push([12.9, person({
    x: 6.7, y: 6.4, sit: 0,
    hair: '#5a3425', hairStyle: 'curls', long: 1, shirt: '#8a63d2', body: 'dress',
    role: 'marketing', activity: 'talking', accessory: 'earring', pants: '#2f3558', talk: 1, hd: 1.1,
    cls: 'opt',
    tip: 'Sinta – Marketing|Berdiskusi soal kampanye',
    arms: (sy, k) =>
      armTo(-9, sy, -17, sy + 9, '#8a63d2', 'talk', 0.55, k) +
      armTo(9, sy, 8, sy + 13, '#8a63d2', '', 0, k),
    extra: say('sinta', 10, -62),
  })]);

  return '';
}

function generateWalker(O, s) {
  s += `<g id="objs">${O.sort((a, b) => a[0] - b[0]).map(o => o[1]).join('')}</g>`;
  s += `<g id="par"></g>`;

  s += person({
    id: 'walker',
    cls: 'opt',
    xy: [0, 0],
    both: 1,
    hair: '#2a2236', hairStyle: 'side', skin: '#c68f64', shirt: '#2f9a92', body: 'hoodie',
    role: 'admin', activity: 'walking', accessory: 'badge', expression: 'happy', pants: '#3b4468',
    tip: 'Eko – Admin|Mengantar dokumen antar meja',
    extra: say('eko', 10, -62),
    arms: (sy, k) =>
      armTo(-9, sy, -10, sy + 15, '#2f9a92', 's1', 0, k) +
      armTo(9, sy, 10, sy + 15, '#2f9a92', 's2', 0, k) +
      `<rect x="9" y="${sy + 10}" width="8" height="10" rx="1.5" fill="#fff" stroke="#c9c3e8"/>`,
  });

  return s;
}
