import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { integer, decimal, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { fechas as meta } from '../meta.js';
export { meta };

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MS_DIA = 86400000;

/** Convierte 'YYYY-MM-DD' en fecha local a mediodía: inmune a cambios de horario. */
function parse(valor) {
  if (!valor) return null;
  const [a, m, d] = valor.split('-').map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d, 12, 0, 0, 0);
}

function iso(fecha) {
  const p = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

function largo(fecha) {
  return `${DIAS_SEMANA[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/** Diferencia en años, meses y días de calendario (no en promedios). */
function desglose(desde, hasta) {
  let a = hasta.getFullYear() - desde.getFullYear();
  let m = hasta.getMonth() - desde.getMonth();
  let d = hasta.getDate() - desde.getDate();
  if (d < 0) {
    m -= 1;
    // Días del mes anterior al de destino
    d += new Date(hasta.getFullYear(), hasta.getMonth(), 0).getDate();
  }
  if (m < 0) {
    a -= 1;
    m += 12;
  }
  return { anios: a, meses: m, dias: d };
}

/** Días de lunes a viernes entre dos fechas, sin contar la inicial. */
function laborables(desde, hasta) {
  const ini = new Date(Math.min(desde, hasta));
  const fin = new Date(Math.max(desde, hasta));
  let n = 0;
  const cursor = new Date(ini);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= fin) {
    const dia = cursor.getDay();
    if (dia !== 0 && dia !== 6) n += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return n;
}

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Días entre fechas' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de días entre fechas',
      lede: 'Cuenta los días que separan dos fechas, incluidos solo los laborables, suma o resta plazos a partir de un día concreto y calcula una edad exacta al día.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="fechas-form" class="card p-5 sm:p-6 lg:col-span-6" novalidate>
        ${panelTitle('Qué quieres calcular', 'calendar')}

        <div class="segmented mb-5" role="group" aria-label="Modo de cálculo">
          <button type="button" class="segmented-item" data-modo="diferencia" aria-pressed="true">Entre fechas</button>
          <button type="button" class="segmented-item" data-modo="sumar" aria-pressed="false">Sumar o restar</button>
          <button type="button" class="segmented-item" data-modo="edad" aria-pressed="false">Edad</button>
        </div>

        <!-- Diferencia entre dos fechas -->
        <div data-panel="diferencia">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="field-label" for="desde">Fecha inicial</label>
              <input class="input" id="desde" type="date" />
            </div>
            <div>
              <label class="field-label" for="hasta">Fecha final</label>
              <input class="input" id="hasta" type="date" />
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="chip !py-1 !text-xs" data-rango="7">+1 semana</button>
            <button type="button" class="chip !py-1 !text-xs" data-rango="30">+30 días</button>
            <button type="button" class="chip !py-1 !text-xs" data-rango="90">+90 días</button>
            <button type="button" class="chip !py-1 !text-xs" data-rango="365">+1 año</button>
          </div>
          <label class="mt-4 flex cursor-pointer select-none items-center gap-2.5 text-sm text-content-muted">
            <input id="incluir" type="checkbox"
                   class="h-4 w-4 rounded border-line-strong bg-surface text-accent focus:ring-accent/30" />
            Contar también el día inicial
          </label>
        </div>

        <!-- Sumar o restar plazo -->
        <div data-panel="sumar" hidden>
          <div>
            <label class="field-label" for="base">Fecha de partida</label>
            <input class="input" id="base" type="date" />
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="field-label" for="cantidad">Cantidad</label>
              <input class="input no-spin" id="cantidad" type="number" inputmode="numeric"
                     min="-3650" max="3650" step="1" value="30" />
            </div>
            <div>
              <label class="field-label" for="unidad">Unidad</label>
              <select class="input" id="unidad">
                <option value="dias" selected>Días</option>
                <option value="semanas">Semanas</option>
                <option value="meses">Meses</option>
                <option value="anios">Años</option>
              </select>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="chip !py-1 !text-xs" data-signo="1">Sumar</button>
            <button type="button" class="chip !py-1 !text-xs" data-signo="-1">Restar</button>
          </div>
          <p class="hint">Útil para vencimientos, plazos administrativos o fechas de entrega.</p>
        </div>

        <!-- Edad exacta -->
        <div data-panel="edad" hidden>
          <div>
            <label class="field-label" for="nacimiento">Fecha de nacimiento</label>
            <input class="input" id="nacimiento" type="date" />
          </div>
          <p class="hint">Se calcula respecto al día de hoy, en tu propio dispositivo.</p>
        </div>

        ${privacyNote()}
      </form>

      <section class="lg:col-span-6" aria-live="polite">
        <div class="card sticky top-24 overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75" id="cabecera">Diferencia</p>
            <p class="relative mt-1 text-[2.5rem] font-extrabold leading-none tabular-nums tracking-tight" id="out-principal">—</p>
            <p class="relative mt-2 text-sm text-white/85" id="out-sub">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="grid grid-cols-2 gap-2.5" id="stats"></dl>

            <div class="mt-5 rounded-xl border border-line p-4">
              <p class="text-sm leading-6 text-content-muted" id="out-nota">—</p>
            </div>

            <button type="button" class="btn-primary mt-5 w-full" id="copy-fechas">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar resultado</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Cómo se cuentan los días entre dos fechas</h2>
      <p>
        Calcular cuántos días separan dos fechas parece trivial, pero esconde una decisión que cambia el
        resultado: <strong>si se cuenta o no el día inicial</strong>. La convención habitual es no contarlo, de
        modo que del 1 al 2 de marzo hay un día de diferencia. En plazos administrativos y contractuales, en
        cambio, es frecuente contar ambos extremos, y entonces serían dos. Por eso esta calculadora te deja
        elegir con una casilla.
      </p>
      <p>
        El otro punto delicado son los <strong>años bisiestos</strong>. Un año tiene 365 días salvo los
        divisibles entre 4, que tienen 366, con la excepción de los divisibles entre 100 que no lo sean entre
        400: por eso 2000 fue bisiesto y 1900 no. La herramienta trabaja con fechas de calendario reales, así
        que los bisiestos ya están contemplados sin que tengas que hacer nada.
      </p>
      <h2>Días naturales frente a días laborables</h2>
      <p>
        Muchos plazos no se cuentan en días naturales sino en <strong>días hábiles</strong>, y la diferencia es
        enorme: 30 días naturales equivalen a unos 22 laborables. Esta calculadora descuenta sábados y
        domingos, que es el criterio general. Ten en cuenta que <strong>no descuenta festivos</strong>, porque
        dependen de tu comunidad autónoma y de tu municipio; si el plazo es legalmente relevante, réstalos a
        mano consultando el calendario laboral oficial.
      </p>
      <h2>Sumar plazos y calcular una edad exacta</h2>
      <p>
        Sumar o restar meses tiene una trampa conocida: ¿qué fecha resulta de sumar un mes al 31 de enero? El
        criterio más extendido, y el que aplica esta herramienta, es ajustar al último día del mes de destino,
        de modo que el resultado es el 28 o el 29 de febrero. Es el mismo comportamiento que usan las hojas de
        cálculo.
      </p>
      <p>
        Para la <strong>edad exacta</strong> el cálculo no es una simple división entre 365. Se cuenta cuántos
        cumpleaños completos han pasado y, a partir de ahí, los meses y días sueltos, que es como se expresa
        una edad en la práctica. La calculadora te dice además cuántos días faltan para tu próximo cumpleaños y
        en qué día de la semana caerá.
      </p>
    `)}

    ${faq([
      {
        q: '¿Descuenta los días festivos?',
        a: 'No. Solo descuenta sábados y domingos, porque los festivos varían según la comunidad autónoma y el municipio. Para plazos legales, consulta el calendario laboral oficial y réstalos aparte.',
      },
      {
        q: '¿Cuento el día inicial o no?',
        a: 'Depende del contexto. Por defecto no se cuenta, que es la convención habitual. Si tu plazo lo exige (algunos trámites administrativos lo hacen), marca la casilla correspondiente.',
      },
      {
        q: '¿Qué pasa al sumar un mes al 31 de enero?',
        a: 'El resultado se ajusta al último día del mes de destino: 28 o 29 de febrero según el año. Es el mismo criterio que aplican las hojas de cálculo.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);

  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  const state = { modo: 'diferencia', signo: 1 };

  // Los valores por defecto se ponen aquí, no en render(): así el HTML
  // prerenderizado no queda con la fecha del día del build.
  el('desde').value = iso(hoy);
  el('hasta').value = iso(new Date(hoy.getTime() + 30 * MS_DIA));
  el('base').value = iso(hoy);
  el('nacimiento').value = iso(new Date(hoy.getFullYear() - 30, hoy.getMonth(), hoy.getDate(), 12));

  const stat = (label, valor, nota = '') => `
    <div class="stat">
      <dt class="stat-label">${label}</dt>
      <dd class="stat-value !text-lg">${valor}</dd>
      ${nota ? `<p class="mt-0.5 text-xs text-content-subtle">${nota}</p>` : ''}
    </div>`;

  let texto = '';

  function calcular() {
    if (state.modo === 'diferencia') return diferencia();
    if (state.modo === 'sumar') return sumar();
    return edad();
  }

  function diferencia() {
    const a = parse(el('desde').value);
    const b = parse(el('hasta').value);
    if (!a || !b) return { principal: '—', sub: 'Introduce las dos fechas', stats: '', nota: '' };

    const incluir = el('incluir').checked;
    const dias = Math.round(Math.abs(b - a) / MS_DIA) + (incluir ? 1 : 0);
    const hab = laborables(a, b) + (incluir && ![0, 6].includes(a.getDay()) ? 1 : 0);
    const d = desglose(new Date(Math.min(a, b)), new Date(Math.max(a, b)));
    const futuro = b > a;

    texto = [
      '📅 Diferencia entre fechas',
      `• Del ${largo(a)}`,
      `• Al ${largo(b)}`,
      `• ${integer(dias)} días naturales · ${integer(hab)} laborables`,
      `• Equivale a ${d.anios} años, ${d.meses} meses y ${d.dias} días`,
      '',
      `Calculado con ${SITE.name}`,
    ].join('\n');

    return {
      cabecera: 'Diferencia',
      principal: `${integer(dias)} ${dias === 1 ? 'día' : 'días'}`,
      sub: `${d.anios > 0 ? `${d.anios} ${d.anios === 1 ? 'año' : 'años'}, ` : ''}${d.meses} ${
        d.meses === 1 ? 'mes' : 'meses'
      } y ${d.dias} ${d.dias === 1 ? 'día' : 'días'}`,
      stats:
        stat('Días laborables', integer(hab), 'Sin sábados ni domingos') +
        stat('Semanas', decimal(dias / 7, 1)) +
        stat('Meses aprox.', decimal(dias / 30.44, 1)) +
        stat('Horas', integer(dias * 24)),
      nota: `${futuro ? 'Faltan' : 'Han pasado'} ${integer(dias)} días entre el ${largo(a)} y el ${largo(
        b
      )}.`,
    };
  }

  function sumar() {
    const base = parse(el('base').value);
    if (!base) return { principal: '—', sub: 'Introduce la fecha de partida', stats: '', nota: '' };

    const cantidad = Math.round(readNumber(el('cantidad').value, 0)) * state.signo;
    const unidad = el('unidad').value;
    const r = new Date(base);

    if (unidad === 'dias') r.setDate(r.getDate() + cantidad);
    if (unidad === 'semanas') r.setDate(r.getDate() + cantidad * 7);
    if (unidad === 'anios') r.setFullYear(r.getFullYear() + cantidad);
    if (unidad === 'meses') {
      const diaOriginal = r.getDate();
      r.setDate(1);
      r.setMonth(r.getMonth() + cantidad);
      // Ajuste al último día del mes destino (31 de enero + 1 mes = 28/29 de febrero)
      const ultimo = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
      r.setDate(Math.min(diaOriginal, ultimo));
    }

    const dias = Math.round(Math.abs(r - base) / MS_DIA);
    texto = [
      '📅 Fecha calculada',
      `• Partiendo del ${largo(base)}`,
      `• ${cantidad >= 0 ? 'Sumando' : 'Restando'} ${Math.abs(cantidad)} ${unidad}`,
      `• Resultado: ${largo(r)}`,
      '',
      `Calculado con ${SITE.name}`,
    ].join('\n');

    return {
      cabecera: 'Fecha resultante',
      principal: `${r.getDate()} ${MESES[r.getMonth()].slice(0, 3)} ${r.getFullYear()}`,
      sub: largo(r),
      stats:
        stat('Día de la semana', DIAS_SEMANA[r.getDay()]) +
        stat('Días de diferencia', integer(dias)) +
        stat('Laborables', integer(laborables(base, r))) +
        stat('Semana del año', String(semanaISO(r)), 'Numeración ISO 8601'),
      nota: `${cantidad >= 0 ? 'Sumando' : 'Restando'} ${Math.abs(
        cantidad
      )} ${unidad} al ${largo(base)} se obtiene el ${largo(r)}.`,
    };
  }

  function edad() {
    const nac = parse(el('nacimiento').value);
    if (!nac) return { principal: '—', sub: 'Introduce la fecha de nacimiento', stats: '', nota: '' };
    if (nac > hoy) {
      return {
        cabecera: 'Edad',
        principal: '—',
        sub: 'La fecha aún no ha llegado',
        stats: '',
        nota: 'Introduce una fecha de nacimiento anterior a hoy.',
      };
    }

    const d = desglose(nac, hoy);
    const dias = Math.round((hoy - nac) / MS_DIA);

    // Próximo cumpleaños
    let prox = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate(), 12);
    if (prox < hoy) prox = new Date(hoy.getFullYear() + 1, nac.getMonth(), nac.getDate(), 12);
    const faltan = Math.round((prox - hoy) / MS_DIA);

    texto = [
      '🎂 Edad exacta',
      `• Nacimiento: ${largo(nac)}`,
      `• Edad: ${d.anios} años, ${d.meses} meses y ${d.dias} días`,
      `• Días vividos: ${integer(dias)}`,
      `• Próximo cumpleaños: ${largo(prox)} (faltan ${faltan} días)`,
      '',
      `Calculado con ${SITE.name}`,
    ].join('\n');

    return {
      cabecera: 'Edad exacta',
      principal: `${d.anios} ${d.anios === 1 ? 'año' : 'años'}`,
      sub: `y ${d.meses} ${d.meses === 1 ? 'mes' : 'meses'} y ${d.dias} ${d.dias === 1 ? 'día' : 'días'}`,
      stats:
        stat('Días vividos', integer(dias)) +
        stat('Próximo cumple', faltan === 0 ? '¡Hoy!' : `${faltan} días`) +
        stat('Naciste en', DIAS_SEMANA[nac.getDay()]) +
        stat('Cumples en', DIAS_SEMANA[prox.getDay()]),
      nota:
        faltan === 0
          ? `Hoy cumples ${d.anios} años. ¡Felicidades!`
          : `Cumplirás ${d.anios + 1} años el ${largo(prox)}.`,
    };
  }

  /** Número de semana según ISO 8601 (la semana 1 contiene el primer jueves). */
  function semanaISO(fecha) {
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    const dia = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dia);
    const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - inicio) / MS_DIA + 1) / 7);
  }

  function update() {
    const r = calcular();
    el('cabecera').textContent = r.cabecera || 'Resultado';
    el('out-principal').textContent = r.principal;
    el('out-sub').textContent = r.sub;
    el('stats').innerHTML = r.stats;
    el('out-nota').textContent = r.nota;
  }

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

  root.querySelectorAll('[data-rango]').forEach((btn) =>
    L.on(btn, 'click', () => {
      const desde = parse(el('desde').value) || hoy;
      el('hasta').value = iso(new Date(desde.getTime() + Number(btn.dataset.rango) * MS_DIA));
      update();
    })
  );

  root.querySelectorAll('[data-signo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.signo = Number(btn.dataset.signo);
      root.querySelectorAll('[data-signo]').forEach((b) => {
        const activo = b === btn;
        b.classList.toggle('chip-active', activo);
        b.setAttribute('aria-pressed', String(activo));
      });
      update();
    })
  );

  ['desde', 'hasta', 'base', 'cantidad', 'unidad', 'nacimiento'].forEach((id) =>
    L.on(el(id), 'input', update)
  );
  L.on(el('incluir'), 'change', update);
  L.on(el('fechas-form'), 'submit', (e) => e.preventDefault());

  bindCopyButton(el('copy-fechas'), () => texto, { label: 'Copiar resultado' });

  root.querySelector('[data-signo="1"]')?.classList.add('chip-active');
  update();
  return () => L.destroy();
}
