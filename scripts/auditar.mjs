/**
 * Auditoría de la carpeta dist antes de publicar.
 *
 * Comprueba lo que de verdad afecta al posicionamiento y a la aceptación en
 * AdSense: metadatos únicos y de longitud razonable, un solo h1, datos
 * estructurados válidos, enlazado interno sin páginas huérfanas y huecos
 * publicitarios con alto reservado.
 *
 * Uso: npm run auditar
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const problemas = [];
const avisos = [];
const fallo = (m) => problemas.push(m);
const aviso = (m) => avisos.push(m);

/* ---------- Recopilar páginas ---------- */
function paginas(dir = DIST, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory() && e.name !== 'assets') paginas(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

// dist/index.html -> "/" · dist/hipoteca.html -> "/hipoteca"
// dist/hipoteca/amortizar.html -> "/hipoteca/amortizar"
const rutaDe = (f) => {
  const rel = f.split(/[\\/]/).slice(1).join('/');
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\.html$/, '');
};

const html = new Map();
for (const f of paginas()) html.set(rutaDe(f), readFileSync(f, 'utf8'));

const extraer = (h, re) => (h.match(re) || [])[1] || '';

/* ---------- 1. Metadatos ---------- */
const vistos = { titulo: new Map(), desc: new Map(), canonical: new Map() };
const tabla = [];

for (const [ruta, h] of html) {
  const titulo = extraer(h, /<title>([^<]*)<\/title>/);
  const desc = extraer(h, /name="description" content="([^"]*)"/);
  const canonical = extraer(h, /rel="canonical" href="([^"]*)"/);
  const h1 = (h.match(/<h1/g) || []).length;
  const esError = ruta.includes('404');

  tabla.push({ ruta, titulo: titulo.length, desc: desc.length, h1 });

  if (!titulo) fallo(`sin <title>: ${ruta}`);
  if (!desc) fallo(`sin description: ${ruta}`);
  if (!canonical) fallo(`sin canonical: ${ruta}`);
  if (h1 !== 1) fallo(`${h1} etiquetas h1 (debe haber 1): ${ruta}`);
  if (titulo.length > 65) aviso(`título de ${titulo.length} caracteres, Google lo cortará: ${ruta}`);
  if (desc.length > 165) aviso(`descripción de ${desc.length} caracteres: ${ruta}`);
  if (desc && desc.length < 70 && !esError) aviso(`descripción corta (${desc.length}): ${ruta}`);

  for (const [clave, valor] of [['titulo', titulo], ['desc', desc], ['canonical', canonical]]) {
    if (!valor) continue;
    if (vistos[clave].has(valor)) fallo(`${clave} duplicado entre ${ruta} y ${vistos[clave].get(valor)}`);
    else vistos[clave].set(valor, ruta);
  }

  // Open Graph y Twitter
  for (const etiqueta of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) {
    if (!h.includes(etiqueta)) fallo(`falta ${etiqueta}: ${ruta}`);
  }
  // El canonical debe apuntar a la propia página
  const esperado = ruta === '/' ? '/' : ruta.replace(/\/$/, '');
  if (canonical && !canonical.endsWith(esperado)) {
    fallo(`canonical no coincide con la ruta: ${ruta} -> ${canonical}`);
  }
  // Marcadores sin sustituir
  const corchetes = h.match(/\[[A-ZÁÉÍÓÚÑ][^\]]{3,}\]/g);
  if (corchetes) fallo(`marcadores sin rellenar en ${ruta}: ${corchetes.slice(0, 3).join(', ')}`);
}

/* ---------- 2. Datos estructurados ---------- */
for (const [ruta, h] of html) {
  const bloques = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const b of bloques) {
    try {
      JSON.parse(b[1]);
    } catch {
      fallo(`JSON-LD inválido en ${ruta}`);
    }
  }
}

/* ---------- 3. Indexación ---------- */
const noindex = [...html].filter(([, h]) => /name="robots" content="[^"]*noindex/.test(h)).map(([r]) => r);
if (!noindex.some((r) => r.includes('404'))) fallo('la página 404 debería llevar noindex');
for (const r of noindex) if (!r.includes('404')) fallo(`página con noindex inesperado: ${r}`);

/* ---------- 4. Sitemap y robots ---------- */
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const enSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/'
);
const indexables = [...html.keys()]
  .map((r) => r.replace(/\/$/, '') || '/')
  .filter((r) => !r.includes('404'));

for (const r of indexables) if (!enSitemap.includes(r)) fallo(`falta en el sitemap: ${r}`);
for (const r of enSitemap) if (!indexables.includes(r)) fallo(`en el sitemap pero sin HTML: ${r}`);

const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap:')) fallo('robots.txt sin línea Sitemap');
if (!/utilifast\.com/.test(robots)) fallo('robots.txt no apunta al dominio definitivo');

/* ---------- 5. Enlazado interno ---------- */
const entrantes = new Map(indexables.map((r) => [r, 0]));
for (const [, h] of html) {
  const enlaces = [...h.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1].replace(/\/$/, '') || '/');
  for (const e of new Set(enlaces)) if (entrantes.has(e)) entrantes.set(e, entrantes.get(e) + 1);
}
for (const [r, n] of entrantes) if (n === 0) fallo(`página huérfana, nadie la enlaza: ${r}`);
const pocos = [...entrantes].filter(([, n]) => n < 3).map(([r, n]) => `${r} (${n})`);
if (pocos.length) aviso(`con menos de 3 enlaces entrantes: ${pocos.join(', ')}`);

/* ---------- 6. Recursos y AdSense ---------- */
for (const f of ['favicon.svg', 'og-default.png']) {
  if (!existsSync(join(DIST, f))) fallo(`falta ${f}`);
}
const bloqueables = readdirSync(join(DIST, 'assets')).filter((n) =>
  /(^|[^a-z])ads?([^a-z]|$)|adslot|banner|doubleclick|popunder/i.test(n)
);
if (bloqueables.length) fallo(`ficheros que bloquearía un bloqueador: ${bloqueables.join(', ')}`);

const conHueco = [...html].filter(([, h]) => h.includes('hueco-marco')).length;
if (conHueco < indexables.length - 3) aviso(`solo ${conHueco} páginas tienen hueco publicitario`);

// Sin identificador de AdSense no debe emitirse ningún script de Google
const conScriptGoogle = [...html].filter(([, h]) => h.includes('googlesyndication')).map(([r]) => r);
if (conScriptGoogle.length) fallo(`script de AdSense en el HTML (debe inyectarlo el consentimiento): ${conScriptGoogle}`);

/* ---------- 6 bis. Contenido suficiente ---------- */
// El umbral evita que una página quede como «contenido de escaso valor»: es el
// motivo de rechazo más frecuente en AdSense para sitios de calculadoras.
const MINIMO_PALABRAS = 300;
for (const [ruta, h] of html) {
  if (/\/(legal|quienes-somos)\/?$/.test(ruta) || ruta.includes('404')) continue;
  const art = h.match(/<div class="prose-seo">([\s\S]*?)<\/div>\s*<\/section>/);
  if (!art) {
    fallo(`sin bloque de contenido editorial: ${ruta}`);
    continue;
  }
  const palabras = art[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
  if (palabras < MINIMO_PALABRAS) fallo(`solo ${palabras} palabras de artículo (mínimo ${MINIMO_PALABRAS}): ${ruta}`);
}

// Las páginas informativas deben ser alcanzables desde el pie de todas las páginas
for (const [ruta, h] of html) {
  const pie = h.slice(h.lastIndexOf('<footer'));
  for (const destino of ['/legal', '/quienes-somos']) {
    if (!pie.includes(`href="${destino}"`)) fallo(`${destino} no está enlazado en el pie de ${ruta}`);
  }
  if (!pie.includes('data-cookie-settings')) fallo(`sin acceso a preferencias de cookies en el pie de ${ruta}`);
}

/* ---------- 7. Jerarquía de encabezados ---------- */
for (const [ruta, h] of html) {
  const niveles = [...h.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  let previo = 0;
  for (const n of niveles) {
    if (previo && n > previo + 1) {
      fallo(`salto de encabezado h${previo} a h${n} en ${ruta}`);
      break;
    }
    previo = n;
  }
  if (!niveles.length) fallo(`sin encabezados: ${ruta}`);
}

/* ---------- 8. Accesibilidad ---------- */
for (const [ruta, h] of html) {
  if (!/<html[^>]+lang="es"/.test(h)) fallo(`falta lang="es" en ${ruta}`);
  if (!/name="viewport"[^>]+width=device-width/.test(h)) fallo(`viewport mal configurado en ${ruta}`);

  // Toda imagen necesita alt (los SVG decorativos van con aria-hidden)
  const imgsSinAlt = [...h.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)];
  if (imgsSinAlt.length) fallo(`${imgsSinAlt.length} <img> sin alt en ${ruta}`);

  const svgSinOcultar = [...h.matchAll(/<svg(?![^>]*(aria-hidden|role="img"))[^>]*>/g)];
  if (svgSinOcultar.length) fallo(`${svgSinOcultar.length} <svg> sin aria-hidden ni role en ${ruta}`);

  // Campos de formulario: cada uno con label, aria-label o aria-labelledby
  const campos = [...h.matchAll(/<(input|select|textarea)\b[^>]*>/g)].map((m) => m[0]);
  const idsConLabel = new Set([...h.matchAll(/<label[^>]+for="([^"]+)"/g)].map((m) => m[1]));
  let sinEtiquetar = 0;
  for (const campo of campos) {
    if (/type="(hidden|submit|button)"/.test(campo)) continue;
    if (/aria-label(ledby)?=/.test(campo)) continue;
    const id = (campo.match(/\bid="([^"]+)"/) || [])[1];
    if (id && idsConLabel.has(id)) continue;
    // Un campo envuelto por su propia <label> tampoco necesita for
    const envuelto = new RegExp('<label[^>]*>(?:(?!</label>)[\\s\\S])*?' + campo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (envuelto.test(h)) continue;
    sinEtiquetar++;
  }
  if (sinEtiquetar) fallo(`${sinEtiquetar} campos sin etiqueta accesible en ${ruta}`);

  // Botones sin nombre accesible: ni texto visible, ni aria-label.
  // Se compara el contenido con las etiquetas quitadas; un `[\s\S]*?` suelto
  // se traga el texto intermedio y da falsos positivos.
  let mudos = 0;
  for (const b of h.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const [, atributos, contenido] = b;
    if (/aria-label(ledby)?=/.test(atributos)) continue;
    const texto = contenido
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/g, '')
      .trim();
    if (!texto) mudos++;
  }
  if (mudos) fallo(`${mudos} botones sin nombre accesible en ${ruta}`);
}

/* ---------- 9. Móvil ---------- */
const css = readdirSync(join(DIST, 'assets')).find((n) => n.endsWith('.css'));
const hojaEstilos = readFileSync(join(DIST, 'assets', css), 'utf8');
if (!hojaEstilos.includes('@media')) fallo('la hoja de estilos no tiene consultas de medios');
if (!/prefers-reduced-motion/.test(hojaEstilos)) aviso('sin soporte de prefers-reduced-motion');
// El tema oscuro se resuelve con [data-theme] que fija un script en línea antes
// de pintar, leyendo prefers-color-scheme. Cualquiera de las dos vías es válida.
if (!/prefers-color-scheme|\[data-theme/.test(hojaEstilos)) aviso('sin soporte de tema oscuro');
// Alto reservado de los huecos: es lo que mantiene el CLS a cero
for (const clase of ['hueco-banner', 'hueco-cuadro', 'hueco-columna']) {
  const re = new RegExp('\\.' + clase + '[^}]*height:\\s*\\d');
  if (!re.test(hojaEstilos)) fallo(`la clase .${clase} no reserva alto fijo`);
}

/* ---------- 10. Peso ---------- */
const assets = readdirSync(join(DIST, 'assets'));
const nucleo = assets.find((n) => n.startsWith('index-') && n.endsWith('.js'));
const kb = (f) => statSync(join(DIST, 'assets', f)).size / 1024;
if (kb(nucleo) > 120) aviso(`núcleo JS de ${kb(nucleo).toFixed(0)} kB, revisar`);

/* ---------- Informe ---------- */
console.log('\nRuta                                    título  desc  h1');
for (const t of tabla.sort((a, b) => a.ruta.localeCompare(b.ruta))) {
  console.log(t.ruta.padEnd(40), String(t.titulo).padStart(5), String(t.desc).padStart(5), String(t.h1).padStart(3));
}

console.log(`\n${html.size} páginas · ${enSitemap.length} en sitemap · núcleo ${kb(nucleo).toFixed(1)} kB`);

if (avisos.length) {
  console.log('\nAvisos:');
  avisos.forEach((a) => console.log('  ·', a));
}
if (problemas.length) {
  console.log('\nPROBLEMAS:');
  problemas.forEach((p) => console.log('  ✗', p));
  process.exit(1);
}
console.log('\nSin problemas.');
