import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { decimal, integer, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { cable as meta } from '../meta.js';
export { meta };

// Secciones comerciales (mm²) con su equivalencia AWG aproximada e intensidad
// máxima orientativa en instalación al aire, cable de cobre aislado en PVC.
const SECCIONES = [
  { mm2: 0.5, awg: 20, imax: 9 },
  { mm2: 0.75, awg: 18, imax: 12 },
  { mm2: 1, awg: 17, imax: 15 },
  { mm2: 1.5, awg: 16, imax: 19 },
  { mm2: 2.5, awg: 14, imax: 26 },
  { mm2: 4, awg: 12, imax: 35 },
  { mm2: 6, awg: 10, imax: 46 },
  { mm2: 10, awg: 8, imax: 63 },
  { mm2: 16, awg: 6, imax: 85 },
  { mm2: 25, awg: 4, imax: 112 },
  { mm2: 35, awg: 2, imax: 138 },
  { mm2: 50, awg: 0, imax: 175 },
  { mm2: 70, awg: '2/0', imax: 220 },
  { mm2: 95, awg: '3/0', imax: 265 },
];

// Resistividad del cobre a 20 °C, en ohmios·mm²/m
const RHO_COBRE = 0.0175;

// Fusibles comerciales de automoción (A)
const FUSIBLES = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 150, 200, 250];

const TENSIONES = [
  { v: 12, label: '12 V', detalle: 'Turismo, moto, camper' },
  { v: 24, label: '24 V', detalle: 'Camión, náutica, industrial' },
  { v: 48, label: '48 V', detalle: 'Solar, patinete, golf' },
];

// Caída máxima recomendada según el uso
const CAIDAS = [
  { pct: 2, label: '2 %', detalle: 'Crítico: faros, sensores, audio' },
  { pct: 3, label: '3 %', detalle: 'Recomendado general' },
  { pct: 5, label: '5 %', detalle: 'Tolerante: bombas, ventiladores' },
];

const DEFAULTS = { amperios: 15, longitud: 3, tension: 12, caidaMax: 3 };

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Sección de cable' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Sección de cable para 12 V',
      lede: 'Dime cuántos amperios va a mover el circuito y cuánto cable vas a tirar, y te digo el grosor mínimo en mm², su equivalencia en AWG y qué fusible ponerle. El cálculo tiene en cuenta la caída de tensión, que es lo que de verdad manda en baja tensión.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="cable-form" class="card p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('El circuito', 'bolt')}

        <div class="space-y-5">
          <div>
            <label class="field-label" for="amperios">Consumo del aparato</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="amperios" type="number"
                     inputmode="decimal" min="0.1" max="400" step="0.5" value="${DEFAULTS.amperios}" />
              <span class="input-affix">A</span>
            </div>
            <p class="hint">
              Si solo conoces la potencia, divide entre la tensión:
              <span id="ayuda-vatios">180 W ÷ 12 V = 15 A</span>.
            </p>
          </div>

          <div>
            <label class="field-label" for="longitud">Longitud del tramo</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="longitud" type="number"
                     inputmode="decimal" min="0.1" max="100" step="0.5" value="${DEFAULTS.longitud}" />
              <span class="input-affix">m</span>
            </div>
            <p class="hint">
              Solo la ida. El cálculo ya duplica la distancia para contar el retorno por masa.
            </p>
          </div>
        </div>

        <div class="mt-6 border-t border-line pt-5">
          <p class="field-label">Tensión del sistema</p>
          <div class="segmented" role="group" aria-label="Tensión">
            ${TENSIONES.map(
              (t) =>
                `<button type="button" class="segmented-item" data-tension="${t.v}"
                   aria-pressed="${t.v === DEFAULTS.tension}">${t.label}</button>`
            ).join('')}
          </div>
          <p class="hint" id="tension-detalle">Turismo, moto, camper.</p>
        </div>

        <div class="mt-5">
          <p class="field-label">Caída de tensión máxima</p>
          <div class="grid gap-2">
            ${CAIDAS.map(
              (c) => `
              <button type="button" data-caida="${c.pct}" aria-pressed="${c.pct === DEFAULTS.caidaMax}"
                      class="caida flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition hover:border-line-strong">
                <span class="text-sm text-content-muted">${c.detalle}</span>
                <span class="shrink-0 rounded-md bg-surface-muted px-2 py-0.5 text-2xs font-bold tabular-nums text-content-muted">${c.label}</span>
              </button>`
            ).join('')}
          </div>
        </div>

        ${privacyNote()}
      </form>

      <section class="lg:col-span-7" aria-live="polite">
        <div class="card overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75">Sección mínima recomendada</p>
            <p class="relative mt-1 flex items-baseline gap-2 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight">
              <span id="out-seccion">—</span>
              <span class="text-xl font-bold text-white/70">mm²</span>
            </p>
            <p class="relative mt-2 text-sm text-white/85" id="out-awg">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div class="stat">
                <dt class="stat-label">Caída real</dt>
                <dd class="stat-value !text-base" id="out-caida">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Tensión perdida</dt>
                <dd class="stat-value !text-base" id="out-voltios">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Fusible</dt>
                <dd class="stat-value !text-base" id="out-fusible">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Potencia</dt>
                <dd class="stat-value !text-base" id="out-potencia">—</dd>
              </div>
            </dl>

            <!-- Qué manda: la caída o la intensidad máxima -->
            <div class="mt-5 rounded-xl border border-line p-4">
              <p class="flex items-center gap-2 text-sm font-semibold text-content">
                ${icon('info', { class: 'h-4 w-4 text-content-subtle' })} Qué determina esta sección
              </p>
              <p class="mt-1.5 text-sm leading-6 text-content-muted" id="out-motivo">—</p>
            </div>

            <div id="aviso-largo" hidden
                 class="mt-4 flex items-start gap-3 rounded-xl bg-caution-soft p-4 text-sm leading-6 text-caution ring-1 ring-inset ring-caution/25">
              <span class="mt-0.5 shrink-0">${icon('alert', { class: 'h-4 w-4' })}</span>
              <p id="aviso-largo-texto"></p>
            </div>

            <button type="button" class="btn-primary mt-5 w-full sm:w-auto" id="copy-cable">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar resultado</span>
            </button>
          </div>
        </div>

        ${hueco({ format: 'rectangle', className: 'mt-6' })}
      </section>
    </div>

    <!-- Tabla de secciones -->
    <section class="mt-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Todas las secciones para tu circuito</h2>
          <p class="mt-1.5 text-sm text-content-muted">
            Caída de tensión que tendrías con cada sección comercial en tu tramo.
          </p>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div class="max-h-[26rem] overflow-auto">
          <table class="data-table data-table-inset w-full min-w-[540px]">
            <caption class="sr-only">Secciones comerciales y caída de tensión</caption>
            <thead class="sticky top-0 bg-surface">
              <tr>
                <th scope="col" class="text-left">Sección</th>
                <th scope="col" class="text-right">AWG</th>
                <th scope="col" class="text-right">Intensidad máx.</th>
                <th scope="col" class="text-right">Caída</th>
                <th scope="col" class="text-right">Veredicto</th>
              </tr>
            </thead>
            <tbody id="tabla-secciones"></tbody>
          </table>
        </div>
      </div>
    </section>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Por qué en 12 V manda la caída de tensión</h2>
      <p>
        En una instalación doméstica de 230 V el criterio para elegir el cable suele ser la intensidad máxima
        que aguanta sin calentarse. En <strong>baja tensión</strong> ocurre algo distinto: mucho antes de que
        el cable se caliente, la tensión que llega al aparato ya ha bajado tanto que este funciona mal. Por eso
        la sección se calcula a partir de la <strong>caída de tensión</strong>, no del calentamiento.
      </p>
      <p>
        La razón es aritmética. Perder medio voltio en una línea de 230 V es un 0,2 % y no lo nota nadie; ese
        mismo medio voltio en 12 V es un 4 %, y ahí sí se nota: unos faros que alumbran amarillentos, una
        nevera de camper que arranca con dificultad o un motor que se calienta porque tira más amperios para
        compensar.
      </p>
      <h2>Cómo se calcula</h2>
      <p>
        La fórmula parte de la resistividad del cobre, unos 0,0175 ohmios por milímetro cuadrado y metro. La
        sección necesaria equivale a esa resistividad multiplicada por <strong>el doble de la longitud</strong>
        —hay que contar la ida y el retorno, aunque el retorno vaya por el chasis— y por la intensidad, todo
        ello dividido entre la caída de tensión que estés dispuesto a admitir en voltios.
      </p>
      <p>
        Como referencia práctica: hasta un <strong>3 %</strong> es la recomendación general, un <strong>2 %</strong>
        conviene en circuitos sensibles como iluminación, sensores o audio, y un <strong>5 %</strong> es
        aceptable en cargas poco exigentes como una bomba de agua o un ventilador. Después hay que redondear
        siempre <em>hacia arriba</em> a la sección comercial más próxima, nunca hacia abajo.
      </p>
      <h2>El fusible protege el cable, no el aparato</h2>
      <p>
        Es el error más extendido en las instalaciones caseras. El fusible se dimensiona en función de lo que
        aguanta el <strong>cable</strong>, para que este nunca llegue a arder: debe superar el consumo normal
        del aparato pero quedar por debajo de la intensidad máxima admisible del conductor. Ponerlo demasiado
        grande convierte el cable en la parte más débil del circuito, y un cable no funde limpiamente como un
        fusible: se calienta, derrite el aislante y termina provocando un cortocircuito o un incendio.
      </p>
      <p>
        La regla práctica que aplica esta calculadora es dimensionar el fusible un <strong>25 % por encima
        del consumo continuo</strong> y elegir después un cable que aguante más que el fusible. Si el cable
        va justo al consumo, el único fusible que le cabe saltará con el pico de arranque de cualquier motor.
      </p>
      <p>
        Colócalo además <strong>lo más cerca posible del polo positivo de la batería</strong>, en los primeros
        centímetros del tramo. Un fusible al final de la línea no protege absolutamente nada del cable que hay
        antes de él, que es justo el que más riesgo corre si roza contra el chasis.
      </p>
    `)}

    ${faq([
      {
        q: '¿Por qué se multiplica la longitud por dos?',
        a: 'Porque la corriente tiene que ir y volver. En un vehículo el retorno se hace por el chasis, pero ese camino también tiene resistencia, así que el cálculo estándar cuenta el doble de la distancia para quedarse del lado seguro.',
      },
      {
        q: '¿Vale esta calculadora para 24 V o para 48 V?',
        a: 'Sí. Cambia la tensión del sistema y el cálculo se ajusta: a igual potencia, más tensión significa menos amperios y por tanto menos sección. Es la razón por la que las instalaciones solares grandes trabajan a 48 V.',
      },
      {
        q: '¿Puedo usar cable de más sección de la calculada?',
        a: 'Siempre. Pasarse solo cuesta dinero y algo de rigidez al instalar. Quedarse corto provoca caída de tensión, calentamiento y riesgo de incendio, así que ante la duda sube una medida.',
      },
      {
        q: '¿Sirve para cable de aluminio?',
        a: 'No directamente. El aluminio tiene una resistividad mayor que el cobre, así que necesita aproximadamente un 60 % más de sección para el mismo resultado. Esta herramienta calcula sobre cobre, que es lo habitual en automoción.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const state = { ...DEFAULTS };

  /** Sección teórica mínima por caída de tensión, en mm². */
  function seccionTeorica() {
    const caidaV = state.tension * (state.caidaMax / 100);
    if (caidaV <= 0) return Infinity;
    return (2 * state.longitud * RHO_COBRE * state.amperios) / caidaV;
  }

  function caidaCon(mm2) {
    return ((2 * state.longitud * RHO_COBRE * state.amperios) / mm2 / state.tension) * 100;
  }

  // El fusible se dimensiona un 25 % por encima del consumo continuo, y el cable
  // tiene que aguantar más que el fusible. Si el cable va justo al consumo, el
  // fusible que le cabe salta al primer pico de arranque.
  const MARGEN = 1.25;

  function elegir() {
    const teorica = seccionTeorica();
    // Debe cumplir a la vez la caída objetivo y la intensidad máxima con margen
    const porCaida = SECCIONES.find((s) => s.mm2 >= teorica);
    const porIntensidad = SECCIONES.find((s) => s.imax >= state.amperios * MARGEN);
    if (!porCaida || !porIntensidad) return null;

    const elegida = porCaida.mm2 >= porIntensidad.mm2 ? porCaida : porIntensidad;
    return {
      ...elegida,
      teorica,
      motivo: porCaida.mm2 >= porIntensidad.mm2 ? 'caida' : 'intensidad',
      porCaida,
      porIntensidad,
    };
  }

  function fusible(imax) {
    // Por encima del consumo con margen, y siempre por debajo de lo que aguanta el cable
    const candidatos = FUSIBLES.filter((f) => f >= state.amperios * MARGEN && f <= imax);
    return candidatos.length ? candidatos[0] : null;
  }

  let resumen = '';

  function update() {
    const r = elegir();
    el('ayuda-vatios').textContent = `${integer(state.amperios * state.tension)} W ÷ ${
      state.tension
    } V = ${decimal(state.amperios, 1)} A`;

    if (!r) {
      el('out-seccion').textContent = '—';
      el('out-awg').textContent = 'Consumo fuera del rango de esta tabla';
      el('out-motivo').textContent =
        'Para más de 265 A conviene calcular con tablas de instalación específicas y cable de batería.';
      el('tabla-secciones').innerHTML = '';
      return;
    }

    const caidaReal = caidaCon(r.mm2);
    const voltios = state.tension * (caidaReal / 100);
    const fus = fusible(r.imax);

    el('out-seccion').textContent = decimal(r.mm2, r.mm2 < 1 ? 2 : r.mm2 < 10 ? 1 : 0);
    el('out-awg').textContent = `Equivale a AWG ${r.awg} · admite hasta ${r.imax} A`;
    el('out-caida').textContent = `${decimal(caidaReal, 2)} %`;
    el('out-voltios').textContent = `${decimal(voltios, 2)} V`;
    el('out-fusible').textContent = fus ? `${decimal(fus, fus % 1 ? 1 : 0)} A` : '—';
    el('out-potencia').textContent = `${integer(state.amperios * state.tension)} W`;

    el('out-motivo').innerHTML =
      r.motivo === 'caida'
        ? `Manda la <strong class="font-semibold text-content">caída de tensión</strong>. Por intensidad
           bastarían ${decimal(r.porIntensidad.mm2, 1)} mm², pero con esa sección perderías
           ${decimal(caidaCon(r.porIntensidad.mm2), 2)} % en ${decimal(state.longitud, 1)} m.
           La sección teórica exacta es ${decimal(r.teorica, 2)} mm², redondeada al alza.`
        : `Manda la <strong class="font-semibold text-content">intensidad máxima</strong>. Por caída de
           tensión bastarían ${decimal(r.porCaida.mm2, 1)} mm², pero el cable debe soportar
           ${decimal(state.amperios * MARGEN, 1)} A —un 25 % por encima del consumo— para que quepa un
           fusible que no salte con los picos de arranque.`;

    const aviso = el('aviso-largo');
    if (state.longitud >= 10 && caidaReal > state.caidaMax * 0.9) {
      aviso.hidden = false;
      el('aviso-largo-texto').innerHTML = `Con ${decimal(
        state.longitud,
        1
      )} m estás en un tramo largo para ${state.tension} V. Si puedes, acerca el aparato a la batería o sube
      la tensión del sistema: ambas cosas reducen la sección necesaria mucho más que cambiar de cable.`;
    } else {
      aviso.hidden = true;
    }

    el('tabla-secciones').innerHTML = SECCIONES.map((s) => {
      const c = caidaCon(s.mm2);
      const okCaida = c <= state.caidaMax;
      const okIntensidad = s.imax >= state.amperios * MARGEN;
      const vale = okCaida && okIntensidad;
      const elegida = s.mm2 === r.mm2;
      return `
        <tr class="${elegida ? 'bg-accent-soft' : ''}">
          <th scope="row" class="py-2.5 text-left font-semibold tabular-nums text-content">
            ${decimal(s.mm2, s.mm2 < 1 ? 2 : s.mm2 < 10 ? 1 : 0)} mm²
            ${elegida ? '<span class="ml-1.5 text-2xs font-bold uppercase tracking-wider text-accent">elegida</span>' : ''}
          </th>
          <td class="py-2 text-right tabular-nums text-content-subtle">${s.awg}</td>
          <td class="py-2 text-right tabular-nums text-content-muted">${s.imax} A</td>
          <td class="py-2 text-right font-medium tabular-nums ${okCaida ? 'text-positive' : 'text-data-3'}">${decimal(
            c,
            2
          )} %</td>
          <td class="py-2 text-right text-xs ${vale ? 'text-positive' : 'text-content-subtle'}">${
            vale ? 'Válida' : !okIntensidad ? 'No aguanta la corriente' : 'Cae demasiado'
          }</td>
        </tr>`;
    }).join('');

    resumen = [
      '⚡ Sección de cable',
      `• Circuito: ${decimal(state.amperios, 1)} A · ${decimal(state.longitud, 1)} m · ${state.tension} V`,
      `• Sección mínima: ${decimal(r.mm2, 1)} mm² (AWG ${r.awg})`,
      `• Caída real: ${decimal(caidaReal, 2)} % (${decimal(voltios, 2)} V)`,
      fus ? `• Fusible: ${decimal(fus, fus % 1 ? 1 : 0)} A junto al positivo de la batería` : '',
      '',
      `Calculado con ${SITE.name}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  L.on(el('amperios'), 'input', () => {
    state.amperios = clamp(readNumber(el('amperios').value, 1), 0.1, 400);
    update();
  });
  L.on(el('longitud'), 'input', () => {
    state.longitud = clamp(readNumber(el('longitud').value, 1), 0.1, 100);
    update();
  });

  root.querySelectorAll('[data-tension]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.tension = Number(btn.dataset.tension);
      root.querySelectorAll('[data-tension]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
      el('tension-detalle').textContent =
        TENSIONES.find((t) => t.v === state.tension).detalle + '.';
      update();
    })
  );

  root.querySelectorAll('[data-caida]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.caidaMax = Number(btn.dataset.caida);
      root.querySelectorAll('[data-caida]').forEach((b) => {
        const activo = b === btn;
        b.setAttribute('aria-pressed', String(activo));
        b.classList.toggle('border-accent', activo);
        b.classList.toggle('bg-accent-soft', activo);
      });
      update();
    })
  );

  L.on(el('cable-form'), 'submit', (e) => e.preventDefault());
  bindCopyButton(el('copy-cable'), () => resumen, { label: 'Copiar resultado' });

  root.querySelector(`[data-caida="${DEFAULTS.caidaMax}"]`)?.classList.add('border-accent', 'bg-accent-soft');
  update();
  return () => L.destroy();
}
