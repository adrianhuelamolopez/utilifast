import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { decimal, integer, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { rm as meta } from '../meta.js';
export { meta };

// Las cinco fórmulas de estimación más citadas en la literatura de fuerza.
const FORMULAS = [
  {
    id: 'epley',
    nombre: 'Epley',
    anio: 1985,
    calc: (w, r) => w * (1 + r / 30),
    nota: 'La más usada. Tiende a estimar algo alto en repeticiones altas.',
  },
  {
    id: 'brzycki',
    nombre: 'Brzycki',
    anio: 1993,
    calc: (w, r) => (w * 36) / (37 - r),
    nota: 'Muy fiable por debajo de 10 repeticiones; se dispara por encima.',
  },
  {
    id: 'lombardi',
    nombre: 'Lombardi',
    anio: 1989,
    calc: (w, r) => w * Math.pow(r, 0.1),
    nota: 'Curva suave, la más conservadora en series largas.',
  },
  {
    id: 'oconner',
    nombre: 'O’Conner',
    anio: 1989,
    calc: (w, r) => w * (1 + 0.025 * r),
    nota: 'Lineal y sencilla, resultados bajos frente al resto.',
  },
  {
    id: 'lander',
    nombre: 'Lander',
    anio: 1985,
    calc: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
    nota: 'Muy próxima a Brzycki en el rango habitual.',
  },
];

// Porcentaje del 1RM con las repeticiones que suelen salir a ese peso.
const PORCENTAJES = [
  { pct: 100, reps: 1, zona: 'fuerza' },
  { pct: 95, reps: 2, zona: 'fuerza' },
  { pct: 90, reps: 4, zona: 'fuerza' },
  { pct: 85, reps: 6, zona: 'fuerza' },
  { pct: 80, reps: 8, zona: 'hipertrofia' },
  { pct: 75, reps: 10, zona: 'hipertrofia' },
  { pct: 70, reps: 12, zona: 'hipertrofia' },
  { pct: 65, reps: 15, zona: 'resistencia' },
  { pct: 60, reps: 20, zona: 'resistencia' },
  { pct: 55, reps: 24, zona: 'resistencia' },
];

const ZONAS = {
  fuerza: { label: 'Fuerza máxima', clase: 'text-data-3', fondo: 'bg-data-3/10' },
  hipertrofia: { label: 'Hipertrofia', clase: 'text-accent', fondo: 'bg-accent-soft' },
  resistencia: { label: 'Resistencia', clase: 'text-data-2', fondo: 'bg-data-2/10' },
};

const EJERCICIOS = [
  { id: 'banca', label: 'Press banca' },
  { id: 'sentadilla', label: 'Sentadilla' },
  { id: 'peso-muerto', label: 'Peso muerto' },
  { id: 'otro', label: 'Otro' },
];

const DEFAULTS = { peso: 80, reps: 5, ejercicio: 'banca' };

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Repetición máxima' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de repetición máxima (1RM)',
      lede: 'Estima el peso que podrías levantar una sola vez a partir de una serie que ya has hecho. Sin arriesgar una máxima real, comparando las cinco fórmulas de referencia y con la tabla de porcentajes para montar tus series.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="rm-form" class="card p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('Tu serie', 'dumbbell')}

        <div class="space-y-5">
          <div>
            <label class="field-label" for="peso">Peso levantado</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="peso" type="number"
                     inputmode="decimal" min="1" max="500" step="2.5" value="${DEFAULTS.peso}" />
              <span class="input-affix">kg</span>
            </div>
            <p class="hint">Incluida la barra. Una barra olímpica estándar pesa 20 kg.</p>
          </div>

          <div>
            <label class="field-label" for="reps">Repeticiones completadas</label>
            <div class="flex items-center gap-2">
              <button type="button" class="btn-icon shrink-0" data-rep="-1" aria-label="Una repetición menos">
                ${icon('minus', { class: 'h-4 w-4' })}
              </button>
              <input class="input no-spin text-center text-lg font-semibold" id="reps" type="number"
                     inputmode="numeric" min="1" max="20" step="1" value="${DEFAULTS.reps}" />
              <button type="button" class="btn-icon shrink-0" data-rep="1" aria-label="Una repetición más">
                ${icon('plus', { class: 'h-4 w-4' })}
              </button>
            </div>
            <p class="hint">
              Cuenta solo las que hiciste con técnica correcta, hasta el fallo o muy cerca.
            </p>
          </div>
        </div>

        <div class="mt-6 border-t border-line pt-5">
          <p class="field-label">Ejercicio <span class="font-normal text-content-subtle">(solo para el resumen)</span></p>
          <div class="flex flex-wrap gap-2">
            ${EJERCICIOS.map(
              (e) =>
                `<button type="button" class="chip !py-1 !text-xs${
                  e.id === DEFAULTS.ejercicio ? ' chip-active' : ''
                }" data-ejercicio="${e.id}" aria-pressed="${e.id === DEFAULTS.ejercicio}">${e.label}</button>`
            ).join('')}
          </div>
        </div>

        <div id="aviso-reps" hidden
             class="mt-5 flex items-start gap-3 rounded-xl bg-caution-soft p-4 text-sm leading-6 text-caution ring-1 ring-inset ring-caution/25">
          <span class="mt-0.5 shrink-0">${icon('alert', { class: 'h-4 w-4' })}</span>
          <p id="aviso-reps-texto"></p>
        </div>

        ${privacyNote()}
      </form>

      <section class="lg:col-span-7" aria-live="polite">
        <div class="card overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75">Tu 1RM estimado</p>
            <p class="relative mt-1 flex items-baseline gap-2 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight">
              <span id="out-rm">—</span>
              <span class="text-xl font-bold text-white/70">kg</span>
            </p>
            <p class="relative mt-2 text-sm text-white/85" id="out-detalle">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <p class="stat-label mb-3">Qué dice cada fórmula</p>
            <ul class="divide-y divide-line rounded-xl border border-line" id="lista-formulas"></ul>

            <dl class="mt-5 grid grid-cols-3 gap-2.5">
              <div class="stat">
                <dt class="stat-label">Mínimo</dt>
                <dd class="stat-value !text-base" id="out-min">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Media</dt>
                <dd class="stat-value !text-base" id="out-media">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Máximo</dt>
                <dd class="stat-value !text-base" id="out-max">—</dd>
              </div>
            </dl>

            <button type="button" class="btn-primary mt-5 w-full sm:w-auto" id="copy-rm">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar resultado</span>
            </button>

            <div class="mt-5 flex items-start gap-3 rounded-xl bg-caution-soft p-4 text-sm leading-6 text-caution ring-1 ring-inset ring-caution/25">
              <span class="mt-0.5 shrink-0">${icon('alert', { class: 'h-4 w-4' })}</span>
              <p>
                Es una <strong class="font-semibold">estimación</strong>, no una marca. Intentar una máxima
                real sin técnica consolidada y sin alguien que te asegure la serie es la vía rápida a una
                lesión, sobre todo en press banca y sentadilla.
              </p>
            </div>
          </div>
        </div>

        ${hueco({ format: 'rectangle', className: 'mt-6' })}
      </section>
    </div>

    <!-- Tabla de porcentajes -->
    <section class="mt-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Tus pesos por porcentaje</h2>
          <p class="mt-1.5 text-sm text-content-muted">
            Con qué peso entrenar según el objetivo de la sesión.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          ${Object.entries(ZONAS)
            .map(
              ([, z]) =>
                `<span class="inline-flex items-center gap-1.5 rounded-md ${z.fondo} px-2 py-1 font-semibold ${z.clase}">${z.label}</span>`
            )
            .join('')}
        </div>
      </div>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table data-table-inset w-full min-w-[520px]">
            <caption class="sr-only">Pesos de entrenamiento según el porcentaje del 1RM</caption>
            <thead>
              <tr>
                <th scope="col" class="text-left">% del 1RM</th>
                <th scope="col" class="text-right">Peso</th>
                <th scope="col" class="text-right">Repeticiones típicas</th>
                <th scope="col" class="text-right">Objetivo</th>
              </tr>
            </thead>
            <tbody id="tabla-pct"></tbody>
          </table>
        </div>
      </div>
    </section>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Qué es el 1RM y por qué se estima en vez de medirlo</h2>
      <p>
        La <strong>repetición máxima</strong> es el peso más alto que puedes mover una sola vez con técnica
        correcta en un ejercicio. Es la referencia sobre la que se construyen casi todos los programas de
        fuerza, porque las series se prescriben como un porcentaje de ese número: 5×5 al 80 %, 3×3 al 90 % y
        así.
      </p>
      <p>
        Medirlo de verdad tiene un coste. Una máxima real exige calentamiento largo, técnica consolidada y
        alguien que asegure la serie, deja el sistema nervioso fatigado durante días y concentra bastante
        riesgo de lesión. Por eso lo habitual es <strong>estimarlo</strong> a partir de una serie normal de
        entrenamiento, que es exactamente lo que hace esta calculadora.
      </p>
      <h2>Las cinco fórmulas y por qué no coinciden</h2>
      <p>
        Todas parten de la misma idea —cuantas más repeticiones hagas con un peso, más lejos estás de tu
        máximo— pero modelan esa relación de forma distinta. <strong>Epley</strong> y <strong>Brzycki</strong>
        son las más citadas y dan resultados muy parecidos por debajo de 10 repeticiones. <strong>Lombardi</strong>
        usa una curva de potencia y se mantiene más conservadora en series largas, mientras que
        <strong>O’Conner</strong> es lineal y suele quedarse por debajo del resto. Mostrar las cinco a la vez
        no es un adorno: la <strong>horquilla entre la más baja y la más alta</strong> te dice cuánta
        incertidumbre tiene tu estimación.
      </p>
      <p>
        Esa incertidumbre crece muy rápido con las repeticiones. Con 3 o 5 repeticiones las fórmulas se
        agrupan y el resultado es bastante fiable; a partir de 10 empiezan a separarse, y por encima de 12 la
        estimación depende tanto de tu resistencia como de tu fuerza máxima, así que deja de ser útil. Si
        quieres un número en el que confiar, haz una serie de entre 3 y 6 repeticiones.
      </p>
      <h2>Cómo usar la tabla de porcentajes</h2>
      <p>
        Por encima del 85 % del 1RM se entrena <strong>fuerza máxima</strong>, con series de 1 a 6
        repeticiones y descansos largos. La franja del 67 % al 85 % es la de <strong>hipertrofia</strong>,
        entre 6 y 12 repeticiones, donde se acumula la mayor parte del volumen de trabajo. Por debajo del
        67 % se entrena <strong>resistencia muscular</strong>. Recalcula tu 1RM cada seis u ocho semanas: si
        no cambia, tu programación tampoco está cambiando nada.
      </p>
    `)}

    ${faq([
      {
        q: '¿Cuántas repeticiones debo hacer para que la estimación sea fiable?',
        a: 'Entre 3 y 6. Con menos de 3 el margen de error también sube porque cualquier fallo técnico pesa mucho, y por encima de 10 las fórmulas se separan tanto entre sí que el número deja de ser orientativo.',
      },
      {
        q: '¿Qué fórmula debería usar?',
        a: 'El resultado principal es la media de las cinco, que es más estable que cualquiera por separado. Si sigues un programa que cita una fórmula concreta, usa esa para mantener la coherencia con sus porcentajes.',
      },
      {
        q: '¿Sirve para cualquier ejercicio?',
        a: 'Funciona mejor en básicos con mucho recorrido y muchos grupos musculares implicados: press banca, sentadilla, peso muerto o press militar. En ejercicios de aislamiento como un curl de bíceps la relación entre peso y repeticiones es menos predecible.',
      },
      {
        q: '¿Es un consejo de entrenamiento?',
        a: 'No. Es una herramienta de cálculo con fines informativos. Para una programación adaptada a ti, y sobre todo si tienes alguna lesión previa, consulta a un entrenador cualificado.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const state = { ...DEFAULTS };

  function estimaciones() {
    const w = clamp(state.peso, 1, 500);
    const r = clamp(Math.round(state.reps), 1, 20);
    // Con una sola repetición el peso movido ES la máxima: las fórmulas no aplican.
    return FORMULAS.map((f) => ({ ...f, valor: r === 1 ? w : f.calc(w, r) }));
  }

  let resumen = '';

  function update() {
    const lista = estimaciones();
    const valores = lista.map((f) => f.valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const dispersion = media > 0 ? ((max - min) / media) * 100 : 0;

    el('out-rm').textContent = decimal(media, 1);
    el('out-detalle').textContent =
      state.reps === 1
        ? `Has levantado ${decimal(state.peso, 1)} kg a una repetición: eso ya es tu máxima.`
        : `A partir de ${decimal(state.peso, 1)} kg × ${integer(state.reps)} repeticiones · horquilla de ${decimal(
            min,
            1
          )} a ${decimal(max, 1)} kg`;

    el('out-min').textContent = `${decimal(min, 1)} kg`;
    el('out-media').textContent = `${decimal(media, 1)} kg`;
    el('out-max').textContent = `${decimal(max, 1)} kg`;

    el('lista-formulas').innerHTML = lista
      .map(
        (f) => `
        <li class="flex items-start justify-between gap-4 p-3.5">
          <span class="min-w-0">
            <span class="text-sm font-semibold text-content">${f.nombre}
              <span class="font-normal text-content-subtle">· ${f.anio}</span>
            </span>
            <span class="mt-0.5 block text-xs leading-5 text-content-muted">${f.nota}</span>
          </span>
          <span class="shrink-0 text-base font-bold tabular-nums text-content">${decimal(f.valor, 1)} kg</span>
        </li>`
      )
      .join('');

    // Aviso proporcional a la fiabilidad real de la estimación
    const aviso = el('aviso-reps');
    if (state.reps > 12) {
      aviso.hidden = false;
      el('aviso-reps-texto').innerHTML = `Con <strong class="font-semibold">${integer(
        state.reps
      )} repeticiones</strong> las fórmulas se separan un ${decimal(
        dispersion,
        0
      )} % entre sí: el resultado es poco fiable. Repite el cálculo con una serie de 3 a 6 repeticiones.`;
    } else if (state.reps > 10) {
      aviso.hidden = false;
      el('aviso-reps-texto').innerHTML =
        'Por encima de 10 repeticiones la estimación empieza a depender más de tu resistencia que de tu fuerza máxima. Úsala como orientación.';
    } else {
      aviso.hidden = true;
    }

    el('tabla-pct').innerHTML = PORCENTAJES.map((p) => {
      const z = ZONAS[p.zona];
      return `
        <tr>
          <th scope="row" class="py-2.5 text-left font-semibold tabular-nums text-content">${p.pct} %</th>
          <td class="py-2 text-right text-base font-bold tabular-nums text-content">${decimal(
            (media * p.pct) / 100,
            1
          )} kg</td>
          <td class="py-2 text-right tabular-nums text-content-muted">${p.reps}</td>
          <td class="py-2 text-right">
            <span class="inline-flex rounded-md ${z.fondo} px-2 py-0.5 text-2xs font-semibold ${z.clase}">${z.label}</span>
          </td>
        </tr>`;
    }).join('');

    const ejercicio = EJERCICIOS.find((e) => e.id === state.ejercicio).label;
    resumen = [
      `🏋️ 1RM estimado · ${ejercicio}`,
      `• Serie: ${decimal(state.peso, 1)} kg × ${integer(state.reps)} repeticiones`,
      `• 1RM: ${decimal(media, 1)} kg (entre ${decimal(min, 1)} y ${decimal(max, 1)})`,
      '',
      `• 90 % · ${decimal(media * 0.9, 1)} kg (4 reps)`,
      `• 80 % · ${decimal(media * 0.8, 1)} kg (8 reps)`,
      `• 70 % · ${decimal(media * 0.7, 1)} kg (12 reps)`,
      '',
      'Estimación orientativa, no una marca.',
      `Calculado con ${SITE.name}`,
    ].join('\n');
  }

  L.on(el('peso'), 'input', () => {
    state.peso = clamp(readNumber(el('peso').value, 1), 1, 500);
    update();
  });
  L.on(el('reps'), 'input', () => {
    state.reps = clamp(readNumber(el('reps').value, 1), 1, 20);
    update();
  });
  root.querySelectorAll('[data-rep]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.reps = clamp(state.reps + Number(btn.dataset.rep), 1, 20);
      el('reps').value = String(state.reps);
      update();
    })
  );
  root.querySelectorAll('[data-ejercicio]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.ejercicio = btn.dataset.ejercicio;
      root.querySelectorAll('[data-ejercicio]').forEach((b) => {
        const activo = b === btn;
        b.classList.toggle('chip-active', activo);
        b.setAttribute('aria-pressed', String(activo));
      });
      update();
    })
  );

  L.on(el('rm-form'), 'submit', (e) => e.preventDefault());
  bindCopyButton(el('copy-rm'), () => resumen, { label: 'Copiar resultado' });

  update();
  return () => L.destroy();
}
