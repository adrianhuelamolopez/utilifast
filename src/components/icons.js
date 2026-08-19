/**
 * Iconografía en línea (sin librerías ni peticiones externas).
 * Trazo de 1.75 sobre una rejilla de 24, coherente con el resto de la interfaz.
 * Uso: icon('fuel', { class: 'h-5 w-5' })
 */
const PATHS = {
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  fuel:
    '<path d="M3 22h12"/><path d="M4 9h10"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
  route:
    '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  qr:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3z"/><path d="M20.5 14v.01"/><path d="M14.5 20.5v.01"/><path d="M20.5 20.5v.01"/><path d="M17.5 17.5h.01"/>',
  nutrition:
    '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  scale:
    '<path d="m16 16 3-8 3 8a4.5 4.5 0 0 1-6 0Z"/><path d="m2 16 3-8 3 8a4.5 4.5 0 0 1-6 0Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  copy:
    '<rect width="13" height="13" x="9" y="9" rx="2.5"/><path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  sun:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  external:
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  spark: '<path d="m12 3 2.09 5.26L19.5 10.5l-5.41 2.24L12 18l-2.09-5.26L4.5 10.5l5.41-2.24z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  alert:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  phone:
    '<rect width="12" height="20" x="6" y="2" rx="2.5"/><path d="M11 18.5h2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  percent:
    '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  receipt:
    '<path d="M4 2v20l2.5-1.5L9 22l2.5-1.5L14 22l2.5-1.5L19 22V2l-2.5 1.5L14 2l-2.5 1.5L9 2 6.5 3.5z"/><path d="M8 8h8"/><path d="M8 12h5"/>',
  body:
    '<circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v7"/><path d="m8.5 9.5 3.5-1 3.5 1"/><path d="m9.5 21 2.5-7 2.5 7"/>',
  ruler:
    '<path d="M3 9h18v6H3z"/><path d="M7 9v3"/><path d="M11 9v4"/><path d="M15 9v3"/><path d="M19 9v4"/>',
  bank:
    '<path d="M3 21h18"/><path d="M5 21V10"/><path d="M19 21V10"/><path d="M9.5 21v-5.5h5V21"/><path d="m2.5 10 9.5-7 9.5 7z"/>',
  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  split:
    '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  calendar:
    '<rect width="18" height="18" x="3" y="4" rx="2.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  key:
    '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 10.3-10.3"/><path d="m16 7 3 3"/><path d="m19 4 3 3"/>',
  refresh:
    '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
  eye:
    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  tyre:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5"/><path d="M12 15.5V21"/><path d="M3 12h5.5"/><path d="M15.5 12H21"/>',
  dumbbell:
    '<path d="M6.5 6.5v11"/><path d="M17.5 6.5v11"/><path d="M3 9.5v5"/><path d="M21 9.5v5"/><path d="M6.5 12h11"/>',
  trend:
    '<path d="M3 17.5 9.5 11l4 4L21 7.5"/><path d="M15.5 7.5H21v5.5"/>',
  wallet:
    '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M17.5 13h.01"/>',
  offline:
    '<path d="M2 2 22 22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 3.4-2.2"/><path d="M15.6 10.7A10 10 0 0 1 19 12.9"/><path d="M2 8.8a16 16 0 0 1 4.7-2.9"/><path d="M12 5c3 0 5.9 1 8.2 2.8"/><path d="M12 20h.01"/>',
};

const FILLED = new Set(['bolt', 'spark', 'send']);

export function icon(name, { class: className = 'h-5 w-5', strokeWidth = 1.75 } = {}) {
  const body = PATHS[name];
  if (!body) return '';
  const filled = FILLED.has(name);
  return `<svg viewBox="0 0 24 24" class="${className}" aria-hidden="true" focusable="false"
    fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${
      filled ? 0 : strokeWidth
    }" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** Marca completa: cuadro con degradado y rayo. */
export function logoMark(size = 'h-9 w-9') {
  return `
  <span class="relative inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-[0.6rem] bg-accent-gradient text-white shadow-glow">
    ${icon('bolt', { class: 'h-[55%] w-[55%]' })}
  </span>`;
}

export function wordmark() {
  return `<span class="text-[1.0625rem] font-bold tracking-tight text-content">Utili<span class="text-accent">Fast</span></span>`;
}
