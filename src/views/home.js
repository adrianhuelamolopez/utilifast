import { TOOLS, CLUSTERS } from '../catalog.js';
import { SATELITES } from '../satelites.js';
import { hueco } from '../components/hueco.js';
import { seoArticle, faq } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { escapeHtml, normalizar } from '../utils/format.js';
import { qs, listeners, debounce } from '../utils/dom.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { home as meta } from '../meta.js';
export { meta };

const TRUST = [
  ['lock', 'Sin enviar datos', 'Todo el cálculo ocurre en tu dispositivo'],
  ['gauge', 'Resultado inmediato', 'Se recalcula mientras escribes'],
  ['users', 'Sin registro', 'Ni cuentas, ni correos, ni instalación'],
  ['offline', 'Funciona sin cobertura', 'Una vez cargada, no necesita red'],
];

const STEPS = [
  ['Elige la herramienta', 'Cada una resuelve una sola cosa y va directa al grano.'],
  ['Rellena los campos', 'Valores por defecto realistas para empezar sin pensar.'],
  ['Copia o comparte', 'Resumen listo para WhatsApp, enlace o descarga en PNG.'],
];

function toolCard(tool, i) {
  const searchIndex = (
    tool.card.title +
    ' ' +
    tool.card.blurb +
    ' ' +
    tool.card.tags.join(' ') +
    ' ' +
    tool.navLabel +
    ' ' +
    (tool.card.keywords || '')
  );
  // Se indexa sin acentos: en español se busca tanto «interés» como «interes».
  const busqueda = normalizar(searchIndex);

  return `
  <a href="${tool.path}" data-link data-tool
     data-search="${escapeHtml(busqueda)}"
     data-cluster="${escapeHtml(tool.cluster || '')}"
     style="animation-delay:${i * 70}ms"
     class="group relative flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-line
            bg-surface p-5 shadow-subtle transition duration-300 ease-spring
            hover:-translate-y-1 hover:border-accent/35 hover:shadow-pop">
    <span class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></span>

    <div class="relative flex items-start justify-between">
      <span class="grid h-12 w-12 place-items-center rounded-xl bg-accent-soft text-accent transition duration-300 ease-spring group-hover:bg-accent-gradient group-hover:text-white group-hover:shadow-glow">
        ${icon(tool.icon, { class: 'h-[1.4rem] w-[1.4rem]', strokeWidth: 1.7 })}
      </span>
      <span class="text-content-subtle transition duration-300 ease-spring group-hover:translate-x-0.5 group-hover:text-accent">
        ${icon('arrowRight', { class: 'h-4 w-4' })}
      </span>
    </div>

    <h3 class="relative mt-4 text-[0.975rem] font-semibold leading-snug text-content">${escapeHtml(
      tool.card.title
    )}</h3>
    <p class="relative mt-1.5 flex-1 text-sm leading-6 text-content-muted">${escapeHtml(tool.card.blurb)}</p>

    <div class="relative mt-4 flex flex-wrap gap-1.5">
      ${tool.card.tags
        .map(
          (t) =>
            `<span class="rounded-md bg-surface-muted px-2 py-0.5 text-2xs font-medium tracking-normal text-content-subtle ring-1 ring-inset ring-line">${escapeHtml(
              t
            )}</span>`
        )
        .join('')}
    </div>
  </a>`;
}

export function render() {
  return `
  <!-- Portada -->
  <section class="relative overflow-hidden border-b border-line bg-hero-glow">
    <div class="pointer-events-none absolute inset-0 bg-grid-fade opacity-60" aria-hidden="true"></div>
    <div class="container-x relative py-14 text-center sm:py-20 lg:py-24">
      <p class="badge-accent mx-auto animate-fade-up">
        ${icon('spark', { class: 'h-3.5 w-3.5' })} Sin registro · sin instalación
      </p>

      <h1 class="mx-auto mt-5 max-w-4xl animate-fade-up text-display font-extrabold" style="animation-delay:60ms">
        Micro-herramientas que resuelven<br class="hidden sm:block" />
        en <span class="text-gradient">10 segundos</span>
      </h1>

      <p class="mx-auto mt-5 max-w-2xl animate-fade-up text-lg leading-relaxed text-content-muted" style="animation-delay:120ms">
        Calculadoras y generadores que se ejecutan enteros en tu navegador. Ni cuentas, ni esperas,
        ni datos viajando a un servidor.
      </p>

      <div class="mx-auto mt-8 max-w-xl animate-fade-up" style="animation-delay:180ms">
        <label class="sr-only" for="buscador">Buscar herramienta</label>
        <div class="group relative">
          <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle transition-colors group-focus-within:text-accent">
            ${icon('search', { class: 'h-[1.15rem] w-[1.15rem]' })}
          </span>
          <input class="input h-14 rounded-2xl pl-12 pr-16 text-base shadow-float"
                 id="buscador" type="search" autocomplete="off"
                 placeholder="Busca: gasolina, QR de WhatsApp, macros…" />
          <kbd class="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface-muted px-2 py-1 text-2xs font-semibold text-content-subtle sm:block">/</kbd>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span class="text-xs text-content-subtle">Populares:</span>
          ${TOOLS.filter((t) => ['/hipoteca', '/iva', '/calorias', '/imc'].includes(t.path))
            .map(
              (t) =>
                `<a class="chip !py-1 !text-xs" href="${t.path}" data-link>${icon(t.icon, {
                  class: 'h-3.5 w-3.5',
                })} ${escapeHtml(t.navLabel)}</a>`
            )
            .join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- Garantías -->
  <section class="border-b border-line bg-surface" aria-label="Cómo trabajamos">
    <div class="container-x grid grid-cols-2 gap-x-6 gap-y-6 py-7 lg:grid-cols-4">
      ${TRUST.map(
        ([ic, title, text]) => `
        <div class="flex items-start gap-3">
          <span class="mt-0.5 shrink-0 text-accent">${icon(ic, { class: 'h-[1.15rem] w-[1.15rem]' })}</span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-content">${title}</p>
            <p class="mt-0.5 text-xs leading-5 text-content-subtle">${text}</p>
          </div>
        </div>`
      ).join('')}
    </div>
  </section>

  <!-- El aire sobre el directorio va aquí y no en el margen del hueco: cuando no
       hay publicidad el hueco no se emite y la sección quedaría pegada a la banda. -->
  <div class="container-x pt-12">
    ${hueco({ format: 'leaderboard', className: 'mb-10' })}

    <!-- Directorio -->
    <section aria-labelledby="directorio" class="scroll-mt-24" id="herramientas">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="directorio">Todas las herramientas</h2>
          <p class="mt-1.5 text-sm text-content-muted">
            <span id="tool-count">${TOOLS.length}</span> herramientas disponibles ahora mismo.
          </p>
        </div>
        <div class="flex flex-wrap gap-2" id="filtros" role="group" aria-label="Filtrar por categoría">
          <button type="button" class="chip chip-active" data-filtro="" aria-pressed="true">Todas</button>
          ${CLUSTERS.map(
            (c) =>
              `<button type="button" class="chip" data-filtro="${escapeHtml(
                c.id
              )}" aria-pressed="false">${escapeHtml(c.label)}</button>`
          ).join('')}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="grid-herramientas">
        ${TOOLS.map(toolCard).join('')}

        <!-- Marcador de "próximamente": mantiene la rejilla equilibrada -->
        <div class="flex flex-col items-start justify-center rounded-2xl border border-dashed border-line-strong bg-surface-muted/50 p-5"
             data-placeholder>
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-surface text-content-subtle ring-1 ring-inset ring-line">
            ${icon('plus', { class: 'h-5 w-5' })}
          </span>
          <h3 class="mt-4 text-[0.975rem] font-semibold text-content-muted">Más herramientas en camino</h3>
          <p class="mt-1.5 text-sm leading-6 text-content-subtle">
            El catálogo crece con utilidades del día a día. ¿Echas alguna en falta?
          </p>
        </div>
      </div>

      <p class="mt-6 hidden rounded-2xl border border-line bg-surface p-8 text-center text-sm text-content-muted" id="sin-resultados">
        No hay herramientas para esa búsqueda. Prueba con otra palabra.
      </p>
    </section>

    <!-- Cómo funciona -->
    <section class="mt-16" aria-labelledby="como-funciona">
      <h2 id="como-funciona">Cómo funciona</h2>
      <ol class="mt-6 grid gap-4 sm:grid-cols-3">
        ${STEPS.map(
          ([title, text], i) => `
          <li class="relative rounded-2xl border border-line bg-surface p-5">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-sm font-bold text-accent">${
              i + 1
            }</span>
            <h3 class="mt-3.5">${title}</h3>
            <p class="mt-1.5 text-sm leading-6 text-content-muted">${text}</p>
          </li>`
        ).join('')}
      </ol>
    </section>

    <!-- Preguntas concretas: cada una es una página con la respuesta ya calculada -->
    <section class="mt-16" aria-labelledby="preguntas-home">
      <h2 id="preguntas-home">Preguntas con respuesta directa</h2>
      <p class="mt-1.5 text-sm text-content-muted">
        Casos concretos resueltos, con el número ya calculado y la calculadora a un clic.
      </p>
      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${SATELITES.map(
          (s) => `
          <a href="${s.path}" data-link
             class="group flex flex-col rounded-2xl border border-line bg-surface p-4 transition duration-300 ease-spring hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-float">
            <span class="text-accent">${icon('spark', { class: 'h-4 w-4' })}</span>
            <span class="mt-2.5 block text-sm font-semibold leading-snug text-content">${escapeHtml(s.h1)}</span>
            <span class="mt-auto pt-3 text-2xs font-semibold uppercase tracking-wider text-content-subtle">
              ${escapeHtml((TOOLS.find((t) => t.path === s.herramienta) || {}).navLabel || '')}
            </span>
          </a>`
        ).join('')}
      </div>
    </section>

    ${seoArticle(
      `
    <h2>Herramientas online rápidas, gratuitas y sin registro</h2>
    <p>
      UtiliFast reúne pequeñas utilidades del día a día que normalmente obligan a instalar una aplicación o a
      registrarse en un servicio: calcular cuánto cuesta un viaje en coche y repartirlo entre los pasajeros,
      generar un enlace de WhatsApp con su código QR o distribuir los macronutrientes de una dieta entre las
      comidas del día. Todas comparten la misma idea: abrir, resolver y cerrar.
    </p>
    <h2>Por qué el cálculo se hace en tu navegador</h2>
    <p>
      Cada herramienta está escrita en JavaScript que se ejecuta <strong>en el cliente</strong>, es decir, en
      tu propio teléfono u ordenador. Esto tiene dos consecuencias directas. La primera es la velocidad: no hay
      ida y vuelta al servidor, así que el resultado aparece mientras escribes. La segunda es la privacidad:
      los datos que introduces —tu número de teléfono, tu peso o la ruta de tu viaje— no viajan por la red
      porque nunca salen de la pestaña del navegador.
    </p>
    <p>
      Ese enfoque también permite que el sitio funcione bien con conexiones lentas o inestables. Una vez
      cargada la página, puedes seguir usando la calculadora aunque pierdas cobertura momentáneamente.
    </p>
    <h2>Qué encontrarás, agrupado por temas</h2>
    <p>
      En <strong>dinero e impuestos</strong> están la calculadora de hipoteca, con cuadro de amortización y
      simulación de aportaciones anticipadas, y la de IVA, que suma o resta el impuesto y contempla el recargo
      de equivalencia y la retención de IRPF de las facturas de autónomos.
    </p>
    <p>
      En <strong>salud y nutrición</strong> encadenas tres herramientas que se complementan: primero calculas
      tus calorías diarias a partir de tu metabolismo basal, después las repartes en proteínas, carbohidratos y
      grasas por comida, y el índice de masa corporal te sitúa junto con el perímetro de cintura.
    </p>
    <p>
      En <strong>viajes y gastos compartidos</strong>, la calculadora de gasolina reparte el coste de un
      trayecto entre los ocupantes del coche, y la de la cuenta divide una comida de grupo con propina, tanto a
      partes iguales como según lo que ha consumido cada uno. A ellas se suma el generador de enlaces y códigos
      QR de WhatsApp.
    </p>
    <p>
      El catálogo irá creciendo con nuevas utilidades. Si echas en falta alguna, la filosofía se mantiene:
      resolver una necesidad concreta, hacerlo rápido y no pedir nada a cambio.
    </p>
  `,
      { label: 'Sobre UtiliFast' }
    )}

    ${faq([
      {
        q: '¿Hace falta registrarse o pagar algo?',
        a: 'No. Todas las herramientas son gratuitas y no requieren cuenta, correo electrónico ni instalación.',
      },
      {
        q: '¿Qué pasa con los datos que introduzco?',
        a: 'Se quedan en tu navegador. No se envían a ningún servidor ni se guardan en bases de datos: al cerrar la pestaña desaparecen.',
      },
      {
        q: '¿Puedo usarlas desde el móvil?',
        a: 'Sí. La interfaz está diseñada primero para móvil, con teclados numéricos adecuados y resultados copiables en un toque.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const buscador = qs('#buscador', root);
  const grid = qs('#grid-herramientas', root);
  const vacio = qs('#sin-resultados', root);
  const contador = qs('#tool-count', root);
  const placeholder = qs('[data-placeholder]', root);
  const cards = Array.from(grid.querySelectorAll('[data-tool]'));

  let query = '';
  let tag = '';

  function applyFilter() {
    let visibles = 0;
    cards.forEach((card) => {
      const matchText = !query || card.dataset.search.includes(query);
      const matchTag = !tag || card.dataset.cluster === tag;
      const show = matchText && matchTag;
      card.classList.toggle('hidden', !show);
      if (show) visibles += 1;
    });
    contador.textContent = String(visibles);
    vacio.classList.toggle('hidden', visibles > 0);
    // El marcador de "próximamente" solo tiene sentido sin filtros activos
    if (placeholder) placeholder.classList.toggle('hidden', Boolean(query || tag));
  }

  L.on(
    buscador,
    'input',
    debounce(() => {
      query = normalizar(buscador.value.trim());
      applyFilter();
    }, 120)
  );

  root.querySelectorAll('[data-filtro]').forEach((btn) =>
    L.on(btn, 'click', () => {
      tag = btn.dataset.filtro;
      root.querySelectorAll('[data-filtro]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('chip-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      applyFilter();
    })
  );

  // Atajo "/" para saltar al buscador, como en las webs de documentación
  L.on(document, 'keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target.tagName;
    if (el === 'INPUT' || el === 'TEXTAREA' || el === 'SELECT' || e.target.isContentEditable) return;
    e.preventDefault();
    buscador.focus();
    buscador.select();
  });

  applyFilter();
  return () => L.destroy();
}
