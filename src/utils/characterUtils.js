// Character rendering utilities
import { P, S, armTo, say } from './svgUtils';

// Head with front/back views
export function head(k, h, o) {
  const lg = o.long ? `<rect x="-8.6" y="-5" width="17.2" height="17" rx="7" fill="${h}"/>` : '';
  const fr = `${lg}<circle r="7.6" fill="${k}"/><path d="M-8 0A8 8 0 0 1 8 0Q3 -4.5 -2 -5.5Q-6 -4 -8 0Z" fill="${h}"/><circle cx="-2.7" cy="1.2" r="1.05" fill="#2b2233"/><circle cx="2.7" cy="1.2" r="1.05" fill="#2b2233"/><ellipse class="${o.talk ? 'mouth' : ''}" cy="4.5" rx="1.8" ry=".9" fill="#b4504a"/>`;
  const bk = `${lg}<circle r="7.6" fill="${k}"/><circle cy="-.8" r="8" fill="${h}"/>`;
  return o.both ? `<g class="fr">${fr}</g><g class="bk">${bk}</g>` : (o.back ? bk : fr);
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

  let g = `<ellipse cy="${cy}" rx="11" ry="5" fill="#000" opacity=".16"/><ellipse class="ring" cy="${cy}" rx="15" ry="7.5"/>`;

  g += sit
    ? `<rect x="-8" y="-8" width="16" height="9" rx="3.5" fill="${p}"/><rect x="-7" y="0" width="5" height="9" rx="2" fill="${p}"/><rect x="2" y="0" width="5" height="9" rx="2" fill="${p}"/>`
    : `<rect class="leg a" x="-6" y="-18" width="5" height="18" rx="2.2" fill="${p}"/><rect class="leg b" x="1" y="-18" width="5" height="18" rx="2.2" fill="${p}"/>`;

  g += `<rect x="-8.5" y="${tb - 19}" width="17" height="21" rx="7" fill="${o.shirt}"/>`
    + o.arms(sy, k);

  g += `<g transform="translate(0,${tb - 26})"><g class="head" style="animation-delay:${o.hd || 0}s">${head(k, o.hair, o)}</g></g>`
    + (o.extra || '');

  return `<g ${o.id ? `id="${o.id}"` : ''} class="char hov ${o.cls || ''}" data-tip="${o.tip}" transform="translate(${X.toFixed(1)},${Y.toFixed(1)})"><g transform="scale(${S})"><g class="ppl">${g}</g></g></g>`;
}

// Bubble (speech indicator)
export function bubble(x, y, d = 0) {
  return `<g transform="translate(${x},${y})"><g class="bub" style="animation-delay:${d}s"><rect x="-11" y="-8" width="22" height="14" rx="7" fill="#fff" stroke="#d6d0f0"/><path d="M-3 6l-2 4 6-4z" fill="#fff"/>${[-5, 0, 5].map((v, i) => `<circle class="dot" cx="${v}" cy="-1" r="1.7" fill="#7a6fd0" style="animation-delay:${i * 0.2 + d}s"/>`).join('')}</g></g>`;
}
