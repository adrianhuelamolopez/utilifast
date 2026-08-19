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

const rutaDe = (f) =>
  '/' + f.split(/[\\/]/).slice(1).join('/').replace(/index\.html$/, '').replace(/\.html$/, '');

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

/* ---------- 7. Peso ---------- */
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
