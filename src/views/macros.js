import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { integer, decimal, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { macros as meta } from '../meta.js';
export { meta };

const OBJETIVOS = {
  definicion: { label: 'Definición', kcalKg: 29, split: { p: 40, c: 30, f: 30 } },
  mantenimiento: { label: 'Mantenimiento', kcalKg: 33, split: { p: 30, c: 40, f: 30 } },
  volumen: { label: 'Volumen', kcalKg: 38, split: { p: 25, c: 50, f: 25 } },
};

const KCAL_G = { p: 4, c: 4, f: 9 };

// Las clases van literales para que Tailwind las detecte al escanear el fichero.
const MACROS = [
  { key: 'p', label: 'Proteína', varName: 'data-1', dot: 'bg-data-1', bar: 'bg-data-1' },
  { key: 'c', label: 'Carbohidratos', varName: 'data-2', dot: 'bg-data-2', bar: 'bg-data-2' },
  { key: 'f', label: 'Grasas', varName: 'data-3', dot: 'bg-data-3', bar: 'bg-data-3' },
];

const MEAL_PLANS = {
  3: [
    { name: 'Desayuno', pct: 30 },
    { name: 'Comida', pct: 40 },
    { name: 'Cena', pct: 30 },
  ],
  4: [
    { name: 'Desayuno', pct: 25 },
    { name: 'Comida', pct: 35 },
    { name: 'Merienda', pct: 10 },
    { name: 'Cena', pct: 30 },
  ],
  5: [
    { name: 'Desayuno', pct: 22 },
    { name: 'Media mañana', pct: 10 },
    { name: 'Comida', pct: 32 },
    { name: 'Merienda', pct: 10 },
    { name: 'Cena', pct: 26 },
  ],
};

const R = 42;
const CIRC = 2 * Math.PI * R;

function donut() {
  return `
  <div class="relative mx-auto h-40 w-40 shrink-0">
    <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r="${R}" fill="none" stroke="rgb(var(--surface-muted))" stroke-width="11" />
      ${MACROS.map(
        (m) =>
          `<circle id="arc-${m.key}" cx="50" cy="50" r="${R}" fill="none"
             stroke="rgb(var(--${m.varName}))" stroke-width="11" stroke-linecap="butt"
             stroke-dasharray="0 ${CIRC}" stroke-dashoffset="0"
             class="transition-all duration-500 ease-spring" />`
      ).join('')}
    </svg>
    <div class="absolute inset-0 grid place-items-center text-center">
      <div>
        <p class="text-2xl font-extrabold tabular-nums tracking-tight text-content" id="donut-kcal">—</p>
        <p class="text-2xs font-semibold uppercase tracking-wider text-content-subtle">kcal/día</p>
      </div>
    </div>
  </div>`;
}

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Macros por comida' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de macronutrientes por comida',
      lede: 'Parte de tus calorías objetivo o de tu peso, elige el reparto de macros y obtén los gramos exactos de proteína, carbohidratos y grasa en cada toma del día.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Formulario -->
      <form id="macro-form" class="card min-w-0 p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('Tus datos', 'gauge')}

        <div class="segmented mb-5" role="group" aria-label="Modo de cálculo">
          <button type="button" class="segmented-item" data-mode="kcal" aria-pressed="true">Sé mis calorías</button>
          <button type="button" class="segmented-item" data-mode="peso" aria-pressed="false">Calcular por peso</button>
        </div>

        <div data-panel="kcal">
          <label class="field-label" for="kcal">Calorías diarias</label>
          <div class="relative">
            <input class="input no-spin pr-16" id="kcal" type="number" inputmode="numeric"
                   min="800" max="6000" step="10" value="2200" />
            <span class="input-affix">kcal</span>
          </div>
          <p class="hint">Si no las conoces, cambia a «Calcular por peso».</p>
        </div>

        <div data-panel="peso" hidden>
          <label class="field-label" for="peso">Peso corporal</label>
          <div class="relative">
            <input class="input no-spin pr-16" id="peso" type="number" inputmode="decimal"
                   min="30" max="250" step="0.5" value="70" />
            <span class="input-affix">kg</span>
          </div>

          <p class="field-label mt-4">Objetivo</p>
          <div class="flex flex-wrap gap-2" id="objetivos">
            ${Object.entries(OBJETIVOS)
              .map(
                ([key, o], i) =>
                  `<button type="button" class="chip${i === 1 ? ' chip-active' : ''}" data-objetivo="${key}"
                     aria-pressed="${i === 1}">${o.label}</button>`
              )
              .join('')}
          </div>
          <p class="hint">Estimación orientativa: <strong class="text-content" id="kcal-estimadas">2310</strong> kcal/día.</p>
        </div>

        <div class="mt-6">
          <p class="field-label">Comidas al día</p>
          <div class="segmented" id="comidas" role="group" aria-label="Número de comidas">
            ${[3, 4, 5]
              .map(
                (n) =>
                  `<button type="button" class="segmented-item" data-comidas="${n}"
                     aria-pressed="${n === 4}">${n} tomas</button>`
              )
              .join('')}
          </div>
        </div>

        <fieldset class="mt-6 border-t border-line pt-5">
          <legend class="field-label">Reparto de macronutrientes</legend>
          <div class="space-y-4">
            ${MACROS.map(
              (m) => `
              <div>
                <div class="mb-1.5 flex items-center justify-between text-sm">
                  <span class="flex items-center gap-2 font-medium text-content">
                    <span class="h-2.5 w-2.5 rounded-full ${m.dot}" aria-hidden="true"></span>${m.label}
                  </span>
                  <span class="flex items-baseline gap-2">
                    <output class="text-sm font-semibold tabular-nums text-content" id="pct-${m.key}">30 %</output>
                    <output class="text-xs tabular-nums text-content-subtle" id="g-${m.key}">—</output>
                  </span>
                </div>
                <input type="range" class="range" id="range-${m.key}" data-macro="${m.key}"
                       style="accent-color:rgb(var(--${m.varName}))"
                       min="10" max="70" step="1" value="30" aria-label="Porcentaje de ${m.label}" />
              </div>`
            ).join('')}
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="text-xs text-content-subtle">Presets:</span>
            <button type="button" class="chip !py-1 !text-xs" data-split="40,30,30">40/30/30</button>
            <button type="button" class="chip !py-1 !text-xs" data-split="30,40,30">30/40/30</button>
            <button type="button" class="chip !py-1 !text-xs" data-split="25,50,25">25/50/25</button>
          </div>
        </fieldset>

        ${privacyNote('Ni tu peso ni tus objetivos salen de este dispositivo.')}
      </form>

      <!-- Resultados -->
      <!-- min-w-0 en los dos: la tabla de reparto lleva min-w-[520px] y, como los
           elementos de rejilla traen min-width:auto, esa anchura estiraba la pista
           entera y desbordaba la pagina en movil en vez de desplazarse la tabla. -->
      <section class="min-w-0 lg:col-span-7" aria-live="polite">
        <div class="card p-5 sm:p-6">
          <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            ${donut()}
            <dl class="grid w-full grid-cols-3 gap-2.5 sm:grid-cols-1">
              ${MACROS.map(
                (m) => `
                <div class="flex items-center gap-3 rounded-xl bg-surface-muted p-3 ring-1 ring-inset ring-line">
                  <span class="h-8 w-1.5 shrink-0 rounded-full ${m.bar}"></span>
                  <div class="min-w-0">
                    <dt class="stat-label">${m.label}</dt>
                    <dd class="text-lg font-bold tabular-nums tracking-tight text-content" id="tot-${m.key}">—</dd>
                  </div>
                  <p class="ml-auto hidden text-xs text-content-subtle sm:block" id="extra-${m.key}"></p>
                </div>`
              ).join('')}
            </dl>
          </div>

          <div class="mt-7 border-t border-line pt-5">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              ${panelTitle('Reparto por comidas', 'layers').replace('mb-4', 'mb-0')}
              <p class="text-xs text-content-subtle">Edita el % de cada toma para ajustarlo a tu rutina.</p>
            </div>

            <div class="-mx-2 overflow-x-auto px-2">
              <table class="data-table data-table-flush min-w-[520px]">
                <caption class="sr-only">Gramos de cada macronutriente por comida</caption>
                <thead>
                  <tr>
                    <th scope="col" class="text-left">Comida</th>
                    <th scope="col" class="text-right">% del día</th>
                    <th scope="col" class="text-right">kcal</th>
                    <th scope="col" class="text-right">Proteína</th>
                    <th scope="col" class="text-right">Carbos</th>
                    <th scope="col" class="text-right">Grasas</th>
                  </tr>
                </thead>
                <tbody id="tabla-comidas"></tbody>
                <tfoot>
                  <tr class="border-t-2 border-line-strong font-semibold text-content">
                    <th scope="row" class="py-3 text-left">Total</th>
                    <td class="py-3 text-right tabular-nums" id="foot-pct">100 %</td>
                    <td class="py-3 text-right tabular-nums" id="foot-kcal">—</td>
                    <td class="py-3 text-right tabular-nums" id="foot-p">—</td>
                    <td class="py-3 text-right tabular-nums" id="foot-c">—</td>
                    <td class="py-3 text-right tabular-nums" id="foot-f">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p id="aviso-pct" hidden class="mt-3 flex items-start gap-2 rounded-lg bg-caution-soft p-2.5 text-xs leading-5 text-caution"></p>

            <div class="mt-5 flex flex-wrap gap-2">
              <button type="button" class="btn-primary" id="copy-plan">
                ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar plan</span>
              </button>
              <button type="button" class="btn-secondary" id="reset-comidas">Restablecer reparto</button>
            </div>
          </div>
        </div>

        ${hueco({ format: 'rectangle', className: 'mt-6' })}
      </section>
    </div>

    ${seoArticle(`
      <h2>Cómo calcular tus macronutrientes diarios</h2>
      <p>
        Los <strong>macronutrientes</strong> son los tres nutrientes que aportan energía: proteínas y
        carbohidratos, con cuatro kilocalorías por gramo, y grasas, con nueve. Repartir tus calorías entre ellos
        es el paso siguiente a fijar el total diario, y determina buena parte de los resultados: la proteína
        sostiene la masa muscular, los carbohidratos alimentan el entrenamiento y las grasas son necesarias para
        el equilibrio hormonal.
      </p>
      <p>
        Si aún no conoces tus calorías, el modo de cálculo por peso aplica una estimación rápida y muy utilizada
        en la práctica: alrededor de 29 kcal por kilo en un objetivo de <strong>definición</strong>, 33 kcal por
        kilo en <strong>mantenimiento</strong> y 38 kcal por kilo en <strong>volumen</strong>. Es un punto de
        partida orientativo que conviene ajustar después según cómo evolucione tu peso a lo largo de dos o tres
        semanas.
      </p>
      <h2>Qué reparto de proteínas, carbohidratos y grasas elegir</h2>
      <p>
        El clásico 40/30/30 prioriza la proteína y encaja bien en fases de pérdida de grasa, cuando interesa
        preservar músculo y mantener la saciedad. Un 30/40/30 resulta equilibrado para mantenimiento y para
        quienes entrenan con frecuencia moderada. En etapas de ganancia muscular, un 25/50/25 deja más espacio a
        los carbohidratos, que son el combustible principal del trabajo de fuerza. Una referencia práctica muy
        extendida es apuntar a entre 1,6 y 2,2 gramos de proteína por kilo de peso corporal: la calculadora te
        muestra ese dato en cuanto introduces tu peso.
      </p>
      <h2>Por qué repartir los macros entre las comidas del día</h2>
      <p>
        Distribuir la ingesta en tres, cuatro o cinco tomas facilita cumplir el objetivo sin llegar a la noche
        con la mitad de las calorías pendientes. Repartir la proteína a lo largo del día, en dosis de entre 25 y
        40 gramos por comida, favorece además la síntesis de proteína muscular mejor que concentrarla en una sola
        toma.
      </p>
      <p>
        La tabla es totalmente editable: puedes cambiar el porcentaje de cada comida para dar más peso a la
        ingesta previa al entrenamiento o para dejar una cena ligera. Los gramos se recalculan al instante en tu
        propio navegador. Recuerda que esta herramienta es informativa y no sustituye el consejo de un dietista
        o nutricionista colegiado, especialmente si tienes alguna patología o sigues un tratamiento médico.
      </p>
    `)}

    ${faq([
      {
        q: '¿Puedo cambiar el porcentaje de cada comida?',
        a: 'Sí. Edita el campo de porcentaje de cualquier fila de la tabla; el resto de columnas se recalculan y el pie te avisa si la suma se aleja del 100 %.',
      },
      {
        q: '¿Las calorías estimadas por peso valen para todo el mundo?',
        a: 'Son una aproximación basada en kilocalorías por kilo de peso. No tienen en cuenta edad, sexo, composición corporal ni nivel de actividad, así que úsalas como punto de partida y ajústalas según tu evolución.',
      },
      {
        q: '¿Es un consejo médico?',
        a: 'No. UtiliFast ofrece una herramienta de cálculo con fines informativos. Para pautas personalizadas consulta a un profesional de la nutrición.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);

  const state = {
    mode: 'kcal',
    kcal: 2200,
    peso: 70,
    objetivo: 'mantenimiento',
    comidas: 4,
    split: { p: 30, c: 40, f: 30 },
    meals: MEAL_PLANS[4].map((m) => ({ ...m })),
  };

  /* --- Reparto de macros: al mover un slider, se reajustan los otros dos --- */
  function setMacro(key, value) {
    const v = clamp(Math.round(value), 10, 70);
    const others = ['p', 'c', 'f'].filter((k) => k !== key);
    const rest = 100 - v;
    const sum = others.reduce((a, k) => a + state.split[k], 0);
    let a = sum > 0 ? Math.round((state.split[others[0]] / sum) * rest) : Math.round(rest / 2);
    a = clamp(a, 10, rest - 10);
    state.split = { ...state.split, [key]: v, [others[0]]: a, [others[1]]: rest - a };
  }

  function dailyKcal() {
    if (state.mode === 'peso') return Math.round(state.peso * OBJETIVOS[state.objetivo].kcalKg);
    return Math.round(state.kcal);
  }

  function macroGrams(kcal) {
    return {
      p: (kcal * (state.split.p / 100)) / KCAL_G.p,
      c: (kcal * (state.split.c / 100)) / KCAL_G.c,
      f: (kcal * (state.split.f / 100)) / KCAL_G.f,
    };
  }

  function rowsHtml() {
    const kcal = dailyKcal();
    const tone = { p: 'text-data-1', c: 'text-data-2', f: 'text-data-3' };
    return state.meals
      .map((m, i) => {
        const mealKcal = kcal * (m.pct / 100);
        const g = macroGrams(mealKcal);
        return `
          <tr>
            <th scope="row" class="py-2.5 text-left font-medium text-content">${m.name}</th>
            <td class="py-2 text-right">
              <input class="input no-spin ml-auto !w-[4.5rem] !px-2 !py-1 text-right text-sm" type="number"
                     min="0" max="100" step="1" value="${m.pct}" data-meal="${i}"
                     aria-label="Porcentaje del día en ${m.name}" />
            </td>
            <td class="py-2 text-right tabular-nums text-content-muted">${integer(mealKcal)}</td>
            <td class="py-2 text-right font-medium tabular-nums ${tone.p}">${integer(g.p)} g</td>
            <td class="py-2 text-right font-medium tabular-nums ${tone.c}">${integer(g.c)} g</td>
            <td class="py-2 text-right font-medium tabular-nums ${tone.f}">${integer(g.f)} g</td>
          </tr>`;
      })
      .join('');
  }

  function planText() {
    const kcal = dailyKcal();
    const tot = macroGrams(kcal);
    const lines = [
      `🥗 Mis macros (${integer(kcal)} kcal/día)`,
      `• Proteína ${integer(tot.p)} g · Carbos ${integer(tot.c)} g · Grasas ${integer(tot.f)} g`,
      `• Reparto ${state.split.p}/${state.split.c}/${state.split.f} en ${state.comidas} tomas`,
      '',
    ];
    state.meals.forEach((m) => {
      const g = macroGrams(kcal * (m.pct / 100));
      lines.push(
        `${m.name} (${integer(kcal * (m.pct / 100))} kcal): P ${integer(g.p)} g · C ${integer(
          g.c
        )} g · G ${integer(g.f)} g`
      );
    });
    lines.push('', `Calculado con ${SITE.name}`);
    return lines.join('\n');
  }

  function paintDonut() {
    let offset = 0;
    ['p', 'c', 'f'].forEach((k) => {
      const len = (state.split[k] / 100) * CIRC;
      const arc = el(`arc-${k}`);
      arc.setAttribute('stroke-dasharray', `${len} ${CIRC - len}`);
      arc.setAttribute('stroke-dashoffset', String(-offset));
      offset += len;
    });
  }

  function update() {
    const kcal = dailyKcal();
    const tot = macroGrams(kcal);

    ['p', 'c', 'f'].forEach((k) => {
      el(`pct-${k}`).textContent = `${state.split[k]} %`;
      el(`g-${k}`).textContent = `${integer(tot[k])} g`;
      el(`range-${k}`).value = String(state.split[k]);
      el(`tot-${k}`).textContent = `${integer(tot[k])} g`;
    });

    el('donut-kcal').textContent = integer(kcal);
    el('kcal-estimadas').textContent = integer(state.peso * OBJETIVOS[state.objetivo].kcalKg);
    el('extra-p').textContent = state.peso > 0 ? `${decimal(tot.p / state.peso, 1)} g/kg` : '';
    el('extra-c').textContent = `${state.split.c} % kcal`;
    el('extra-f').textContent = `${state.split.f} % kcal`;

    paintDonut();
    el('tabla-comidas').innerHTML = rowsHtml();

    const sumPct = state.meals.reduce((a, m) => a + m.pct, 0);
    el('foot-pct').textContent = `${integer(sumPct)} %`;
    el('foot-kcal').textContent = integer(kcal * (sumPct / 100));
    el('foot-p').textContent = `${integer(tot.p * (sumPct / 100))} g`;
    el('foot-c').textContent = `${integer(tot.c * (sumPct / 100))} g`;
    el('foot-f').textContent = `${integer(tot.f * (sumPct / 100))} g`;

    const aviso = el('aviso-pct');
    const desviado = Math.abs(sumPct - 100) > 0.5;
    aviso.hidden = !desviado;
    if (desviado) {
      aviso.innerHTML = `${icon('alert', { class: 'mt-0.5 h-3.5 w-3.5 shrink-0' })}
        <span>Los porcentajes por comida suman ${integer(
          sumPct
        )} %. Ajústalos hasta el 100 % para repartir exactamente tus calorías.</span>`;
    }
  }

  /* --- Eventos --- */
  const syncPressed = (selector, active) =>
    root.querySelectorAll(selector).forEach((b) => b.setAttribute('aria-pressed', String(b === active)));

  root.querySelectorAll('[data-mode]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.mode = btn.dataset.mode;
      syncPressed('[data-mode]', btn);
      root.querySelectorAll('[data-panel]').forEach((p) => {
        p.hidden = p.dataset.panel !== state.mode;
      });
      update();
    })
  );

  root.querySelectorAll('[data-objetivo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.objetivo = btn.dataset.objetivo;
      state.split = { ...OBJETIVOS[state.objetivo].split };
      root.querySelectorAll('[data-objetivo]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('chip-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      update();
    })
  );

  root.querySelectorAll('[data-comidas]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.comidas = Number(btn.dataset.comidas);
      state.meals = MEAL_PLANS[state.comidas].map((m) => ({ ...m }));
      syncPressed('[data-comidas]', btn);
      update();
    })
  );

  root.querySelectorAll('[data-macro]').forEach((range) =>
    L.on(range, 'input', () => {
      setMacro(range.dataset.macro, Number(range.value));
      update();
    })
  );

  root.querySelectorAll('[data-split]').forEach((btn) =>
    L.on(btn, 'click', () => {
      const [p, c, f] = btn.dataset.split.split(',').map(Number);
      state.split = { p, c, f };
      update();
    })
  );

  L.on(el('kcal'), 'input', () => {
    state.kcal = clamp(readNumber(el('kcal').value, 2200), 500, 8000);
    update();
  });
  L.on(el('peso'), 'input', () => {
    state.peso = clamp(readNumber(el('peso').value, 70), 20, 300);
    update();
  });

  // Delegación: los inputs de la tabla se recrean en cada render.
  L.on(el('tabla-comidas'), 'input', (e) => {
    const input = e.target.closest('[data-meal]');
    if (!input) return;
    const i = Number(input.dataset.meal);
    state.meals[i].pct = clamp(readNumber(input.value, 0), 0, 100);
    update();
    el('tabla-comidas').querySelector(`[data-meal="${i}"]`)?.focus();
  });

  L.on(el('reset-comidas'), 'click', () => {
    state.meals = MEAL_PLANS[state.comidas].map((m) => ({ ...m }));
    update();
  });

  L.on(el('macro-form'), 'submit', (e) => e.preventDefault());

  bindCopyButton(el('copy-plan'), planText, { label: 'Copiar plan' });

  update();
  return () => L.destroy();
}
