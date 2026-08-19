import { icon } from './icons.js';
import {
  CATEGORIES,
  acceptAll,
  getConsent,
  hasDecision,
  initGoogleConsentMode,
  rejectAll,
  setConsent,
} from '../utils/consent.js';

/**
 * Banner de consentimiento + panel de preferencias.
 *
 * Se monta UNA sola vez sobre <body>, fuera de #app, para que sobreviva a los
 * cambios de vista del router. No forma parte del HTML prerenderizado, así que
 * no afecta al contenido que indexan los buscadores ni al LCP.
 *
 * Criterios aplicados (AEPD / art. 22.2 LSSI-CE y RGPD):
 *  - No se carga nada de analítica ni publicidad antes de la decisión.
 *  - «Rechazar» tiene el mismo tamaño y jerarquía visual que «Aceptar».
 *  - Las casillas opcionales están desmarcadas por defecto.
 *  - La decisión se puede cambiar o retirar en cualquier momento desde el pie.
 */

const SETTINGS_SELECTOR = '[data-cookie-settings]';

function bannerHtml() {
  return `
  <div id="cookie-banner" role="region" aria-label="Consentimiento de cookies"
       class="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6">
    <div class="pointer-events-auto mx-auto max-w-3xl animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-pop sm:p-6">
      <div class="flex items-start gap-3.5">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          ${icon('lock', { class: 'h-5 w-5' })}
        </span>
        <div class="min-w-0">
          <h2 class="text-base font-semibold">Cookies en UtiliFast</h2>
          <p class="mt-1.5 text-sm leading-6 text-content-muted">
            Usamos cookies propias necesarias para que el sitio funcione y, solo si lo autorizas, de
            terceros para medir el uso y mostrar publicidad. <strong class="font-semibold text-content">Los
            datos que introduces en las calculadoras nunca salen de tu navegador</strong>, decidas lo que decidas.
            Más detalle en la <a class="font-medium text-accent underline underline-offset-2" href="/legal#cookies" data-link>política de cookies</a>.
          </p>
        </div>
      </div>

      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="btn-ghost sm:mr-auto" data-consent="settings">
          ${icon('layers', { class: 'h-4 w-4' })} Configurar
        </button>
        <button type="button" class="btn-secondary sm:min-w-[9.5rem]" data-consent="reject">Rechazar todas</button>
        <button type="button" class="btn-primary sm:min-w-[9.5rem]" data-consent="accept">Aceptar todas</button>
      </div>
    </div>
  </div>`;
}

function switchRow(cat, checked) {
  return `
  <div class="flex items-start justify-between gap-4 border-b border-line py-4 last:border-0">
    <div class="min-w-0">
      <p class="flex items-center gap-2 text-sm font-semibold text-content">
        ${cat.label}
        ${cat.required ? '<span class="badge-positive">Siempre activas</span>' : ''}
      </p>
      <p class="mt-1 text-sm leading-6 text-content-muted">${cat.text}</p>
    </div>
    <button type="button" role="switch" class="switch mt-1 shrink-0"
            data-cat="${cat.id}"
            aria-checked="${cat.required || checked ? 'true' : 'false'}"
            aria-label="${cat.label}"
            ${cat.required ? 'disabled' : ''}>
      <span class="switch-thumb"></span>
    </button>
  </div>`;
}

function dialogHtml() {
  const saved = getConsent();
  return `
  <dialog id="cookie-settings" class="cookie-dialog" aria-labelledby="cookie-settings-title">
    <form method="dialog" class="contents">
      <div class="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div>
          <h2 id="cookie-settings-title" class="text-lg">Preferencias de cookies</h2>
          <p class="mt-1 text-sm text-content-muted">Elige qué categorías autorizas. Puedes cambiarlo cuando quieras.</p>
        </div>
        <button type="button" class="btn-icon shrink-0" data-consent="close" aria-label="Cerrar">
          ${icon('close', { class: 'h-[1.05rem] w-[1.05rem]' })}
        </button>
      </div>

      <div class="max-h-[50vh] overflow-y-auto px-5 sm:px-6">
        ${CATEGORIES.map((c) => switchRow(c, saved?.[c.id])).join('')}
      </div>

      <div class="flex flex-col gap-2 border-t border-line bg-surface-muted p-5 sm:flex-row sm:justify-end sm:p-6">
        <button type="button" class="btn-ghost sm:mr-auto" data-consent="reject">Rechazar todas</button>
        <button type="button" class="btn-secondary" data-consent="accept">Aceptar todas</button>
        <button type="button" class="btn-primary" data-consent="save">Guardar preferencias</button>
      </div>
    </form>
  </dialog>`;
}

export function mountCookieBanner() {
  // Señales por defecto (todo denegado) antes de que exista cualquier etiqueta de Google.
  initGoogleConsentMode();

  const host = document.createElement('div');
  host.id = 'cookie-consent-root';
  host.innerHTML = dialogHtml() + (hasDecision() ? '' : bannerHtml());
  document.body.appendChild(host);

  const dialog = host.querySelector('#cookie-settings');
  let lastFocused = null;

  const banner = () => host.querySelector('#cookie-banner');

  function hideBanner() {
    banner()?.remove();
  }

  function openSettings() {
    lastFocused = document.activeElement;
    // Refleja el estado guardado cada vez que se abre.
    const saved = getConsent();
    dialog.querySelectorAll('[data-cat]').forEach((sw) => {
      if (sw.disabled) return;
      sw.setAttribute('aria-checked', String(Boolean(saved?.[sw.dataset.cat])));
    });
    // showModal aporta trampa de foco, Escape y ::backdrop nativos.
    dialog.showModal();
  }

  function closeSettings() {
    if (dialog.open) dialog.close();
  }

  function readSwitches() {
    const prefs = {};
    dialog.querySelectorAll('[data-cat]').forEach((sw) => {
      prefs[sw.dataset.cat] = sw.getAttribute('aria-checked') === 'true';
    });
    return prefs;
  }

  // Alternar los interruptores
  host.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-cat]');
    if (!sw || sw.disabled) return;
    sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'));
  });

  // Acciones
  host.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-consent]');
    if (!btn) return;
    switch (btn.dataset.consent) {
      case 'accept':
        acceptAll();
        closeSettings();
        hideBanner();
        break;
      case 'reject':
        rejectAll();
        closeSettings();
        hideBanner();
        break;
      case 'save':
        setConsent(readSwitches());
        closeSettings();
        hideBanner();
        break;
      case 'settings':
        openSettings();
        break;
      case 'close':
        closeSettings();
        break;
    }
  });

  // Devolver el foco al elemento que abrió el panel
  dialog.addEventListener('close', () => {
    lastFocused?.focus?.();
    lastFocused = null;
  });

  // Cerrar al pulsar sobre el fondo oscurecido
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeSettings();
  });

  // Enlace «Configurar cookies» del pie: delegado, porque el pie se vuelve a
  // renderizar en cada cambio de vista.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(SETTINGS_SELECTOR);
    if (!trigger) return;
    e.preventDefault();
    openSettings();
  });
}
