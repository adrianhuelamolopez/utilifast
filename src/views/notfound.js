import { TOOLS } from '../catalog.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../utils/format.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { notfound as meta } from '../meta.js';
export { meta };

export function render() {
  return `
  <div class="container-x">
    <section class="mx-auto max-w-xl py-20 text-center sm:py-28">
      <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft text-accent">
        ${icon('search', { class: 'h-7 w-7' })}
      </span>
      <p class="mt-6 text-2xs font-semibold uppercase tracking-[0.25em] text-content-subtle">Error 404</p>
      <h1 class="mt-2">Esta página no existe</h1>
      <p class="mx-auto mt-4 text-base leading-relaxed text-content-muted">
        Puede que el enlace esté mal escrito o que la herramienta haya cambiado de dirección.
      </p>
      <a href="/" data-link class="btn-primary mt-7">
        ${icon('arrowRight', { class: 'h-4 w-4 rotate-180' })} Volver al inicio
      </a>

      <div class="mt-12 border-t border-line pt-8">
        <p class="text-sm font-medium text-content-muted">O prueba una de estas herramientas</p>
        <ul class="mt-4 flex flex-wrap justify-center gap-2">
          ${TOOLS.map(
            (t) =>
              `<li><a class="chip" href="${t.path}" data-link>${icon(t.icon, {
                class: 'h-4 w-4',
              })} ${escapeHtml(t.navLabel)}</a></li>`
          ).join('')}
        </ul>
      </div>
    </section>
  </div>
  `;
}

export function mount() {
  return () => {};
}
