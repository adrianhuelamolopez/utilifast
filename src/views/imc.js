import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { decimal, readNumber, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { imc as meta } from '../meta.js';
export { meta };

// Rangos de la OMS. `hasta` es el límite superior exclusivo.
const CATEGORIAS = [
  { hasta: 18.5, label: 'Bajo peso', color: 'bg-data-2', texto: 'text-data-2', desde: 0 },
  { hasta: 25, label: 'Peso normal', color: 'bg-positive', texto: 'text-positive', desde: 18.5 },
  { hasta: 30, label: 'Sobrepeso', color: 'bg-data-2', texto: 'text-data-2', desde: 25 },
  { hasta: 35, label: 'Obesidad grado I', color: 'bg-data-3/70', texto: 'text-data-3', desde: 30 },
  { hasta: 40, label: 'Obesidad grado II', color: 'bg-data-3', texto: 'text-data-3', desde: 35 },
  { hasta: Infinity, label: 'Obesidad grado III', color: 'bg-data-3', texto: 'text-data-3', desde: 40 },
];

// Umbrales de perímetro abdominal (OMS, población europea).
const CINTURA = {
  mujer: { aumentado: 80, muy: 88 },
  hombre: { aumentado: 94, muy: 102 },
};

// La escala visual va de 15 a 40: cubre el 99 % de los casos reales.
const ESCALA_MIN = 15;
const ESCALA_MAX = 40;
const TRAMOS = [
  { desde: 15, hasta: 18.5, color: 'bg-data-2/60' },
  { desde: 18.5, hasta: 25, color: 'bg-positive' },
  { desde: 25, hasta: 30, color: 'bg-data-2' },
  { desde: 30, hasta: 35, color: 'bg-data-3/70' },
  { desde: 35, hasta: 40, color: 'bg-data-3' },
];

const DEFAULTS = { peso: 70, altura: 170, sexo: 'mujer', cintura: '' };

function categoria(imc) {
  return CATEGORIAS.find((c) => imc < c.hasta) || CATEGORIAS[CATEGORIAS.length - 1];
}

function escala() {
  const ancho = ESCALA_MAX - ESCALA_MIN;
  return `
  <div class="mt-6">
    <div class="relative">
      <div class="flex h-3 w-full overflow-hidden rounded-full" role="img"
           aria-label="Escala de índice de masa corporal de 15 a 40">
        ${TRAMOS.map(
          (t) =>
            `<div class="h-full ${t.color}" style="width:${((t.hasta - t.desde) / ancho) * 100}%"></div>`
        ).join('')}
      </div>
      <div id="marcador"
           class="absolute -top-1 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-surface bg-content shadow-float transition-[left] duration-500 ease-spring"
           style="left:0%"></div>
    </div>
    <div class="mt-2 flex justify-between text-2xs font-medium tabular-nums text-content-subtle">
      <span>15</span><span>18,5</span><span>25</span><span>30</span><span>35</span><span>40</span>
    </div>
  </div>`;
}

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'IMC y peso ideal' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Calculadora',
      title: 'Calculadora de IMC y peso saludable',
      lede: 'Calcula tu índice de masa corporal con los rangos oficiales de la OMS, descubre qué peso corresponde a tu altura y complétalo con el perímetro de cintura, que dice más sobre el riesgo real que el IMC por sí solo.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Formulario -->
      <form id="imc-form" class="card p-5 sm:p-6 lg:col-span-5" novalidate>
        ${panelTitle('Tus medidas', 'ruler')}

        <div class="space-y-5">
          <div>
            <label class="field-label" for="peso">Peso</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="peso" type="number"
                     inputmode="decimal" min="25" max="300" step="0.1" value="${DEFAULTS.peso}" />
              <span class="input-affix">kg</span>
            </div>
          </div>

          <div>
            <label class="field-label" for="altura">Altura</label>
            <div class="relative">
              <input class="input no-spin pr-12 text-lg font-semibold" id="altura" type="number"
                     inputmode="numeric" min="100" max="230" step="1" value="${DEFAULTS.altura}" />
              <span class="input-affix">cm</span>
            </div>
          </div>
        </div>

        <div class="mt-6 border-t border-line pt-5">
          <p class="field-label">Sexo</p>
          <div class="segmented" role="group" aria-label="Sexo">
            <button type="button" class="segmented-item" data-sexo="mujer" aria-pressed="true">Mujer</button>
            <button type="button" class="segmented-item" data-sexo="hombre" aria-pressed="false">Hombre</button>
          </div>
          <p class="hint">El IMC no distingue por sexo. Solo se usa para interpretar el perímetro de cintura.</p>

          <div class="mt-5">
            <label class="field-label" for="cintura">
              Perímetro de cintura <span class="font-normal text-content-subtle">(opcional)</span>
            </label>
            <div class="relative">
              <input class="input no-spin pr-12" id="cintura" type="number" inputmode="decimal"
                     min="40" max="200" step="0.5" placeholder="Mide a la altura del ombligo" />
              <span class="input-affix">cm</span>
            </div>
            <p class="hint">De pie, al final de una espiración normal, sin apretar la cinta.</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between border-t border-line pt-5">
          <p class="text-xs text-content-subtle">Rangos de la OMS para población adulta.</p>
          <button type="button" class="btn-ghost btn-sm" id="reset">Restablecer</button>
        </div>
      </form>

      <!-- Resultado -->
      <section class="lg:col-span-7" aria-live="polite">
        <div class="card p-5 sm:p-6">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="stat-label">Tu índice de masa corporal</p>
              <p class="mt-1 text-5xl font-extrabold leading-none tabular-nums tracking-tight text-content" id="out-imc">—</p>
            </div>
            <p class="badge-accent" id="out-categoria">—</p>
          </div>

          ${escala()}

          <dl class="mt-7 grid gap-2.5 sm:grid-cols-3">
            <div class="stat">
              <dt class="stat-label">Peso saludable</dt>
              <dd class="stat-value !text-lg" id="out-rango">—</dd>
              <p class="mt-0.5 text-xs text-content-subtle">Para tu altura</p>
            </div>
            <div class="stat">
              <dt class="stat-label" id="out-ajuste-label">Diferencia</dt>
              <dd class="stat-value !text-lg" id="out-ajuste">—</dd>
              <p class="mt-0.5 text-xs text-content-subtle" id="out-ajuste-nota">Hasta el rango sano</p>
            </div>
            <div class="stat">
              <dt class="stat-label">IMC en el rango</dt>
              <dd class="stat-value !text-lg" id="out-rango-imc">18,5 – 24,9</dd>
              <p class="mt-0.5 text-xs text-content-subtle">Referencia OMS</p>
            </div>
          </dl>

          <!-- Perímetro de cintura -->
          <div class="mt-5 rounded-xl border border-line p-4" id="bloque-cintura">
            <p class="flex items-center gap-2 text-sm font-semibold text-content">
              ${icon('ruler', { class: 'h-4 w-4 text-content-subtle' })} Perímetro de cintura
            </p>
            <p class="mt-1.5 text-sm leading-6 text-content-muted" id="out-cintura">
              Introduce tu perímetro de cintura para estimar el riesgo cardiometabólico, que el IMC
              por sí solo no detecta.
            </p>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <button type="button" class="btn-primary" id="copy-imc">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar resultado</span>
            </button>
            <a class="btn-secondary" href="/macros" data-link>
              ${icon('nutrition', { class: 'h-4 w-4' })} Calcular mis macros
            </a>
          </div>

          <!-- Advertencia sanitaria: el IMC se malinterpreta con mucha facilidad -->
          <div class="mt-5 flex items-start gap-3 rounded-xl bg-caution-soft p-4 text-sm leading-6 text-caution ring-1 ring-inset ring-caution/25">
            <span class="mt-0.5 shrink-0">${icon('alert', { class: 'h-4 w-4' })}</span>
            <p>
              El IMC es una <strong class="font-semibold">medida de cribado poblacional</strong>, no un
              diagnóstico. No distingue músculo de grasa ni dónde se acumula, y pierde validez en personas
              muy musculadas, embarazadas, menores de 18 años, mayores de 65 y personas amputadas.
              Interpreta el resultado con un profesional sanitario.
            </p>
          </div>

          ${privacyNote('Tu peso y tus medidas no se envían a ningún sitio.')}
        </div>

        ${hueco({ format: 'rectangle', className: 'mt-6' })}
      </section>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Cómo se calcula el índice de masa corporal</h2>
      <p>
        El <strong>IMC</strong> se obtiene dividiendo el peso en kilogramos entre el cuadrado de la altura en
        metros. Una persona de 70 kg y 1,70 m tiene un IMC de 70 ÷ (1,70 × 1,70) = 24,2. La fórmula la propuso
        el estadístico Adolphe Quetelet en el siglo XIX y la Organización Mundial de la Salud la adoptó como
        indicador poblacional por una razón muy concreta: es barata, rápida y solo necesita una báscula y una
        cinta métrica.
      </p>
      <p>
        Los rangos de referencia de la OMS para adultos son: por debajo de 18,5 <strong>bajo peso</strong>;
        entre 18,5 y 24,9 <strong>peso normal</strong>; entre 25 y 29,9 <strong>sobrepeso</strong>; y a partir
        de 30, <strong>obesidad</strong>, que a su vez se divide en grado I (30–34,9), grado II (35–39,9) y
        grado III (40 o más).
      </p>
      <h2>Qué peso corresponde a tu altura</h2>
      <p>
        Darle la vuelta a la fórmula permite calcular el <strong>rango de peso saludable</strong>: basta con
        multiplicar 18,5 y 24,9 por el cuadrado de tu altura en metros. Para 1,70 m ese intervalo va de 53,5 a
        72,0 kg. Es un rango amplio a propósito, porque dentro de él caben complexiones muy distintas. Si tu
        peso queda fuera, la calculadora te indica cuántos kilos te separan del límite más cercano.
      </p>
      <h2>Por qué el perímetro de cintura completa al IMC</h2>
      <p>
        La principal limitación del IMC es que no sabe de qué está hecho tu peso ni dónde está repartido. Un
        deportista de fuerza puede superar 27 sin un gramo de grasa excesiva, y una persona sedentaria puede
        estar en 24 con exceso de grasa abdominal, que es la que más se asocia a riesgo cardiovascular y
        metabólico.
      </p>
      <p>
        Por eso conviene medir también el <strong>perímetro abdominal</strong>. La OMS sitúa el riesgo
        aumentado a partir de 80 cm en mujeres y 94 cm en hombres, y el riesgo muy aumentado a partir de 88 y
        102 cm respectivamente. Se mide de pie, con la cinta a la altura del ombligo, al final de una
        espiración normal y sin apretar. Combinar ambas cifras da una fotografía mucho más útil que el IMC
        aislado, y es la razón por la que esta calculadora incluye las dos.
      </p>
    `)}

    ${faq([
      {
        q: '¿El IMC sirve igual para hombres y para mujeres?',
        a: 'La fórmula y los rangos son los mismos. La diferencia aparece en el perímetro de cintura, donde los umbrales de riesgo sí son distintos: 80 y 88 cm en mujeres frente a 94 y 102 cm en hombres.',
      },
      {
        q: '¿Vale para niños o adolescentes?',
        a: 'No. En menores de 18 años el IMC se interpreta con percentiles por edad y sexo, no con los rangos fijos de adultos. Consulta a tu pediatra.',
      },
      {
        q: 'Entreno con pesas y me sale sobrepeso, ¿es normal?',
        a: 'Sí, es la limitación más conocida del índice. El músculo pesa más que la grasa a igual volumen, así que personas muy musculadas salen en sobrepeso sin exceso de grasa. En ese caso el perímetro de cintura y el porcentaje graso son más informativos.',
      },
      {
        q: '¿Se guardan mi peso y mis medidas?',
        a: 'No. El cálculo se ejecuta entero en tu navegador y nada se envía a ningún servidor.',
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
    const peso = clamp(state.peso, 0, 500);
    const alturaM = clamp(state.altura, 1, 300) / 100;
    const imc = alturaM > 0 ? peso / (alturaM * alturaM) : 0;
    const min = 18.5 * alturaM * alturaM;
    const max = 24.9 * alturaM * alturaM;
    return {
      imc,
      cat: categoria(imc),
      pesoMin: min,
      pesoMax: max,
      // Kilos hasta el límite más cercano del rango sano (0 si ya está dentro)
      ajuste: peso < min ? min - peso : peso > max ? peso - max : 0,
      porDebajo: peso < min,
    };
  }

  function textoCintura(cm) {
    const u = CINTURA[state.sexo];
    if (cm >= u.muy) {
      return {
        nivel: 'Riesgo muy aumentado',
        clase: 'text-data-3',
        detalle: `A partir de ${u.muy} cm en ${state.sexo === 'mujer' ? 'mujeres' : 'hombres'} la OMS sitúa el riesgo cardiometabólico en su nivel más alto.`,
      };
    }
    if (cm >= u.aumentado) {
      return {
        nivel: 'Riesgo aumentado',
        clase: 'text-data-2',
        detalle: `El umbral de riesgo en ${state.sexo === 'mujer' ? 'mujeres' : 'hombres'} empieza en ${u.aumentado} cm y el de riesgo muy aumentado en ${u.muy} cm.`,
      };
    }
    return {
      nivel: 'Dentro de lo recomendado',
      clase: 'text-positive',
      detalle: `Por debajo de ${u.aumentado} cm, el umbral de riesgo aumentado en ${state.sexo === 'mujer' ? 'mujeres' : 'hombres'}.`,
    };
  }

  function summary(r) {
    const lines = [
      '⚖️ Mi IMC',
      `• IMC: ${decimal(r.imc, 1)} (${r.cat.label})`,
      `• Peso: ${decimal(state.peso, 1)} kg · Altura: ${decimal(state.altura, 0)} cm`,
      `• Peso saludable para mi altura: ${decimal(r.pesoMin, 1)}–${decimal(r.pesoMax, 1)} kg`,
    ];
    if (r.ajuste > 0.05) {
      lines.push(`• ${r.porDebajo ? 'Me faltan' : 'Me sobran'} ${decimal(r.ajuste, 1)} kg para el rango`);
    }
    const cm = readNumber(state.cintura, 0);
    if (cm > 0) {
      lines.push(`• Cintura: ${decimal(cm, 1)} cm — ${textoCintura(cm).nivel}`);
    }
    lines.push('', 'El IMC es orientativo, no un diagnóstico.', `Calculado con ${SITE.name}`);
    return lines.join('\n');
  }

  let current = compute();

  function update() {
    current = compute();
    const r = current;

    el('out-imc').textContent = r.imc > 0 ? decimal(r.imc, 1) : '—';

    const badge = el('out-categoria');
    badge.textContent = r.cat.label;
    badge.className = `badge ${r.cat.texto}`;
    badge.style.backgroundColor = 'rgb(var(--surface-muted))';

    // Posición del marcador dentro de la escala 15–40
    const pos = clamp(((r.imc - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)) * 100, 0, 100);
    el('marcador').style.left = `${pos}%`;

    el('out-rango').textContent = `${decimal(r.pesoMin, 1)}–${decimal(r.pesoMax, 1)} kg`;

    if (r.ajuste < 0.05) {
      el('out-ajuste-label').textContent = 'Estado';
      el('out-ajuste').textContent = 'En rango';
      el('out-ajuste-nota').textContent = 'Tu peso está dentro';
    } else {
      el('out-ajuste-label').textContent = r.porDebajo ? 'Te faltan' : 'Te sobran';
      el('out-ajuste').textContent = `${decimal(r.ajuste, 1)} kg`;
      el('out-ajuste-nota').textContent = `Hasta ${decimal(r.porDebajo ? r.pesoMin : r.pesoMax, 1)} kg`;
    }

    const cm = readNumber(state.cintura, 0);
    const caja = el('bloque-cintura');
    if (cm > 0) {
      const t = textoCintura(cm);
      el('out-cintura').innerHTML = `<strong class="font-semibold ${t.clase}">${t.nivel}</strong> · ${decimal(
        cm,
        1
      )} cm. ${t.detalle}`;
      caja.classList.add('bg-surface-muted');
    } else {
      el('out-cintura').textContent =
        'Introduce tu perímetro de cintura para estimar el riesgo cardiometabólico, que el IMC por sí solo no detecta.';
      caja.classList.remove('bg-surface-muted');
    }

    el('out-resumen') && (el('out-resumen').textContent = summary(r));
  }

  L.on(el('peso'), 'input', () => {
    state.peso = Math.max(0, readNumber(el('peso').value, 0));
    update();
  });
  L.on(el('altura'), 'input', () => {
    state.altura = Math.max(0, readNumber(el('altura').value, 0));
    update();
  });
  L.on(el('cintura'), 'input', () => {
    state.cintura = el('cintura').value;
    update();
  });

  root.querySelectorAll('[data-sexo]').forEach((btn) =>
    L.on(btn, 'click', () => {
      state.sexo = btn.dataset.sexo;
      root.querySelectorAll('[data-sexo]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
      update();
    })
  );

  L.on(el('reset'), 'click', () => {
    Object.assign(state, DEFAULTS);
    el('peso').value = DEFAULTS.peso;
    el('altura').value = DEFAULTS.altura;
    el('cintura').value = '';
    root.querySelectorAll('[data-sexo]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.sexo === DEFAULTS.sexo))
    );
    update();
  });

  L.on(el('imc-form'), 'submit', (e) => e.preventDefault());

  bindCopyButton(el('copy-imc'), () => summary(current), { label: 'Copiar resultado' });

  update();
  return () => L.destroy();
}
