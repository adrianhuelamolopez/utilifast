import { hueco } from '../components/hueco.js';
import { pageHeader, breadcrumbs, privacyNote, seoArticle, faq, panelTitle } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { escapeHtml } from '../utils/format.js';
import { qs, listeners, debounce } from '../utils/dom.js';
import { bindCopyButton } from '../utils/clipboard.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { whatsapp as meta } from '../meta.js';
export { meta };

// Prefijos más usados en España y Latinoamérica.
const PREFIXES = [
  { code: '34', label: 'España', flag: '🇪🇸' },
  { code: '52', label: 'México', flag: '🇲🇽' },
  { code: '54', label: 'Argentina', flag: '🇦🇷' },
  { code: '57', label: 'Colombia', flag: '🇨🇴' },
  { code: '56', label: 'Chile', flag: '🇨🇱' },
  { code: '51', label: 'Perú', flag: '🇵🇪' },
  { code: '58', label: 'Venezuela', flag: '🇻🇪' },
  { code: '593', label: 'Ecuador', flag: '🇪🇨' },
  { code: '591', label: 'Bolivia', flag: '🇧🇴' },
  { code: '598', label: 'Uruguay', flag: '🇺🇾' },
  { code: '595', label: 'Paraguay', flag: '🇵🇾' },
  { code: '55', label: 'Brasil', flag: '🇧🇷' },
  { code: '502', label: 'Guatemala', flag: '🇬🇹' },
  { code: '503', label: 'El Salvador', flag: '🇸🇻' },
  { code: '504', label: 'Honduras', flag: '🇭🇳' },
  { code: '505', label: 'Nicaragua', flag: '🇳🇮' },
  { code: '506', label: 'Costa Rica', flag: '🇨🇷' },
  { code: '507', label: 'Panamá', flag: '🇵🇦' },
  { code: '1', label: 'EE. UU. / Canadá', flag: '🇺🇸' },
  { code: '351', label: 'Portugal', flag: '🇵🇹' },
  { code: '33', label: 'Francia', flag: '🇫🇷' },
  { code: '44', label: 'Reino Unido', flag: '🇬🇧' },
  { code: '49', label: 'Alemania', flag: '🇩🇪' },
  { code: '39', label: 'Italia', flag: '🇮🇹' },
  { code: '212', label: 'Marruecos', flag: '🇲🇦' },
];

const PLANTILLAS = [
  { label: 'Información', text: 'Hola, he visto vuestra web y me gustaría pedir información sobre…' },
  { label: 'Reserva', text: '¡Hola! Quería reservar mesa para el sábado. ¿Tenéis disponibilidad?' },
  { label: 'Presupuesto', text: 'Buenos días, ¿podríais enviarme un presupuesto para…?' },
];

export function render() {
  return `
  <div class="container-x">
    ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Enlace y QR de WhatsApp' }])}
    ${pageHeader({
      icon: meta.icon,
      badge: 'Generador',
      title: 'Generador de enlaces wa.me y códigos QR',
      lede: 'Crea un enlace directo a tu chat de WhatsApp con el mensaje ya escrito y descárgalo como código QR en PNG para tu escaparate, tu tarjeta o tus redes.',
      updated: SITE.updated,
    })}

    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Formulario -->
      <form id="wa-form" class="card p-5 sm:p-6 lg:col-span-7" novalidate>
        ${panelTitle('Configura tu enlace', 'phone')}

        <div class="grid gap-5 sm:grid-cols-3">
          <div>
            <label class="field-label" for="prefijo">Prefijo</label>
            <select class="input" id="prefijo">
              ${PREFIXES.map(
                (p) =>
                  `<option value="${p.code}"${p.code === '34' ? ' selected' : ''}>${p.flag} +${
                    p.code
                  } · ${escapeHtml(p.label)}</option>`
              ).join('')}
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="field-label" for="telefono">Número de teléfono</label>
            <input class="input no-spin" id="telefono" type="tel" inputmode="tel"
                   autocomplete="off" placeholder="600 11 22 33" />
            <p class="hint" id="telefono-hint">Sin el prefijo y sin ceros iniciales.</p>
          </div>

          <div class="sm:col-span-3">
            <label class="field-label" for="mensaje">Mensaje predefinido <span class="font-normal text-content-subtle">(opcional)</span></label>
            <textarea class="input min-h-[130px] resize-y leading-6" id="mensaje" rows="4"
                      maxlength="800" placeholder="Escribe lo que verá ya redactado en el chat…"></textarea>
            <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap gap-2">
                ${PLANTILLAS.map(
                  (t, i) =>
                    `<button type="button" class="chip !py-1 !text-xs" data-plantilla="${i}">${escapeHtml(
                      t.label
                    )}</button>`
                ).join('')}
              </div>
              <p class="text-2xs tabular-nums tracking-normal text-content-subtle">
                <span id="contador">0</span>/800
              </p>
            </div>
          </div>
        </div>

        <fieldset class="mt-6 border-t border-line pt-5">
          <legend class="field-label">Tamaño del PNG descargado</legend>
          <div class="segmented max-w-xs" id="qr-sizes" role="group">
            <button type="button" class="segmented-item" data-size="256" aria-pressed="false">256 px</button>
            <button type="button" class="segmented-item" data-size="512" aria-pressed="true">512 px</button>
            <button type="button" class="segmented-item" data-size="1024" aria-pressed="false">1024 px</button>
          </div>
          <p class="hint">Usa 1024 px si vas a imprimirlo en un cartel o escaparate.</p>
        </fieldset>

        ${privacyNote('Tu número nunca se envía a UtiliFast ni se guarda en ningún listado.')}
      </form>

      <!-- Resultado -->
      <section class="lg:col-span-5">
        <div class="card sticky top-24 p-5 sm:p-6">
          ${panelTitle('Tu enlace y tu QR', 'spark')}

          <label class="field-label" for="enlace">Enlace generado</label>
          <input class="input font-mono text-xs" id="enlace" readonly aria-live="polite"
                 placeholder="https://wa.me/…" />

          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" class="btn-primary" id="copy-link">
              ${icon('copy', { class: 'h-4 w-4' })}<span data-copy-label>Copiar enlace</span>
            </button>
            <a class="btn-secondary" id="open-link" href="#" target="_blank" rel="noopener noreferrer">
              ${icon('external', { class: 'h-4 w-4' })} Probar chat
            </a>
          </div>

          <div class="mt-6">
            <p class="field-label">Código QR</p>
            <!-- Alto reservado: el QR aparece sin desplazar el contenido (CLS = 0) -->
            <div class="mx-auto max-w-[260px] rounded-2xl border border-line bg-white p-3 shadow-subtle">
              <div id="qr-box" class="grid aspect-square w-full place-items-center overflow-hidden rounded-lg">
                <p class="px-6 text-center text-xs leading-5 text-slate-400" id="qr-empty">
                  Introduce un número para generar el código QR
                </p>
              </div>
            </div>
            <button type="button" class="btn-secondary mt-3 w-full" id="download-qr" disabled>
              ${icon('download', { class: 'h-4 w-4' })} Descargar QR en PNG
            </button>
          </div>
        </div>
      </section>
    </div>

    ${hueco({ format: 'leaderboard', className: 'my-12' })}

    ${seoArticle(`
      <h2>Qué es un enlace wa.me y para qué sirve</h2>
      <p>
        Un enlace <strong>wa.me</strong> es la forma oficial de abrir una conversación de WhatsApp con un número
        concreto sin que la otra persona tenga que guardarlo antes en su agenda. Su estructura es siempre la
        misma: el dominio <em>wa.me</em>, seguido del número en formato internacional (prefijo del país y número,
        sin signos, sin espacios y sin ceros iniciales) y, opcionalmente, un parámetro con el mensaje que
        aparecerá ya escrito en el chat. Al pulsarlo, el móvil abre la aplicación directamente en la conversación
        y en escritorio se abre WhatsApp Web.
      </p>
      <h2>Cómo crear tu enlace directo de WhatsApp paso a paso</h2>
      <p>
        Elige tu país en el selector de prefijo, escribe el número de teléfono tal y como lo darías a un amigo
        —el generador limpia por ti espacios, guiones y paréntesis— y redacta el mensaje que quieres precargar.
        El enlace se actualiza en tiempo real y puedes copiarlo con un clic para pegarlo en la biografía de
        Instagram, en el botón de contacto de tu web, en la firma del correo o en un anuncio.
      </p>
      <p>
        Un mensaje predefinido bien pensado multiplica la conversión: si el usuario solo tiene que pulsar
        "enviar", la barrera desaparece. Frases del tipo <em>"Hola, quiero información sobre la reserva del
        sábado"</em> también te ayudan a saber de qué campaña procede cada contacto si usas una variante distinta
        en cada canal.
      </p>
      <h2>Cuándo conviene usar el código QR en lugar del enlace</h2>
      <p>
        El código QR es la versión física del mismo enlace. Funciona especialmente bien en escaparates, cartas de
        restaurante, etiquetas de producto, ferias, packaging y tarjetas de visita: el cliente apunta con la
        cámara y entra en tu chat sin teclear nada. Descárgalo en PNG y elige un tamaño generoso —1024 píxeles si
        vas a imprimirlo en un cartel— para que no pierda nitidez al ampliarlo.
      </p>
      <p>
        Al imprimir, respeta un margen blanco alrededor del código, evita fondos con mucho contraste detrás y
        comprueba el resultado escaneándolo tú mismo desde varios metros. Este generador crea el QR con
        corrección de errores media, un buen equilibrio entre densidad y tolerancia a manchas o dobleces del
        papel.
      </p>
    `)}

    ${faq([
      {
        q: '¿Tengo que poner el prefijo del país?',
        a: 'Sí. WhatsApp identifica cada cuenta por su número internacional completo, por eso el generador antepone el prefijo que elijas y elimina los ceros iniciales.',
      },
      {
        q: '¿El QR caduca o deja de funcionar?',
        a: 'No. El código contiene el enlace en sí mismo, no depende de ningún servidor intermedio de UtiliFast, así que seguirá funcionando mientras tu número de WhatsApp esté activo.',
      },
      {
        q: '¿Puedo usarlo con una cuenta de WhatsApp Business?',
        a: 'Sí, funciona igual con cuentas personales y de empresa, y también con el número de un catálogo o de atención al cliente.',
      },
    ])}
  </div>
  `;
}

export function mount(root) {
  const L = listeners();
  const el = (id) => qs('#' + id, root);
  const prefijo = el('prefijo');
  const telefono = el('telefono');
  const mensaje = el('mensaje');
  const enlace = el('enlace');
  const qrBox = el('qr-box');
  const downloadBtn = el('download-qr');

  let qrSize = 512;
  let QrCreator = null;
  let lastLink = '';

  const digits = (v) => String(v || '').replace(/\D/g, '');

  function buildLink() {
    const phone = digits(prefijo.value) + digits(telefono.value).replace(/^0+/, '');
    const text = mensaje.value.trim();
    const valid = digits(telefono.value).replace(/^0+/, '').length >= 6;
    const url = `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
    return { url, valid, phone };
  }

  async function renderQr(url) {
    if (!QrCreator) {
      // Carga diferida: el chunk del QR solo se descarga en esta vista.
      QrCreator = (await import('qr-creator')).default;
    }
    qrBox.innerHTML = '';
    QrCreator.render(
      {
        text: url,
        radius: 0.2,
        ecLevel: 'M',
        fill: '#0b1020',
        background: '#ffffff',
        size: 1024, // se renderiza grande y se escala por CSS: siempre nítido
      },
      qrBox
    );
    const canvas = qrBox.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.classList.add('animate-scale-in');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Código QR con el enlace de WhatsApp');
    }
  }

  function clearQr(message) {
    qrBox.innerHTML = `<p class="px-6 text-center text-xs leading-5 text-slate-400">${escapeHtml(
      message
    )}</p>`;
  }

  const refreshQr = debounce(async () => {
    const { url, valid } = buildLink();
    if (!valid) {
      clearQr('Introduce un número para generar el código QR');
      downloadBtn.disabled = true;
      return;
    }
    try {
      await renderQr(url);
      downloadBtn.disabled = false;
    } catch {
      clearQr('No se ha podido generar el código QR');
      downloadBtn.disabled = true;
    }
  }, 250);

  function update() {
    const { url, valid } = buildLink();
    lastLink = url;
    enlace.value = valid ? url : '';
    const escrito = telefono.value.trim() !== '';
    telefono.classList.toggle('input-invalid', !valid && escrito);
    el('telefono-hint').textContent =
      !valid && escrito
        ? 'El número parece incompleto: revisa los dígitos.'
        : 'Sin el prefijo y sin ceros iniciales.';
    el('open-link').href = valid ? url : '#';
    el('open-link').classList.toggle('pointer-events-none', !valid);
    el('open-link').classList.toggle('opacity-45', !valid);
    el('contador').textContent = String(mensaje.value.length);
    refreshQr();
  }

  L.on(prefijo, 'change', update);
  L.on(telefono, 'input', update);
  L.on(mensaje, 'input', update);
  L.on(el('wa-form'), 'submit', (e) => e.preventDefault());

  root.querySelectorAll('[data-plantilla]').forEach((btn) =>
    L.on(btn, 'click', () => {
      mensaje.value = PLANTILLAS[Number(btn.dataset.plantilla)].text;
      mensaje.focus();
      update();
    })
  );

  root.querySelectorAll('[data-size]').forEach((btn) =>
    L.on(btn, 'click', () => {
      qrSize = Number(btn.dataset.size);
      root.querySelectorAll('[data-size]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
    })
  );

  L.on(downloadBtn, 'click', () => {
    const source = qrBox.querySelector('canvas');
    if (!source) return;
    // Reescalado al tamaño elegido antes de exportar.
    const out = document.createElement('canvas');
    out.width = qrSize;
    out.height = qrSize;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, qrSize, qrSize);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, qrSize, qrSize);

    const a = document.createElement('a');
    a.href = out.toDataURL('image/png');
    a.download = `whatsapp-qr-${buildLink().phone || 'utilifast'}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  bindCopyButton(el('copy-link'), () => lastLink, { label: 'Copiar enlace' });

  update();
  return () => L.destroy();
}
