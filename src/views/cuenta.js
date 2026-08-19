import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { money, decimal, readNumber, clamp, escapeHtml } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { cuenta as meta } from '../meta.js';
export { meta };

const DEFAULTS = { total: 120, personas: 4, propina: 0, modo: 'igual' };
const PROPINAS = [0, 5, 10, 15];

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Dividir la cuenta' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Dividir la cuenta del restaurante',
      lede: 'Reparte la cuenta entre todos, añade propina si quieres y comparte el resultado en el grupo. Si no todos habéis consumido lo mismo, cambia al reparto desigual.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="cuenta-form" class="card p-5 sm:p-6 lg:col-span-7" novalidate>
        ${panelTitle('La cuenta', 'wallet')}

        <div class="segmented mb-5" role="group" aria-label="Tipo de reparto">
          <button type="button" class="segmented-item" data-modo="igual" aria-pressed="true">A partes iguales</button>
          <button type="button" class="segmented-item" data-modo="desigual" aria-pressed="false">Reparto desigual</button>
        </div>

        <div data-panel="igual">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="field-label" for="total">Importe de la cuenta</label>
              <div class="relative">
                <input class="input no-spin pr-12 text-lg font-semibold" id="total" type="number"
                       inputmode="decimal" min="0" step="0.01" value="${DEFAULTS.total}" />
                <span class="input-affix">€</span>
              </div>
            </div>
            <div>
              <label class="field-label" for="personas">
                ${icon('users', { class: 'h-4 w-4 text-content-subtle' })} Comensales
              </label>
              <div class="flex items-center gap-2">
                <button type="button" class="btn-icon shrink-0" data-step="-1" aria-label="Quitar comensal">
                  ${icon('minus', { class: 'h-4 w-4' })}
                </button>
                <input class="input no-spin text-center font-semibold" id="personas" type="number"
                       inputmode="numeric" min="1" max="50" step="1" value="${DEFAULTS.personas}" />
                <button type="button" class="btn-icon shrink-0" data-step="1" aria-label="Añadir comensal">
                  ${icon('plus', { class: 'h-4 w-4' })}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div data-panel="desigual" hidden>
          <p class="text-sm leading-6 text-content-muted">
            Escribe lo que ha consumido cada uno. La propina se reparte en proporción a su gasto.
          </p>
          <div class="mt-4 space-y-2" id="lista-personas"></div>
          <button type="button" class="btn-secondary btn-sm mt-3" id="add-persona">
            ${icon('plus', { class: 'h-3.5 w-3.5' })} Añadir persona
          </button>
        </div>

        <fieldset class="mt-6 border-t border-line pt-5">
          <legend class="field-label">Propina</legend>
          <div class="flex flex-wrap items-center gap-2">
            ${PROPINAS.map(
              (p) =>
                `<button type="button" class="chip${p === DEFAULTS.propina ? ' chip-active' : ''}"
                   data-propina="${p}" aria-pressed="${p === DEFAULTS.propina}">${p === 0 ? 'Sin propina' : p + ' %'}</button>`
            ).join('')}
            <div class="relative w-24">
              <input class="input no-spin !py-1.5 pr-8 text-sm" id="propina" type="number"
                     inputmode="decimal" min="0" max="100" step="1" value="${DEFAULTS.propina}"
                     aria-label="Porcentaje de propina personalizado" />
              <span class="input-affix !pr-3 !text-2xs">%</span>
            </div>
          </div>
          <p class="hint">En España la propina es voluntaria; entre un 5 % y un 10 % es lo habitual si el servicio ha gustado.</p>
        </fieldset>

        ${privacyNote()}
      </form>

      <section class="lg:col-span-5" aria-live="polite">
        <div class="card sticky top-24 overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75" id="cabecera-label">Cada uno paga</p>
            <p class="relative mt-1 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight" id="out-persona">—</p>
            <p class="relative mt-2 text-sm text-white/85" id="out-detalle">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="divide-y divide-line">
              <div class="flex items-baseline justify-between gap-4 pb-3">
                <dt class="text-sm text-content-muted">Cuenta</dt>
                <dd class="text-base font-semibold tabular-nums text-content" id="out-base">—</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 py-3" id="fila-propina">
                <dt class="text-sm text-content-muted">Propina <span class="text-content-subtle" id="out-propina-pct"></span></dt>
                <dd class="text-base font-semibold tabular-nums text-data-2" id="out-propina">—</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 pt-3">
                <dt class="text-sm font-semibold text-content">Total a pagar</dt>
                <dd class="text-lg font-bold tabular-nums text-content" id="out-total">—</dd>
              </div>
            </dl>

            <!-- Desglose individual en reparto desigual -->
            <div class="mt-5" id="bloque-desglose" hidden>
              <p class="stat-label mb-2">Reparto</p>
              <ul class="space-y-1.5 text-sm" id="lista-desglose"></ul>
            </div>

            <div class="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" class="btn-primary" id="copy-cuenta">
                ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar reparto</span>
              </button>
              <a class="btn-secondary" id="share-wa" href="#" rel="noopener" target="_blank">
                ${icon('send', { class: 'h-4 w-4' })} Enviar
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Cómo dividir la cuenta sin discusiones</h2>
      <p>
        Repartir una cuenta parece trivial hasta que llega el momento de hacerlo. El método más rápido es
        <strong>a partes iguales</strong>: se divide el total entre el número de comensales y listo. Funciona
        cuando todos habéis pedido algo parecido y nadie se siente agraviado. Es la fórmula por defecto en
        comidas de grupo, cenas de empresa y menús cerrados.
      </p>
      <p>
        El problema aparece cuando alguien solo ha tomado un café y otro se ha pedido entrante, principal y
        postre. Ahí conviene el <strong>reparto desigual</strong>: cada uno aporta lo que ha consumido y la
        propina se reparte en proporción a su gasto, que es la manera más justa de repartirla. Quien más ha
        consumido más ha ocupado al personal, así que asume una parte proporcional del detalle.
      </p>
      <h2>Cuánta propina se deja en España</h2>
      <p>
        A diferencia de Estados Unidos, donde el 15-20 % es prácticamente obligatorio porque forma parte del
        salario del personal, en España la propina es <strong>totalmente voluntaria</strong>. La costumbre
        varía mucho: en un bar es habitual redondear al alza o dejar las monedas del cambio, mientras que en
        un restaurante de mantel el rango típico va del 5 % al 10 % cuando el servicio ha estado bien. En
        comidas de grupo grandes es frecuente que la propina ya venga incluida en la cuenta, así que conviene
        revisarla antes de añadir otra.
      </p>
      <h2>Trucos para que el reparto sea limpio</h2>
      <p>
        Antes de pedir, acordad el criterio: es mucho más incómodo negociarlo con la cuenta encima de la mesa.
        Si vais a pagar con varias tarjetas, pedid al camarero que la divida directamente en el datáfono, algo
        que hoy casi todos los locales aceptan sin problema. Y si paga una sola persona, comparte el desglose
        por el grupo de mensajería en el momento: cuanto más tarde, más difícil es cobrar.
      </p>
      <p>
        Con el botón de copiar obtienes un resumen con el total, la propina y lo que corresponde a cada uno,
        listo para pegar. Todo el cálculo ocurre en tu propio móvil, así que funciona aunque el restaurante no
        tenga buena cobertura.
      </p>
    `)}

    ${faq([
      {
        q: '¿Cómo se reparte la propina si cada uno ha consumido cosas distintas?',
        a: 'Lo más justo es repartirla en proporción a lo que ha gastado cada uno, que es lo que hace el modo de reparto desigual. Repartirla a partes iguales también es válido si el grupo lo prefiere.',
      },
      {
        q: '¿La propina se calcula sobre el importe con IVA?',
        a: 'En España se calcula sobre el total de la cuenta tal y como la entregan, que ya incluye el IVA. Al ser voluntaria, no hay una norma que obligue a otra cosa.',
      },
      {
        q: '¿Puedo usarla para repartir otros gastos de grupo?',
        a: 'Sí, sirve para cualquier gasto compartido: un regalo conjunto, la compra de una casa rural o el alquiler de un coche. Para los gastos de un viaje en coche tienes una calculadora específica con consumo y peajes.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);

  const state = {
    ...DEFAULTS,
    // Reparto desigual: nombre + importe consumido
    gente: [
      { nombre: 'Persona 1', importe: 35 },
      { nombre: 'Persona 2', importe: 28 },
      { nombre: 'Persona 3', importe: 42 },
    ],
  };

  function pintarLista() {
    el('lista-personas').innerHTML = state.gente
      .map(
        (p, i) => `
        <div class="flex items-center gap-2">
          <input class="input !py-2 text-sm" type="text" value="${escapeHtml(p.nombre)}"
                 data-nombre="${i}" aria-label="Nombre de la persona ${i + 1}" />
          <div class="relative w-28 shrink-0">
            <input class="input no-spin !py-2 pr-8 text-right text-sm font-semibold" type="number"
                   inputmode="decimal" min="0" step="0.5" value="${p.importe}"
                   data-importe="${i}" aria-label="Importe de ${escapeHtml(p.nombre)}" />
            <span class="input-affix !pr-3 !text-2xs">€</span>
          </div>
          <button type="button" class="btn-icon !h-9 !w-9 shrink-0" data-quitar="${i}"
                  aria-label="Quitar a ${escapeHtml(p.nombre)}" ${state.gente.length <= 1 ? 'disabled' : ''}>
            ${icon('close', { class: 'h-3.5 w-3.5' })}
          </button>
        </div>`
      )
      .join('');
  }

  function compute() {
    const pct = clamp(state.propina, 0, 100) / 100;
    if (state.modo === 'igual') {
      const base = Math.max(0, state.total);
      const propina = base * pct;
      const personas = clamp(Math.round(state.personas), 1, 50);
      return {
        base,
        propina,
        total: base + propina,
        personas,
        porPersona: (base + propina) / personas,
        detalle: null,
      };
    }
    const base = state.gente.reduce((a, p) => a + Math.max(0, p.importe), 0);
    const propina = base * pct;
    return {
      base,
      propina,
      total: base + propina,
      personas: state.gente.length,
      porPersona: state.gente.length ? (base + propina) / state.gente.length : 0,
      // La propina se reparte en proporción a lo consumido
      detalle: state.gente.map((p) => ({
        nombre: p.nombre,
        importe: Math.max(0, p.importe),
        paga: base > 0 ? Math.max(0, p.importe) * (1 + pct) : 0,
      })),
    };
  }

  let current = compute();

  function summary(r) {
    const lines = ['🍽️ Reparto de la cuenta', `• Cuenta: ${money(r.base)}`];
    if (r.propina > 0) lines.push(`• Propina (${decimal(state.propina, 0)} %): ${money(r.propina)}`);
    lines.push(`• Total: ${money(r.total)}`, '');
    if (r.detalle) {
      r.detalle.forEach((d) => lines.push(`${d.nombre}: ${money(d.paga)}`));
    } else {
      lines.push(`Somos ${r.personas} ➜ ${money(r.porPersona)} cada uno`);
    }
    lines.push('', `Calculado con ${SITE.name}`);
    return lines.join('\n');
  }

  function update() {
    current = compute();
    const r = current;

    el('out-base').textContent = money(r.base);
    el('out-propina').textContent = money(r.propina);
    el('out-propina-pct').textContent = state.propina > 0 ? `(${decimal(state.propina, 0)} %)` : '';
    el('fila-propina').hidden = r.propina === 0;
    el('out-total').textContent = money(r.total);

    if (r.detalle) {
      el('cabecera-label').textContent = 'Total a pagar';
      el('out-persona').textContent = money(r.total);
      el('out-detalle').textContent = `${r.personas} personas · media de ${money(r.porPersona)}`;
      el('bloque-desglose').hidden = false;
      el('lista-desglose').innerHTML = r.detalle
        .map(
          (d) => `
          <li class="flex items-baseline justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2">
            <span class="truncate text-content-muted">${escapeHtml(d.nombre)}</span>
            <span class="shrink-0 font-semibold tabular-nums text-content">${money(d.paga)}</span>
          </li>`
        )
        .join('');
    } else {
      el('cabecera-label').textContent = 'Cada uno paga';
      el('out-persona').textContent = money(r.porPersona);
      el('out-detalle').textContent = `${r.personas} ${
        r.personas === 1 ? 'comensal' : 'comensales'
      } · ${money(r.total)} en total`;
      el('bloque-desglose').hidden = true;
    }

    el('share-wa').href = `https://wa.me/?text=${encodeURIComponent(summary(r))}`;
  }

  /* --- Eventos --- */
  root.querySelectorAll('[data-modo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.modo = btn.dataset.modo;
      root.querySelectorAll('[data-modo]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
      root.querySelectorAll('[data-panel]').forEach((p) => {
        p.hidden = p.dataset.panel !== state.modo;
      });
      update();
    })
  );

  L.on(el('total'), 'input', () => {
    state.total = Math.max(0, readNumber(el('total').value, 0));
    update();
  });
  L.on(el('personas'), 'input', () => {
    state.personas = clamp(readNumber(el('personas').value, 1), 1, 50);
    update();
  });
  root.querySelectorAll('[data-step]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.personas = clamp(state.personas + Number(btn.dataset.step), 1, 50);
      el('personas').value = String(state.personas);
      update();
    })
  );

  const setPropina = (v) => {
    state.propina = clamp(v, 0, 100);
    el('propina').value = String(state.propina);
    root.querySelectorAll('[data-propina]').forEach((b) => {
      const activo = Number(b.dataset.propina) === state.propina;
      b.classList.toggle('chip-active', activo);
      b.setAttribute('aria-pressed', String(activo));
    });
    update();
  };
  root.querySelectorAll('[data-propina]').forEach((btn) =>
    L.on(btn, 'click', () => setPropina(Number(btn.dataset.propina)))
  );
  L.on(el('propina'), 'input', () => setPropina(readNumber(el('propina').value, 0)));

  // Reparto desigual: delegación, la lista se recrea al añadir o quitar
  L.on(el('lista-personas'), 'input', (e) => {
    const nombre = e.target.closest('[data-nombre]');
    const importe = e.target.closest('[data-importe]');
    if (nombre) state.gente[Number(nombre.dataset.nombre)].nombre = nombre.value;
    if (importe) state.gente[Number(importe.dataset.importe)].importe = readNumber(importe.value, 0);
    update();
  });
  L.on(el('lista-personas'), 'click', (e) => {
    const btn = e.target.closest('[data-quitar]');
    if (!btn || state.gente.length <= 1) return;
    state.gente.splice(Number(btn.dataset.quitar), 1);
    pintarLista();
    update();
  });
  L.on(el('add-persona'), 'click', () => {
    state.gente.push({ nombre: `Persona ${state.gente.length + 1}`, importe: 0 });
    pintarLista();
    update();
  });

  L.on(el('cuenta-form'), 'submit', (e) => e.preventDefault());
  bindCopyButton(el('copy-cuenta'), () => summary(current), { label: 'Copiar reparto' });

  pintarLista();
  update();
  return () => L.destroy();
}
