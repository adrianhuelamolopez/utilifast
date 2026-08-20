/**
 * Prerender estático post-build.
 *
 * Vite genera un único index.html (SPA). Este script reutiliza los MISMOS módulos de
 * vistas para escribir un HTML completo por ruta: /gasolina/index.html, /macros/index.html…
 * Así los buscadores reciben el contenido y las metaetiquetas ya renderizadas (sin depender
 * de que ejecuten JavaScript), y el router hidrata la SPA en cuanto carga el bundle.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TODAS as ROUTES, NOT_FOUND } from '../src/routes.js';
import { shell } from '../src/components/layout.js';
import { buildHead } from '../src/seo.js';
import { SITE } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolvePath(__dirname, '..', 'dist');

let template = readFileSync(join(dist, 'index.html'), 'utf8');

// Precarga de la tipografía: sin esto el navegador no la descubre hasta parsear el CSS.
const fontFile = readdirSync(join(dist, 'assets')).find((f) => f.endsWith('.woff2'));
if (fontFile) {
  template = template.replace(
    '</head>',
    `  <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${fontFile}" />
  </head>`
  );
}

const SEO_BLOCK = /<!--\s*seo:start\s*-->[\s\S]*?<!--\s*seo:end\s*-->/;
const APP_SLOT = /<!--\s*app:html\s*-->/;

async function buildPage(route) {
  const { meta } = route;
  // Los cargadores son perezosos también aquí: cada vista se importa al generarla.
  const view = await route.load();
  const head = `<!--seo:start-->\n    ${buildHead(meta)}\n    <!--seo:end-->`;
  const body = shell(meta, view.render());

  if (!SEO_BLOCK.test(template)) throw new Error('No se encontró el bloque <!--seo:start--> en index.html');
  if (!APP_SLOT.test(template)) throw new Error('No se encontró <!--app:html--> en index.html');

  return template.replace(SEO_BLOCK, () => head).replace(APP_SLOT, () => body);
}

function write(relPath, contents) {
  const file = join(dist, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf8');
  const kb = (Buffer.byteLength(contents, 'utf8') / 1024).toFixed(1);
  console.log(`  ✓ ${relPath.padEnd(28)} ${kb.padStart(7)} kB`);
}

console.log('\nPrerender de rutas:');

for (const route of ROUTES) {
  const { path } = route.meta;
  // Fichero plano, no carpeta con index.html.
  //
  // Cloudflare Pages sirve `hipoteca/index.html` en `/hipoteca/` y redirige con un
  // 308 desde `/hipoteca`, que es justo la URL de nuestros canonical y del sitemap.
  // Con `hipoteca.html` la sirve directamente en `/hipoteca`: sin redirección y sin
  // discrepancia entre lo que declaramos y lo que responde el servidor.
  write(path === '/' ? 'index.html' : `${path.replace(/^\//, '')}.html`, await buildPage(route));
}

// 404 propio (Cloudflare Pages y Vercel lo sirven automáticamente)
write('404.html', await buildPage(NOT_FOUND));

// sitemap.xml
const base = SITE.url.replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
const urls = ROUTES.map(
  (r) => `  <url>
    <loc>${base}${r.meta.path === '/' ? '/' : r.meta.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${r.meta.path === '/' ? '1.0' : r.meta.isTool ? '0.8' : '0.5'}</priority>
  </url>`
).join('\n');
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);

// robots.txt
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

// ads.txt: solo tiene sentido con un identificador de AdSense real.
// Google lo exige para poder pagarte; sin el fichero, tu inventario se marca como no autorizado.
if (SITE.adsense) {
  const pub = SITE.adsense.replace(/^ca-/, '');
  write('ads.txt', `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
} else {
  console.log('  · ads.txt omitido (SITE.adsense sin configurar)');
}

console.log(`\nListo. ${ROUTES.length} rutas prerenderizadas en dist/\n`);
