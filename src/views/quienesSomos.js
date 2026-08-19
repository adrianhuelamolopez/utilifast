import { breadcrumbs } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { TOOLS } from '../catalog.js';
import { SITE } from '../config.js';
import { escapeHtml } from '../utils/format.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { quienesSomos as meta } from '../meta.js';
export { meta };

// Fuentes reales de cada herramienta. Google valora que se puedan verificar,
// y a ti te obliga a mantener el rigor cuando añadas herramientas nuevas.
const FUENTES = [
  {
    tool: 'IVA e IRPF',
    fuente: 'Ley 37/1992 del Impuesto sobre el Valor Añadido y tipos de retención vigentes de la AEAT.',
  },
  {
    tool: 'IMC y peso saludable',
    fuente:
      'Clasificación del estado nutricional de la Organización Mundial de la Salud y umbrales de perímetro abdominal de la OMS para población europea.',
  },
  {
    tool: 'Calorías diarias',
    fuente:
      'Ecuación de Mifflin-St Jeor (1990) y factores de actividad física de uso estándar en nutrición clínica.',
  },
  {
    tool: 'Macronutrientes',
    fuente:
      'Equivalencias energéticas de Atwater (4 kcal/g en proteínas y carbohidratos, 9 kcal/g en grasas) y rangos de reparto de uso común.',
  },
  {
    tool: 'Hipoteca',
    fuente: 'Sistema de amortización francés de cuota constante, el utilizado por la práctica totalidad de la banca española.',
  },
  {
    tool: 'Gasolina y cuenta compartida',
    fuente: 'Aritmética directa sobre los datos que introduce el usuario. Sin estimaciones ni tablas externas.',
  },
];

const PRINCIPIOS = [
  [
    'lock',
    'Nada sale de tu dispositivo',
    'Todas las calculadoras son JavaScript que se ejecuta en tu navegador. No hay servidor que reciba tus datos porque no hay servidor: la web es estática.',
  ],
  [
    'layers',
    'Fórmulas verificables',
    'Cada herramienta explica el método que aplica y cita su fuente. Si un cálculo se puede comprobar a mano, el artículo muestra cómo.',
  ],
  [
    'alert',
    'Sin promesas que no podamos cumplir',
    'Las calculadoras de salud y de dinero son orientativas y lo decimos donde toca. No sustituyen a un médico, a un dietista ni a un asesor fiscal.',
  ],
  [
    'gauge',
    'Rápido de verdad',
    'Sin frameworks pesados ni rastreadores que ralenticen la carga. Si una función no aporta, no entra.',
  ],
];

/**
 * Ficha de autoría. Solo se emite con SITE.titular.nombre relleno: una ficha con
 * marcadores a medias resta más credibilidad que no tenerla, y fingir una autoría
 * que no existe sería peor todavía.
 */
function quienEstaDetras() {
  const t = SITE.titular || {};
  if (!t.nombre) {
    return `
    <section class="mb-12">
      <h2 class="mb-5">Quién está detrás</h2>
      <div class="card max-w-2xl p-5 sm:p-6">
        <div class="flex items-start gap-4">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            ${icon('users', { class: 'h-5 w-5' })}
          </span>
          <div class="min-w-0">
            <p class="text-sm leading-6 text-content-muted">
              ${escapeHtml(SITE.name)} es un proyecto personal e independiente, sin empresa ni equipo
              detrás. Se mantiene por una persona y no recibe financiación de terceros.
            </p>
            <p class="mt-3 text-sm leading-6 text-content-muted">
              Para cualquier consulta, corrección o sugerencia sobre las herramientas, el correo de
              contacto es <a class="font-medium text-accent hover:underline" href="mailto:${SITE.email}">${SITE.email}</a>.
              Las correcciones sobre datos o fórmulas se agradecen especialmente.
            </p>
          </div>
        </div>
      </div>
    </section>`;
  }
  return `
    <section class="mb-12">
      <h2 class="mb-5">Quién está detrás</h2>
      <div class="card max-w-2xl p-5 sm:p-6">
        <div class="flex items-start gap-4">
          <span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            ${icon('users', { class: 'h-6 w-6' })}
          </span>
          <div class="min-w-0">
            <p class="text-base font-semibold text-content">${escapeHtml(t.nombre)}</p>
            ${t.perfil ? `<p class="mt-0.5 text-sm text-content-muted">${escapeHtml(t.perfil)}</p>` : ''}
            ${t.bio ? `<p class="mt-3 text-sm leading-6 text-content-muted">${escapeHtml(t.bio)}</p>` : ''}
            <p class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a class="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                 href="mailto:${SITE.email}">
                ${icon('send', { class: 'h-3.5 w-3.5' })} ${escapeHtml(SITE.email)}
              </a>
              <a class="link inline-flex items-center gap-1.5" href="/legal" data-link>
                ${icon('scale', { class: 'h-3.5 w-3.5' })} Información legal
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>`;
}

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Quiénes somos' }])}

    <header class="mb-10 max-w-3xl">
      <p class="badge-accent mb-3">${icon('info', { class: 'h-3.5 w-3.5' })} Sobre el proyecto</p>
      <h1>Quiénes somos y cómo elaboramos las calculadoras</h1>
      <p class="mt-4 text-[1.0625rem] leading-relaxed text-content-muted">
        ${escapeHtml(SITE.name)} es un proyecto independiente que reúne calculadoras y generadores para
        resolver cuestiones concretas del día a día: cuánto cuesta un viaje, cuánto IVA lleva una factura,
        cuántas calorías necesitas o cuánto pagarás por tu hipoteca. Sin registro, sin instalar nada y sin
        que tus datos salgan de tu navegador.
      </p>
    </header>

    <section class="mb-12">
      <h2 class="mb-5">Cómo trabajamos</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        ${PRINCIPIOS.map(
          ([ic, titulo, texto]) => `
          <div class="card p-5">
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              ${icon(ic, { class: 'h-5 w-5' })}
            </span>
            <h3 class="mt-3.5">${titulo}</h3>
            <p class="mt-1.5 text-sm leading-6 text-content-muted">${texto}</p>
          </div>`
        ).join('')}
      </div>
    </section>

    <section class="mb-12">
      <h2 class="mb-2">De dónde salen las fórmulas</h2>
      <p class="mb-5 max-w-2xl text-sm leading-6 text-content-muted">
        Ninguna calculadora inventa sus coeficientes. Estas son las fuentes en las que se basa cada una:
      </p>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table data-table-inset w-full min-w-[520px]">
            <caption class="sr-only">Fuentes de cada calculadora</caption>
            <thead>
              <tr>
                <th scope="col" class="text-left">Herramienta</th>
                <th scope="col" class="text-left">Base de cálculo</th>
              </tr>
            </thead>
            <tbody>
              ${FUENTES.map(
                (f) => `
                <tr>
                  <th scope="row" class="whitespace-nowrap py-3 text-left align-top font-semibold text-content">${escapeHtml(
                    f.tool
                  )}</th>
                  <td class="py-3 align-top leading-6 text-content-muted">${escapeHtml(f.fuente)}</td>
                </tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    ${quienEstaDetras()}

    <section class="mb-12">
      <h2 class="mb-2">Cómo nos financiamos</h2>
      <div class="prose-seo max-w-2xl">
        <p>
          ${escapeHtml(SITE.name)} es gratuito y lo seguirá siendo. Los costes de dominio y alojamiento se
          cubren con <strong>publicidad</strong>, que se muestra en espacios delimitados y nunca interrumpe el
          uso de una calculadora: no hay anuncios a pantalla completa, ni ventanas emergentes, ni contenido que
          se desplace mientras lees.
        </p>
        <p>
          Los anuncios <strong>solo se cargan si aceptas la categoría publicitaria</strong> en el aviso de
          cookies. Si la rechazas, la web funciona exactamente igual. Puedes revisar tu elección cuando quieras
          desde el enlace «Configurar cookies» del pie de página.
        </p>
        <p>
          Que haya publicidad no cambia el contenido: ninguna calculadora está diseñada para empujarte hacia un
          producto ni recibimos comisiones por recomendar servicios financieros o sanitarios.
        </p>
      </div>
    </section>

    <section>
      <h2 class="mb-5">Todas las herramientas</h2>
      <ul class="flex flex-wrap gap-2">
        ${TOOLS.map(
          (t) =>
            `<li><a class="chip" href="${t.path}" data-link>${icon(t.icon, {
              class: 'h-4 w-4',
            })} ${escapeHtml(t.navLabel)}</a></li>`
        ).join('')}
      </ul>
    </section>
  </div>
  `;
}

export function mount() {
  return () => {};
}
