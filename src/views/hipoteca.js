import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { money, decimal, integer, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';
import { simular, plazoTexto } from '../calc/hipoteca.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { hipoteca as meta } from '../meta.js';
export { meta };

const DEFAULTS = { importe: 180000, interes: 3.1, anios: 25, extra: 0 };

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Hipoteca' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de hipoteca y cuadro de amortización',
      lede: 'Calcula tu cuota mensual con el sistema francés, mira cuántos intereses pagarás en total y simula qué pasa si aportas algo más cada mes.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="hip-form" class="card p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('Datos del préstamo', 'bank')}

        <div class="space-y-5">
          <div>
            <label class="field-label" for="importe">Importe del préstamo</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="importe" type="number"
                     inputmode="numeric" min="1000" max="2000000" step="1000" value="${DEFAULTS.importe}" />
              <span class="input-affix">€</span>
            </div>
            <p class="hint">El precio de la vivienda menos la entrada que aportas.</p>
          </div>

          <div>
            <label class="field-label" for="interes">Tipo de interés anual</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="interes" type="number"
                     inputmode="decimal" min="0" max="20" step="0.05" value="${DEFAULTS.interes}" />
              <span class="input-affix">%</span>
            </div>
          </div>

          <div>
            <label class="field-label" for="anios">Plazo</label>
            <div class="flex items-center gap-3">
              <input type="range" class="range flex-1" id="anios-range" min="5" max="40" step="1" value="${DEFAULTS.anios}" aria-label="Plazo en años" />
              <div class="relative w-24 shrink-0">
                <input class="input no-spin !py-1.5 pr-12 text-center text-sm font-semibold" id="anios"
                       type="number" inputmode="numeric" min="5" max="40" step="1" value="${DEFAULTS.anios}" />
                <span class="input-affix !pr-3 !text-2xs">años</span>
              </div>
            </div>
          </div>
        </div>

        <fieldset class="mt-6 border-t border-line pt-5">
          <legend class="field-label">Amortización anticipada</legend>
          <label class="field-label !font-normal !text-content-muted" for="extra">
            Aportación extra cada mes
          </label>
          <div class="relative">
            <input class="input no-spin pr-12" id="extra" type="number" inputmode="numeric"
                   min="0" max="5000" step="25" value="${DEFAULTS.extra}" />
            <span class="input-affix">€</span>
          </div>
          <div class="mt-2.5 flex flex-wrap gap-2">
            ${[50, 100, 200, 300].map(
              (v) => `<button type="button" class="chip !py-1 !text-xs" data-extra="${v}">+${v} €</button>`
            ).join('')}
            <button type="button" class="chip !py-1 !text-xs" data-extra="0">Ninguna</button>
          </div>
          <p class="hint">Se aplica a reducción de plazo, la modalidad que más intereses ahorra.</p>
        </fieldset>

        <div class="mt-6 flex items-center justify-between border-t border-line pt-5">
          <p class="text-xs text-content-subtle">Sistema francés (cuota constante).</p>
          <button type="button" class="btn-ghost btn-sm" id="reset">Restablecer</button>
        </div>
      </form>

      <section class="lg:col-span-7" aria-live="polite">
        <div class="card overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75">Cuota mensual</p>
            <p class="relative mt-1 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight" id="out-cuota">—</p>
            <p class="relative mt-2 text-sm text-white/85" id="out-cuota-detalle">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div class="stat">
                <dt class="stat-label">Intereses totales</dt>
                <dd class="stat-value !text-lg" id="out-intereses">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Total a devolver</dt>
                <dd class="stat-value !text-lg" id="out-total">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Duración real</dt>
                <dd class="stat-value !text-lg" id="out-duracion">—</dd>
              </div>
            </dl>

            <div class="mt-5">
              <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted" role="img"
                   aria-label="Proporción entre capital e intereses">
                <div class="h-full bg-accent transition-[width] duration-500 ease-spring" id="bar-capital" style="width:70%"></div>
                <div class="h-full bg-data-3 transition-[width] duration-500 ease-spring" id="bar-intereses" style="width:30%"></div>
              </div>
              <div class="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-content-muted">
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-accent"></span>Capital
                  <span class="font-semibold text-content" id="pct-capital">—</span></span>
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-data-3"></span>Intereses
                  <span class="font-semibold text-content" id="pct-intereses">—</span></span>
              </div>
            </div>

            <!-- Ahorro por amortización anticipada -->
            <div class="mt-5 rounded-xl bg-positive-soft p-4 ring-1 ring-inset ring-positive/20" id="bloque-ahorro" hidden>
              <p class="flex items-center gap-2 text-sm font-semibold text-positive">
                ${icon('spark', { class: 'h-4 w-4' })} Con tu aportación extra
              </p>
              <p class="mt-1.5 text-sm leading-6 text-positive" id="out-ahorro"></p>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button type="button" class="btn-primary" id="copy-hip">
                ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar resumen</span>
              </button>
            </div>
          </div>
        </div>

        ${hueco({ format: 'rectangle', className: 'mt-6' })}
      </section>
    </div>

    <!-- Cuadro de amortización -->
    <section class="mt-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2>Cuadro de amortización año a año</h2>
        <p class="text-sm text-content-muted">Cuánto capital e intereses pagas cada año.</p>
      </div>
      <div class="card overflow-hidden">
        <div class="max-h-[26rem] overflow-auto">
          <table class="data-table data-table-inset w-full min-w-[560px]">
            <caption class="sr-only">Amortización anual del préstamo</caption>
            <thead class="sticky top-0 bg-surface">
              <tr>
                <th scope="col" class="text-left">Año</th>
                <th scope="col" class="text-right">Cuotas pagadas</th>
                <th scope="col" class="text-right">Capital</th>
                <th scope="col" class="text-right">Intereses</th>
                <th scope="col" class="text-right">Pendiente</th>
              </tr>
            </thead>
            <tbody id="tabla-amort"></tbody>
          </table>
        </div>
      </div>
    </section>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Cómo se calcula la cuota de una hipoteca</h2>
      <p>
        Casi todas las hipotecas en España usan el <strong>sistema francés</strong>, que se caracteriza por
        una cuota constante durante toda la vida del préstamo. Lo que cambia mes a mes es su composición: al
        principio la mayor parte se va en intereses y muy poco en amortizar capital, y esa proporción se va
        invirtiendo con los años. Por eso el cuadro de amortización es tan revelador.
      </p>
      <p>
        La fórmula parte de tres datos: el capital prestado, el tipo de interés mensual —el anual dividido
        entre doce— y el número de cuotas. Con 180.000 € al 3,1 % a 25 años salen 300 cuotas de 862,97 €, y
        el total devuelto asciende a 258.892 €: casi 79.000 € solo en intereses. Ese número es el que conviene
        tener delante antes de firmar nada.
      </p>
      <h2>Qué pasa si amortizas anticipadamente</h2>
      <p>
        Aportar dinero extra permite elegir entre <strong>reducir cuota</strong> o <strong>reducir plazo</strong>.
        Reducir plazo ahorra bastante más en intereses, porque elimina directamente los últimos años del
        préstamo, que son los que más capital pendiente arrastran. Esta calculadora simula esa modalidad.
      </p>
      <p>
        El efecto sorprende: sobre el ejemplo anterior, 100 € más al mes recortan tres años y ocho meses y ahorran
        unos 12.700 € en intereses. Cuanto antes se hace la aportación, mayor es el efecto, porque el interés
        se aplica sobre un capital pendiente que se reduce durante más tiempo.
      </p>
      <h2>Qué no incluye este cálculo</h2>
      <p>
        La cuota que ves es la del préstamo puro. A ella hay que sumar los <strong>seguros</strong> (hogar y,
        con frecuencia, vida) que la entidad vincula para bonificar el tipo, y los gastos iniciales de tasación
        y notaría. Tampoco contempla la revisión del tipo en hipotecas variables ligadas al euríbor: para esas,
        introduce el tipo actual y repite el cálculo cuando cambie. Ten en cuenta además que muchas entidades
        aplican una comisión por amortización anticipada durante los primeros años, limitada por ley pero no
        siempre nula. Esta herramienta es informativa y no constituye asesoramiento financiero.
      </p>
    `)}

    ${faq([
      {
        q: '¿Es mejor reducir cuota o reducir plazo?',
        a: 'Reducir plazo ahorra más intereses porque elimina las últimas cuotas del préstamo. Reducir cuota da más holgura mensual. Esta calculadora simula la reducción de plazo, que es la opción financieramente más eficiente.',
      },
      {
        q: '¿El tipo que introduzco es el TIN o la TAE?',
        a: 'Introduce el TIN, que es el que se usa para calcular la cuota. La TAE incorpora comisiones y productos vinculados, sirve para comparar ofertas pero no para calcular la mensualidad.',
      },
      {
        q: '¿Sirve para un préstamo personal o para el coche?',
        a: 'Sí. El sistema de amortización es el mismo, solo cambian los importes y los plazos. Ajusta el capital y los años y el cálculo es igual de válido.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const state = { ...DEFAULTS };

  function filas(anios) {
    return anios
      .map(
        (a) => `
        <tr>
          <th scope="row" class="py-2.5 text-left font-medium text-content">${a.anio}</th>
          <td class="py-2 text-right tabular-nums text-content-subtle">${a.cuotas}</td>
          <td class="py-2 text-right font-medium tabular-nums text-accent">${money(a.capital)}</td>
          <td class="py-2 text-right font-medium tabular-nums text-data-3">${money(a.intereses)}</td>
          <td class="py-2 text-right tabular-nums text-content-muted">${money(a.pendiente)}</td>
        </tr>`
      )
      .join('');
  }


  let base = null;
  let real = null;

  function summary() {
    const lines = [
      '🏠 Simulación de hipoteca',
      `• Importe: ${money(state.importe)} · ${decimal(state.interes, 2)} % · ${state.anios} años`,
      `• Cuota mensual: ${money(base.cuota)}`,
      `• Intereses totales: ${money(real.intereses)}`,
      `• Total a devolver: ${money(real.total)}`,
    ];
    if (state.extra > 0) {
      lines.push(
        `• Con ${money(state.extra)} extra al mes: acabas en ${plazoTexto(real.meses)} y ahorras ${money(
          base.intereses - real.intereses
        )}`
      );
    }
    lines.push('', `Calculado con ${SITE.name}`);
    return lines.join('\n');
  }

  function update() {
    base = simular(state.importe, state.interes, state.anios, 0);
    real = simular(state.importe, state.interes, state.anios, state.extra);
    if (!base || !real) return;

    el('out-cuota').textContent = money(base.cuota);
    el('out-cuota-detalle').textContent = `${money(state.importe)} · ${decimal(
      state.interes,
      2
    )} % · ${state.anios} años`;

    el('out-intereses').textContent = money(real.intereses);
    el('out-total').textContent = money(real.total);
    el('out-duracion').textContent = plazoTexto(real.meses);

    const pctCapital = (state.importe / real.total) * 100;
    el('bar-capital').style.width = `${pctCapital}%`;
    el('bar-intereses').style.width = `${100 - pctCapital}%`;
    el('pct-capital').textContent = `${integer(pctCapital)} %`;
    el('pct-intereses').textContent = `${integer(100 - pctCapital)} %`;

    const bloque = el('bloque-ahorro');
    if (state.extra > 0) {
      const mesesMenos = base.meses - real.meses;
      bloque.hidden = false;
      el('out-ahorro').innerHTML = `Pagando <strong class="font-semibold">${money(
        state.extra
      )}</strong> más cada mes terminas en <strong class="font-semibold">${plazoTexto(
        real.meses
      )}</strong> en lugar de ${plazoTexto(base.meses)}, y ahorras <strong class="font-semibold">${money(
        base.intereses - real.intereses
      )}</strong> en intereses. Son ${mesesMenos} cuotas menos.`;
    } else {
      bloque.hidden = true;
    }

    el('tabla-amort').innerHTML = filas(real.anios);
  }

  L.on(el('importe'), 'input', () => {
    state.importe = clamp(readNumber(el('importe').value, 0), 0, 5000000);
    update();
  });
  L.on(el('interes'), 'input', () => {
    state.interes = clamp(readNumber(el('interes').value, 0), 0, 25);
    update();
  });
  const setAnios = (v) => {
    state.anios = clamp(Math.round(v), 1, 40);
    el('anios').value = String(state.anios);
    el('anios-range').value = String(state.anios);
    update();
  };
  L.on(el('anios'), 'input', () => setAnios(readNumber(el('anios').value, 25)));
  L.on(el('anios-range'), 'input', () => setAnios(Number(el('anios-range').value)));

  L.on(el('extra'), 'input', () => {
    state.extra = clamp(readNumber(el('extra').value, 0), 0, 20000);
    update();
  });
  root.querySelectorAll('[data-extra]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.extra = Number(btn.dataset.extra);
      el('extra').value = String(state.extra);
      update();
    })
  );

  L.on(el('reset'), 'click', () => {
    Object.assign(state, DEFAULTS);
    el('importe').value = DEFAULTS.importe;
    el('interes').value = DEFAULTS.interes;
    el('extra').value = DEFAULTS.extra;
    setAnios(DEFAULTS.anios);
  });

  L.on(el('hip-form'), 'submit', (e) => e.preventDefault());
  bindCopyButton(el('copy-hip'), summary, { label: 'Copiar resumen' });

  update();
  return () => L.destroy();
}
