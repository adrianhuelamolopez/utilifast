import { breadcrumbs } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { SITE } from '../config.js';
import { escapeHtml } from '../utils/format.js';

// Los metadatos viven en src/meta.js para que la navegación pueda importarlos
// sin arrastrar el código de esta vista, que se carga bajo demanda.
import { legal as meta } from '../meta.js';
export { meta };

/**
 * Bloque identificativo del artículo 10 LSSI-CE.
 *
 * Con SITE.titular relleno se publica la identificación completa. Sin él se emite
 * solo el contacto: es preferible a dejar corchetes a medias en una página en
 * producción, que resta credibilidad sin aportar cumplimiento alguno.
 */
/** Responsable del tratamiento, en la política de privacidad. */
function responsableTexto() {
  const t = SITE.titular || {};
  if (!t.nombre) {
    return `Al no realizarse tratamiento de datos personales a través de las herramientas, el único punto
        de contacto para cualquier cuestión relacionada con la privacidad de este sitio es
        ${SITE.email}.`;
  }
  return `Responsable: ${escapeHtml(t.nombre)}, NIF ${escapeHtml(t.nif)}${
    t.localidad ? `, con domicilio en ${escapeHtml(t.localidad)}` : ''
  }, y correo electrónico ${SITE.email}.`;
}

function identificacion() {
  const t = SITE.titular || {};
  const completo = t.nombre && t.nif;
  if (!completo) {
    return `
      <ul>
        <li><strong>Sitio web:</strong> ${SITE.url}</li>
        <li><strong>Correo de contacto:</strong> ${SITE.email}</li>
      </ul>
      <p>
        Este sitio se ofrece de forma gratuita y sin ánimo de lucro. Si en el futuro incorpora
        publicidad u otra forma de monetización, pasará a constituir actividad económica y esta
        sección se completará con los datos identificativos que exige el artículo 10 de la LSSI-CE.
      </p>`;
  }
  return `
      <ul>
        <li><strong>Titular:</strong> ${escapeHtml(t.nombre)}</li>
        <li><strong>NIF:</strong> ${escapeHtml(t.nif)}</li>
        ${t.localidad ? `<li><strong>Domicilio:</strong> ${escapeHtml(t.localidad)}</li>` : ''}
        <li><strong>Correo de contacto:</strong> ${SITE.email}</li>
        <li><strong>Sitio web:</strong> ${SITE.url}</li>
      </ul>`;
}

export function render() {
  return `
  <div class="container-x">
  ${breadcrumbs([{ label: 'Inicio', href: '/' }, { label: 'Información legal' }])}

  <header class="mb-8 max-w-3xl">
    <h1>Aviso legal, privacidad y cookies</h1>
    <p class="mt-3 max-w-2xl text-base leading-relaxed text-content-muted">
      Documento informativo sobre las condiciones de uso de ${SITE.name}, el tratamiento de datos personales
      y el uso de cookies, conforme al Reglamento (UE) 2016/679 (RGPD), a la Ley Orgánica 3/2018 (LOPDGDD)
      y a la Ley 34/2002 (LSSI-CE).
    </p>
    <div class="mt-5 flex items-start gap-3 rounded-xl bg-caution-soft p-4 text-sm leading-6 text-caution ring-1 ring-inset ring-caution/25">
      <span class="mt-0.5 shrink-0">${icon('alert', { class: 'h-4 w-4' })}</span>
      <p><strong class="font-semibold">Plantilla orientativa.</strong> Sustituye los campos entre corchetes por
      tus datos reales y revisa el texto con un profesional del derecho antes de publicarlo. Este contenido no
      constituye asesoramiento jurídico.</p>
      <p class="mt-2">
        La obligación del artículo 10 de la LSSI-CE alcanza a quien presta un servicio con
        <strong class="font-semibold">actividad económica</strong>: una web sin publicidad ni ingresos queda
        fuera de su ámbito. Si llegas a monetizar, rellena <code>SITE.titular</code> en
        <code>src/config.js</code> y esta sección se completa sola: nombre y apellidos, NIF, localidad y
        provincia —no la dirección completa— y un medio de contacto directo.
      </p>
    </div>
  </header>

  <div class="grid gap-10 lg:grid-cols-[1fr_15rem]">
  <div class="prose-seo order-2 lg:order-1">
    <section id="aviso-legal" class="scroll-mt-24">
      <h2>1. Aviso legal e información del titular</h2>
      <p>
        Datos identificativos y de contacto del responsable de este sitio web, conforme al artículo 10 de la
        Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico:
      </p>
      ${identificacion()}
      <p>
        Para cualquier consulta relacionada con este sitio, el correo electrónico es el canal de
        comunicación directa y efectiva previsto en el artículo 10.1.a de la LSSI-CE.
      </p>

      <h3>1.1. Objeto y condiciones de uso</h3>
      <p>
        Este sitio ofrece de forma gratuita un conjunto de calculadoras y generadores de uso general. El acceso
        atribuye la condición de usuario e implica la aceptación de las presentes condiciones. El usuario se
        compromete a hacer un uso lícito del sitio y a no emplearlo para fines contrarios a la ley, a la buena
        fe o al orden público, ni a realizar acciones que puedan dañar, sobrecargar o inutilizar el servicio.
      </p>

      <h3>1.2. Exclusión de responsabilidad</h3>
      <p>
        Las herramientas se facilitan <strong>«tal cual», con carácter meramente informativo y orientativo</strong>.
        Los resultados dependen íntegramente de los datos introducidos por el usuario y pueden contener
        aproximaciones o redondeos. En particular, las calculadoras de carácter nutricional no constituyen
        consejo médico, dietético ni sanitario, y las estimaciones económicas no constituyen asesoramiento
        financiero. El titular no se responsabiliza de las decisiones adoptadas a partir de dichos resultados.
      </p>

      <h3>1.3. Propiedad intelectual</h3>
      <p>
        El código, el diseño, los textos y los elementos gráficos del sitio son titularidad de su autor o se
        utilizan bajo licencia. Queda prohibida su reproducción o distribución con fines comerciales sin
        autorización expresa. Las marcas de terceros que puedan citarse (por ejemplo, WhatsApp) pertenecen a
        sus respectivos titulares y se mencionan únicamente con fines descriptivos; este sitio no está
        afiliado a ellos ni patrocinado por ellos.
      </p>

      <h3>1.4. Enlaces y legislación aplicable</h3>
      <p>
        El sitio puede incluir enlaces a páginas de terceros sobre cuyos contenidos el titular no ejerce
        control alguno. La relación entre el usuario y el titular se rige por la legislación española y, salvo
        que la normativa de consumo disponga otra cosa, las partes se someten a los juzgados y tribunales
        que resulten competentes conforme a la legislación aplicable. Si el usuario tiene la condición de
        consumidor, será competente el juzgado correspondiente a su domicilio.
      </p>
    </section>

    <section id="privacidad" class="scroll-mt-24">
      <h2>2. Política de privacidad</h2>

      <h3>2.1. Principio fundamental: procesamiento 100 % local</h3>
      <p>
        Todas las calculadoras y generadores de ${SITE.name} se ejecutan <strong>exclusivamente en el
        navegador del usuario</strong>, mediante JavaScript que corre en su propio dispositivo. Los datos que
        introduces —kilómetros, consumo, precio del carburante, número de teléfono, mensajes, peso corporal u
        objetivos nutricionales— <strong>no se transmiten a ningún servidor, no se almacenan en bases de datos
        y no se comparten con terceros</strong>. Al cerrar o recargar la pestaña, esa información desaparece.
      </p>
      <p>
        En consecuencia, el titular <strong>no realiza tratamiento alguno de los datos introducidos en las
        herramientas</strong>, ya que nunca llegan a su ámbito de control.
      </p>

      <h3>2.2. Responsable del tratamiento</h3>
      <p>
        ${responsableTexto()}
      </p>

      <h3>2.3. Datos que sí pueden tratarse</h3>
      <ul>
        <li>
          <strong>Datos de navegación.</strong> El proveedor de alojamiento registra de forma automática
          direcciones IP, tipo de navegador y páginas visitadas con la finalidad de garantizar la seguridad y
          el funcionamiento del servicio. Base jurídica: interés legítimo (art. 6.1.f RGPD).
        </li>
        <li>
          <strong>Comunicaciones voluntarias.</strong> Si escribes al correo de contacto, se tratarán los datos
          que facilites con la única finalidad de atender tu consulta. Base jurídica: consentimiento
          (art. 6.1.a RGPD). Conservación: el tiempo necesario para responder y los plazos legales aplicables.
        </li>
        <li>
          <strong>Analítica y publicidad.</strong> Si se activan herramientas de medición o redes publicitarias
          (por ejemplo, Google AdSense o Google Analytics), estas podrán tratar identificadores y datos de uso
          con base en el <strong>consentimiento</strong> prestado en el panel de cookies, que puedes retirar en
          cualquier momento.
        </li>
      </ul>

      <h3>2.4. Destinatarios y transferencias internacionales</h3>
      <p>
        Los datos podrán ser tratados por los proveedores tecnológicos que prestan servicio al sitio
        (alojamiento en Cloudflare Pages y, en su caso, proveedores de analítica y
        publicidad), actuando como encargados o corresponsables. Algunos de ellos pueden realizar
        transferencias internacionales amparadas en decisiones de adecuación o en cláusulas contractuales tipo.
      </p>

      <h3>2.5. Tus derechos</h3>
      <p>
        Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento
        y portabilidad escribiendo a ${SITE.email}, acreditando tu identidad. Si consideras que el tratamiento
        no se ajusta a la normativa, puedes presentar una reclamación ante la Agencia Española de Protección de
        Datos (www.aepd.es).
      </p>

      <h3>2.6. Menores</h3>
      <p>
        El sitio no está dirigido específicamente a menores de 14 años ni recaba conscientemente datos de ellos.
      </p>
    </section>

    <section id="cookies" class="scroll-mt-24">
      <h2>3. Política de cookies</h2>
      <p>
        Una cookie es un pequeño fichero que un sitio web almacena en tu dispositivo para recordar información
        sobre tu visita. Conforme al artículo 22.2 de la LSSI-CE, solo se instalan cookies no técnicas si
        prestas tu consentimiento.
      </p>

      <h3>3.1. Cookies utilizadas</h3>
      <ul>
        <li>
          <strong>Técnicas o necesarias.</strong> Imprescindibles para el funcionamiento del sitio y para
          recordar tu elección sobre cookies. No requieren consentimiento.
        </li>
        <li>
          <strong>De preferencias.</strong> Este sitio no usa cookies para ello, sino
          <em>localStorage</em> del navegador, con dos únicas claves:
          <code>utilifast:consent</code> (tu decisión sobre esta política) y
          <code>utilifast:theme</code> (tema claro u oscuro). No identifican al usuario, no se
          transmiten a ningún servidor y permanecen solo en tu dispositivo.
        </li>
        <li>
          <strong>De análisis.</strong> Permiten medir de forma agregada el uso del sitio. Requieren
          consentimiento.
        </li>
        <li>
          <strong>Publicitarias de terceros.</strong> Google y sus socios pueden utilizar cookies para mostrar
          anuncios y medir su rendimiento. Requieren consentimiento. Puedes consultar y configurar tus
          preferencias de anuncios personalizados en los ajustes de tu cuenta de Google.
        </li>
      </ul>

      <h3>3.2. Cómo gestionarlas</h3>
      <p>
        Al entrar por primera vez verás un aviso con tres opciones: aceptar todas, rechazar todas o
        configurar por categorías. Hasta que elijas, <strong>no se carga ninguna cookie de análisis ni de
        publicidad</strong>. Las casillas de las categorías opcionales están desmarcadas por defecto.
      </p>
      <p>
        Puedes cambiar o retirar tu consentimiento cuando quieras con el botón siguiente, o desde el enlace
        «Configurar cookies» del pie de página. Adicionalmente puedes borrar o bloquear cookies desde los
        ajustes de tu navegador (Chrome, Firefox, Safari, Edge); ten en cuenta que desactivar las técnicas
        puede afectar al funcionamiento de algunas funciones.
      </p>
      <p>
        <button type="button" class="btn-secondary" data-cookie-settings>
          ${icon('layers', { class: 'h-4 w-4' })} Configurar cookies
        </button>
      </p>

      <h3>3.3. Actualizaciones</h3>
      <p>
        Esta política puede actualizarse para adaptarse a cambios normativos o a nuevas funcionalidades del
        sitio. Última actualización: ${escapeHtml(SITE.updated)}.
      </p>
    </section>
  </div>

  <nav aria-label="Secciones legales" class="order-1 lg:order-2">
    <div class="sticky top-24 rounded-2xl border border-line bg-surface p-4">
      <p class="text-2xs font-semibold uppercase tracking-wider text-content-subtle">En esta página</p>
      <ul class="mt-3 space-y-1 text-sm">
        <li><a class="link block rounded-lg px-2 py-1.5 hover:bg-surface-muted" href="#aviso-legal">1. Aviso legal</a></li>
        <li><a class="link block rounded-lg px-2 py-1.5 hover:bg-surface-muted" href="#privacidad">2. Privacidad</a></li>
        <li><a class="link block rounded-lg px-2 py-1.5 hover:bg-surface-muted" href="#cookies">3. Cookies</a></li>
      </ul>
      <div class="mt-4 flex items-start gap-2 border-t border-line pt-4 text-xs leading-5 text-content-subtle">
        ${icon('shield', { class: 'mt-0.5 h-3.5 w-3.5 shrink-0' })}
        <span>Los cálculos de las herramientas nunca salen de tu navegador.</span>
      </div>
    </div>
  </nav>
  </div>
  </div>
  `;
}

export function mount() {
  // Página estática: no necesita comportamiento en cliente.
  return () => {};
}
