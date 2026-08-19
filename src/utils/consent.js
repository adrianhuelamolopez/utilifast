/**
 * Estado del consentimiento de cookies.
 *
 * Se guarda en localStorage (almacenamiento técnico, exento de consentimiento según
 * el art. 22.2 LSSI-CE por ser imprescindible para recordar la propia elección).
 *
 * Regla de oro: mientras `getConsent()` devuelva null o la categoría esté a false,
 * NO se puede cargar ningún script de analítica ni de publicidad.
 */
const KEY = 'utilifast:consent';

// Súbela si cambian las finalidades o los proveedores: invalida los consentimientos
// anteriores y vuelve a mostrar el banner, como exige la renovación del consentimiento.
export const CONSENT_VERSION = 1;

/** Categorías configurables. Las necesarias no se pueden desactivar. */
export const CATEGORIES = [
  {
    id: 'necesarias',
    label: 'Estrictamente necesarias',
    required: true,
    text: 'Permiten el funcionamiento básico del sitio y recuerdan tu elección sobre cookies y sobre el tema claro u oscuro. No se pueden desactivar.',
  },
  {
    id: 'analiticas',
    label: 'Analíticas',
    required: false,
    text: 'Nos ayudan a saber qué herramientas se usan más, de forma agregada. Nunca incluyen los datos que introduces en las calculadoras.',
  },
  {
    id: 'publicitarias',
    label: 'Publicitarias',
    required: false,
    text: 'Permiten mostrar anuncios y medir su rendimiento. Sin ellas seguirás viendo publicidad, pero no personalizada.',
  },
];

const OPTIONAL = CATEGORIES.filter((c) => !c.required).map((c) => c.id);

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

/** Devuelve la decisión guardada, o null si no hay ninguna válida para esta versión. */
export function getConsent() {
  const saved = read();
  if (!saved || saved.version !== CONSENT_VERSION) return null;
  return saved;
}

export function hasDecision() {
  return getConsent() !== null;
}

/** ¿Está concedida una categoría concreta? Las necesarias siempre lo están. */
export function isAllowed(category) {
  if (category === 'necesarias') return true;
  return Boolean(getConsent()?.[category]);
}

/**
 * Guarda la decisión y avisa al resto de la aplicación.
 * @param {Record<string, boolean>} prefs por ejemplo { analiticas: true, publicitarias: false }
 */
export function setConsent(prefs) {
  const value = {
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
    ...Object.fromEntries(OPTIONAL.map((id) => [id, Boolean(prefs[id])])),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* modo privado: la decisión vale para esta sesión */
  }
  syncGoogleConsentMode(value);
  window.dispatchEvent(new CustomEvent('utilifast:consent', { detail: value }));
  return value;
}

export const acceptAll = () => setConsent(Object.fromEntries(OPTIONAL.map((id) => [id, true])));
export const rejectAll = () => setConsent(Object.fromEntries(OPTIONAL.map((id) => [id, false])));

/** Borra la decisión: el banner volverá a aparecer. Útil para pruebas. */
export function resetConsent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada que borrar */
  }
}

/** Suscripción a los cambios. Devuelve la función para cancelarla. */
export function onConsentChange(handler) {
  const fn = (e) => handler(e.detail);
  window.addEventListener('utilifast:consent', fn);
  return () => window.removeEventListener('utilifast:consent', fn);
}

/* ------------------------------------------------------------------ *
 * Google Consent Mode v2
 *
 * Si algún día añades Google Analytics o AdSense, estas señales les dicen
 * qué pueden y qué no pueden hacer. Son inocuas mientras no exista gtag.
 * ------------------------------------------------------------------ */
function gtag(...args) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Estado por defecto: todo denegado hasta que el usuario decida. */
export function initGoogleConsentMode() {
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  });
  const saved = getConsent();
  if (saved) syncGoogleConsentMode(saved);
}

function syncGoogleConsentMode(value) {
  const ads = value.publicitarias ? 'granted' : 'denied';
  gtag('consent', 'update', {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: value.analiticas ? 'granted' : 'denied',
  });
}
