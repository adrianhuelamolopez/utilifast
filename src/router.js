import { resolve } from './routes.js';
import { shell, mountChrome } from './components/layout.js';
import { applyMeta } from './seo.js';
import { watchSystemTheme } from './utils/theme.js';
import { refrescarAnuncios } from './utils/publicidad.js';

let appEl = null;
let unmountView = null;
let unmountChrome = null;
let currentPath = null;

// Cada navegación recibe un número. Si al resolverse el import() ya se ha lanzado
// otra, la respuesta tardía se descarta: evita que un chunk lento pise a uno rápido.
let navToken = 0;

// La primera vista puede venir ya pintada por el prerender: en ese caso no se
// vuelve a renderizar, solo se enganchan los eventos.
let primeraCarga = true;

function isInternalLink(a) {
  if (!a) return false;
  if (a.target && a.target !== '_self') return false;
  if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return false;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  return new URL(a.href, location.href).origin === location.origin;
}

function scrollTo(hash) {
  if (hash) {
    const target = document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/**
 * Recuerda si ya se ha recurrido a una recarga completa para una ruta.
 *
 * Sin esta marca, una ruta cuyo módulo nunca llega entraría en bucle de recargas.
 * Con ella se intenta una vez y, si vuelve a fallar, se deja el HTML
 * prerenderizado en pantalla: es el contenido correcto, solo que sin interacción.
 */
const CLAVE_RECARGA = 'utilifast:recarga';
const yaRecargado = (path) => {
  try {
    return sessionStorage.getItem(CLAVE_RECARGA) === path;
  } catch {
    return true; // sin sessionStorage no se puede evitar el bucle: mejor no recargar
  }
};
const marcarRecarga = (path) => {
  try {
    sessionStorage.setItem(CLAVE_RECARGA, path);
  } catch {
    /* modo privado */
  }
};
const olvidarRecarga = () => {
  try {
    sessionStorage.removeItem(CLAVE_RECARGA);
  } catch {
    /* nada que borrar */
  }
};

/** Barra de progreso: solo aparece si la carga llega a notarse (red lenta). */
function progreso(activo) {
  document.documentElement.classList.toggle('cargando', activo);
}

async function renderRoute({ hash = '', restoreScroll = false } = {}) {
  const token = ++navToken;
  const route = resolve(location.pathname);
  const { meta } = route;

  const avisoLento = setTimeout(() => {
    if (token === navToken) progreso(true);
  }, 150);

  let view;
  try {
    view = await route.load();
  } catch (error) {
    clearTimeout(avisoLento);
    progreso(false);
    // Nunca dejar al usuario con la URL cambiada y el contenido anterior: eso
    // parece una web rota. Si el módulo no llega —red caída, bloqueador de
    // anuncios, chunk obsoleto tras un despliegue— se recurre a una navegación
    // normal del navegador, que sí funciona porque cada ruta existe como HTML
    // prerenderizado. El usuario pierde la interactividad, no la página.
    console.error('[router] no se pudo cargar la vista de', location.pathname, error);
    if (token === navToken && !yaRecargado(location.pathname)) {
      marcarRecarga(location.pathname);
      location.assign(location.href);
    }
    return;
  }
  clearTimeout(avisoLento);

  // Una navegación posterior ya ha tomado el control.
  if (token !== navToken) return;
  progreso(false);
  olvidarRecarga();

  if (typeof unmountView === 'function') unmountView();
  if (typeof unmountChrome === 'function') unmountChrome();
  unmountView = null;
  unmountChrome = null;

  applyMeta(meta);

  // ¿El HTML que ya hay en la página es justo el de esta ruta? Entonces se
  // aprovecha: cero reescritura del DOM y cero reflow en la primera pintura.
  const yaPintado = document.querySelector(`#contenido[data-route="${meta.path}"]`);
  if (!(primeraCarga && yaPintado)) {
    appEl.innerHTML = shell(meta, view.render());
  }
  primeraCarga = false;

  unmountChrome = mountChrome(appEl);
  const main = document.getElementById('contenido');
  unmountView = view.mount ? view.mount(main) : null;

  // Los bloques de anuncios de la vista recién montada aún están vacíos.
  refrescarAnuncios(main);

  if (!restoreScroll) scrollTo(hash);

  // Anuncia el cambio de página a los lectores de pantalla.
  const live = document.getElementById('route-announcer');
  if (live) live.textContent = document.title;

  currentPath = location.pathname;
}

export function navigate(url, { replace = false } = {}) {
  const next = new URL(url, location.href);
  if (next.pathname === location.pathname && next.hash) {
    history.pushState({}, '', next.href);
    scrollTo(next.hash);
    return;
  }
  history[replace ? 'replaceState' : 'pushState']({}, '', next.href);
  renderRoute({ hash: next.hash });
}

export function startRouter(root) {
  appEl = root;
  watchSystemTheme();

  const announcer = document.createElement('div');
  announcer.id = 'route-announcer';
  announcer.setAttribute('aria-live', 'polite');
  announcer.className = 'sr-only';
  document.body.appendChild(announcer);

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!isInternalLink(a)) return;
    e.preventDefault();
    navigate(a.href);
  });

  // Precarga al pasar el ratón o al empezar a tocar: cuando llega el clic el chunk
  // suele estar ya descargado y la navegación se percibe instantánea.
  const precargados = new Set();
  const precargar = (e) => {
    const a = e.target.closest?.('a');
    if (!isInternalLink(a)) return;
    const path = new URL(a.href, location.href).pathname;
    if (precargados.has(path)) return;
    precargados.add(path);
    resolve(path)
      .load()
      .catch(() => precargados.delete(path));
  };
  document.addEventListener('pointerenter', precargar, { capture: true });
  document.addEventListener('touchstart', precargar, { capture: true, passive: true });

  window.addEventListener('popstate', () => {
    // Cambio solo de hash dentro de la misma ruta: no hay que volver a renderizar.
    if (location.pathname === currentPath) {
      scrollTo(location.hash);
      return;
    }
    renderRoute({ hash: location.hash, restoreScroll: true });
  });

  renderRoute({ hash: location.hash, restoreScroll: !location.hash });
}
