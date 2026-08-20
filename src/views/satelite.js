import { SATELITES } from '../satelites.js';
import { TOOLS } from '../catalog.js';
import { hayHueco, hueco } from '../components/hueco.js';
import { breadcrumbs, seoArticle, privacyNote } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../utils/format.js';

/**
 * Vista genérica de las páginas satélite.
 *
 * A diferencia de una herramienta, aquí no hay formulario: la respuesta va calculada
 * y escrita en el HTML durante el prerender. Se lee sin ejecutar JavaScript, se puede
 * citar en un fragmento destacado, y la calculadora queda a un clic para quien quiera
 * cambiar los supuestos.
 */
function render(indice, contenido) {
  const herramienta = TOOLS.find((t) => t.path === indice.herramienta);
  const r = contenido.responde();

  return `
  <div class="container-x">
    ${breadcrumbs([
      { label: 'Inicio', href: '/' },
      { label: herramienta.navLabel, href: herramienta.path },
      { label: indice.h1 },
    ])}

    <div class="grid gap-8 lg:grid-cols-12">
      <div class="${hayHueco('halfpage') ? 'lg:col-span-8' : 'lg:col-span-8 lg:col-start-3'}">
        <header class="mb-8">
          <p class="badge-accent mb-3">
            ${icon(herramienta.icon, { class: 'h-3.5 w-3.5' })} ${escapeHtml(herramienta.navLabel)}
          </p>
          <h1>${escapeHtml(indice.h1)}</h1>
          <p class="mt-4 text-[1.0625rem] leading-relaxed text-content-muted">${escapeHtml(
            contenido.entradilla
          )}</p>
        </header>

        <!-- La respuesta, arriba y sin necesidad de tocar nada -->
        <div class="card overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75">Respuesta corta</p>
            <p class="relative mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[2.5rem] font-extrabold leading-none tabular-nums tracking-tight">
              ${escapeHtml(r.titular)}
              <span class="text-base font-semibold tracking-normal text-white/80">${escapeHtml(r.unidad)}</span>
            </p>
          </div>

          <div class="p-5 sm:p-6">
            <p class="text-[1.0625rem] leading-relaxed text-content">${r.frase}</p>

            <dl class="mt-5 grid gap-2.5 sm:grid-cols-2">
              ${r.datos
                .map(
                  ([k, v]) => `
                <div class="stat">
                  <dt class="stat-label">${escapeHtml(k)}</dt>
                  <dd class="stat-value !text-base">${escapeHtml(v)}</dd>
                </div>`
                )
                .join('')}
            </dl>

            <p class="mt-5 flex items-start gap-2 text-xs leading-5 text-content-subtle">
              ${icon('info', { class: 'mt-0.5 h-3.5 w-3.5 shrink-0' })}
              <span>${escapeHtml(contenido.supuesto)}</span>
            </p>

            <a href="${herramienta.path}" data-link class="btn-primary mt-5 w-full sm:w-auto">
              ${icon(herramienta.icon, { class: 'h-4 w-4' })} ${escapeHtml(contenido.cta)}
            </a>
          </div>
        </div>

        ${seoArticle(contenido.contenido, { label: 'En detalle' })}

        ${privacyNote()}
      </div>

      ${
        // Sin columna de anuncios el artículo se centra en lugar de quedarse
        // pegado a la izquierda con un tercio de la rejilla en blanco.
        hayHueco('halfpage')
          ? `<aside class="lg:col-span-4">
        <div class="sticky top-24">${hueco({ format: 'halfpage' })}</div>
      </aside>`
          : ''
      }
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}
  </div>
  `;
}

/**
 * Devuelve el módulo de vista de un satélite con la forma que espera el router.
 * El contenido pesado se importa aquí, no en el índice.
 */
export async function cargarSatelite(path) {
  const indice = SATELITES.find((s) => s.path === path);
  const contenido = (await indice.load()).default;
  return {
    render: () => render(indice, contenido),
    mount: () => () => {},
  };
}
