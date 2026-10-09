// Character rendering utilities
import { P, S, armTo, say } from './svgUtils';

// Head with front/back views. Profiles keep the cast visually distinct without
// moving the scene's coordinate system or tooltip behavior.
export function head(k, h, o) {
  const face = o.face === 'soft' ? `<rect x="-8.3" y="-7.5" width="16.6" height="16" rx="7" fill="${k}"/>` : `<circle r="8" fill="${k}"/>`;
  const hair = {
    bob: `<path d="M-9 1A9 9 0 0 1 8-1L9 8H5L3 3Q-2 7-7 4L-8 8h-3z" fill="${h}"/>`,
    curls: `<path d="M-9 1A9 9 0 0 1 9 1L7-6Q3-10 0-6Q-4-11-7-5z" fill="${h}"/><circle cx="-9" cy="1" r="3" fill="${h}"/><circle cx="9" cy="1" r="3" fill="${h}"/>`,
    cap: `<path d="M-9-1Q-4-10 5-7Q9-5 9 1H-9z" fill="${h}"/><path d="M-8-2Q0-5 11-2" stroke="#f6c64c" stroke-width="2" fill="none"/>`,
    side: `<path d="M-9 1A9 9 0 0 1 8-2Q3-7-2-6Q-7-5-9 1z" fill="${h}"/><path d="M-8 1Q-11 5-8 9h3V2z" fill="${h}"/>`,
    pony: `<path d="M-9 1A9 9 0 0 1 8-2Q4-7-2-6Q-8-5-9 1z" fill="${h}"/><circle cx="9" cy="-5" r="4" fill="${h}"/>`,
    undercut: `<path d="M-9 0A9 9 0 0 1 8-2Q3-7-3-6Q-7-5-9 0z" fill="${h}"/><path d="M5-5v8" stroke="#2b2233" stroke-width="1.5"/>`,
    spiky: `<path d="M-9 0L-6-8-2-5 1-10 4-5 9-7 8 1Q1-5-9 0z" fill="${h}"/>`,
  }[o.hairStyle || 'side'];
  const eyes = o.expression === 'happy'
    ? `<path d="M-5 1q2-2 4 0M1 1q2-2 4 0" stroke="#2b2233" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    : o.expression === 'focused'
      ? `<path d="M-5 0h3M2 0h3" stroke="#2b2233" stroke-width="1.7" stroke-linecap="round"/>`
      : `<circle cx="-3" cy="1" r="1.25" fill="#2b2233"/><circle cx="3" cy="1" r="1.25" fill="#2b2233"/>`;
  const mouth = o.expression === 'surprised' ? `<circle cy="5" r="1.5" fill="#b4504a"/>` : `<path class="${o.talk ? 'mouth' : ''}" d="M-2 5q2 1.5 4 0" stroke="#b4504a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  const lg = o.long ? `<rect x="-9" y="-5" width="18" height="18" rx="7" fill="${h}"/>` : '';
  const fr = `${lg}${face}${hair}<g class="eyes">${eyes}</g>${mouth}<path d="M-7 5Q-9 6-8 7M7 5Q9 6 8 7" stroke="#e99789" stroke-width="1.2" opacity=".65"/>`;
  const bk = `${lg}<circle r="8" fill="${k}"/><circle cy="-.8" r="8.5" fill="${h}"/>`;
  return o.both ? `<g class="fr">${fr}</g><g class="bk">${bk}</g>` : (o.back ? bk : fr);
}

function body(o, p) {
  if (o.body === 'hoodie') return `<path d="M-10-4Q-9-10-4-11L0-7 4-11Q9-10 10-4L8 4H-8z" fill="${o.shirt}"/><path d="M-4-9Q0-5 4-9" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" fill="none"/>`;
  if (o.body === 'jacket') return `<path d="M-9-6Q-8-11 0-11T9-6L8 4H-8z" fill="${o.shirt}"/><path d="M0-9V4M-4-7l4 3 4-3" stroke="#fff" stroke-opacity=".6" fill="none"/>`;
  if (o.body === 'dress') return `<path d="M-6-10H6L11 5H-11z" fill="${o.shirt}"/><path d="M-4-5H4" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>`;
  if (o.body === 'vest') return `<path d="M-9-6Q-8-11 0-11T9-6L8 4H-8z" fill="${o.shirt}"/><path d="M-6-8L0-3 6-8" stroke="#f8df83" stroke-width="2" fill="none"/>`;
  return `<rect x="-9" y="-10" width="18" height="20" rx="7" fill="${o.shirt}"/><path d="M-7-5H7" stroke="#fff" stroke-opacity=".28" stroke-width="1.5"/>`;
}

function accessory(o) {
  if (o.accessory === 'glasses') return `<path d="M-7 0h4l1 2h4l1-2h4" stroke="#2b2233" stroke-width="1.3" fill="none"/><circle cx="-5" cy="1" r="2.5" fill="none" stroke="#2b2233"/><circle cx="5" cy="1" r="2.5" fill="none" stroke="#2b2233"/>`;
  if (o.accessory === 'headset') return `<path d="M-9 2A9 9 0 0 1 9 2" stroke="#f6c64c" stroke-width="1.8" fill="none"/><rect x="-10" y="1" width="2.5" height="5" rx="1" fill="#f6c64c"/><rect x="7.5" y="1" width="2.5" height="5" rx="1" fill="#f6c64c"/>`;
  if (o.accessory === 'scarf') return `<path d="M-8-4Q0 1 8-4" stroke="#f6c64c" stroke-width="2.5" fill="none"/><path d="M5-3v7" stroke="#f6c64c" stroke-width="2"/>`;
  if (o.accessory === 'visor') return `<path d="M-8-2Q0-5 8-2L7 1H-7z" fill="#58b9ff" stroke="#2b2233" stroke-width="1"/>`;
  if (o.accessory === 'earring') return `<circle cx="8" cy="5" r="1.8" fill="#f6c64c"/><circle cx="-8" cy="5" r="1.2" fill="#f6c64c"/>`;
  if (o.accessory === 'badge') return `<circle cx="5.5" cy="-5" r="2" fill="#f6c64c" stroke="#fff" stroke-width=".7"/>`;
  return '';
}

// Complete person/character
export function person(o) {
  const [X, Y] = o.xy || P(o.x, o.y, o.z || 0);
  const sit = o.sit;
  const tb = sit ? -6 : -17;
  const k = o.skin || '#f2c9a0';
  const p = o.pants || '#3b4468';
  const sy = tb - 15;
  const cy = sit ? 7 : 2;

  const role = o.role || 'team';
  const activity = o.activity || 'idle';
  let g = `<ellipse cy="${cy}" rx="13" ry="5.5" fill="#000" opacity=".2"/><ellipse class="ring" cy="${cy}" rx="17" ry="8.5"/>`;

  g += sit
    ? `<rect x="-8" y="-8" width="16" height="9" rx="3.5" fill="${p}"/><rect x="-7" y="0" width="5" height="9" rx="2" fill="${p}"/><rect x="2" y="0" width="5" height="9" rx="2" fill="${p}"/>`
    : `<rect class="leg a" x="-6" y="-18" width="5" height="18" rx="2.2" fill="${p}"/><rect class="leg b" x="1" y="-18" width="5" height="18" rx="2.2" fill="${p}"/>`;

  g += body(o, p)
    + o.arms(sy, k);

  g += `<g transform="translate(0,${tb - 26})"><g class="head" style="animation-delay:${o.hd || 0}s">${head(k, o.hair, o)}${accessory(o)}</g></g>`
    + (o.extra || '');

  return `<g ${o.id ? `id="${o.id}"` : ''} class="char hov avatar role-${role} activity-${activity} ${activity === 'walking' ? 'walking' : ''} ${o.cls || ''}" data-tip="${o.tip}" transform="translate(${X.toFixed(1)},${Y.toFixed(1)})"><g transform="scale(${S * 1.22})"><g class="ppl">${g}</g></g></g>`;
}

// Bubble (speech indicator)
export function bubble(x, y, d = 0) {
  return `<g transform="translate(${x},${y})"><g class="bub" style="animation-delay:${d}s"><rect x="-11" y="-8" width="22" height="14" rx="7" fill="#fff" stroke="#d6d0f0"/><path d="M-3 6l-2 4 6-4z" fill="#fff"/>${[-5, 0, 5].map((v, i) => `<circle class="dot" cx="${v}" cy="-1" r="1.7" fill="#7a6fd0" style="animation-delay:${i * 0.2 + d}s"/>`).join('')}</g></g>`;
}
