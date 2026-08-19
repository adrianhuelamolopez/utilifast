const eur = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = (min = 0, max = 2) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: min, maximumFractionDigits: max });

export const money = (v) => eur.format(Number.isFinite(v) ? v : 0);
export const decimal = (v, d = 2) => num(d, d).format(Number.isFinite(v) ? v : 0);
export const integer = (v) => num(0, 0).format(Number.isFinite(v) ? Math.round(v) : 0);

/** Lee un input numérico aceptando coma decimal (teclado español). */
export function readNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
  if (normalized === '') return fallback;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Minúsculas y sin acentos, para buscar.
 * En español mucha gente teclea «interes» o «calorias» sin tilde: sin esto,
 * el buscador del directorio no encontraría nada.
 */
export function normalizar(texto = '') {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
