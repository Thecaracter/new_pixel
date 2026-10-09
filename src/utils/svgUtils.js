// SVG coordinate and rendering utilities

export const W = 40, H = 34, OX = 450, OY = 170, S = 1.25;

// Isometric projection point
export const P = (x, y, z = 0) => [OX + (x - y) * W, OY + (x + y) * W / 2 - z * H];

// Convert points array to SVG polygon points string
export const pts = (a) => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

// Create polygon element
export const poly = (a, f, x = '') => `<polygon points="${pts(a)}" fill="${f}" ${x}/>`;

// Shade hex color by factor
export function sh(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, n >> 8 & 255, n & 255]
    .map(v => Math.round(v * f).toString(16).padStart(2, '0'))
    .join('');
}

// 3D box (isometric)
export function box(x, y, z, w, d, h, c, o = {}) {
  const t = o.t || c;
  const l = o.l || sh(c, 0.84);
  const r = o.r || sh(c, 0.68);
  return poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], t)
    + poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], l)
    + poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], r);
}

// Cylinder (isometric)
export function cyl(x, y, z, r, h, top, side) {
  const rx = 56.57 * r, ry = 28.28 * r;
  const [bx, by] = P(x, y, z);
  const [, ty] = P(x, y, z + h);
  side = side || sh(top, 0.75);
  return `<path d="M${bx - rx},${ty}L${bx - rx},${by}A${rx},${ry} 0 0 0 ${bx + rx},${by}L${bx + rx},${ty}Z" fill="${side}"/><ellipse cx="${bx}" cy="${ty}" rx="${rx}" ry="${ry}" fill="${top}"/>`;
}

// Wall segments
export const wl = (a, b, z0, z1, f, x = '') => poly([P(0, a, z0), P(0, b, z0), P(0, b, z1), P(0, a, z1)], f, x);
export const wr = (a, b, z0, z1, f, x = '') => poly([P(a, 0, z0), P(b, 0, z0), P(b, 0, z1), P(a, 0, z1)], f, x);
export const fq = (x0, x1, z0, z1, y, f, x = '') => poly([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)], f, x);
export const pl = (xp, ya, yb, z0, z1, f) => poly([P(xp, ya, z0), P(xp, yb, z0), P(xp, yb, z1), P(xp, ya, z1)], f);

// Ellipse
export const ell = (x, y, r, f, o = 1) => {
  const [a, b] = P(x, y);
  return `<ellipse cx="${a}" cy="${b}" rx="${56.57 * r}" ry="${28.28 * r}" fill="${f}" opacity="${o}"/>`;
};

// Distance between two isometric points
export const L = (o, t) => {
  const a = P(...o);
  const b = P(...t);
  return [(b[0] - a[0]) / S, (b[1] - a[1]) / S];
};

// Window panes
export function win(q, a, b) {
  const w = b - a;
  let s = q(a - 0.12, b + 0.12, 1.1, 3.55, '#fbf5e8') + q(a, b, 1.2, 3.45, 'url(#sky)');
  s += q(a + w * 0.05, a + w * 0.3, 1.2, 2.2, '#9bbbe3')
    + q(a + w * 0.35, a + w * 0.6, 1.2, 2.8, '#86a9d6')
    + q(a + w * 0.65, a + w * 0.95, 1.2, 2.05, '#a6c4e8');
  return s + q((a + b) / 2 - 0.03, (a + b) / 2 + 0.03, 1.2, 3.45, '#fbf5e8')
    + q(a, b, 2.3, 2.36, '#fbf5e8');
}

// Plant
export function plant(x, y, k) {
  const [bx, by] = P(x, y, 0.38 * k);
  const g = ['#3fae6a', '#2f9a5a', '#58c47d'];
  let l = '';
  [-55, -28, 0, 28, 55].forEach((a, i) => {
    l += `<path d="M0 0Q-9 -18 0 -${34 * k}Q9 -18 0 0Z" transform="rotate(${a}) scale(${0.9 + (i % 2) * 0.15})" fill="${g[i % 3]}"/>`;
  });
  return cyl(x, y, 0, 0.26 * k, 0.38 * k, '#d9674c')
    + `<g transform="translate(${bx},${by})"><g class="sway">${l}</g></g>`;
}

// Chair
export function chair(cx, cy, c = '#2fa7a0') {
  return cyl(cx, cy, 0, 0.12, 0.34, '#555')
    + cyl(cx, cy, 0.34, 0.36, 0.12, c)
    + box(cx - 0.28, cy + 0.28, 0.46, 0.56, 0.09, 0.55, c);
}

// Desk with monitor and items
export function desk(x, y, n, who, task, o = {}) {
  let s = box(x + 0.05, y + 0.08, 0, 0.12, 1.04, 0.78, '#a8703f')
    + box(x + 2.03, y + 0.08, 0, 0.12, 1.04, 0.78, '#a8703f')
    + box(x, y, 0.78, 2.2, 1.2, 0.12, '#e2ac72', { l: '#c98f5a', r: '#a97445' });

  const mx = x + 0.65, my = y + 0.22;
  s += box(mx + 0.3, my + 0.02, 0.9, 0.35, 0.15, 0.06, '#444')
    + box(mx, my, 0.96, 0.95, 0.08, 0.55, '#262b40');
  s += fq(mx + 0.07, mx + 0.88, 1.0, 1.46, my + 0.08, '#58b9ff');

  [0, 1, 2].forEach(i => s += fq(mx + 0.14, mx + 0.3 + 0.38 * ((i * 5) % 3 + 1) * 0.6, 1.34 - i * 0.11, 1.38 - i * 0.11, my + 0.08, '#fff', `class="ln" opacity=".7" style="animation-delay:${i * 0.5}s"`));

  s += box(x + 0.7, y + 0.55, 0.9, 0.8, 0.28, 0.035, '#f3f1ee')
    + box(x + 1.65, y + 0.65, 0.9, 0.14, 0.2, 0.03, '#ddd')
    + cyl(x + 0.35, y + 0.5, 0.9, 0.1, 0.16, o.mug || '#f26a5b')
    + steam(x + 0.35, y + 0.5);

  if (o.paper) s += box(x + 1.6, y + 0.12, 0.9, 0.4, 0.5, 0.02, '#fff');

  return `<g class="hov" data-tip="Meja 0${n}|${who} – ${task}">${s}</g>`;
}

// Steam effect
export const steam = (x, y) => {
  const [a, b] = P(x, y, 1.1);
  return `<path class="steam" d="M${a},${b}q-4 -6 0 -11t0 -11" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
};

// Arm reaching from point to point
export function armTo(sx, sy, tx, ty, c, cls = '', d = 0, hand = '#f2c9a0') {
  const dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy);
  const a = Math.atan2(-dx, dy) * 180 / Math.PI;
  return `<g transform="translate(${sx},${sy}) rotate(${a.toFixed(1)})"><g class="arm ${cls}" style="animation-delay:${d}s"><rect x="-2.3" width="4.6" height="${len.toFixed(1)}" rx="2.3" fill="${c}"/><circle cy="${len.toFixed(1)}" r="2.8" fill="${hand}"/></g></g>`;
}

// Speech bubble
export const say = (id, x, y) => `<g transform="translate(${x},${y})"><g class="say" data-say="${id}"><rect fill="#fff" stroke="#d6d0f0"/><path class="tail" fill="#fff"/><text font-size="8.5" font-weight="800" fill="#2b2750" text-anchor="middle" y="3"></text></g></g>`;

// Emoji animation
export const emo = (x, y, ch, d) => `<text class="emo" x="${x}" y="${y}" font-size="11" text-anchor="middle" style="animation-delay:${d}s">${ch}</text>`;

// Hanging arms (generic)
export const hang = (sy, c, k, cls1 = '', cls2 = '') =>
  armTo(-9, sy, -10, sy + 15, c, cls1, 0, k) + armTo(9, sy, 10, sy + 15, c, cls2, 0, k);
