import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { decimal, integer, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';
import {
  CARGA, VELOCIDAD, TOLERANCIA, ANCHOS, PERFILES, LLANTAS,
  diametro, circunferencia, equivalentes,
  medida as texto, medidaCompleta as completa,
} from '../calc/neumaticos.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { neumaticos as meta } from '../meta.js';
export { meta };

const INDICES_CARGA = Object.keys(CARGA).map(Number);

const CODIGOS_VELOCIDAD = Object.keys(VELOCIDAD);

const DEFAULTS = { ancho: 205, perfil: 55, llanta: 16, carga: 91, velocidad: 'V' };
const NUEVA = { ancho: 225, perfil: 45, llanta: 17, carga: 94, velocidad: 'W' };


function selectorMedida(prefijo, valores, etiqueta) {
  const campo = (id, opciones, sel, label, extra = '') => `
    <div>
      <label class="sr-only" for="${prefijo}-${id}">${label}</label>
      <select class="input !px-2 text-center font-semibold ${extra}" id="${prefijo}-${id}">
        ${opciones.map((v) => `<option value="${v}"${v === sel ? ' selected' : ''}>${v}</option>`).join('')}
      </select>
    </div>`;
  return `
    <fieldset>
      <legend class="field-label">${etiqueta}</legend>
      <div class="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5">
        ${campo('ancho', ANCHOS, valores.ancho, 'Anchura en milímetros')}
        <span class="text-center text-lg font-bold text-content-subtle">/</span>
        ${campo('perfil', PERFILES, valores.perfil, 'Perfil o serie')}
        <span class="text-center text-sm font-bold text-content-subtle">R</span>
        ${campo('llanta', LLANTAS, valores.llanta, 'Diámetro de llanta en pulgadas')}
      </div>
      <div class="mt-2 grid grid-cols-2 gap-1.5">
        ${campo('carga', INDICES_CARGA, valores.carga, 'Índice de capacidad de carga')}
        ${campo('velocidad', CODIGOS_VELOCIDAD, valores.velocidad, 'Categoría de velocidad')}
      </div>
      <p class="hint">
        Medida · índice de carga · categoría de velocidad. Los dos últimos van impresos
        en el flanco justo detrás de la medida (por ejemplo <span class="font-mono">205/55 R16 91V</span>).
      </p>
    </fieldset>`;
}

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Equivalencia de neumáticos' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Comparador',
      title: 'Equivalencia de neumáticos',
      lede: 'Compara la medida que llevas con la que te ofrecen y comprueba los cuatro criterios que aplica el Manual ITV, no solo el diámetro. Incluye el error que introduce en el velocímetro y un listado de medidas equivalentes.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <form id="neu-form" class="card p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('Las dos medidas', 'tyre')}

        <div class="space-y-5">
          ${selectorMedida('act', DEFAULTS, 'Medida actual')}
          <div class="flex items-center gap-3">
            <span class="h-px flex-1 bg-line"></span>
            <span class="text-2xs font-semibold uppercase tracking-wider text-content-subtle">comparar con</span>
            <span class="h-px flex-1 bg-line"></span>
          </div>
          ${selectorMedida('nue', NUEVA, 'Medida nueva')}
        </div>

        <div class="mt-6 flex items-center justify-between border-t border-line pt-5">
          <p class="text-xs text-content-subtle">Tolerancia de referencia: ±${TOLERANCIA} %</p>
          <button type="button" class="btn-ghost btn-sm" id="reset">Restablecer</button>
        </div>

        ${privacyNote()}
      </form>

      <section class="lg:col-span-7" aria-live="polite">
        <div class="card overflow-hidden">
          <div class="relative overflow-hidden p-5 text-white sm:p-6" id="cabecera-resultado">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75">Diferencia de diámetro</p>
            <p class="relative mt-1 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight" id="out-diferencia">—</p>
            <p class="relative mt-2 flex items-center gap-1.5 text-sm text-white/90" id="out-veredicto">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <!-- Los cuatro criterios del Manual ITV, uno a uno -->
            <p class="stat-label mb-3">Criterios del Manual ITV</p>
            <ul class="mb-6 divide-y divide-line rounded-xl border border-line" id="criterios"></ul>

            <dl class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div class="stat">
                <dt class="stat-label">Diámetro actual</dt>
                <dd class="stat-value !text-base" id="out-d-act">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Diámetro nuevo</dt>
                <dd class="stat-value !text-base" id="out-d-nue">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Altura flanco</dt>
                <dd class="stat-value !text-base" id="out-flanco">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Vueltas por km</dt>
                <dd class="stat-value !text-base" id="out-vueltas">—</dd>
              </div>
            </dl>

            <div class="mt-5 rounded-xl border border-line p-4">
              <p class="flex items-center gap-2 text-sm font-semibold text-content">
                ${icon('gauge', { class: 'h-4 w-4 text-content-subtle' })} Efecto en el velocímetro
              </p>
              <p class="mt-1.5 text-sm leading-6 text-content-muted" id="out-velocimetro">—</p>
            </div>

            <button type="button" class="btn-primary mt-5 w-full sm:w-auto" id="copy-neu">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar comparativa</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Medidas equivalentes -->
    <section class="mt-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Medidas equivalentes a la tuya</h2>
          <p class="mt-1.5 text-sm text-content-muted">
            Combinaciones cuyo diámetro no se aleja más del ${TOLERANCIA} % de tu medida actual, con saltos
            realistas de anchura (±30 mm) y de llanta (±2 pulgadas). Comprueba además índice de carga y
            categoría de velocidad contra tu tarjeta ITV.
          </p>
        </div>
        <div class="flex flex-wrap gap-2" id="filtro-llanta" role="group" aria-label="Filtrar por llanta"></div>
      </div>
      <div class="card overflow-hidden">
        <div class="max-h-[26rem] overflow-auto">
          <table class="data-table data-table-inset w-full min-w-[520px]">
            <caption class="sr-only">Medidas de neumático equivalentes</caption>
            <thead class="sticky top-0 bg-surface">
              <tr>
                <th scope="col" class="text-left">Medida</th>
                <th scope="col" class="text-right">Diámetro</th>
                <th scope="col" class="text-right">Diferencia</th>
                <th scope="col" class="text-right">Llanta</th>
              </tr>
            </thead>
            <tbody id="tabla-equiv"></tbody>
          </table>
        </div>
      </div>
      <p id="sin-equivalentes" hidden class="mt-3 text-sm text-content-muted"></p>
    </section>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Cómo se leen las medidas de un neumático</h2>
      <p>
        En el flanco de la rueda aparece una secuencia del tipo <strong>205/55 R16</strong>. El primer número
        es la <strong>anchura</strong> de la banda de rodadura en milímetros. El segundo es el
        <strong>perfil</strong> o serie, y no es una medida absoluta sino un porcentaje: indica que la altura
        del flanco equivale al 55 % de esa anchura, es decir, 112,75 mm. La <strong>R</strong> señala
        construcción radial y el último número es el diámetro de la llanta en pulgadas.
      </p>
      <p>
        Con esos tres datos se obtiene el diámetro total: la llanta convertida a milímetros más dos veces la
        altura del flanco, porque el neumático aparece arriba y abajo. Para 205/55 R16 salen 631,9 mm. Ese
        número es el que de verdad importa al comparar medidas, porque de él dependen las vueltas que da la
        rueda por kilómetro y, con ellas, la lectura del velocímetro y del cuentakilómetros.
      </p>
      <h2>Los cuatro criterios que exige la ITV</h2>
      <p>
        El diámetro es solo uno de los requisitos. Según el Manual de Procedimiento de Inspección ITV, una
        medida se considera equivalente cuando cumple <strong>cuatro condiciones a la vez</strong>: índice de
        capacidad de carga igual o superior al mínimo de la tarjeta ITV; categoría de velocidad igual o
        superior a ese mínimo; diámetro exterior con una tolerancia de <strong>±3 %</strong>; y perfil de
        llanta de montaje correspondiente al neumático. Si falla cualquiera de los cuatro, la medida no es
        equivalente a efectos legales.
      </p>
      <p>
        Esa tolerancia del ±3 % está recogida en la normativa, no es una regla de andar por casa. Tiene sentido
        técnico: por encima de ese margen el velocímetro se desvía de forma apreciable, y con él el
        cuentakilómetros, además de alterarse el comportamiento del ABS y del control de estabilidad, que se
        calibran contando vueltas de rueda.
      </p>
      <p>
        Un caso habitual ilustra bien los cuatro criterios a la vez:
        <a href="/neumaticos/225-45-r17-en-lugar-de-205-55-r16" data-link>montar 225/45 R17 llevando de origen
        205/55 R16</a>, una sustitución muy frecuente al cambiar de llantas.
      </p>
      <p>
        El documento que manda en la inspección es la <strong>tarjeta ITV</strong> de tu vehículo, no lo que
        monte un coche parecido ni lo que se lea en un foro. Esta herramienta comprueba el criterio del
        diámetro, que es el que descarta más opciones de golpe; los índices de carga y velocidad los llevas
        grabados en el flanco del neumático y debes contrastarlos con tu tarjeta antes de comprar.
      </p>
      <h2>Qué cambia al montar una medida distinta</h2>
      <p>
        Subir de llanta manteniendo el diámetro total —lo que se conoce como <em>plus sizing</em>— implica bajar
        el perfil, y eso significa menos flanco. La dirección gana precisión y el coche parece más asentado,
        pero la conducción se vuelve más seca sobre bache y la llanta queda más expuesta a los golpes contra
        bordillos y baches profundos. Ensanchar la banda mejora el agarre en seco, aunque suele penalizar el
        consumo y el ruido de rodadura.
      </p>
      <p>
        Ten en cuenta además que un neumático más ancho o de mayor diámetro puede llegar a rozar con los pasos
        de rueda o con los elementos de la suspensión al girar a tope o con el coche cargado, algo que ninguna
        tabla puede anticipar por ti.
      </p>
    `)}

    ${faq([
      {
        q: '¿Puedo montar cualquier medida que entre en el 3 %?',
        a: 'No. El diámetro es uno de los cuatro criterios del Manual ITV: también deben cumplirse el índice de carga, la categoría de velocidad y el perfil de llanta, siempre contra lo que figure en tu tarjeta ITV. Esta herramienta resuelve el criterio del diámetro; los otros tres los verificas en el flanco del neumático y en tu tarjeta.',
      },
      {
        q: '¿Cómo afecta al velocímetro montar una rueda más grande?',
        a: 'Una rueda de mayor diámetro recorre más distancia por vuelta, así que el velocímetro marca menos de lo que realmente circulas. Con una rueda más pequeña ocurre lo contrario. La herramienta te da la velocidad real para una lectura de 120 km/h.',
      },
      {
        q: '¿Tienen que ser iguales las cuatro ruedas?',
        a: 'Deben ser iguales al menos por eje, y lo recomendable es que las cuatro coincidan en medida y tipo. Mezclar diámetros distintos entre ejes afecta al ABS, al control de estabilidad y, en tracciones totales, al diferencial.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  let filtroLlanta = null;

  const leer = (prefijo) => ({
    ancho: Number(el(`${prefijo}-ancho`).value),
    perfil: Number(el(`${prefijo}-perfil`).value),
    llanta: Number(el(`${prefijo}-llanta`).value),
    carga: Number(el(`${prefijo}-carga`).value),
    velocidad: el(`${prefijo}-velocidad`).value,
  });

  /**
   * Evalúa los criterios del Manual de Procedimiento de Inspección ITV.
   * El cuarto (perfil de llanta de montaje) no es comprobable con estos datos:
   * depende de la anchura de la llanta, que no forma parte de la medida del neumático.
   */
  function criterios(act, nue) {
    const dAct = diametro(act);
    const dNue = diametro(nue);
    const dif = ((dNue - dAct) / dAct) * 100;
    return [
      {
        nombre: 'Diámetro exterior',
        estado: Math.abs(dif) <= TOLERANCIA ? 'ok' : 'no',
        detalle: `${decimal(dNue, 1)} mm frente a ${decimal(dAct, 1)} mm · ${
          dif >= 0 ? '+' : '−'
        }${decimal(Math.abs(dif), 2)} % (tolerancia ±${TOLERANCIA} %)`,
      },
      {
        nombre: 'Índice de capacidad de carga',
        estado: nue.carga >= act.carga ? 'ok' : 'no',
        detalle: `${nue.carga} (${CARGA[nue.carga]} kg) frente a ${act.carga} (${
          CARGA[act.carga]
        } kg) · debe ser igual o superior`,
      },
      {
        nombre: 'Categoría de velocidad',
        estado: VELOCIDAD[nue.velocidad] >= VELOCIDAD[act.velocidad] ? 'ok' : 'no',
        detalle: `${nue.velocidad} (${VELOCIDAD[nue.velocidad]} km/h) frente a ${act.velocidad} (${
          VELOCIDAD[act.velocidad]
        } km/h) · debe ser igual o superior`,
      },
      {
        nombre: 'Perfil de llanta de montaje',
        estado: 'nd',
        detalle:
          'Depende de la anchura de tu llanta, que no va en la medida del neumático. Compruébalo con el fabricante o en tu tarjeta ITV.',
      },
    ];
  }

  /**
   * Combinaciones dentro de la tolerancia, ordenadas por cercanía de diámetro.
   *
   * Filtrar solo por diámetro no basta: un 155/40 R20 tiene el mismo diámetro que
   * un 205/55 R16 y no es una sustitución que nadie plantee. Se acotan también la
   * anchura y el salto de llanta a lo que se monta en la práctica.
   */
  function pintarFiltros(lista, base) {
    const llantas = [...new Set(lista.map((m) => m.llanta))].sort((a, b) => a - b);
    el('filtro-llanta').innerHTML =
      `<button type="button" class="chip !py-1 !text-xs${
        filtroLlanta === null ? ' chip-active' : ''
      }" data-llanta="">Todas</button>` +
      llantas
        .map(
          (l) =>
            `<button type="button" class="chip !py-1 !text-xs${
              filtroLlanta === l ? ' chip-active' : ''
            }" data-llanta="${l}">R${l}${l === base.llanta ? ' ·' : ''}</button>`
        )
        .join('');
  }

  function pintarTabla(lista) {
    const filtrada = filtroLlanta === null ? lista : lista.filter((m) => m.llanta === filtroLlanta);
    const visibles = filtrada.slice(0, 40);
    el('tabla-equiv').innerHTML = visibles
      .map(
        (m) => `
        <tr>
          <th scope="row" class="py-2.5 text-left font-semibold tabular-nums text-content">${texto(m)}</th>
          <td class="py-2 text-right tabular-nums text-content-muted">${decimal(m.d, 1)} mm</td>
          <td class="py-2 text-right font-medium tabular-nums ${
            Math.abs(m.dif) <= 1 ? 'text-positive' : 'text-data-2'
          }">${m.dif >= 0 ? '+' : '−'}${decimal(Math.abs(m.dif), 2)} %</td>
          <td class="py-2 text-right tabular-nums text-content-subtle">R${m.llanta}</td>
        </tr>`
      )
      .join('');

    const aviso = el('sin-equivalentes');
    if (!filtrada.length) {
      aviso.hidden = false;
      aviso.textContent = 'No hay medidas comerciales equivalentes con ese diámetro de llanta.';
    } else if (filtrada.length > visibles.length) {
      aviso.hidden = false;
      aviso.textContent = `Se muestran las ${visibles.length} más próximas de ${filtrada.length} equivalencias encontradas.`;
    } else {
      aviso.hidden = true;
    }
  }

  const ESTADOS = {
    ok: { icono: 'check', clase: 'text-positive', fondo: 'bg-positive-soft', texto: 'Cumple' },
    no: { icono: 'close', clase: 'text-data-3', fondo: 'bg-data-3/10', texto: 'No cumple' },
    nd: { icono: 'info', clase: 'text-content-subtle', fondo: 'bg-surface-muted', texto: 'No comprobable' },
  };

  function pintarCriterios(lista) {
    el('criterios').innerHTML = lista
      .map((c) => {
        const e = ESTADOS[c.estado];
        return `
        <li class="flex items-start gap-3 p-3.5">
          <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${e.fondo} ${e.clase}">
            ${icon(e.icono, { class: 'h-3.5 w-3.5' })}
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-baseline gap-x-2">
              <span class="text-sm font-semibold text-content">${c.nombre}</span>
              <span class="text-2xs font-semibold uppercase tracking-wider ${e.clase}">${e.texto}</span>
            </span>
            <span class="mt-0.5 block text-xs leading-5 text-content-muted">${c.detalle}</span>
          </span>
        </li>`;
      })
      .join('');
  }

  let resumen = '';

  function update() {
    const act = leer('act');
    const nue = leer('nue');
    const dAct = diametro(act);
    const dNue = diametro(nue);
    const dif = ((dNue - dAct) / dAct) * 100;
    const lista = criterios(act, nue);
    const fallan = lista.filter((c) => c.estado === 'no');
    const apto = fallan.length === 0;
    pintarCriterios(lista);

    // La cabecera resume los tres criterios comprobables, no solo el diámetro
    el('cabecera-resultado').className = `relative overflow-hidden p-5 text-white sm:p-6 ${
      apto ? 'bg-positive' : 'bg-caution'
    }`;
    el('out-diferencia').textContent = `${dif >= 0 ? '+' : '−'}${decimal(Math.abs(dif), 2)} %`;
    el('out-veredicto').innerHTML = apto
      ? `${icon('check', {
          class: 'h-4 w-4',
        })} Cumple los 3 criterios comprobables · ${completa(act)} → ${completa(nue)}`
      : `${icon('alert', { class: 'h-4 w-4' })} Falla ${
          fallan.length === 1 ? fallan[0].nombre.toLowerCase() : `${fallan.length} criterios`
        } · ${completa(act)} → ${completa(nue)}`;

    el('out-d-act').textContent = `${decimal(dAct, 1)} mm`;
    el('out-d-nue').textContent = `${decimal(dNue, 1)} mm`;
    el('out-flanco').textContent = `${decimal((nue.ancho * nue.perfil) / 100, 1)} mm`;
    el('out-vueltas').textContent = integer(1000000 / circunferencia(nue));

    // A 120 km/h marcados, la velocidad real cambia en proporción al diámetro
    const real = 120 * (dNue / dAct);
    el('out-velocimetro').innerHTML =
      Math.abs(dif) < 0.05
        ? 'El diámetro es prácticamente idéntico: el velocímetro no se ve afectado.'
        : `Con el velocímetro marcando <strong class="font-semibold text-content">120 km/h</strong> circularías
           en realidad a <strong class="font-semibold text-content">${decimal(real, 1)} km/h</strong>.
           El cuentakilómetros ${dif > 0 ? 'contará de menos' : 'contará de más'} un ${decimal(
             Math.abs(dif),
             2
           )} %.`;

    resumen = [
      '🛞 Equivalencia de neumáticos',
      `• Actual: ${completa(act)} · ${decimal(dAct, 1)} mm`,
      `• Nueva: ${completa(nue)} · ${decimal(dNue, 1)} mm`,
      '',
      ...lista.map((c) => `${c.estado === 'ok' ? '✅' : c.estado === 'no' ? '❌' : 'ℹ️'} ${c.nombre}`),
      '',
      `• A 120 km/h marcados irías a ${decimal(real, 1)} km/h`,
      '',
      'El documento que manda es tu tarjeta ITV.',
      `Calculado con ${SITE.name}`,
    ].join('\n');

    const equivs = equivalentes(act);
    pintarFiltros(equivs, act);
    pintarTabla(equivs);
  }

  ['act', 'nue'].forEach((p) =>
    ['ancho', 'perfil', 'llanta', 'carga', 'velocidad'].forEach((c) => L.on(el(`${p}-${c}`), 'change', () => {
      if (p === 'act') filtroLlanta = null;
      update();
    }))
  );

  L.on(el('filtro-llanta'), 'click', (e) => {
    const btn = e.target.closest('[data-llanta]');
    if (!btn) return;
    filtroLlanta = btn.dataset.llanta === '' ? null : Number(btn.dataset.llanta);
    update();
  });

  L.on(el('reset'), 'click', () => {
    el('act-ancho').value = DEFAULTS.ancho;
    el('act-perfil').value = DEFAULTS.perfil;
    el('act-llanta').value = DEFAULTS.llanta;
    el('act-carga').value = DEFAULTS.carga;
    el('act-velocidad').value = DEFAULTS.velocidad;
    el('nue-ancho').value = NUEVA.ancho;
    el('nue-perfil').value = NUEVA.perfil;
    el('nue-llanta').value = NUEVA.llanta;
    el('nue-carga').value = NUEVA.carga;
    el('nue-velocidad').value = NUEVA.velocidad;
    filtroLlanta = null;
    update();
  });

  L.on(el('neu-form'), 'submit', (e) => e.preventDefault());
  bindCopyButton(el('copy-neu'), () => resumen, { label: 'Copiar comparativa' });

  update();
  return () => L.destroy();
}
