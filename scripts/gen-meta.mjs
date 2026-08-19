/**
 * Extrae el `meta` de cada vista y lo vuelca en src/meta.js.
 * Se ejecuta a mano cuando se añade una herramienta nueva; no forma parte del build.
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const VISTAS = [
  'home', 'gasolina', 'neumaticos', 'cable', 'calorias', 'macros', 'imc', 'iva',
  'hipoteca', 'interes', 'rm', 'cuenta', 'fechas', 'contrasena', 'whatsapp', 'quienesSomos', 'legal', 'notfound',
];

const entradas = [];
for (const nombre of VISTAS) {
  const url = pathToFileURL(resolve('src/views', `${nombre}.js`)).href;
  const mod = await import(url);
  entradas.push([nombre, mod.meta]);
}

const cuerpo = entradas
  .map(([nombre, m]) => `export const ${nombre} = ${JSON.stringify(m, null, 2)};`)
  .join('\n\n');

writeFileSync(
  'src/meta.js',
  `/**
 * Metadatos de todas las rutas, separados de su implementación.
 *
 * Esto es lo que permite trocear el bundle: la navegación, el sitemap y el <head>
 * necesitan estos datos en TODAS las páginas, mientras que el render y la lógica de
 * cada herramienta solo hacen falta en la suya. Al vivir aquí, importar los metadatos
 * ya no arrastra el código de la vista.
 *
 * Generado por scripts/gen-meta.mjs. Al añadir una herramienta, escribe su meta en la
 * vista y vuelve a ejecutar \`npm run meta\`.
 */

${cuerpo}
`,
  'utf8'
);
console.log('src/meta.js generado con', entradas.length, 'entradas');
