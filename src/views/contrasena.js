import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { integer, decimal, clamp } from '../utils/format.js';
import { qs, listeners } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { contrasena as meta } from '../meta.js';
export { meta };

const JUEGOS = [
  { id: 'minus', label: 'Minúsculas', ejemplo: 'a-z', chars: 'abcdefghijklmnopqrstuvwxyz', activo: true },
  { id: 'mayus', label: 'Mayúsculas', ejemplo: 'A-Z', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', activo: true },
  { id: 'numeros', label: 'Números', ejemplo: '0-9', chars: '0123456789', activo: true },
  { id: 'simbolos', label: 'Símbolos', ejemplo: '!@#$…', chars: '!@#$%&*+-=?_~^()[]{}<>.,:;/|', activo: true },
];

// Caracteres que se confunden al leerlos o dictarlos.
const AMBIGUOS = 'lI1O0oB8S5Z2';

const NIVELES = [
  { hasta: 45, label: 'Débil', clase: 'text-data-3', barra: 'bg-data-3', ancho: 25 },
  { hasta: 65, label: 'Aceptable', clase: 'text-data-2', barra: 'bg-data-2', ancho: 50 },
  { hasta: 90, label: 'Fuerte', clase: 'text-positive', barra: 'bg-positive', ancho: 75 },
  { hasta: Infinity, label: 'Excelente', clase: 'text-positive', barra: 'bg-positive', ancho: 100 },
];

const DEFAULTS = { longitud: 20, evitarAmbiguos: false };

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Contraseñas seguras' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Generador',
      title: 'Generador de contraseñas seguras',
      lede: 'Contraseñas aleatorias generadas con el motor criptográfico de tu propio navegador. No viajan por la red, no se guardan en ningún sitio y nadie más las ve.',
      updated: SITE.updated,
    })}

    <!-- Resultado arriba: es lo que el usuario viene a buscar -->
    <div class="card overflow-hidden">
      <div class="border-b border-line bg-surface-muted p-5 sm:p-6">
        <label class="field-label" for="salida">Tu contraseña</label>
        <div class="flex flex-col gap-3 sm:flex-row">
          <input class="input h-14 flex-1 select-all font-mono text-base tracking-wide sm:text-lg"
                 id="salida" readonly aria-live="polite" />
          <div class="flex gap-2">
            <button type="button" class="btn-secondary !h-14 !px-4" id="regenerar" aria-label="Generar otra contraseña">
              ${icon('refresh', { class: 'h-[1.15rem] w-[1.15rem]' })}
            </button>
            <button type="button" class="btn-primary !h-14 flex-1 sm:!px-6" id="copy-pass">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar</span>
            </button>
          </div>
        </div>

        <div class="mt-4">
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold" id="nivel">—</span>
            <span class="tabular-nums text-content-muted"><span id="bits">—</span> bits de entropía</span>
          </div>
          <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
            <div class="h-full rounded-full transition-all duration-500 ease-spring" id="barra" style="width:0%"></div>
          </div>
          <p class="mt-2 text-xs leading-5 text-content-subtle" id="crack">—</p>
        </div>
      </div>

      <div class="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        <div>
          <label class="field-label" for="longitud">
            Longitud: <span class="tabular-nums text-accent" id="longitud-valor">${DEFAULTS.longitud}</span> caracteres
          </label>
          <input type="range" class="range" id="longitud" min="6" max="64" step="1" value="${DEFAULTS.longitud}" />
          <div class="mt-1 flex justify-between text-2xs text-content-subtle">
            <span>6</span><span>64</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            ${[12, 16, 20, 32].map(
              (n) => `<button type="button" class="chip !py-1 !text-xs" data-longitud="${n}">${n}</button>`
            ).join('')}
          </div>
        </div>

        <div>
          <p class="field-label">Incluir</p>
          <div class="grid gap-2 sm:grid-cols-2">
            ${JUEGOS.map(
              (j) => `
              <label class="flex cursor-pointer select-none items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm transition hover:border-line-strong">
                <input type="checkbox" data-juego="${j.id}" ${j.activo ? 'checked' : ''}
                       class="h-4 w-4 rounded border-line-strong bg-surface text-accent focus:ring-accent/30" />
                <span class="font-medium text-content">${j.label}</span>
                <span class="ml-auto font-mono text-2xs tracking-normal text-content-subtle">${j.ejemplo}</span>
              </label>`
            ).join('')}
          </div>
          <label class="mt-2 flex cursor-pointer select-none items-center gap-2.5 text-sm text-content-muted">
            <input id="ambiguos" type="checkbox"
                   class="h-4 w-4 rounded border-line-strong bg-surface text-accent focus:ring-accent/30" />
            Evitar caracteres confusos (l, I, 1, O, 0…)
          </label>
          <p class="hint" id="aviso-juegos" hidden></p>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-12">
      <div class="lg:col-span-7">
        ${privacyNote(
          'La contraseña se genera con <code class="rounded bg-positive/10 px-1 font-mono text-xs">crypto.getRandomValues</code>, el generador criptográfico del navegador. Nunca se transmite ni se registra.'
        )}
      </div>
      <div class="lg:col-span-5">
        ${hueco({ format: 'rectangle' })}
      </div>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Qué hace segura a una contraseña</h2>
      <p>
        La seguridad de una contraseña no depende de que parezca complicada, sino de cuántas combinaciones
        posibles existen. Esa magnitud se mide en <strong>bits de entropía</strong>: cada bit adicional duplica
        el número de intentos que necesitaría un atacante. Una clave de 8 caracteres con letras, números y
        símbolos ronda los 52 bits; una de 20 caracteres supera los 130. La diferencia entre ambas no es del
        doble: es de miles de millones de veces.
      </p>
      <p>
        Por eso la <strong>longitud pesa más que la complejidad</strong>. Añadir un carácter multiplica las
        combinaciones por el tamaño del alfabeto, mientras que sustituir una «a» por una «@» apenas aporta
        nada, y además es un truco que todos los diccionarios de ataque conocen desde hace décadas. Las
        recomendaciones actuales, incluidas las del NIST estadounidense, priorizan claves largas sobre reglas
        de composición rebuscadas.
      </p>
      <h2>Por qué importa que la aleatoriedad sea criptográfica</h2>
      <p>
        Este generador usa <strong>crypto.getRandomValues</strong>, la fuente de aleatoriedad criptográfica del
        navegador, y no la función <em>Math.random</em> que se emplea habitualmente para cosas triviales.
        La diferencia es sustancial: <em>Math.random</em> es predecible si se conoce su estado interno, así que
        no debe usarse jamás para generar secretos. Además, el reparto de caracteres se hace descartando
        valores sobrantes en lugar de aplicar un resto, un detalle técnico que evita que unos caracteres salgan
        con más frecuencia que otros.
      </p>
      <h2>Qué hacer con la contraseña una vez generada</h2>
      <p>
        Una clave larga y aleatoria es imposible de memorizar, y eso es precisamente lo que se busca: debe
        vivir en un <strong>gestor de contraseñas</strong>, no en tu cabeza ni en un papel. Usa una distinta
        para cada servicio, porque el mayor riesgo real no es que alguien adivine tu clave, sino que se filtre
        en una brecha de datos y la reutilices en otros diez sitios. Activa además la verificación en dos
        pasos donde esté disponible: aporta más seguridad que cualquier mejora de la contraseña.
      </p>
      <p>
        Para las pocas claves que sí necesitas recordar —la del propio gestor o la del portátil— una
        alternativa excelente es una <strong>frase de paso</strong>: cuatro o cinco palabras aleatorias sin
        relación entre sí, que se recuerdan con facilidad y alcanzan una entropía muy alta gracias a su
        longitud.
      </p>
    `)}

    ${faq([
      {
        q: '¿Se guarda en algún sitio la contraseña que genero?',
        a: 'No. Se crea en la memoria de tu navegador y desaparece al cerrar o recargar la pestaña. No hay servidor implicado: la web es estática y no envía nada.',
      },
      {
        q: '¿Cuántos caracteres debería usar?',
        a: 'Con los cuatro tipos de carácter activados, 16 caracteres ya ofrecen un margen muy holgado y 20 son una elección cómoda por defecto. Para cuentas críticas, como el correo principal o el banco, sube a 24 o más.',
      },
      {
        q: '¿Es seguro generar contraseñas en una página web?',
        a: 'Depende de si el cálculo ocurre en tu navegador o en un servidor. Aquí ocurre íntegramente en tu dispositivo, algo que puedes verificar desconectándote de internet: la herramienta sigue funcionando.',
      },
      {
        q: '¿Por qué evitar caracteres confusos?',
        a: 'Porque la ele minúscula, la i mayúscula y el uno son casi idénticos en muchas tipografías, igual que la o y el cero. Si vas a teclear o dictar la clave, esa opción evita errores; a cambio reduce ligeramente la entropía.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const state = { ...DEFAULTS, juegos: JUEGOS.filter((j) => j.activo).map((j) => j.id) };

  function alfabeto() {
    let chars = JUEGOS.filter((j) => state.juegos.includes(j.id))
      .map((j) => j.chars)
      .join('');
    if (state.evitarAmbiguos) {
      chars = [...chars].filter((c) => !AMBIGUOS.includes(c)).join('');
    }
    return chars;
  }

  /**
   * Selección uniforme con rechazo: descarta los valores del último tramo
   * incompleto en lugar de aplicar un resto, que sesgaría los primeros caracteres.
   */
  function aleatorio(n) {
    const limite = Math.floor(256 / n) * n;
    const buf = new Uint8Array(1);
    let v;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limite);
    return v % n;
  }

  function generar() {
    const chars = alfabeto();
    if (!chars.length) return '';
    const largo = clamp(Math.round(state.longitud), 1, 128);
    let out = '';
    for (let i = 0; i < largo; i++) out += chars[aleatorio(chars.length)];
    return out;
  }

  function tiempoTexto(bits) {
    // Hipótesis: ataque offline sobre un hash rápido, 10^11 intentos por segundo.
    const segundos = Math.pow(2, bits - 1) / 1e11;
    if (segundos < 1) return 'menos de un segundo';
    const unidades = [
      [60, 'segundos'],
      [60, 'minutos'],
      [24, 'horas'],
      [365, 'días'],
      [1000, 'años'],
      [1000, 'miles de años'],
      [1000, 'millones de años'],
    ];
    let v = segundos;
    let nombre = 'segundos';
    for (const [div, etiqueta] of unidades) {
      if (v < div) {
        nombre = etiqueta;
        break;
      }
      v /= div;
      nombre = etiqueta;
    }
    if (nombre === 'millones de años' && v > 1000) return 'más de mil millones de años';
    return `${v >= 100 ? integer(v) : decimal(v, 1)} ${nombre}`;
  }

  function update(nueva = true) {
    const chars = alfabeto();
    const aviso = el('aviso-juegos');

    if (!chars.length) {
      el('salida').value = '';
      el('salida').placeholder = 'Selecciona al menos un tipo de carácter';
      el('nivel').textContent = '—';
      el('bits').textContent = '0';
      el('barra').style.width = '0%';
      el('crack').textContent = '';
      aviso.hidden = false;
      aviso.textContent = 'Marca al menos un tipo de carácter para generar la contraseña.';
      return;
    }
    aviso.hidden = true;

    if (nueva) el('salida').value = generar();

    const bits = state.longitud * Math.log2(chars.length);
    const nivel = NIVELES.find((n) => bits < n.hasta);

    el('bits').textContent = integer(bits);
    el('nivel').textContent = nivel.label;
    el('nivel').className = `font-semibold ${nivel.clase}`;
    el('barra').className = `h-full rounded-full transition-all duration-500 ease-spring ${nivel.barra}`;
    el('barra').style.width = `${nivel.ancho}%`;
    el('crack').textContent = `Alfabeto de ${chars.length} caracteres. Un ataque capaz de probar cien mil millones de combinaciones por segundo tardaría de media ${tiempoTexto(
      bits
    )}.`;
  }

  const setLongitud = (v) => {
    state.longitud = clamp(Math.round(v), 6, 64);
    el('longitud').value = String(state.longitud);
    el('longitud-valor').textContent = String(state.longitud);
    update();
  };

  L.on(el('longitud'), 'input', () => setLongitud(Number(el('longitud').value)));
  root.querySelectorAll('[data-longitud]').forEach((btn) =>
    L.on(btn, 'click', () => setLongitud(Number(btn.dataset.longitud)))
  );

  root.querySelectorAll('[data-juego]').forEach((chk) =>
    L.on(chk, 'change', () => {
      state.juegos = Array.from(root.querySelectorAll('[data-juego]'))
        .filter((c) => c.checked)
        .map((c) => c.dataset.juego);
      update();
    })
  );

  L.on(el('ambiguos'), 'change', () => {
    state.evitarAmbiguos = el('ambiguos').checked;
    update();
  });

  L.on(el('regenerar'), 'click', () => update(true));
  bindCopyButton(el('copy-pass'), () => el('salida').value, { label: 'Copiar' });

  update();
  return () => L.destroy();
}
