import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { integer, decimal, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { calorias as meta } from '../meta.js';
export { meta };

const ACTIVIDAD = [
  { id: 'sedentario', factor: 1.2, label: 'Sedentario', detalle: 'Trabajo de oficina, sin ejercicio' },
  { id: 'ligero', factor: 1.375, label: 'Ligero', detalle: 'Ejercicio suave 1-3 días por semana' },
  { id: 'moderado', factor: 1.55, label: 'Moderado', detalle: 'Ejercicio 3-5 días por semana' },
  { id: 'alto', factor: 1.725, label: 'Alto', detalle: 'Ejercicio intenso 6-7 días por semana' },
  { id: 'muyalto', factor: 1.9, label: 'Muy alto', detalle: 'Trabajo físico o doble sesión diaria' },
];

const OBJETIVOS = [
  { id: 'perder', ajuste: -0.2, label: 'Perder grasa', detalle: 'Déficit del 20 %' },
  { id: 'mantener', ajuste: 0, label: 'Mantener', detalle: 'Tu gasto real' },
  { id: 'ganar', ajuste: 0.15, label: 'Ganar músculo', detalle: 'Superávit del 15 %' },
];

const DEFAULTS = { sexo: 'mujer', edad: 30, peso: 68, altura: 168, actividad: 'moderado', objetivo: 'mantener' };

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Calorías diarias' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de calorías diarias',
      lede: 'Calcula tu metabolismo basal y tu gasto energético total con la fórmula que hoy se considera más precisa, y ajústalo a tu objetivo. Después reparte esas calorías en tus comidas.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="cal-form" class="card p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('Tus datos', 'gauge')}

        <div class="segmented mb-5" role="group" aria-label="Sexo">
          <button type="button" class="segmented-item" data-sexo="mujer" aria-pressed="true">Mujer</button>
          <button type="button" class="segmented-item" data-sexo="hombre" aria-pressed="false">Hombre</button>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="field-label" for="edad">Edad</label>
            <div class="relative">
              <input class="input no-spin pr-11" id="edad" type="number" inputmode="numeric"
                     min="15" max="100" step="1" value="${DEFAULTS.edad}" />
              <span class="input-affix !pr-3 !text-2xs">años</span>
            </div>
          </div>
          <div>
            <label class="field-label" for="peso">Peso</label>
            <div class="relative">
              <input class="input no-spin pr-9" id="peso" type="number" inputmode="decimal"
                     min="30" max="250" step="0.5" value="${DEFAULTS.peso}" />
              <span class="input-affix !pr-3 !text-2xs">kg</span>
            </div>
          </div>
          <div>
            <label class="field-label" for="altura">Altura</label>
            <div class="relative">
              <input class="input no-spin pr-9" id="altura" type="number" inputmode="numeric"
                     min="120" max="230" step="1" value="${DEFAULTS.altura}" />
              <span class="input-affix !pr-3 !text-2xs">cm</span>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <p class="field-label">Nivel de actividad</p>
          <div class="space-y-2">
            ${ACTIVIDAD.map(
              (a) => `
              <button type="button" data-actividad="${a.id}" aria-pressed="${a.id === DEFAULTS.actividad}"
                      class="nivel flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-line-strong">
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-content">${a.label}</span>
                  <span class="mt-0.5 block text-xs leading-5 text-content-subtle">${a.detalle}</span>
                </span>
                <span class="shrink-0 rounded-md bg-surface-muted px-2 py-0.5 text-2xs font-bold tabular-nums text-content-muted">
                  ×${decimal(a.factor, 3).replace(/0+$/, '').replace(/,$/, '')}
                </span>
              </button>`
            ).join('')}
          </div>
        </div>

        <div class="mt-6 border-t border-line pt-5">
          <p class="field-label">Objetivo</p>
          <div class="segmented" role="group" aria-label="Objetivo">
            ${OBJETIVOS.map(
              (o) =>
                `<button type="button" class="segmented-item" data-objetivo="${o.id}"
                   aria-pressed="${o.id === DEFAULTS.objetivo}">${o.label}</button>`
            ).join('')}
          </div>
          <p class="hint" id="objetivo-detalle">Tu gasto real.</p>
        </div>

        ${privacyNote('Tus datos corporales no salen de este dispositivo.')}
      </form>

      <section class="lg:col-span-7" aria-live="polite">
        <div class="card overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75" id="objetivo-label">
              Calorías para mantener
            </p>
            <p class="relative mt-1 flex items-baseline gap-2 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight">
              <span id="out-objetivo">—</span>
              <span class="text-xl font-bold text-white/70">kcal/día</span>
            </p>
            <p class="relative mt-2 text-sm text-white/85" id="out-diferencia">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="grid grid-cols-2 gap-2.5">
              <div class="stat">
                <dt class="stat-label">Metabolismo basal</dt>
                <dd class="stat-value" id="out-tmb">—</dd>
                <p class="mt-0.5 text-xs text-content-subtle">En reposo absoluto</p>
              </div>
              <div class="stat">
                <dt class="stat-label">Gasto total diario</dt>
                <dd class="stat-value" id="out-get">—</dd>
                <p class="mt-0.5 text-xs text-content-subtle">Con tu actividad</p>
              </div>
            </dl>

            <!-- Reparto del gasto -->
            <div class="mt-5">
              <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted" role="img"
                   aria-label="Proporción entre metabolismo basal y actividad">
                <div class="h-full bg-accent transition-[width] duration-500 ease-spring" id="bar-tmb" style="width:65%"></div>
                <div class="h-full bg-data-2 transition-[width] duration-500 ease-spring" id="bar-act" style="width:35%"></div>
              </div>
              <div class="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-content-muted">
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-accent"></span>Basal
                  <span class="font-semibold text-content" id="pct-tmb">—</span></span>
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-data-2"></span>Actividad
                  <span class="font-semibold text-content" id="pct-act">—</span></span>
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-line p-4" id="bloque-ritmo">
              <p class="flex items-center gap-2 text-sm font-semibold text-content">
                ${icon('clock', { class: 'h-4 w-4 text-content-subtle' })} Ritmo estimado
              </p>
              <p class="mt-1.5 text-sm leading-6 text-content-muted" id="out-ritmo">—</p>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button type="button" class="btn-primary" id="copy-cal">
                ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar resultado</span>
              </button>
              <a class="btn-secondary" href="/macros" data-link>
                ${icon('nutrition', { class: 'h-4 w-4' })} Repartir en macros
              </a>
              <a class="btn-secondary" href="/imc" data-link>
                ${icon('body', { class: 'h-4 w-4' })} Ver mi IMC
              </a>
            </div>

            <div class="mt-5 flex items-start gap-3 rounded-xl bg-caution-soft p-4 text-sm leading-6 text-caution ring-1 ring-inset ring-caution/25">
              <span class="mt-0.5 shrink-0">${icon('alert', { class: 'h-4 w-4' })}</span>
              <p>
                Son <strong class="font-semibold">estimaciones estadísticas</strong>, no medidas de tu
                metabolismo real, que puede desviarse un 10-15 %. No bajes de forma sostenida de 1.200 kcal
                (mujeres) o 1.500 kcal (hombres) sin supervisión profesional.
              </p>
            </div>
          </div>
        </div>

        ${hueco({ format: 'rectangle', className: 'mt-6' })}
      </section>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Qué es el metabolismo basal y en qué se diferencia del gasto total</h2>
      <p>
        El <strong>metabolismo basal</strong> (TMB) es la energía que tu cuerpo consume en reposo absoluto solo
        para seguir vivo: respirar, bombear sangre, mantener la temperatura y renovar tejidos. Supone entre el
        60 % y el 70 % de todo lo que gastas en un día, aunque no muevas un dedo. El <strong>gasto energético
        total</strong> añade a esa base el ejercicio, el trabajo y hasta la digestión.
      </p>
      <p>
        Esta calculadora usa la ecuación de <strong>Mifflin-St Jeor</strong>, publicada en 1990 y considerada
        hoy la más precisa para población general, por encima de la clásica Harris-Benedict. Para mujeres es
        10 × peso + 6,25 × altura − 5 × edad − 161, y para hombres el mismo cálculo sumando 5 en lugar de
        restar 161. El resultado se multiplica por un factor de actividad que va de 1,2 en personas sedentarias
        a 1,9 en quienes hacen trabajo físico o doble sesión de entrenamiento.
      </p>
      <h2>Cuántas calorías necesitas según tu objetivo</h2>
      <p>
        Para <strong>perder grasa</strong> se aplica un déficit moderado, en torno al 20 % del gasto total.
        Bajar más rápido no acelera resultados: aumenta la pérdida de masa muscular y hace la dieta
        insostenible. Un déficit de 500 kcal diarias equivale a unos 3.500 kcal semanales, aproximadamente
        medio kilo de grasa por semana, que es el ritmo que la mayoría de guías consideran seguro.
      </p>
      <p>
        Para <strong>ganar músculo</strong> basta un superávit del 10-15 %. Comer mucho más no construye
        músculo más rápido, porque la síntesis proteica tiene un techo: el exceso se acumula como grasa. Y para
        <strong>mantener</strong>, el objetivo es simplemente igualar tu gasto.
      </p>
      <h2>Del número a la práctica</h2>
      <p>
        Las calorías son solo la mitad de la ecuación. Una vez tienes tu cifra, el paso siguiente es repartirla
        entre proteínas, carbohidratos y grasas, y distribuir esos gramos entre las comidas del día. Elige el
        nivel de actividad con honestidad: sobreestimarlo es el error más común y explica por qué mucha gente
        no ve resultados pese a "hacer dieta". Ajusta la cifra después de dos o tres semanas según cómo
        evolucione tu peso, que es el único dato realmente fiable.
      </p>
    `)}

    ${faq([
      {
        q: '¿Por qué Mifflin-St Jeor y no Harris-Benedict?',
        a: 'La ecuación de Harris-Benedict se formuló en 1919 con una muestra poco representativa de la población actual y tiende a sobreestimar el gasto. Mifflin-St Jeor, de 1990, se ajusta mejor a adultos con sobrepeso, que es el perfil más habitual.',
      },
      {
        q: '¿Debo recalcularlo al perder peso?',
        a: 'Sí. El metabolismo basal depende del peso, así que baja conforme adelgazas. Conviene repetir el cálculo cada 4-5 kg de cambio para que el objetivo siga siendo realista.',
      },
      {
        q: '¿Estas calorías incluyen el ejercicio?',
        a: 'Sí, el factor de actividad ya lo contempla. No sumes aparte las calorías que te marque el reloj o la app de entrenamiento: acabarías contándolas dos veces.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const state = { ...DEFAULTS };

  const actividad = () => ACTIVIDAD.find((a) => a.id === state.actividad);
  const objetivo = () => OBJETIVOS.find((o) => o.id === state.objetivo);

  function compute() {
    const base = 10 * state.peso + 6.25 * state.altura - 5 * state.edad;
    const tmb = state.sexo === 'hombre' ? base + 5 : base - 161;
    const get = tmb * actividad().factor;
    const obj = get * (1 + objetivo().ajuste);
    return { tmb: Math.max(0, tmb), get: Math.max(0, get), objetivo: Math.max(0, obj), diff: obj - get };
  }

  function summary(r) {
    return [
      '🔥 Mis calorías diarias',
      `• Metabolismo basal: ${integer(r.tmb)} kcal`,
      `• Gasto total (${actividad().label.toLowerCase()}): ${integer(r.get)} kcal`,
      `• Objetivo (${objetivo().label.toLowerCase()}): ${integer(r.objetivo)} kcal/día`,
      '',
      'Estimación orientativa, no consejo médico.',
      `Calculado con ${SITE.name}`,
    ].join('\n');
  }

  let current = compute();

  function update() {
    current = compute();
    const r = current;

    el('out-tmb').textContent = `${integer(r.tmb)}`;
    el('out-get').textContent = `${integer(r.get)}`;
    el('out-objetivo').textContent = integer(r.objetivo);
    el('objetivo-label').textContent = `Calorías para ${objetivo().label.toLowerCase()}`;
    el('objetivo-detalle').textContent = objetivo().detalle + '.';

    if (Math.abs(r.diff) < 1) {
      el('out-diferencia').textContent = `Igual a tu gasto total estimado`;
    } else {
      el('out-diferencia').textContent = `${r.diff > 0 ? '+' : '−'}${integer(
        Math.abs(r.diff)
      )} kcal sobre tu gasto de ${integer(r.get)} kcal`;
    }

    const pctTmb = r.get > 0 ? (r.tmb / r.get) * 100 : 0;
    el('bar-tmb').style.width = `${pctTmb}%`;
    el('bar-act').style.width = `${100 - pctTmb}%`;
    el('pct-tmb').textContent = `${integer(pctTmb)} %`;
    el('pct-act').textContent = `${integer(100 - pctTmb)} %`;

    // Ritmo estimado: 7.700 kcal ≈ 1 kg de tejido graso
    const semanal = r.diff * 7;
    const kgSemana = Math.abs(semanal) / 7700;
    if (Math.abs(r.diff) < 1) {
      el('out-ritmo').textContent =
        'Con este objetivo tu peso debería mantenerse estable. Ajusta la cifra si en dos o tres semanas ves una tendencia clara.';
    } else {
      el('out-ritmo').innerHTML = `A este ritmo ${
        r.diff < 0 ? 'perderías' : 'ganarías'
      } en torno a <strong class="font-semibold text-content">${decimal(
        kgSemana,
        2
      )} kg por semana</strong> (${integer(Math.abs(semanal))} kcal semanales). Un kilo de grasa equivale
      a unas 7.700 kcal.`;
    }
  }

  const syncPressed = (sel, activo) =>
    root.querySelectorAll(sel).forEach((b) => b.setAttribute('aria-pressed', String(b === activo)));

  root.querySelectorAll('[data-sexo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.sexo = btn.dataset.sexo;
      syncPressed('[data-sexo]', btn);
      update();
    })
  );

  root.querySelectorAll('[data-actividad]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.actividad = btn.dataset.actividad;
      root.querySelectorAll('[data-actividad]').forEach((b) => {
        const activo = b === btn;
        b.setAttribute('aria-pressed', String(activo));
        b.classList.toggle('border-accent', activo);
        b.classList.toggle('bg-accent-soft', activo);
      });
      update();
    })
  );

  root.querySelectorAll('[data-objetivo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.objetivo = btn.dataset.objetivo;
      syncPressed('[data-objetivo]', btn);
      update();
    })
  );

  [
    ['edad', 15, 100],
    ['peso', 20, 300],
    ['altura', 100, 250],
  ].forEach(([id, min, max]) =>
    L.on(el(id), 'input', () => {
      state[id] = clamp(readNumber(el(id).value, DEFAULTS[id]), min, max);
      update();
    })
  );

  L.on(el('cal-form'), 'submit', (e) => e.preventDefault());
  bindCopyButton(el('copy-cal'), () => summary(current), { label: 'Copiar resultado' });

  // Estado visual inicial del nivel de actividad
  root.querySelector(`[data-actividad="${DEFAULTS.actividad}"]`)?.classList.add('border-accent', 'bg-accent-soft');

  update();
  return () => L.destroy();
}
