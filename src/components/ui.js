import { escapeHtml } from '../utils/format.js';
import { icon } from './icons.js';

/** Cabecera de herramienta: icono, distintivo, h1 único y entradilla. */
export function pageHeader({ icon: iconName, title, lede, badge, updated }) {
  return `
    <header class="mb-8 animate-fade-up">
      <div class="flex items-start gap-4">
        ${
          iconName
            ? `<span class="ring-gradient grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent sm:h-14 sm:w-14">
                 ${icon(iconName, { class: 'h-6 w-6 sm:h-7 sm:w-7', strokeWidth: 1.6 })}
               </span>`
            : ''
        }
        <div class="min-w-0">
          ${
            badge
              ? `<p class="badge-accent mb-2">${icon('spark', { class: 'h-3 w-3' })} ${escapeHtml(badge)}</p>`
              : ''
          }
          <h1>${escapeHtml(title)}</h1>
        </div>
      </div>
      <p class="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-content-muted">${lede}</p>
      ${
        updated
          ? `<p class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-content-subtle">
               <span class="inline-flex items-center gap-1.5">${icon('clock', {
                 class: 'h-3.5 w-3.5',
               })} Actualizado en ${escapeHtml(updated)}</span>
               <span class="inline-flex items-center gap-1.5">${icon('lock', {
                 class: 'h-3.5 w-3.5',
               })} Sin envío de datos</span>
             </p>`
          : ''
      }
    </header>`;
}

export function breadcrumbs(items) {
  const sep = `<span class="text-content-subtle/50" aria-hidden="true">${icon('chevronDown', {
    class: 'h-3.5 w-3.5 -rotate-90',
  })}</span>`;
  const parts = items.map((it, i) => {
    const last = i === items.length - 1;
    const node = last
      ? `<span class="font-medium text-content-muted" aria-current="page">${escapeHtml(it.label)}</span>`
      : `<a class="link" href="${it.href}" data-link>${escapeHtml(it.label)}</a>`;
    return `<li class="flex items-center gap-1.5">${i ? sep : ''}${node}</li>`;
  });
  return `<nav aria-label="Migas de pan" class="py-6 text-sm text-content-subtle">
      <ol class="flex flex-wrap items-center gap-1.5">${parts.join('')}</ol>
    </nav>`;
}

/** Aviso reutilizable de "todo se calcula en tu navegador". */
export function privacyNote(extra = '') {
  return `
    <div class="mt-6 flex items-start gap-3 rounded-xl bg-positive-soft p-3.5 text-sm leading-6 text-positive ring-1 ring-inset ring-positive/20">
      <span class="mt-0.5 shrink-0">${icon('shield', { class: 'h-4 w-4' })}</span>
      <p>Los cálculos se ejecutan <strong class="font-semibold">en local, dentro de tu navegador</strong>.
      No enviamos ni almacenamos ningún dato en servidores.${extra ? ' ' + extra : ''}</p>
    </div>`;
}

/** Bloque de contenido editorial (SEO long-tail) bajo la herramienta. */
export function seoArticle(html, { label = 'Guía rápida' } = {}) {
  return `
    <section class="mt-14 border-t border-line pt-10">
      <p class="badge-accent mb-4">${icon('layers', { class: 'h-3.5 w-3.5' })} ${escapeHtml(label)}</p>
      <div class="prose-seo">${html}</div>
    </section>`;
}

/** FAQ con acordeón nativo (sin JavaScript). */
export function faq(items) {
  return `
    <section class="mt-12">
      <h2 class="mb-5">Preguntas frecuentes</h2>
      <div class="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        ${items
          .map(
            (it) => `
          <details class="group">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-content transition-colors hover:bg-surface-muted">
              <span>${escapeHtml(it.q)}</span>
              <span class="shrink-0 text-content-subtle transition-transform duration-300 ease-spring group-open:rotate-180">
                ${icon('chevronDown', { class: 'h-4 w-4' })}
              </span>
            </summary>
            <div class="px-5 pb-5 text-sm leading-6 text-content-muted">${it.a}</div>
          </details>`
          )
          .join('')}
      </div>
    </section>`;
}

/** Encabezado de un panel de resultados. */
export function panelTitle(text, iconName) {
  return `<h2 class="mb-4 flex items-center gap-2 text-base font-semibold">
    ${iconName ? `<span class="text-content-subtle">${icon(iconName, { class: 'h-4 w-4' })}</span>` : ''}
    ${escapeHtml(text)}
  </h2>`;
}
