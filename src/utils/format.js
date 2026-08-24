const formateadorMoneda = (currency) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Se cachean porque `update()` repinta en cada tecleo y crear un
// Intl.NumberFormat no es gratis.
const monedas = { EUR: formateadorMoneda('EUR') };

const num = (min = 0, max = 2) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: min, maximumFractionDigits: max });

/**
 * Importe con símbolo de moneda. El euro es el valor por defecto: cambiarlo es
 * elegir **cómo se escribe** la cifra, no convertirla. Aquí no hay ni habrá
 * conversión entre divisas: exigiría pedir una cotización a un servidor y el
 * sitio promete que ningún dato sale del dispositivo.
 */
export const money = (v, currency = 'EUR') => {
  if (!monedas[currency]) monedas[currency] = formateadorMoneda(currency);
  return monedas[currency].format(Number.isFinite(v) ? v : 0);
};

/**
 * Símbolo que `money()` usará para esa divisa, sacado del propio formateador.
 * Escribirlo a mano se desincroniza: en es-ES el dólar se escribe «US$», no «$»,
 * y el total y el coste por kilómetro acababan con símbolos distintos.
 */
export const currencySymbol = (currency = 'EUR') => {
  if (!monedas[currency]) monedas[currency] = formateadorMoneda(currency);
  const parte = monedas[currency].formatToParts(0).find((p) => p.type === 'currency');
  return parte ? parte.value : currency;
};
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
