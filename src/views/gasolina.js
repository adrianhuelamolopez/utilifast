import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { money, currencySymbol, decimal, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';
import { viaje } from '../calc/gasolina.js';
import {
  SISTEMAS,
  SISTEMA_POR_DEFECTO,
  sistema,
  aKm,
  desdeKm,
  desdeLitros,
  aPrecioPorLitro,
} from '../calc/unidades.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { gasolina as meta } from '../meta.js';
export { meta };

const DEFAULTS = { km: 300, consumo: 6, precio: 1.559, peajes: 0, ocupantes: 4, idaVuelta: false };

// Solo el símbolo: aquí no se convierte nada, se elige cómo se escribe la cifra.
const MONEDAS = [
  { code: 'EUR', label: '€' },
  { code: 'USD', label: '$' },
  { code: 'MXN', label: 'MXN' },
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

          <!-- Sistema de medida: en México se razona en km/l y en EE. UU. en mpg.
               Sin declararlo, un «12» en km/l se calculaba como 12 l/100 km. -->
          <div class="sm:col-span-2">
            <label class="field-label" for="sistema">Cómo mides el consumo</label>
            <div class="grid gap-2 sm:grid-cols-3" role="group" aria-label="Sistema de medida">
              ${Object.values(SISTEMAS)
                .map(
                  (s) => `
                <button type="button" data-sistema="${s.id}"
                        aria-pressed="${s.id === SISTEMA_POR_DEFECTO}"
                        class="tipo-card group rounded-xl border border-line bg-surface p-2.5 text-left transition hover:border-line-strong">
                  <span class="block text-sm font-semibold text-content">${s.etiqueta}</span>
                  <span class="mt-0.5 block text-2xs text-content-subtle">${s.donde}</span>
                </button>`
                )
                .join('')}
            </div>
          </div>

          <div>
            ${numberField({
              id: 'consumo',
              label: 'Consumo medio',
              unit: 'l/100 km',
              value: DEFAULTS.consumo,
            })}
            <div class="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Consumos habituales"
                 id="presets-consumo"></div>
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
            <div class="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Moneda">
              ${MONEDAS.map(
                (m) => `
                <button type="button" class="chip !py-1 !text-xs" data-moneda="${m.code}"
                        aria-pressed="${m.code === 'EUR'}">${m.label}</button>`
              ).join('')}
            </div>
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
                <dt class="stat-label" id="label-volumen">Litros</dt>
                <dd class="stat-value" id="out-litros">—</dd>
              </div>
              <div class="stat">
                <dt class="stat-label" id="label-distancia">Coste por km</dt>
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
        en recorridos largos. Para ver el efecto de esos números sobre una ruta concreta, tienes el desglose de
        <a href="/gasolina/madrid-valencia" data-link>cuánto cuesta ir de Madrid a Valencia en coche</a>.
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
        q: '¿Puedo calcularlo en kilómetros por litro o en millas por galón?',
        a: 'Sí. Arriba puedes elegir entre l/100 km, que es como se mide en España y Europa, km/l, habitual en México, Argentina y Chile, y millas por galón, que es el sistema de Estados Unidos. Al cambiarlo se convierten también la distancia, el precio del carburante y el resultado, así que no tienes que hacer ninguna cuenta a mano.',
      },
      {
        q: '¿Puedo poner el precio en dólares o en pesos?',
        a: 'Sí, junto al precio del carburante puedes elegir la moneda con la que se escriben todos los importes. Ten en cuenta que solo cambia el símbolo: la calculadora no convierte divisas, porque para eso haría falta consultar una cotización en internet y aquí no sale ningún dato de tu dispositivo. Introduce el precio en la moneda que hayas elegido.',
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

  // Estado de presentación. El cálculo interno es siempre km + l/100 km:
  // `calc/gasolina.js` no sabe nada de sistemas y las satélites dependen de eso.
  let sistemaId = SISTEMA_POR_DEFECTO;
  let moneda = 'EUR';
  const eur = (v) => money(v, moneda);

  function compute() {
    const s = sistema(sistemaId);
    return viaje({
      km: aKm(readNumber(inputs.km.value), sistemaId),
      consumo: s.aL100km(readNumber(inputs.consumo.value)),
      precio: aPrecioPorLitro(readNumber(inputs.precio.value), sistemaId),
      peajes: readNumber(inputs.peajes.value),
      ocupantes: clamp(Math.round(readNumber(inputs.ocupantes.value, 1)), 1, 9),
      idaVuelta: inputs.idaVuelta.checked,
    });
  }

  function summary(r) {
    const s = sistema(sistemaId);
    return [
      '🚗 Reparto del viaje',
      `• Distancia: ${decimal(desdeKm(r.km, sistemaId), 0)} ${s.unidadDistancia}`,
      `• Consumo: ${decimal(s.desdeL100km(r.consumo), 1)} ${s.unidadConsumo} · ${decimal(
        desdeLitros(r.litros, sistemaId),
        1
      )} ${s.unidadVolumen}`,
      `• Carburante: ${eur(r.combustible)}${r.peajes > 0 ? ` · Peajes: ${eur(r.peajes)}` : ''}`,
      `• Total: ${eur(r.total)}`,
      `• Somos ${r.ocupantes} ➜ ${eur(r.porPersona)} por persona`,
      '',
      `Calculado con ${SITE.name}`,
    ].join('\n');
  }

  let current = compute();

  function update() {
    const s = sistema(sistemaId);
    current = compute();
    el('out-persona').textContent = eur(current.porPersona);
    el('out-personas-detalle').innerHTML = `${icon('users', { class: 'h-4 w-4 opacity-80' })} ${
      current.ocupantes
    } ${current.ocupantes === 1 ? 'ocupante' : 'ocupantes'} · ${decimal(
      desdeKm(current.km, sistemaId),
      0
    )} ${s.unidadDistancia}`;
    el('out-total').textContent = eur(current.total);
    el('out-combustible').textContent = eur(current.combustible);
    el('out-litros').textContent = `${decimal(desdeLitros(current.litros, sistemaId), 1)} ${
      s.unidadVolumen
    }`;
    // El coste por unidad de distancia se recalcula sobre la distancia mostrada:
    // en millas el número es mayor que en kilómetros y debe cuadrar con el total.
    const distancia = desdeKm(current.km, sistemaId);
    el('out-km').textContent = `${decimal(
      distancia > 0 ? current.total / distancia : 0,
      3
    )} ${currencySymbol(moneda)}`;

    const pctComb = current.total > 0 ? (current.combustible / current.total) * 100 : 100;
    el('bar-combustible').style.width = `${pctComb}%`;
    el('bar-peajes').style.width = `${100 - pctComb}%`;
    el('pct-combustible').textContent = `${decimal(pctComb, 0)} %`;
    el('pct-peajes').textContent = `${decimal(100 - pctComb, 0)} %`;

    const text = summary(current);
    el('out-resumen').textContent = text;
    el('share-wa').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  /** Sufijo de unidad de un campo (el <span> que pinta `numberField`). */
  const afijo = (input) => input.parentElement.querySelector('.input-affix');

  /** Repinta todo lo que depende del sistema o de la moneda. */
  function refrescarUnidades() {
    const s = sistema(sistemaId);
    const simbolo = currencySymbol(moneda);

    afijo(inputs.km).textContent = s.unidadDistancia;
    afijo(inputs.consumo).textContent = s.unidadConsumo;
    afijo(inputs.precio).textContent = `${simbolo}/${s.volumenPorUnidad}`;
    afijo(inputs.peajes).textContent = simbolo;

    el('label-volumen').textContent = s.unidadVolumen === 'gal' ? 'Galones' : 'Litros';
    el('label-distancia').textContent = `Coste por ${s.unidadDistancia === 'mi' ? 'milla' : 'km'}`;

    // Los consumos de referencia son los mismos coches expresados en otra escala.
    el('presets-consumo').innerHTML = s.presets
      .map(
        (p) =>
          `<button type="button" class="chip !py-1 !text-xs" data-preset-consumo="${p.value}">${
            p.label
          } · ${decimal(p.value, 1)}</button>`
      )
      .join('');

    root.querySelectorAll('[data-sistema]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.sistema === sistemaId))
    );
    root.querySelectorAll('[data-moneda]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.moneda === moneda))
    );
  }

  Object.values(inputs).forEach((input) => L.on(input, 'input', update));
  L.on(inputs.idaVuelta, 'change', update);

  // Delegación: los chips de consumo se regeneran al cambiar de sistema, así que
  // no se les puede enganchar un listener de una vez para siempre.
  L.on(el('presets-consumo'), 'click', (e) => {
    const btn = e.target.closest('[data-preset-consumo]');
    if (!btn) return;
    inputs.consumo.value = btn.dataset.presetConsumo;
    update();
  });

  root.querySelectorAll('[data-sistema]').forEach((btn) =>
    L.on(btn, 'click', () => {
      const anterior = sistema(sistemaId);
      const nuevo = sistema(btn.dataset.sistema);
      if (nuevo.id === sistemaId) return;
      // Se convierte lo que ya había escrito en lugar de dejar el número tal cual:
      // cambiar de escala no debería cambiar el coche que el usuario tenía en mente.
      const enL100 = anterior.aL100km(readNumber(inputs.consumo.value));
      const km = aKm(readNumber(inputs.km.value), sistemaId);
      const precioLitro = aPrecioPorLitro(readNumber(inputs.precio.value), sistemaId);

      sistemaId = nuevo.id;
      inputs.consumo.value = decimal(nuevo.desdeL100km(enL100), 1).replace(',', '.');
      inputs.km.value = decimal(desdeKm(km, sistemaId), 0).replace(/\./g, '').replace(',', '.');
      inputs.precio.value = decimal(
        nuevo.volumenPorUnidad === 'gal' ? precioLitro * 3.785411784 : precioLitro,
        3
      ).replace(',', '.');

      refrescarUnidades();
      update();
    })
  );

  root.querySelectorAll('[data-moneda]').forEach((btn) =>
    L.on(btn, 'click', () => {
      moneda = btn.dataset.moneda;
      refrescarUnidades();
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
    // Restablecer vuelve también al sistema y la moneda de partida: si no, los
    // valores por defecto (300, 6, 1,559) se pintarían bajo unidades ajenas.
    sistemaId = SISTEMA_POR_DEFECTO;
    moneda = 'EUR';
    inputs.km.value = DEFAULTS.km;
    inputs.consumo.value = DEFAULTS.consumo;
    inputs.precio.value = DEFAULTS.precio;
    inputs.peajes.value = DEFAULTS.peajes;
    inputs.ocupantes.value = DEFAULTS.ocupantes;
    inputs.idaVuelta.checked = DEFAULTS.idaVuelta;
    refrescarUnidades();
    update();
  });

  L.on(el('fuel-form'), 'submit', (e) => e.preventDefault());

  bindCopyButton(el('copy-wa'), () => summary(current), { label: 'Copiar resumen' });

  refrescarUnidades();
  update();
  return () => L.destroy();
}
