# UtiliFast

Portal de micro-herramientas construido con **Vite + JavaScript vanilla + Tailwind CSS**.
SPA con routing por History API y **prerender estático por ruta** en el build, para que los
buscadores reciban HTML completo sin ejecutar JavaScript.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # vite build + prerender por ruta -> dist/
npm run preview  # sirve dist/ replicando el comportamiento de Cloudflare/Vercel
npm run og       # regenera public/og-default.png (solo si cambias la marca)
```

## Estructura

```
utilifast/
├── index.html                  Shell HTML con marcadores <!--seo:start--> y <!--app:html-->
├── vite.config.js              Build + plugin que sirve el prerender en `npm run preview`
├── tailwind.config.js          Tokens semánticos, tema oscuro y escala tipográfica
├── postcss.config.js
├── vercel.json                 cleanUrls + cabeceras de caché (despliegue en Vercel)
├── public/
│   ├── _headers                Equivalente para Cloudflare Pages
│   ├── favicon.svg
│   └── og-default.png          1200x630, generado por scripts/gen-og.mjs
├── scripts/
│   ├── prerender.mjs           Genera dist/<ruta>/index.html + 404.html + sitemap + robots
│   └── gen-og.mjs              Escribe el PNG de Open Graph sin dependencias
└── src/
    ├── main.js                 Punto de entrada (importa el CSS y arranca el router)
    ├── router.js               History API, intercepción de enlaces, popstate, anchors
    ├── meta.js                 Metadatos de TODAS las rutas (generado, ver más abajo)
    ├── routes.js               Metadatos + cargador perezoso de cada vista
    ├── catalog.js              Catálogo de herramientas -> navegación y buscador del home
    ├── config.js               SITE.url, nombre, email, imagen OG... (editar antes de desplegar)
    ├── seo.js                  buildHead() para el prerender + applyMeta() en cliente
    ├── style.css               Tokens de color, tipografía autoalojada y capa de componentes
    ├── components/
    │   ├── layout.js           Cabecera, pie, relacionadas, shell() y mountChrome()
    │   ├── icons.js            Iconografía SVG en línea + logotipo
    │   ├── cookieBanner.js     Banner de consentimiento + panel de preferencias
    │   ├── adSlot.js           Huecos publicitarios con alto reservado
    │   └── ui.js               pageHeader, breadcrumbs, privacyNote, seoArticle, faq
    ├── utils/                  format (Intl es-ES), dom, clipboard, theme, consent, ads
    └── views/
        ├── home.js             Directorio con buscador y filtros por etiqueta
        ├── gasolina.js         Coste por km y reparto entre ocupantes
        ├── neumaticos.js       Los 4 criterios de equivalencia del Manual ITV
        ├── cable.js            Sección en mm²/AWG por caída de tensión en 12/24/48 V
        ├── cuenta.js           Dividir la cuenta con propina y reparto desigual
        ├── calorias.js         Metabolismo basal y gasto energético diario
        ├── macros.js           Macronutrientes repartidos por comidas
        ├── imc.js              Índice de masa corporal y perímetro de cintura
        ├── rm.js               Repetición máxima con cinco fórmulas y tabla de %
        ├── iva.js              IVA, recargo de equivalencia y retención de IRPF
        ├── hipoteca.js         Cuota, cuadro de amortización y amortización anticipada
        ├── fechas.js           Días entre fechas, laborables, sumar plazos y edad exacta
        ├── contrasena.js       Generador con crypto.getRandomValues y entropía en bits
        ├── whatsapp.js         Enlaces wa.me + QR descargable en PNG
        ├── quienesSomos.js     Autoría, fuentes y financiación en /quienes-somos (E-E-A-T)
        ├── legal.js            Aviso legal, privacidad y cookies (RGPD/LSSI)
        └── notfound.js         404
```

Cada vista es un módulo con la misma interfaz:

```js
export const meta = { path, title, description, navLabel, isTool, icon, card };
export function render() { /* devuelve HTML como string */ }
export function mount(root) { /* engancha eventos; devuelve función de limpieza */ }
```

Como `render()` es una función pura que devuelve un string, **el mismo código genera el HTML
en el navegador y en Node durante el build**.

**Para añadir una herramienta:** crea el módulo en `src/views/`, escribe su `meta`, añádela a la
lista de `scripts/gen-meta.mjs` y ejecuta `npm run meta`; después regístrala en `src/routes.js`
(con su `import()` dinámico) y, si debe salir en el directorio, en `src/catalog.js`.

### Por qué los metadatos viven aparte

`src/meta.js` contiene el `meta` de cada ruta y **no importa ninguna vista**. Es lo que hace posible
el troceado: la navegación, el `<head>` y el sitemap necesitan esos datos en todas las páginas,
mientras que el `render()` y la lógica de cada herramienta solo hacen falta en la suya. Si el `meta`
siguiera dentro de la vista, importarlo arrastraría el código entero y no habría nada que trocear.

Cada vista reimporta su propio `meta` desde ahí, así que sigue habiendo una única definición.

## Sistema de diseño

No hay clases de color sueltas: todo pasa por **tokens semánticos** declarados como variables CSS
en `src/style.css` y expuestos a Tailwind en `tailwind.config.js`.

| token                                 | uso                                       |
| ------------------------------------- | ----------------------------------------- |
| `canvas` / `surface` / `surface-muted` | fondo de página, tarjetas y paneles        |
| `line` / `line-strong`                 | bordes y separadores                       |
| `content` / `-muted` / `-subtle`       | tres niveles de texto                      |
| `accent` / `violet-brand`              | color de marca y degradado                 |
| `data-1..3`                            | series de datos (macros, desgloses)        |

El **tema oscuro** intercambia esos tokens bajo `[data-theme="dark"]`, así que ningún componente
necesita variantes `dark:`. El tema se aplica con un script en línea en `index.html` antes de
pintar (sin destello blanco), se guarda en `localStorage` y, si el usuario no ha elegido, sigue al
sistema en caliente. Durante el cambio se congelan las transiciones para que no se animen todos
los colores a la vez.

Otros detalles de la capa visual:

- **Tipografía Inter autoalojada** (`@fontsource-variable/inter`), solo el subconjunto latino
  (48 kB) y con una fuente de reserva de métricas ajustadas para que el intercambio no mueva el
  texto. El prerender inyecta el `<link rel="preload">` con el nombre real del fichero con hash.
- **Iconos SVG en línea** en `src/components/icons.js` — cero peticiones y color heredado.
- **Contraste verificado**: los tres niveles de texto superan 4,5:1 sobre sus fondos en ambos
  temas (medido sobre el DOM, no estimado).
- `prefers-reduced-motion` desactiva animaciones y desplazamiento suave.

### Tablas

`.data-table` da el estilo base. El padding lateral de las columnas de los extremos es una
**decisión explícita**, no el valor por defecto, porque depende de dónde viva la tabla:

| clase                | cuándo                                              |
| -------------------- | --------------------------------------------------- |
| `.data-table-flush`  | dentro de una caja que ya tiene padding (macros)     |
| `.data-table-inset`  | a sangre dentro de una tarjeta (hipoteca, /quienes-somos) |

Sin una de las dos, todas las celdas llevan el mismo padding. **No lo ajustes con utilidades
sueltas tipo `px-4` en las celdas**: las reglas `:first-child` del componente tienen más
especificidad y las anulan justo en los bordes, que es donde se nota.

### Nombres que un bloqueador no puede tumbar

Ni los ficheros ni las clases del hueco publicitario llevan «ad» en el nombre: es
`src/components/hueco.js`, `src/utils/publicidad.js` y clases `hueco-marco`, `hueco-banner`…

No es cosmético. Ese componente lo importan **todas** las vistas, así que Vite lo emite como chunk
compartido. Un fichero llamado `adSlot-XXXX.js` coincide con los filtros de EasyList, el navegador
lo descarta, el `import()` de cualquier vista falla y la web se queda con la URL cambiada y el
contenido anterior: rota para quien use bloqueador, que en España es mucha gente.

Al añadir componentes relacionados con publicidad, mantén esta convención. Y si alguna vez cae un
chunk igualmente —red, despliegue a mitad—, el router recurre a una navegación normal del navegador
en lugar de dejar al usuario colgado, con una marca en `sessionStorage` que evita el bucle.

## Clusters temáticos

Cada herramienta declara un `cluster` en su `meta`. Eso gobierna dos cosas:

- El **filtro del directorio** en la portada (Viajes y gastos · Salud y nutrición · Dinero e
  impuestos · Utilidades).
- El **enlazado interno**: el bloque «Sigue explorando» prioriza herramientas del mismo tema antes
  de rellenar con el resto. Concentrar enlaces internos dentro de un tema es lo que construye
  autoridad sobre él; repartirlos al azar la diluye.

- El **desplegable «Herramientas»** de la cabecera, que las lista todas agrupadas por familia y
  está presente en cada página: son diez enlaces internos en todas las URLs del sitio.

Al añadir una herramienta, asígnale cluster. Si creas uno nuevo, añádelo también a `CLUSTERS` en
`src/catalog.js` con su etiqueta legible. `NAV` (también en `catalog.js`) controla solo los enlaces
directos de la cabecera; el desplegable se genera siempre a partir de `TOOLS`, así que **ninguna
herramienta puede quedar fuera de la navegación por olvido**.

## SEO

- **Prerender por ruta.** `npm run build` escribe `dist/gasolina/index.html`, `dist/macros/index.html`…
  con el `<head>` y el contenido ya renderizados. El bundle hidrata la SPA al cargar.
- **Metaetiquetas por vista**: title, description, canonical, Open Graph y Twitter Cards.
  En navegación cliente se reemplaza el bloque entre `<!--seo:start-->` y `<!--seo:end-->`.
- **JSON-LD**: `WebSite` en el home y `WebApplication` + `BreadcrumbList` en cada herramienta.
- **Contenido editorial** de 300–400 palabras bajo cada herramienta, con `<h1>` único y `<h2>`/`<h3>`
  jerárquicos, más un bloque de preguntas frecuentes en `<details>`.
- `sitemap.xml` y `robots.txt` se generan en el build a partir de `SITE.url` y de `ROUTES`,
  así que se mantienen solos al añadir herramientas. **No los coloques en `public/`**: Vite copia
  esa carpeta antes de que corra el prerender, y las versiones generadas los sobrescribirían.
- 404 real: `dist/404.html` con `noindex, follow`.

> Antes de desplegar, edita `src/config.js` con tu dominio definitivo: de ahí salen los
> `canonical`, las URL absolutas de Open Graph y el sitemap.

## Rendimiento

- **Un chunk por herramienta.** El núcleo son 42,6 kB (14,6 kB gzip) e incluye router, navegación,
  metadatos de las quince rutas y consentimiento. Cada vista se descarga al entrar en ella: visitar
  `/iva` cuesta 59,5 kB en total, no los 251 kB de todo el catálogo.
- **Precarga al pasar el ratón** (`pointerenter`) y al iniciar un toque: cuando llega el clic, el
  chunk suele estar ya descargado. Medido en local: 26-81 ms por navegación.
- **Sin re-render en la primera carga.** El `<main>` prerenderizado lleva `data-route`; si coincide
  con la ruta actual, el router solo engancha eventos en lugar de reescribir el DOM.
- `qr-creator` va en un chunk aparte y solo se descarga al entrar en `/whatsapp`.
- Tipografía autoalojada y precargada: cero peticiones a CDN externos.
- CSS compilado con PostCSS y purgado por Tailwind (9,3 kB gzip).
- **CLS = 0**: huecos publicitarios, contenedor del QR y métricas de la fuente de reserva
  mantienen el alto reservado desde el primer pintado.

> Navegar rápido entre rutas no rompe nada: cada navegación lleva un número de orden y las
> respuestas tardías se descartan, de modo que la vista pintada siempre es la de la última URL.

## Monetización

Los huecos se generan con `adSlot({ format })` desde `src/components/adSlot.js`:

| formato       | móvil   | escritorio | uso habitual        |
| ------------- | ------- | ---------- | ------------------- |
| `leaderboard` | 300×250 | 728×90     | cabecera / pie      |
| `rectangle`   | 300×250 | 300×250    | dentro del artículo |
| `halfpage`    | 300×250 | 300×600    | columna lateral     |

Para activar AdSense, sustituye el `<div class="ad-placeholder …">` interno por el `<ins
class="adsbygoogle">` **manteniendo el contenedor y su clase de tamaño**: así el espacio sigue
reservado y no se produce salto de diseño mientras carga el anuncio.

### Activar AdSense

Todo el cableado está hecho. Cuando Google apruebe el sitio, solo tienes que rellenar
`src/config.js`:

```js
adsense: 'ca-pub-XXXXXXXXXXXXXXXX',
adSlots: { leaderboard: '1234567890', rectangle: '0987654321', halfpage: '' },
```

A partir de ahí, automáticamente:

- `adSlot()` emite `<ins class="adsbygoogle">` en lugar del marcador, **con el mismo alto
  reservado**, así que activar los anuncios no introduce CLS.
- El prerender genera `dist/ads.txt` con tu identificador (Google lo exige para pagarte; sin
  él tu inventario aparece como no autorizado). Ojo: en `ads.txt` va `pub-…`, no `ca-pub-…`
  — el script hace esa conversión por ti.
- `src/utils/ads.js` inyecta el script de Google **solo si el usuario acepta la categoría
  «publicitarias»**, y reacciona si la acepta más tarde. Sin consentimiento no se descarga nada.
- El router llama a `refrescarAnuncios()` en cada cambio de vista, porque en una SPA los
  bloques nuevos no se rellenan solos.

Con `adsense` vacío la web no hace ni una petición externa: puedes desplegar y pedir la
revisión de AdSense sin tocar nada más.

### Consentimiento de cookies

El banner está implementado en `src/components/cookieBanner.js` y su estado vive en
`src/utils/consent.js`. Se monta una vez sobre `<body>`, fuera de `#app`, así que sobrevive a los
cambios de vista y **no forma parte del HTML prerenderizado** (no afecta al LCP ni a lo que indexan
los buscadores). Al ser `position: fixed` tampoco desplaza el contenido: CLS = 0.

Criterios aplicados (AEPD, art. 22.2 LSSI-CE y RGPD):

- Nada de analítica ni publicidad se carga antes de la decisión.
- «Rechazar todas» y «Aceptar todas» tienen el mismo tamaño y jerarquía visual.
- Las categorías opcionales están **desmarcadas** por defecto; las necesarias, bloqueadas.
- La decisión se puede cambiar o retirar desde el pie y desde `/legal#cookies`.
- Se guarda con fecha y `CONSENT_VERSION`: al subir la versión (nuevas finalidades o proveedores)
  los consentimientos previos dejan de valer y el banner vuelve a pedirse.

Antes de cargar cualquier script de terceros, consulta el estado:

```js
import { isAllowed, onConsentChange } from './utils/consent.js';

if (isAllowed('publicitarias')) cargarAdSense();
onConsentChange((c) => { if (c.publicitarias) cargarAdSense(); });
```

`initGoogleConsentMode()` ya emite las señales de **Google Consent Mode v2** (todo denegado por
defecto y `update` al decidir), así que al añadir gtag o AdSense respetarán la elección sin tocar
nada más. Para probar el flujo desde cero: `localStorage.removeItem('utilifast:consent')`.

## Desplegar en Cloudflare Pages

| Ajuste | Valor |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | la de `.nvmrc` (22) |

Sirve `/gasolina` desde `dist/gasolina/index.html` y usa `dist/404.html` automáticamente, así que no
hace falta ninguna regla de reescritura. `dist/` **no se sube a git**: lo genera Cloudflare en cada
despliegue.

**Vercel** — framework preset "Vite", output `dist`. `vercel.json` ya activa `cleanUrls`.

### Antes de conectar el repositorio

1. `src/config.js` → `url` con el dominio definitivo (de ahí salen canonical, Open Graph y sitemap).
2. Configurar el reenvío de `hola@tudominio` con Cloudflare Email Routing.
3. `SITE.titular` solo si vas a monetizar: sin él, las páginas legales se publican coherentes.

## Pendiente / personalizable

- `src/config.js`: dominio, correo de contacto y cuenta de Twitter.
- `src/views/legal.js`: campos entre `[CORCHETES]` (titular, NIF, domicilio, ciudad, fecha).
  **La plantilla legal es orientativa; revísala con un profesional antes de publicar.**
- `public/og-default.png`: la imagen generada es un marcador de posición sin texto.
