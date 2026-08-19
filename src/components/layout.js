import { NAV, TOOLS, CLUSTERS } from '../catalog.js';
import { satelitesDe } from '../satelites.js';
import { SITE } from '../config.js';
import { escapeHtml } from '../utils/format.js';
import { icon, logoMark, wordmark } from './icons.js';
import { listeners } from '../utils/dom.js';
import { toggleTheme } from '../utils/theme.js';

/* ------------------------------------------------------------------ *
 * Cabecera
 * ------------------------------------------------------------------ */
function navLink(item, activePath, extra = '') {
  const active = item.path === activePath;
  return `<a href="${item.path}" data-link
    class="relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'text-content' : 'text-content-muted hover:text-content'
    } ${extra}"${active ? ' aria-current="page"' : ''}>
    ${escapeHtml(item.label)}
    ${
      active
        ? '<span class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent-gradient"></span>'
        : ''
    }
  </a>`;
}

/** Desplegable de la cabecera con las diez herramientas agrupadas por tema. */
function menuHerramientas(activePath) {
  const enHerramienta = TOOLS.some((t) => t.path === activePath);
  return `
  <div class="relative" data-dropdown>
    <button type="button" data-dropdown-toggle aria-expanded="false" aria-controls="menu-herramientas"
      class="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
        enHerramienta
          ? 'border-accent/40 bg-accent-soft text-accent'
          : 'border-line bg-surface text-content hover:border-line-strong hover:bg-surface-muted'
      }">
      ${icon('layers', { class: 'h-4 w-4 opacity-70' })}
      Todas las herramientas
      <span class="rounded-md bg-surface-muted px-1.5 py-0.5 text-2xs font-bold tabular-nums text-content-muted">${
        TOOLS.length
      }</span>
      <span class="text-content-subtle transition-transform duration-200" data-dropdown-arrow>
        ${icon('chevronDown', { class: 'h-3.5 w-3.5' })}
      </span>
    </button>

    <div id="menu-herramientas" hidden
      class="absolute left-0 top-full z-50 mt-2 w-[min(30rem,calc(100vw-2rem))] animate-scale-in rounded-2xl border border-line bg-surface p-4 shadow-pop">
      <div class="grid grid-cols-2 gap-x-5 gap-y-4">
        ${CLUSTERS.map(
          (c) => `
          <div>
            <p class="mb-1.5 px-2 text-2xs font-semibold uppercase tracking-wider text-content-subtle">${escapeHtml(
              c.label
            )}</p>
            <ul class="space-y-0.5">
              ${TOOLS.filter((t) => t.cluster === c.id)
                .map(
                  (t) => `
                <li><a href="${t.path}" data-link
                  class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    t.path === activePath
                      ? 'bg-accent-soft font-medium text-accent'
                      : 'text-content-muted hover:bg-surface-muted hover:text-content'
                  }">
                  <span class="shrink-0 text-content-subtle">${icon(t.icon, { class: 'h-4 w-4' })}</span>
                  ${escapeHtml(t.navLabel)}
                </a></li>`
                )
                .join('')}
            </ul>
          </div>`
        ).join('')}
      </div>
      <div class="mt-3 border-t border-line pt-3">
        <a href="/" data-link class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-accent hover:underline">
          Ver el directorio completo · ${TOOLS.length} herramientas
          ${icon('arrowRight', { class: 'h-3.5 w-3.5' })}
        </a>
      </div>
    </div>
  </div>`;
}

function header(activePath) {
  return `
  <div class="hidden border-b border-line bg-surface-muted/60 sm:block">
    <div class="container-x flex h-9 items-center justify-between text-xs text-content-subtle">
      <p class="flex items-center gap-1.5">
        ${icon('lock', { class: 'h-3.5 w-3.5' })}
        Los cálculos se ejecutan en tu navegador: ningún dato sale de este dispositivo.
      </p>
      <a class="link hidden font-medium md:inline" href="/legal" data-link>Privacidad y cookies</a>
    </div>
  </div>

  <header id="site-header"
    class="sticky top-0 z-50 border-b border-transparent bg-canvas/80 backdrop-blur-xl transition-[border-color,box-shadow] duration-300">
    <div class="container-x flex h-16 items-center gap-3">
      <a href="/" data-link class="flex shrink-0 items-center gap-2.5" aria-label="UtiliFast, inicio">
        ${logoMark('h-9 w-9')}
        ${wordmark()}
      </a>

      <nav aria-label="Principal" class="ml-4 hidden flex-1 md:block">
        <ul class="flex items-center gap-1">
          <li>${menuHerramientas(activePath)}</li>
          ${NAV.filter((i) => i.path !== '/')
            .map((item) => `<li>${navLink(item, activePath)}</li>`)
            .join('')}
        </ul>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-icon" data-theme-toggle
                aria-label="Cambiar entre tema claro y oscuro">
          <span class="dark:hidden">${icon('moon', { class: 'h-[1.05rem] w-[1.05rem]' })}</span>
          <span class="hidden dark:block">${icon('sun', { class: 'h-[1.05rem] w-[1.05rem]' })}</span>
        </button>
        <button type="button" class="btn-icon md:hidden" data-menu-toggle
                aria-expanded="false" aria-controls="mobile-nav" aria-label="Abrir menú">
          <span data-menu-open>${icon('menu', { class: 'h-[1.05rem] w-[1.05rem]' })}</span>
          <span data-menu-close hidden>${icon('close', { class: 'h-[1.05rem] w-[1.05rem]' })}</span>
        </button>
      </div>
    </div>

    <nav id="mobile-nav" aria-label="Menú móvil"
         class="hidden border-t border-line bg-surface md:!hidden">
      <div class="container-x max-h-[70vh] overflow-y-auto py-3">
        ${CLUSTERS.map(
          (c) => `
          <div class="mb-3">
            <p class="px-2 pb-1 text-2xs font-semibold uppercase tracking-wider text-content-subtle">${escapeHtml(
              c.label
            )}</p>
            <ul>
              ${TOOLS.filter((t) => t.cluster === c.id)
                .map(
                  (t) => `
                <li><a href="${t.path}" data-link
                  class="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm ${
                    t.path === activePath ? 'bg-accent-soft text-accent' : 'text-content-muted'
                  }">
                  <span class="text-content-subtle">${icon(t.icon, { class: 'h-4 w-4' })}</span>
                  ${escapeHtml(t.navLabel)}
                </a></li>`
                )
                .join('')}
            </ul>
          </div>`
        ).join('')}
        <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-2 pt-3 text-sm">
          <a href="/quienes-somos" data-link class="link">Quiénes somos</a>
          <a href="/legal" data-link class="link">Aviso legal y privacidad</a>
        </div>
      </div>
    </nav>
  </header>`;
}

/* ------------------------------------------------------------------ *
 * Preguntas concretas que responde esta herramienta
 * ------------------------------------------------------------------ */
function preguntas(activePath) {
  const lista = satelitesDe(activePath);
  if (!lista.length) return '';
  return `
  <div class="container-x">
  <section class="mt-16 border-t border-line pt-10" aria-labelledby="preguntas-concretas">
    <h2 id="preguntas-concretas" class="mb-1.5 text-lg">Preguntas que resuelve esta calculadora</h2>
    <p class="mb-5 text-sm text-content-muted">Con la respuesta ya calculada, por si buscas un caso concreto.</p>
    <div class="grid gap-3 sm:grid-cols-2">
      ${lista
        .map(
          (s) => `
        <a href="${s.path}" data-link
           class="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition duration-300 ease-spring hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-float">
          <span class="mt-0.5 shrink-0 text-accent">${icon('spark', { class: 'h-4 w-4' })}</span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-content">${escapeHtml(s.h1)}</span>
            <span class="mt-1 block text-sm leading-6 text-content-muted">${escapeHtml(s.description)}</span>
          </span>
        </a>`
        )
        .join('')}
    </div>
  </section>
  </div>`;
}

/* ------------------------------------------------------------------ *
 * Herramientas relacionadas
 * ------------------------------------------------------------------ */
function relatedTools(activePath) {
  const actual = TOOLS.find((t) => t.path === activePath);
  const resto = TOOLS.filter((t) => t.path !== activePath);
  // Primero las del mismo cluster temático: refuerza la autoridad del sitio
  // sobre ese tema y da al usuario el enlace que realmente le interesa.
  const mismoTema = resto.filter((t) => actual && t.cluster === actual.cluster);
  const otras = resto.filter((t) => !mismoTema.includes(t));
  const others = [...mismoTema, ...otras].slice(0, 4);
  if (!others.length || activePath === '/') return '';
  return `
  <div class="container-x">
  <section class="mt-16 border-t border-line pt-10" aria-labelledby="otras-herramientas">
    <div class="mb-5 flex items-center justify-between gap-4">
      <h2 id="otras-herramientas" class="text-lg">Sigue explorando</h2>
      <a href="/" data-link class="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
        Ver todas ${icon('arrowRight', { class: 'h-4 w-4' })}
      </a>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      ${others
        .map(
          (t) => `
        <a href="${t.path}" data-link
           class="group flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-4 transition duration-300 ease-spring hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            ${icon(t.icon, { class: 'h-5 w-5' })}
          </span>
          <span class="min-w-0">
            <span class="flex items-center gap-1.5 text-sm font-semibold text-content">
              ${escapeHtml(t.card.title)}
              <span class="text-content-subtle transition-transform duration-300 ease-spring group-hover:translate-x-0.5">
                ${icon('arrowRight', { class: 'h-3.5 w-3.5' })}
              </span>
            </span>
            <span class="mt-1 block text-sm leading-6 text-content-muted">${escapeHtml(t.card.blurb)}</span>
          </span>
        </a>`
        )
        .join('')}
    </div>
  </section>
  </div>`;
}

/* ------------------------------------------------------------------ *
 * Pie
 * ------------------------------------------------------------------ */
function footer() {
  const year = new Date().getFullYear();
  const col = (title, links) => `
    <nav aria-label="${escapeHtml(title)}">
      <h2 class="text-2xs font-semibold uppercase tracking-wider text-content-subtle">${escapeHtml(title)}</h2>
      <ul class="mt-3.5 space-y-2.5 text-sm">
        ${links
          .map(
            (l) =>
              `<li><a class="link" href="${l.href}"${l.link ? ' data-link' : ''}${
                l.external ? ' rel="noopener"' : ''
              }>${escapeHtml(l.label)}</a></li>`
          )
          .join('')}
      </ul>
    </nav>`;

  return `
  <footer class="mt-20 border-t border-line bg-surface">
    <div class="container-x py-12">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div class="lg:col-span-1">
          <div class="flex items-center gap-2.5">${logoMark('h-8 w-8')}${wordmark()}</div>
          <p class="mt-3.5 max-w-xs text-sm leading-6 text-content-muted">
            Micro-herramientas que se ejecutan enteras en tu navegador. Sin registro, sin subir datos,
            sin esperas.
          </p>
          <p class="badge-positive mt-4">
            ${icon('shield', { class: 'h-3.5 w-3.5' })} Procesado en local
          </p>
        </div>

        ${col(
          'Herramientas',
          TOOLS.map((t) => ({ href: t.path, label: t.navLabel, link: true }))
        )}
        <nav aria-label="Información">
          <h2 class="text-2xs font-semibold uppercase tracking-wider text-content-subtle">Información</h2>
          <ul class="mt-3.5 space-y-2.5 text-sm">
            <li><a class="link" href="/legal" data-link>Aviso legal</a></li>
            <li><a class="link" href="/legal#privacidad" data-link>Política de privacidad</a></li>
            <li><a class="link" href="/legal#cookies">Política de cookies</a></li>
            <li>
              <button type="button" class="link text-left" data-cookie-settings>Configurar cookies</button>
            </li>
            <li><a class="link" href="mailto:${SITE.email}">Contacto</a></li>
          </ul>
        </nav>

        <div>
          <h2 class="text-2xs font-semibold uppercase tracking-wider text-content-subtle">Cómo funciona</h2>
          <ul class="mt-3.5 space-y-3 text-sm text-content-muted">
            <li class="flex gap-2.5">
              ${icon('offline', { class: 'mt-0.5 h-4 w-4 shrink-0 text-content-subtle' })}
              <span>Sin llamadas al servidor: funciona aunque pierdas la conexión.</span>
            </li>
            <li class="flex gap-2.5">
              ${icon('gauge', { class: 'mt-0.5 h-4 w-4 shrink-0 text-content-subtle' })}
              <span>Resultados en tiempo real mientras escribes.</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-content-subtle sm:flex-row sm:items-center sm:justify-between">
        <p>© ${year} ${escapeHtml(SITE.name)}. Todos los derechos reservados.</p>
        <p class="max-w-xl sm:text-right">
          Herramientas informativas: los resultados son orientativos y no constituyen asesoramiento
          profesional, médico ni financiero.
        </p>
      </div>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------------ *
 * Envoltorio común: lo usan el router y el prerender para el mismo HTML
 * ------------------------------------------------------------------ */
export function shell(meta, viewHtml) {
  return `${header(meta.path)}
  <main id="contenido" data-route="${meta.path}" class="pb-4">
    ${viewHtml}
    ${preguntas(meta.path)}
    ${relatedTools(meta.path)}
  </main>
  ${footer()}`;
}

/** Interacciones del armazón: tema, menú móvil y estado de la cabecera al hacer scroll. */
export function mountChrome(root) {
  const L = listeners();
  const header = root.querySelector('#site-header');
  const menuBtn = root.querySelector('[data-menu-toggle]');
  const menu = root.querySelector('#mobile-nav');

  L.on(root.querySelector('[data-theme-toggle]'), 'click', toggleTheme);

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle('hidden', !open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuBtn.querySelector('[data-menu-open]').hidden = open;
    menuBtn.querySelector('[data-menu-close]').hidden = !open;
  }

  L.on(menuBtn, 'click', () => setMenu(menu.classList.contains('hidden')));
  L.on(menu, 'click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  /* --- Desplegable de herramientas --- */
  const dropBtn = root.querySelector('[data-dropdown-toggle]');
  const dropPanel = root.querySelector('#menu-herramientas');
  const dropArrow = root.querySelector('[data-dropdown-arrow]');

  function setDropdown(abierto) {
    if (!dropPanel || !dropBtn) return;
    dropPanel.hidden = !abierto;
    dropBtn.setAttribute('aria-expanded', String(abierto));
    dropArrow?.classList.toggle('rotate-180', abierto);
  }

  L.on(dropBtn, 'click', (e) => {
    e.stopPropagation();
    setDropdown(dropPanel.hidden);
  });
  // Al elegir una herramienta o pulsar fuera, se cierra.
  L.on(dropPanel, 'click', (e) => {
    if (e.target.closest('a')) setDropdown(false);
  });
  L.on(document, 'click', (e) => {
    if (!e.target.closest('[data-dropdown]')) setDropdown(false);
  });

  L.on(document, 'keydown', (e) => {
    if (e.key !== 'Escape') return;
    setMenu(false);
    setDropdown(false);
  });

  const onScroll = () => {
    const scrolled = window.scrollY > 8;
    header?.classList.toggle('border-line', scrolled);
    header?.classList.toggle('shadow-raised', scrolled);
    header?.classList.toggle('border-transparent', !scrolled);
  };
  L.on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  return () => L.destroy();
}
