import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { money, decimal, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';
import { viaje } from '../calc/gasolina.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { gasolina as meta } from '../meta.js';
export { meta };

const DEFAULTS = { km: 300, consumo: 6, precio: 1.559, peajes: 0, ocupantes: 4, idaVuelta: false };

const CONSUMO_PRESETS = [
  { label: 'Ciudad', value: 8 },
  { label: 'Mixto', value: 6 },
  { label: 'Carretera', value: 5 },
];

/** Campo numérico con sufijo de unidad. */
function numberField({ id, label, unit, value, step = '0.1', min = '0', hint = '', mode = 'decimal' }) {
  return `
    <div>
      <label class="field-label" for="${id}">${label}</label>
      <div class="relative">
        <input class="input no-spin ${unit ? 'pr-16' : ''}" id="${id}" type="number"
               inputmode="${mode}" min="${min}" step="${step}" value="${value}" />
        ${unit ? `<span class="input-affix">${unit}</span>` : ''}
      </div>
      ${hint ? `<p class="hint">${hint}</p>` : ''}
    </div>`;
}

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Coste de gasolina' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de gasolina y gastos compartidos',
      lede: 'Calcula lo que cuesta un trayecto en coche y repártelo entre los pasajeros. Ajusta consumo, precio del carburante y peajes, y comparte el resultado en un toque.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Formulario -->
      <form id="fuel-form" class="card p-5 sm:p-6 lg:col-span-7" novalidate>
        ${panelTitle('Datos del trayecto', 'route')}

        <div class="grid gap-5 sm:grid-cols-2">
          <div class="sm:col-span-2">
            ${numberField({
              id: 'km',
              label: 'Distancia',
              unit: 'km',
              value: DEFAULTS.km,
              step: '1',
            })}
            <label class="mt-2.5 inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-content-muted">
              <input id="idaVuelta" type="checkbox"
                     class="h-4 w-4 rounded border-line-strong bg-surface text-accent focus:ring-accent/30" />
              Ida y vuelta <span class="text-content-subtle">(duplica los kilómetros)</span>
            </label>
          </div>

          <div>
            ${numberField({
              id: 'consumo',
              label: 'Consumo medio',
              unit: 'l/100 km',
              value: DEFAULTS.consumo,
            })}
            <div class="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Consumos habituales">
              ${CONSUMO_PRESETS.map(
                (p) =>
                  `<button type="button" class="chip !py-1 !text-xs" data-preset-consumo="${p.value}">${
                    p.label
                  } · ${decimal(p.value, 1)}</button>`
              ).join('')}
            </div>
          </div>

          <div>
            ${numberField({
              id: 'precio',
              label: 'Precio del carburante',
              unit: '€/l',
              value: DEFAULTS.precio,
              step: '0.001',
              hint: 'Consulta el precio del día en la gasolinera o en la app de tu tarjeta.',
            })}
          </div>

          <div>
            ${numberField({
              id: 'peajes',
              label: 'Peajes y parking',
              unit: '€',
              value: DEFAULTS.peajes,
              step: '0.5',
            })}
          </div>

          <div>
            <label class="field-label" for="ocupantes">
              ${icon('users', { class: 'h-4 w-4 text-content-subtle' })} Ocupantes que comparten
            </label>
            <div class="flex items-center gap-2">
              <button type="button" class="btn-icon shrink-0" data-step="-1" aria-label="Quitar ocupante">
                ${icon('minus', { class: 'h-4 w-4' })}
              </button>
              <input class="input no-spin text-center font-semibold" id="ocupantes" type="number"
                     inputmode="numeric" min="1" max="9" step="1" value="${DEFAULTS.ocupantes}" />
              <button type="button" class="btn-icon shrink-0" data-step="1" aria-label="Añadir ocupante">
                ${icon('plus', { class: 'h-4 w-4' })}
              </button>
            </div>
            <p class="hint">Incluye al conductor si también paga su parte.</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between border-t border-line pt-5">
          <p class="text-xs text-content-subtle">Los valores por defecto son un viaje tipo de 300 km.</p>
          <button type="button" class="btn-ghost btn-sm" id="reset">Restablecer</button>
        </div>
      </form>

      <!-- Resultados -->
      <section class="lg:col-span-5" aria-live="polite">
        <div class="card sticky top-24 overflow-hidden">
          <div class="relative overflow-hidden bg-accent-gradient p-5 text-white sm:p-6">
            <span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"></span>
            <p class="relative text-2xs font-semibold uppercase tracking-wider text-white/75">Coste por persona</p>
            <p class="relative mt-1 text-[2.75rem] font-extrabold leading-none tabular-nums tracking-tight" id="out-persona">—</p>
            <p class="relative mt-2 flex items-center gap-1.5 text-sm text-white/85" id="out-personas-detalle">—</p>
          </div>

          <div class="p-5 sm:p-6">
            <dl class="grid grid-cols-2 gap-2.5">
              <div class="stat">
                <dt class="stat-label">Coste total</dt>
                <dd class="stat-value" id="out-total">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Combustible</dt>
                <dd class="stat-value" id="out-combustible">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Litros</dt>
                <dd class="stat-value" id="out-litros">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label">Coste por km</dt>
                <dd class="stat-value" id="out-km">—</dd>
              </div>
            </dl>

            <!-- Desglose visual -->
            <div class="mt-5" id="desglose">
              <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted" role="img"
                   aria-label="Proporción entre combustible y peajes">
                <div class="h-full bg-accent transition-[width] duration-500 ease-spring" id="bar-combustible" style="width:100%"></div>
                <div class="h-full bg-data-2 transition-[width] duration-500 ease-spring" id="bar-peajes" style="width:0%"></div>
              </div>
              <div class="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-content-muted">
                <span class="inline-flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full bg-accent"></span>Combustible
                  <span class="font-semibold text-content" id="pct-combustible">100 %</span>
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full bg-data-2"></span>Peajes
                  <span class="font-semibold text-content" id="pct-peajes">0 %</span>
                </span>
              </div>
            </div>

            <div class="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" class="btn-primary" id="copy-wa">
                ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar resumen</span>
              </button>
              <a class="btn-secondary" id="share-wa" href="#" rel="noopener" target="_blank">
                ${icon('send', { class: 'h-4 w-4' })} Enviar por WhatsApp
              </a>
            </div>

            <details class="group mt-4">
              <summary class="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-content-subtle transition-colors hover:text-content">
                ${icon('chevronDown', { class: 'h-3.5 w-3.5 transition-transform group-open:rotate-180' })}
                Ver el texto que se copiará
              </summary>
              <pre id="out-resumen" class="mt-2 whitespace-pre-wrap rounded-xl bg-surface-muted p-3 font-mono text-2xs leading-5 tracking-normal text-content-muted ring-1 ring-inset ring-line"></pre>
            </details>

            ${privacyNote()}
          </div>
        </div>
      </section>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Cómo calcular el gasto de gasolina de un viaje en coche</h2>
      <p>
        Saber cuánto cuesta un desplazamiento en coche es más sencillo de lo que parece: solo necesitas tres
        datos y una multiplicación. Primero, los <strong>kilómetros totales</strong> del trayecto, que puedes
        obtener de cualquier aplicación de mapas (recuerda marcar la casilla de ida y vuelta si vas a regresar).
        Segundo, el <strong>consumo medio en litros cada 100 kilómetros</strong>, que aparece en el ordenador de
        a bordo. Y tercero, el <strong>precio del litro de carburante</strong> el día que repostas.
      </p>
      <p>
        La fórmula que aplica esta calculadora de gasolina es directa: los litros consumidos equivalen a los
        kilómetros multiplicados por el consumo y divididos entre cien. Ese resultado se multiplica por el precio
        del litro y se le suman los peajes, el parking o cualquier gasto fijo del viaje. El total se divide entre
        el número de ocupantes que comparten los gastos para obtener el <strong>coste por persona</strong>.
      </p>
      <h2>Qué consumo debes introducir para que el cálculo sea realista</h2>
      <p>
        El consumo homologado por el fabricante suele ser optimista. Para estimar el gasto de combustible con
        precisión conviene usar el consumo real medido en tu propio uso. Como referencia, un coche de gasolina
        compacto ronda los 8 l/100 km en ciudad, entre 5 y 6 l/100 km en autovía a velocidad constante, y sube
        con facilidad por encima de 7 l/100 km si viajas cargado, con baca, con el aire acondicionado al máximo
        o en puerto de montaña. Los vehículos diésel y los híbridos suelen situarse uno o dos litros por debajo
        en recorridos largos.
      </p>
      <h2>Cómo dividir los gastos del coche compartido sin discusiones</h2>
      <p>
        El reparto más aceptado consiste en dividir el total —combustible más peajes— entre todos los ocupantes,
        incluido el conductor, porque quien conduce ya aporta el vehículo, el desgaste de neumáticos, el seguro y
        el mantenimiento. Si prefieres que el conductor no pague su parte, basta con indicar únicamente el número
        de acompañantes en el campo de ocupantes.
      </p>
      <p>
        Para evitar malentendidos, comparte el desglose antes de salir: con el botón de copiar obtienes un
        resumen listo para pegar en el grupo de WhatsApp con los kilómetros, el consumo aplicado, el coste total
        y lo que pone cada uno. Y como todo el cálculo ocurre en tu navegador, puedes usarlo sin conexión estable
        y sin que ningún dato del viaje salga de tu teléfono.
      </p>
    `)}

    ${faq([
      {
        q: '¿Incluye el desgaste del coche o solo el combustible?',
        a: 'Por defecto calcula combustible más peajes. Si quieres repercutir mantenimiento y neumáticos, una regla habitual es sumar entre 0,03 € y 0,06 € por kilómetro en el campo de peajes.',
      },
      {
        q: '¿Sirve para coches eléctricos?',
        a: 'Sí. Introduce el consumo en kWh/100 km en el campo de consumo y el precio del kWh en el de carburante: la fórmula es idéntica.',
      },
      {
        q: '¿Se guardan mis datos?',
        a: 'No. La calculadora se ejecuta íntegramente en tu navegador y no envía la información a ningún servidor.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const inputs = {
    km: el('km'),
    consumo: el('consumo'),
    precio: el('precio'),
    peajes: el('peajes'),
    ocupantes: el('ocupantes'),
    idaVuelta: el('idaVuelta'),
  };

  function compute() {
    return viaje({
      km: readNumber(inputs.km.value),
      consumo: readNumber(inputs.consumo.value),
      precio: readNumber(inputs.precio.value),
      peajes: readNumber(inputs.peajes.value),
      ocupantes: clamp(Math.round(readNumber(inputs.ocupantes.value, 1)), 1, 9),
      idaVuelta: inputs.idaVuelta.checked,
    });
  }

  function summary(r) {
    return [
      '🚗 Reparto del viaje',
      `• Distancia: ${decimal(r.km, 0)} km`,
      `• Consumo: ${decimal(r.consumo, 1)} l/100 km · ${decimal(r.litros, 1)} l`,
      `• Carburante: ${money(r.combustible)}${r.peajes > 0 ? ` · Peajes: ${money(r.peajes)}` : ''}`,
      `• Total: ${money(r.total)}`,
      `• Somos ${r.ocupantes} ➜ ${money(r.porPersona)} por persona`,
      '',
      `Calculado con ${SITE.name}`,
    ].join('\n');
  }

  let current = compute();

  function update() {
    current = compute();
    el('out-persona').textContent = money(current.porPersona);
    el('out-personas-detalle').innerHTML = `${icon('users', { class: 'h-4 w-4 opacity-80' })} ${
      current.ocupantes
    } ${current.ocupantes === 1 ? 'ocupante' : 'ocupantes'} · ${decimal(current.km, 0)} km`;
    el('out-total').textContent = money(current.total);
    el('out-combustible').textContent = money(current.combustible);
    el('out-litros').textContent = `${decimal(current.litros, 1)} l`;
    el('out-km').textContent = `${decimal(current.porKm, 3)} €`;

    const pctComb = current.total > 0 ? (current.combustible / current.total) * 100 : 100;
    el('bar-combustible').style.width = `${pctComb}%`;
    el('bar-peajes').style.width = `${100 - pctComb}%`;
    el('pct-combustible').textContent = `${decimal(pctComb, 0)} %`;
    el('pct-peajes').textContent = `${decimal(100 - pctComb, 0)} %`;

    const text = summary(current);
    el('out-resumen').textContent = text;
    el('share-wa').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  Object.values(inputs).forEach((input) => L.on(input, 'input', update));
  L.on(inputs.idaVuelta, 'change', update);

  root.querySelectorAll('[data-preset-consumo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      inputs.consumo.value = btn.dataset.presetConsumo;
      update();
    })
  );

  root.querySelectorAll('[data-step]').forEach((btn) =>
    L.on(btn, 'click', () => {
      const next = clamp(readNumber(inputs.ocupantes.value, 1) + Number(btn.dataset.step), 1, 9);
      inputs.ocupantes.value = String(next);
      update();
    })
  );

  L.on(el('reset'), 'click', () => {
    inputs.km.value = DEFAULTS.km;
    inputs.consumo.value = DEFAULTS.consumo;
    inputs.precio.value = DEFAULTS.precio;
    inputs.peajes.value = DEFAULTS.peajes;
    inputs.ocupantes.value = DEFAULTS.ocupantes;
    inputs.idaVuelta.checked = DEFAULTS.idaVuelta;
    update();
  });

  L.on(el('fuel-form'), 'submit', (e) => e.preventDefault());

  bindCopyButton(el('copy-wa'), () => summary(current), { label: 'Copiar resumen' });

  update();
  return () => L.destroy();
}
