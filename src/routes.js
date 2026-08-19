import * as META from './meta.js';
import { SATELITES } from './satelites.js';

/**
 * Cada ruta declara sus metadatos (necesarios en todas las páginas para la
 * navegación, el <head> y el sitemap) y un cargador perezoso de su vista.
 *
 * El `import()` dinámico es lo que hace que Vite emita un chunk por herramienta:
 * quien entra a /iva no descarga el código de la hipoteca ni el de los neumáticos.
 */
const ruta = (meta, load) => ({ meta, load });

export const ROUTES = [
  ruta(META.home, () => import('./views/home.js')),
  ruta(META.gasolina, () => import('./views/gasolina.js')),
  ruta(META.neumaticos, () => import('./views/neumaticos.js')),
  ruta(META.cable, () => import('./views/cable.js')),
  ruta(META.calorias, () => import('./views/calorias.js')),
  ruta(META.macros, () => import('./views/macros.js')),
  ruta(META.imc, () => import('./views/imc.js')),
  ruta(META.iva, () => import('./views/iva.js')),
  ruta(META.hipoteca, () => import('./views/hipoteca.js')),
  ruta(META.interes, () => import('./views/interes.js')),
  ruta(META.rm, () => import('./views/rm.js')),
  ruta(META.cuenta, () => import('./views/cuenta.js')),
  ruta(META.fechas, () => import('./views/fechas.js')),
  ruta(META.contrasena, () => import('./views/contrasena.js')),
  ruta(META.whatsapp, () => import('./views/whatsapp.js')),
  ruta(META.quienesSomos, () => import('./views/quienesSomos.js')),
  ruta(META.legal, () => import('./views/legal.js')),
];

/**
 * Las páginas satélite comparten una única vista genérica; lo que cambia entre
 * ellas es el módulo de contenido, que se carga dentro de `cargarSatelite`.
 */
const RUTAS_SATELITE = SATELITES.map((s) =>
  ruta(
    {
      path: s.path,
      navLabel: s.h1,
      title: s.title,
      description: s.description,
      isTool: false,
      esSatelite: true,
    },
    async () => (await import('./views/satelite.js')).cargarSatelite(s.path)
  )
);

export const TODAS = [...ROUTES, ...RUTAS_SATELITE];

export const NOT_FOUND = ruta(META.notfound, () => import('./views/notfound.js'));

export function resolve(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return TODAS.find((r) => r.meta.path === clean) || NOT_FOUND;
}
