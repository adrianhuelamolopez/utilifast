import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { money, decimal, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { iva as meta } from '../meta.js';
export { meta };

// Tipos vigentes en España (Ley 37/1992 del IVA).
const TIPOS_IVA = [
  { valor: 21, label: 'General', ejemplo: 'La mayoría de bienes y servicios' },
  { valor: 10, label: 'Reducido', ejemplo: 'Hostelería, transporte, vivienda' },
  { valor: 4, label: 'Superreducido', ejemplo: 'Pan, leche, libros, medicamentos' },
  { valor: 0, label: 'Exento', ejemplo: 'Sanidad, educación, seguros' },
];

// Recargo de equivalencia asociado a cada tipo (régimen especial de minoristas).
// Es un régimen exclusivamente español: con un tipo de otro país da 0, que es
// justo lo correcto, y por eso las búsquedas se hacen con `?? 0`.
const RECARGO = { 21: 5.2, 10: 1.4, 4: 0.5, 0: 0 };

/**
 * Tipos generales de otros países hispanohablantes, verificados para 2026.
 *
 * Van como fila secundaria y no como tarjetas: esta herramienta es de IVA
 * español y es ahí donde compite. Pero el 18 % de las impresiones del sitio
 * viene de Latinoamérica, y quien llega desde México necesitaba saber que el
 * campo «Otro tipo» aceptaba su 16 % en vez de marcharse.
 */
const TIPOS_PAIS = [
  { pais: 'México', valor: 16 },
  { pais: 'Colombia', valor: 19 },
  { pais: 'Chile', valor: 19 },
  { pais: 'Perú', valor: 18, nota: 'IGV' },
  { pais: 'Argentina', valor: 21 },
];

const TIPOS_IRPF = [
  { valor: 0, label: 'Sin retención' },
  { valor: 7, label: '7 % nuevos autónomos' },
  { valor: 15, label: '15 % general' },
];

const DEFAULTS = { importe: 1000, iva: 21, irpf: 0, modo: 'anadir', recargo: false };

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'IVA e IRPF' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de IVA y desglose de facturas',
      lede: 'Añade el IVA a una base imponible o quítalo de un precio que ya lo incluye. Con recargo de equivalencia y retención de IRPF para que la factura cuadre al céntimo.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Formulario -->
      <form id="iva-form" class="card p-5 sm:p-6 lg:col-span-7" novalidate>
        ${panelTitle('Importe y tipo', 'receipt')}

        <div class="segmented mb-5" role="group" aria-label="Qué representa el importe">
          <button type="button" class="segmented-item" data-modo="anadir" aria-pressed="true">
            Añadir IVA
          </button>
          <button type="button" class="segmented-item" data-modo="quitar" aria-pressed="false">
            Quitar IVA
          </button>
        </div>

        <div>
          <label class="field-label" for="importe">
            <span id="importe-label">Base imponible (sin IVA)</span>
          </label>
          <div class="relative">
            <input class="input no-spin pr-12 text-lg font-semibold" id="importe" type="number"
                   inputmode="decimal" min="0" step="0.01" value="${DEFAULTS.importe}" />
            <span class="input-affix">€</span>
          </div>
          <p class="hint" id="importe-hint">Introduce el importe antes de impuestos.</p>
        </div>

        <div class="mt-6">
          <label class="field-label" for="iva">Tipo de IVA</label>
          <div class="grid gap-2 sm:grid-cols-2">
            ${TIPOS_IVA.map(
              (t) => `
              <button type="button" data-tipo-iva="${t.valor}"
                      aria-pressed="${t.valor === DEFAULTS.iva}"
                      class="tipo-card group flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-line-strong">
                <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-sm font-bold tabular-nums text-content-muted transition">
                  ${t.valor}
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-content">${t.label}</span>
                  <span class="mt-0.5 block text-xs leading-5 text-content-subtle">${t.ejemplo}</span>
                </span>
              </button>`
            ).join('')}
          </div>
          <div class="mt-3 flex items-center gap-3">
            <label class="text-xs text-content-subtle" for="iva">Otro tipo</label>
            <div class="relative w-28">
              <input class="input no-spin !py-1.5 pr-8 text-sm" id="iva" type="number"
                     inputmode="decimal" min="0" max="100" step="0.1" value="${DEFAULTS.iva}" />
              <span class="input-affix !pr-3 !text-2xs">%</span>
            </div>
          </div>

          <div class="mt-3 border-t border-line pt-3">
            <p class="text-xs text-content-subtle" id="otros-paises">Tipo general en otros países</p>
            <div class="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="otros-paises">
              ${TIPOS_PAIS.map(
                (p) => `
                <button type="button" class="chip !py-1 !text-xs" data-tipo-iva="${p.valor}">
                  ${p.pais} <span class="font-semibold tabular-nums">${p.valor} %</span>${
                  p.nota ? `<span class="text-content-subtle"> ${p.nota}</span>` : ''
                }
                </button>`
              ).join('')}
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-4 border-t border-line pt-5">
          <label class="flex cursor-pointer select-none items-start gap-3">
            <input id="recargo" type="checkbox"
                   class="mt-0.5 h-4 w-4 rounded border-line-strong bg-surface text-accent focus:ring-accent/30" />
            <span class="min-w-0">
              <span class="block text-sm font-medium text-content">Recargo de equivalencia</span>
              <span class="mt-0.5 block text-xs leading-5 text-content-subtle">
                Régimen especial de comerciantes minoristas. Tipo aplicable:
                <strong class="text-content-muted" id="recargo-tipo">5,2 %</strong>
              </span>
            </span>
          </label>

          <div>
            <p class="field-label">Retención de IRPF</p>
            <div class="flex flex-wrap gap-2">
              ${TIPOS_IRPF.map(
                (t) =>
                  `<button type="button" class="chip !py-1 !text-xs${
                    t.valor === DEFAULTS.irpf ? ' chip-active' : ''
                  }" data-irpf="${t.valor}" aria-pressed="${t.valor === DEFAULTS.irpf}">${
                    t.label
                  }</button>`
              ).join('')}
            </div>
            <p class="hint">Solo en facturas de profesionales a empresas o a otros autónomos.</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between border-t border-line pt-5">
          <p class="text-xs text-content-subtle">Tipos vigentes en España (Ley 37/1992).</p>
          <button type="button" class="btn-ghost btn-sm" id="reset">Restablecer</button>
        </div>
      </form>

      <!-- Resultado -->
      <section class="lg:col-span-5" aria-live="polite">
        <div class="card sticky top-24 overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75" id="total-label">
              Total con IVA
            </p>
            <p class="relative mt-1 text-[2.5rem] font-extrabold leading-none tabular-nums tracking-tight" id="out-total">—</p>
            <p class="relative mt-2 text-sm text-white/85" id="out-detalle">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="divide-y divide-line">
              <div class="flex items-baseline justify-between gap-4 pb-3">
                <dt class="text-sm text-content-muted">Base imponible</dt>
                <dd class="text-base font-semibold tabular-nums text-content" id="out-base">—</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 py-3">
                <dt class="text-sm text-content-muted">
                  Cuota de IVA <span class="text-content-subtle" id="out-iva-tipo"></span>
                </dt>
                <dd class="text-base font-semibold tabular-nums text-data-1" id="out-iva">—</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 py-3" id="fila-recargo" hidden>
                <dt class="text-sm text-content-muted">
                  Recargo de equivalencia <span class="text-content-subtle" id="out-rec-tipo"></span>
                </dt>
                <dd class="text-base font-semibold tabular-nums text-data-2" id="out-recargo">—</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 py-3" id="fila-irpf" hidden>
                <dt class="text-sm text-content-muted">
                  Retención IRPF <span class="text-content-subtle" id="out-irpf-tipo"></span>
                </dt>
                <dd class="text-base font-semibold tabular-nums text-data-3" id="out-irpf">—</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 pt-3">
                <dt class="text-sm font-semibold text-content">Total factura</dt>
                <dd class="text-lg font-bold tabular-nums text-content" id="out-total-linea">—</dd>
              </div>
            </dl>

            <!-- Desglose visual -->
            <div class="mt-5">
              <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted" role="img"
                   aria-label="Proporción entre base imponible e impuestos">
                <div class="h-full bg-accent transition-[width] duration-500 ease-spring" id="bar-base" style="width:100%"></div>
                <div class="h-full bg-data-1 transition-[width] duration-500 ease-spring" id="bar-iva" style="width:0%"></div>
                <div class="h-full bg-data-2 transition-[width] duration-500 ease-spring" id="bar-rec" style="width:0%"></div>
              </div>
              <div class="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-content-muted">
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-accent"></span>Base</span>
                <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-data-1"></span>IVA</span>
                <span class="inline-flex items-center gap-1.5" id="leyenda-rec" hidden><span class="h-2 w-2 rounded-full bg-data-2"></span>Recargo</span>
              </div>
            </div>

            <button type="button" class="btn-primary mt-5 w-full" id="copy-desglose">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar desglose</span>
            </button>

            <details class="group mt-4">
              <summary class="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-content-subtle transition-colors hover:text-content">
                ${icon('chevronDown', { class: 'h-3.5 w-3.5 transition-transform group-open:rotate-180' })}
                Ver el texto que se copiará
              </summary>
              <pre id="out-resumen" class="mt-2 whitespace-pre-wrap rounded-xl bg-surface-muted p-3 font-mono text-2xs leading-5 tracking-normal text-content-muted ring-1 ring-inset ring-line"></pre>
            </details>

            ${privacyNote('Ningún importe se envía ni se guarda.')}
          </div>
        </div>
      </section>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Cómo calcular el IVA de un importe</h2>
      <p>
        El <strong>Impuesto sobre el Valor Añadido</strong> se calcula siempre sobre la base imponible, es
        decir, sobre el precio del producto o servicio antes de impuestos. Para <strong>añadir el IVA</strong>
        basta con multiplicar esa base por el tipo correspondiente y sumarlo: con el tipo general del 21 %, una
        base de 1.000 € genera una cuota de 210 € y un total de 1.210 €.
      </p>
      <p>
        La operación inversa es la que más errores provoca. Para <strong>quitar el IVA</strong> de un precio
        que ya lo incluye no se resta el 21 %, sino que se divide el total entre 1,21. Restar el porcentaje
        directamente da un resultado más bajo del real: de 1.210 €, restar el 21 % daría 955,90 €, cuando la
        base correcta es 1.000 €. Esta calculadora aplica siempre la división, así que el desglose cuadra con
        el que espera Hacienda.
      </p>
      <h2>Qué tipo de IVA aplicar en España</h2>
      <p>
        La Ley 37/1992 establece tres tipos. El <strong>general del 21 %</strong> es el que se aplica por
        defecto a la mayoría de bienes y servicios. El <strong>reducido del 10 %</strong> cubre hostelería,
        transporte de viajeros, entradas a espectáculos o entrega de viviendas. El
        <strong>superreducido del 4 %</strong> queda para productos de primera necesidad como el pan común, la
        leche, los libros, los periódicos y los medicamentos de uso humano. Algunas actividades, como la
        sanidad, la educación reglada o los seguros, están <strong>exentas</strong> y no repercuten IVA.
      </p>
      <h2>Recargo de equivalencia y retención de IRPF</h2>
      <p>
        El <strong>recargo de equivalencia</strong> es un régimen especial obligatorio para los comerciantes
        minoristas que venden a particulares sin transformar el producto. Su proveedor le repercute, además del
        IVA, un porcentaje adicional del 5,2 %, 1,4 % o 0,5 % según el tipo aplicado, y a cambio el minorista
        no presenta declaraciones trimestrales de IVA.
      </p>
      <p>
        La <strong>retención de IRPF</strong> es un asunto distinto: no es un impuesto sobre el consumo, sino un
        anticipo del impuesto sobre la renta del profesional. Se resta del total y la ingresa el cliente, no
        quien factura. El tipo general es del 15 %, reducido al 7 % durante el año de alta y los dos
        siguientes. Solo se aplica en facturas emitidas por profesionales a empresas o a otros autónomos, nunca
        a particulares. Esta herramienta es informativa y no sustituye el criterio de un asesor fiscal.
      </p>
    `)}

    ${faq([
      {
        q: '¿Cómo saco la base imponible de un precio con IVA?',
        a: 'Divide el precio final entre 1 más el tipo en tanto por uno. Con el 21 %, divide entre 1,21; con el 10 %, entre 1,10. Restar el porcentaje al total es el error más habitual y da una base más baja de la real.',
      },
      {
        q: '¿El IRPF se calcula sobre la base o sobre el total con IVA?',
        a: 'Siempre sobre la base imponible, nunca sobre el importe con IVA. Por eso en la factura aparece como una línea que se resta después de haber sumado el IVA.',
      },
      {
        q: '¿Puedo usar un tipo distinto a los oficiales?',
        a: 'Sí. El campo «Otro tipo» acepta cualquier porcentaje, útil para simulaciones o para operaciones con impuestos de otros países. El recargo de equivalencia solo tiene tipo definido para el 21 %, 10 % y 4 %.',
      },
      {
        q: '¿Sirve para calcular el IVA de México, Colombia o Argentina?',
        a: 'Sí. Debajo del campo «Otro tipo» tienes los tipos generales de México (16 %), Colombia (19 %), Chile (19 %), Perú (18 %, allí llamado IGV) y Argentina (21 %). La fórmula es idéntica en todos: para quitar el impuesto de un precio que ya lo incluye se divide entre 1 más el tipo, nunca se resta el porcentaje. Lo que no se aplica fuera de España es el recargo de equivalencia, que es un régimen español para minoristas.',
      },
      {
        q: '¿Se guardan los importes que introduzco?',
        a: 'No. El cálculo se ejecuta íntegramente en tu navegador y nada se envía a ningún servidor.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);

  const state = { ...DEFAULTS };

  function compute() {
    const iva = clamp(state.iva, 0, 100);
    const rec = state.recargo ? RECARGO[iva] ?? 0 : 0;
    const irpf = clamp(state.irpf, 0, 100);
    const importe = Math.max(0, state.importe);

    // Al quitar el IVA hay que dividir, nunca restar el porcentaje.
    const base =
      state.modo === 'quitar' ? importe / (1 + iva / 100 + rec / 100) : importe;

    const cuotaIva = base * (iva / 100);
    const cuotaRec = base * (rec / 100);
    const retencion = base * (irpf / 100);

    return {
      iva,
      rec,
      irpf,
      base,
      cuotaIva,
      cuotaRec,
      retencion,
      conImpuestos: base + cuotaIva + cuotaRec,
      total: base + cuotaIva + cuotaRec - retencion,
    };
  }

  function summary(r) {
    const lines = [
      '🧾 Desglose de la factura',
      `• Base imponible: ${money(r.base)}`,
      `• IVA (${decimal(r.iva, r.iva % 1 ? 1 : 0)} %): ${money(r.cuotaIva)}`,
    ];
    if (r.rec > 0) lines.push(`• Recargo de equivalencia (${decimal(r.rec, 1)} %): ${money(r.cuotaRec)}`);
    if (r.irpf > 0) lines.push(`• Retención IRPF (${decimal(r.irpf, 0)} %): −${money(r.retencion)}`);
    lines.push(`• TOTAL: ${money(r.total)}`, '', `Calculado con ${SITE.name}`);
    return lines.join('\n');
  }

  let current = compute();

  function update() {
    current = compute();
    const r = current;
    const pctIva = decimal(r.iva, r.iva % 1 ? 1 : 0);

    // Etiquetas que dependen del modo
    const quitando = state.modo === 'quitar';
    el('importe-label').textContent = quitando
      ? 'Precio final (IVA incluido)'
      : 'Base imponible (sin IVA)';
    el('importe-hint').textContent = quitando
      ? 'Introduce el importe que ya incluye impuestos.'
      : 'Introduce el importe antes de impuestos.';
    el('total-label').textContent = r.irpf > 0 ? 'Total a percibir' : 'Total con IVA';

    el('out-total').textContent = money(r.total);
    el('out-total-linea').textContent = money(r.total);
    el('out-detalle').textContent =
      `${money(r.base)} + ${pctIva} % de IVA` + (r.rec > 0 ? ` + ${decimal(r.rec, 1)} % de recargo` : '');
    el('out-base').textContent = money(r.base);
    el('out-iva').textContent = money(r.cuotaIva);
    el('out-iva-tipo').textContent = `(${pctIva} %)`;

    el('fila-recargo').hidden = r.rec === 0;
    el('leyenda-rec').hidden = r.rec === 0;
    el('out-recargo').textContent = money(r.cuotaRec);
    el('out-rec-tipo').textContent = `(${decimal(r.rec, 1)} %)`;

    el('fila-irpf').hidden = r.irpf === 0;
    el('out-irpf').textContent = `−${money(r.retencion)}`;
    el('out-irpf-tipo').textContent = `(${decimal(r.irpf, 0)} %)`;

    // Barra proporcional sobre el importe con impuestos (sin restar la retención)
    const tot = r.conImpuestos || 1;
    el('bar-base').style.width = `${(r.base / tot) * 100}%`;
    el('bar-iva').style.width = `${(r.cuotaIva / tot) * 100}%`;
    el('bar-rec').style.width = `${(r.cuotaRec / tot) * 100}%`;

    el('recargo-tipo').textContent = `${decimal(RECARGO[r.iva] ?? 0, 1)} %`;

    // Tipo de IVA activo entre las tarjetas
    root.querySelectorAll('[data-tipo-iva]').forEach((btn) => {
      const activo = Number(btn.dataset.tipoIva) === state.iva;
      btn.setAttribute('aria-pressed', String(activo));
      btn.classList.toggle('border-accent', activo);
      btn.classList.toggle('bg-accent-soft', activo);
      const badge = btn.querySelector('span');
      badge.classList.toggle('bg-accent', activo);
      badge.classList.toggle('text-white', activo);
      badge.classList.toggle('bg-surface-muted', !activo);
      badge.classList.toggle('text-content-muted', !activo);
    });

    const text = summary(r);
    el('out-resumen').textContent = text;
  }

  /* --- Eventos --- */
  root.querySelectorAll('[data-modo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.modo = btn.dataset.modo;
      root.querySelectorAll('[data-modo]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
      update();
    })
  );

  root.querySelectorAll('[data-tipo-iva]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.iva = Number(btn.dataset.tipoIva);
      el('iva').value = String(state.iva);
      update();
    })
  );

  root.querySelectorAll('[data-irpf]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.irpf = Number(btn.dataset.irpf);
      root.querySelectorAll('[data-irpf]').forEach((b) => {
        const activo = b === btn;
        b.classList.toggle('chip-active', activo);
        b.setAttribute('aria-pressed', String(activo));
      });
      update();
    })
  );

  L.on(el('importe'), 'input', () => {
    state.importe = Math.max(0, readNumber(el('importe').value, 0));
    update();
  });

  L.on(el('iva'), 'input', () => {
    state.iva = clamp(readNumber(el('iva').value, 0), 0, 100);
    update();
  });

  L.on(el('recargo'), 'change', () => {
    state.recargo = el('recargo').checked;
    update();
  });

  L.on(el('reset'), 'click', () => {
    Object.assign(state, DEFAULTS);
    el('importe').value = DEFAULTS.importe;
    el('iva').value = DEFAULTS.iva;
    el('recargo').checked = DEFAULTS.recargo;
    root.querySelectorAll('[data-modo]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.modo === DEFAULTS.modo))
    );
    root.querySelectorAll('[data-irpf]').forEach((b) => {
      const activo = Number(b.dataset.irpf) === DEFAULTS.irpf;
      b.classList.toggle('chip-active', activo);
      b.setAttribute('aria-pressed', String(activo));
    });
    update();
  });

  L.on(el('iva-form'), 'submit', (e) => e.preventDefault());

  bindCopyButton(el('copy-desglose'), () => summary(current), { label: 'Copiar desglose' });

  update();
  return () => L.destroy();
}
