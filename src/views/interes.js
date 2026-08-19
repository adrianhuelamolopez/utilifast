import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { money, decimal, integer, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';
import { proyectar, aniosEnDuplicar, PERIODOS } from '../calc/interes.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { interes as meta } from '../meta.js';
export { meta };

const PERIODICIDADES = [
  { id: 'mensual', label: 'Mensual' },
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'anual', label: 'Anual' },
];

const DEFAULTS = { inicial: 5000, aportacion: 200, periodicidad: 'mensual', tasa: 6, anios: 20 };

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Interés compuesto' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de interés compuesto',
      lede: 'Proyecta cuánto puede crecer tu ahorro aportando de forma constante durante años. La cifra que sorprende no es el total, sino qué parte de él la ponen los intereses y no tú.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="int-form" class="card p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('Tu plan de ahorro', 'wallet')}

        <div class="space-y-5">
          <div>
            <label class="field-label" for="inicial">Capital inicial</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="inicial" type="number"
                     inputmode="numeric" min="0" max="10000000" step="500" value="${DEFAULTS.inicial}" />
              <span class="input-affix">€</span>
            </div>
            <p class="hint">Lo que tienes ahorrado hoy. Puede ser cero.</p>
          </div>

          <div>
            <label class="field-label" for="aportacion">Aportación periódica</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="aportacion" type="number"
                     inputmode="numeric" min="0" max="100000" step="25" value="${DEFAULTS.aportacion}" />
              <span class="input-affix">€</span>
            </div>
            <div class="segmented mt-2.5" role="group" aria-label="Cada cuánto aportas">
              ${PERIODICIDADES.map(
                (p) =>
                  `<button type="button" class="segmented-item" data-periodo="${p.id}"
                     aria-pressed="${p.id === DEFAULTS.periodicidad}">${p.label}</button>`
              ).join('')}
            </div>
          </div>

          <div>
            <label class="field-label" for="tasa">Rentabilidad anual</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="tasa" type="number"
                     inputmode="decimal" min="0" max="30" step="0.25" value="${DEFAULTS.tasa}" />
              <span class="input-affix">%</span>
            </div>
            <div class="mt-2.5 flex flex-wrap gap-2">
              <button type="button" class="chip !py-1 !text-xs" data-tasa="2">Depósito · 2 %</button>
              <button type="button" class="chip !py-1 !text-xs" data-tasa="6">Bolsa global · 6 %</button>
              <button type="button" class="chip !py-1 !text-xs" data-tasa="8">Optimista · 8 %</button>
            </div>
          </div>

          <div>
            <label class="field-label" for="anios">Durante</label>
            <div class="flex items-center gap-3">
              <input type="range" class="range flex-1" id="anios-range" min="1" max="40" step="1"
                     value="${DEFAULTS.anios}" aria-label="Años de aportación" />
              <div class="relative w-24 shrink-0">
                <input class="input no-spin !py-1.5 pr-12 text-center text-sm font-semibold" id="anios"
                       type="number" inputmode="numeric" min="1" max="40" step="1" value="${DEFAULTS.anios}" />
                <span class="input-affix !pr-3 !text-2xs">años</span>
              </div>
            </div>
          </div>
        </div>

        ${privacyNote()}
      </form>

      <section class="lg:col-span-7" aria-live="polite">
        <div class="card overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75">Capital final</p>
            <p class="relative mt-1 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight" id="out-final">—</p>
            <p class="relative mt-2 text-sm text-white/85" id="out-detalle">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div class="stat">
                <dt class="stat-label">Has aportado tú</dt>
                <dd class="stat-value !text-base" id="out-aportado">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Lo ponen los intereses</dt>
                <dd class="stat-value !text-base" id="out-intereses">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Duplicas cada</dt>
                <dd class="stat-value !text-base" id="out-duplicar">—</dd>
              </div>
            </dl>

            <div class="mt-5">
              <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted" role="img"
                   aria-label="Proporción entre lo aportado y los intereses">
                <div class="h-full bg-accent transition-[width] duration-500 ease-spring" id="bar-aportado" style="width:70%"></div>
                <div class="h-full bg-positive transition-[width] duration-500 ease-spring" id="bar-intereses" style="width:30%"></div>
              </div>
              <div class="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-content-muted">
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-accent"></span>Tu dinero
                  <span class="font-semibold text-content" id="pct-aportado">—</span></span>
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-positive"></span>Intereses
                  <span class="font-semibold text-content" id="pct-intereses">—</span></span>
              </div>
            </div>

            <!-- Evolución año a año, en barras -->
            <div class="mt-6">
              <p class="stat-label mb-2.5">Cómo crece año a año</p>
              <div class="flex h-32 items-end gap-[2px] overflow-hidden rounded-lg bg-surface-muted p-2" id="grafico"></div>
            </div>

            <div class="mt-5 rounded-xl border border-line p-4">
              <p class="text-sm leading-6 text-content-muted" id="out-nota">—</p>
            </div>

            <button type="button" class="btn-primary mt-5 w-full sm:w-auto" id="copy-int">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar proyección</span>
            </button>
          </div>
        </div>

        ${hueco({ format: 'rectangle', className: 'mt-6' })}
      </section>
    </div>

    <!-- Tabla año a año -->
    <section class="mt-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Tu ahorro año a año</h2>
          <p class="mt-1.5 text-sm text-content-muted">
            Fíjate en cuándo los intereses empiezan a superar a lo que aportas tú.
          </p>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div class="max-h-[26rem] overflow-auto">
          <table class="data-table data-table-inset w-full min-w-[520px]">
            <caption class="sr-only">Evolución anual del capital</caption>
            <thead class="sticky top-0 bg-surface">
              <tr>
                <th scope="col" class="text-left">Año</th>
                <th scope="col" class="text-right">Aportado</th>
                <th scope="col" class="text-right">Intereses</th>
                <th scope="col" class="text-right">Capital</th>
              </tr>
            </thead>
            <tbody id="tabla-interes"></tbody>
          </table>
        </div>
      </div>
    </section>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Qué es exactamente el interés compuesto</h2>
      <p>
        El interés simple se calcula siempre sobre el capital que pusiste al principio. El
        <strong>interés compuesto</strong> se calcula sobre el capital <em>más</em> los intereses que ya has
        acumulado, de modo que cada año la base sobre la que se generan rendimientos es mayor que la del año
        anterior. Esa diferencia parece menor al principio y se vuelve enorme con el tiempo.
      </p>
      <p>
        El motivo es que el crecimiento no es lineal sino exponencial. Durante los primeros años la mayor parte
        de lo que ves acumulado lo has puesto tú; llega un punto —normalmente entre el año doce y el
        quince, según la rentabilidad— en el que los intereses generados superan a las aportaciones. A partir
        de ahí el dinero crece más por sí solo que por lo que añades.
      </p>
      <h2>El tiempo importa más que la cantidad</h2>
      <p>
        Es la conclusión menos intuitiva y la más útil. Aportar 200 € al mes durante veinte años produce
        bastante más que aportar 400 € durante diez, aunque en el segundo caso hayas puesto exactamente el
        mismo dinero. Los años que llevan las primeras aportaciones trabajando valen más que su importe.
      </p>
      <p>
        Un atajo mental clásico es la <strong>regla del 72</strong>: dividiendo 72 entre la rentabilidad anual
        obtienes los años aproximados que tarda tu capital en duplicarse. Al 6 % son unos doce años; al 8 %,
        nueve. La calculadora te muestra ese dato para que compruebes cuántas veces se duplicaría tu dinero
        en el plazo que estás planteando.
      </p>
      <h2>Qué rentabilidad es realista</h2>
      <p>
        Los porcentajes propuestos son referencias, no promesas. Un depósito bancario se mueve en cifras bajas
        y con el capital garantizado; la bolsa global ha rendido históricamente en torno al 6-8 % anual a
        largo plazo, pero con caídas fuertes por el camino y sin ninguna garantía de repetirlo. Ninguna
        inversión da un porcentaje constante año tras año: esta proyección asume un rendimiento medio
        uniforme, lo que sirve para entender el efecto pero no para predecir un resultado.
      </p>
      <p>
        Falta además un factor que se come parte del resultado: la <strong>inflación</strong>. Si tu dinero
        crece al 6 % y los precios suben al 2 %, tu poder adquisitivo real crece alrededor de un 4 %. Y las
        comisiones del producto y la fiscalidad de las plusvalías también restan. Esta herramienta es
        informativa y no constituye asesoramiento financiero.
      </p>
    `)}

    ${faq([
      {
        q: '¿Qué diferencia hay entre aportar mensual o anualmente?',
        a: 'Aportando mensualmente el dinero empieza a generar rendimiento antes, así que el resultado es algo mayor que aportando la misma cantidad total una vez al año. La diferencia es pequeña en plazos cortos y se nota más cuanto más largo es el periodo.',
      },
      {
        q: '¿La proyección descuenta la inflación?',
        a: 'No. Muestra el capital nominal. Para estimar el poder adquisitivo real, resta la inflación esperada a la rentabilidad: con un 6 % de rendimiento y un 2 % de inflación, introduce un 4 %.',
      },
      {
        q: '¿Por qué mi banco me da un número distinto?',
        a: 'Suele deberse a la frecuencia de capitalización y a las comisiones. Aquí los intereses se capitalizan con la misma periodicidad que aportas, y no se descuenta ninguna comisión ni impuesto.',
      },
      {
        q: '¿Sirve para calcular una deuda?',
        a: 'El mecanismo es el mismo pero en tu contra, y funciona igual de bien para entenderlo. Para un préstamo con cuotas, la calculadora de hipoteca es más adecuada porque contempla la amortización.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const state = { ...DEFAULTS };

  let actual = null;

  function update() {
    actual = proyectar({
      inicial: state.inicial,
      aportacion: state.aportacion,
      periodicidad: state.periodicidad,
      tasaAnual: state.tasa,
      anios: state.anios,
    });
    const r = actual;
    const porAnio = PERIODOS[state.periodicidad];

    el('out-final').textContent = money(r.final);
    el('out-detalle').textContent = `${money(state.inicial)} iniciales y ${money(
      state.aportacion
    )} ${state.periodicidad === 'anual' ? 'al año' : state.periodicidad === 'trimestral' ? 'al trimestre' : 'al mes'} durante ${
      state.anios
    } años`;

    el('out-aportado').textContent = money(r.aportado);
    el('out-intereses').textContent = money(r.intereses);
    const duplica = aniosEnDuplicar(state.tasa);
    el('out-duplicar').textContent = Number.isFinite(duplica) ? `${decimal(duplica, 1)} años` : '—';

    const pctAportado = r.final > 0 ? (r.aportado / r.final) * 100 : 100;
    el('bar-aportado').style.width = `${pctAportado}%`;
    el('bar-intereses').style.width = `${100 - pctAportado}%`;
    el('pct-aportado').textContent = `${integer(pctAportado)} %`;
    el('pct-intereses').textContent = `${integer(100 - pctAportado)} %`;

    // Gráfico de barras: cada barra es un año, con la parte de intereses destacada
    const max = Math.max(...r.serie.map((s) => s.saldo), 1);
    el('grafico').innerHTML = r.serie
      .map((s) => {
        const alto = (s.saldo / max) * 100;
        const parteIntereses = s.saldo > 0 ? (s.intereses / s.saldo) * 100 : 0;
        return `<div class="flex-1 overflow-hidden rounded-sm bg-accent" style="height:${alto}%"
                     title="Año ${s.anio}: ${money(s.saldo)}">
                  <div class="w-full bg-positive" style="height:${parteIntereses}%"></div>
                </div>`;
      })
      .join('');

    // Año en que los intereses superan a lo aportado
    const cruce = r.serie.find((s) => s.intereses > s.aportado);
    el('out-nota').innerHTML = cruce
      ? `A partir del <strong class="font-semibold text-content">año ${cruce.anio}</strong> los intereses
         acumulados superan a todo lo que has aportado tú. De ahí en adelante tu dinero crece más por sí solo
         que por lo que añades.`
      : `En ${state.anios} años los intereses aún no llegan a superar a tus aportaciones. Alarga el plazo o
         sube la rentabilidad para ver dónde está ese punto de inflexión.`;

    el('tabla-interes').innerHTML = r.serie
      .map(
        (s) => `
        <tr${cruce && s.anio === cruce.anio ? ' class="bg-positive-soft"' : ''}>
          <th scope="row" class="py-2.5 text-left font-medium text-content">${s.anio}</th>
          <td class="py-2 text-right tabular-nums text-content-muted">${money(s.aportado)}</td>
          <td class="py-2 text-right font-medium tabular-nums text-positive">${money(s.intereses)}</td>
          <td class="py-2 text-right font-semibold tabular-nums text-content">${money(s.saldo)}</td>
        </tr>`
      )
      .join('');
  }

  function resumen() {
    const r = actual;
    return [
      '📈 Proyección de ahorro',
      `• ${money(state.inicial)} iniciales + ${money(state.aportacion)} ${
        state.periodicidad === 'anual' ? 'al año' : state.periodicidad === 'trimestral' ? 'al trimestre' : 'al mes'
      }`,
      `• ${decimal(state.tasa, 2)} % anual durante ${state.anios} años`,
      '',
      `• Capital final: ${money(r.final)}`,
      `• Aportado por ti: ${money(r.aportado)}`,
      `• Generado por intereses: ${money(r.intereses)} (${integer(r.pesoIntereses)} % del total)`,
      '',
      'Proyección orientativa. No descuenta inflación, comisiones ni impuestos.',
      `Calculado con ${SITE.name}`,
    ].join('\n');
  }

  [
    ['inicial', 0, 10000000],
    ['aportacion', 0, 100000],
    ['tasa', 0, 30],
  ].forEach(([id, min, max]) =>
    L.on(el(id), 'input', () => {
      state[id] = clamp(readNumber(el(id).value, 0), min, max);
      update();
    })
  );

  const setAnios = (v) => {
    state.anios = clamp(Math.round(v), 1, 40);
    el('anios').value = String(state.anios);
    el('anios-range').value = String(state.anios);
    update();
  };
  L.on(el('anios'), 'input', () => setAnios(readNumber(el('anios').value, 20)));
  L.on(el('anios-range'), 'input', () => setAnios(Number(el('anios-range').value)));

  root.querySelectorAll('[data-periodo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.periodicidad = btn.dataset.periodo;
      root.querySelectorAll('[data-periodo]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
      update();
    })
  );

  root.querySelectorAll('[data-tasa]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.tasa = Number(btn.dataset.tasa);
      el('tasa').value = String(state.tasa);
      update();
    })
  );

  L.on(el('int-form'), 'submit', (e) => e.preventDefault());
  bindCopyButton(el('copy-int'), resumen, { label: 'Copiar proyección' });

  update();
  return () => L.destroy();
}
