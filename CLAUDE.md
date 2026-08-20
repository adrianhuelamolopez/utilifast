# UtiliFast

Portal de micro-calculadoras en español. **Vite + JavaScript vanilla + Tailwind**, sin framework.
Objetivo del proyecto: tráfico orgánico monetizado con AdSense.

El `README.md` documenta el *cómo* para cualquiera que llegue al repositorio. Este fichero recoge
el *por qué*: decisiones tomadas, trampas ya pisadas y lo que queda pendiente.

```bash
npm run dev      # desarrollo
npm run build    # vite build + prerender por ruta -> dist/
npm run preview  # sirve dist/ replicando Cloudflare Pages
npm run meta     # regenera src/meta.js desde las vistas (tras añadir una herramienta)
npm run og       # regenera public/og-default.png
npm run auditar  # revisa dist: metadatos, huérfanas, JSON-LD, nombres bloqueables
```

## Estado actual

- **14 herramientas** + 3 páginas satélite + `/quienes-somos` + `/legal` = **20 rutas prerenderizadas**.
- Núcleo JS **47,6 kB (16,1 kB gzip)**; CSS 9,7 kB gzip; 30 chunks (uno por vista).
- Artículos de 333–496 palabras por herramienta. Los satélites van de **318 a 432** (medido, no
  estimado: la nota anterior decía ~270 y era falsa), más el bloque de respuesta con las cifras.
- **PUBLICADO** en `https://utilifast.com` (Cloudflare Pages, despliegue automático desde `main`).
  Correo `hola@utilifast.com` enrutado con Cloudflare Email Routing.
- Search Console verificado por **propiedad de Dominio**; sitemap enviado y en estado «Correcto»
  con las 20 páginas descubiertas (20 de agosto de 2026). La indexación tarda de 1 a 3 semanas.
- `www.utilifast.com` redirige con 301 a la versión sin www mediante una **Redirect Rule** de
  Cloudflare (el `_redirects` de Pages no sirve: solo admite rutas relativas, no cambios de dominio).

## Las cuatro ideas que sostienen el proyecto

**1. Prerender por ruta, no SPA a secas.** Una SPA pura no se indexa de forma fiable. `npm run build`
reutiliza las mismas vistas desde Node y escribe un HTML completo por URL. El bundle hidrata encima.

**2. Clusters temáticos.** Cada herramienta declara un `cluster`. Gobierna el filtro del directorio y,
sobre todo, el enlazado interno: «Sigue explorando» prioriza el mismo tema. Concentrar enlaces
dentro de un tema construye autoridad; repartirlos al azar la diluye.

**3. Páginas satélite y su enlazado.** Responden a *una pregunta concreta* («¿cuánto ahorro amortizando 100 € al
mes?») con el número ya calculado y escrito en el HTML. Nadie busca «calculadora de hipoteca»: contra
esa palabra compiten bancos y dominios dedicados. Contra la pregunta larga, no compite nadie.
La satélite capta la búsqueda y el botón lleva a la calculadora.

Una satélite nueva **solo tiene enlaces internos**: el dominio es joven y nadie la enlaza desde fuera,
así que el enlazado no es un adorno, es lo único que la saca de la cola de rastreo. Cada una recibe
cuatro enlaces, y ninguno es casual:

| Origen | Dónde se genera |
| --- | --- |
| Su herramienta madre, en tarjetas | `preguntas()` en `layout.js` |
| Su herramienta madre, **dentro del artículo** | prosa de la vista — es el de más peso |
| Portada | `home.js` |
| Las páginas del mismo cluster sin satélite propia | `preguntasAfines()` en `layout.js` |

**Por tema y nunca en todas las páginas.** Un bloque idéntico repetido en las veinte páginas es
plantilla y los buscadores lo descuentan; uno que solo aparece entre páginas afines cuenta como
señal. Por eso `satelitesAfines()` devuelve `[]` si la página ya tiene satélites propias: dos
bloques de preguntas seguidos serían ruido y enlace duplicado.

`temaDe()` resuelve el cluster tanto de una herramienta como de una satélite. `relatedTools()`
lo usa: antes las satélites no estaban en `TOOLS`, se quedaban sin cluster y «Sigue explorando»
les mostraba cuatro herramientas cualesquiera en vez de las de su tema.

**4. Profundidad antes que amplitud.** Un portal masivo tiene 50 herramientas con 200-300 palabras
cada una y ninguna autoría. La ventaja no está en tener más, está en resolver la pregunta entera.

## Convenciones que hay que respetar

### Añadir una herramienta

1. Crear `src/views/<nombre>.js` con `meta`, `render()` y `mount(root)`.
2. Añadir su nombre a la lista de `scripts/gen-meta.mjs` y ejecutar `npm run meta`.
3. Sustituir el `meta` en línea por `import { <nombre> as meta } from '../meta.js'; export { meta };`
4. Registrar en `src/routes.js` con `import()` dinámico y en `src/catalog.js` con su cluster.
5. `npm run auditar` antes de dar nada por bueno.

**`src/meta.js` es la fuente de verdad de los metadatos.** Tras el paso 3 las vistas lo importan,
así que `npm run meta` ya solo sirve para dar de alta una herramienta nueva: para editar un título
o una descripción, toca `src/meta.js` directamente.

**Límites que respeta la auditoría:** título ≤ 50 caracteres (con « · UtiliFast» queda en 62, justo
en lo que muestra Google) y descripción entre 120 y 158. Pasarse no rompe nada, pero el final se
corta en los resultados de búsqueda y se desperdicia.

### Trampas ya pisadas — no repetirlas

**Nombres que bloquea un bloqueador de anuncios.** Un chunk llamado `adSlot-XXXX.js` coincide con los
filtros de EasyList. Como ese módulo lo importan todas las vistas, el navegador lo descartaba y la web
se quedaba con la URL cambiada y el contenido anterior: rota para quien usa bloqueador, que en España
es muchísima gente. Por eso ahora es `components/hueco.js`, `utils/publicidad.js` y clases
`hueco-marco`/`hueco-banner`. **Nada relacionado con publicidad lleva «ad» en el nombre.**

**Huecos vacíos a la vista.** `hueco()` no emite nada mientras `SITE.adsense` esté sin rellenar:
un recuadro gris con la palabra «Publicidad» y ningún anuncio dentro no aporta al usuario y es
exactamente la señal de «sitio a medio montar» que penaliza la revisión de AdSense. Los altos
siguen en el CSS, así que rellenar `adsense` + `adSlots` los devuelve con CLS = 0.
Para revisar la maqueta, `SITE.huecosVisibles = true`. Consecuencia a tener presente:
**el margen entre secciones nunca puede vivir en el `className` del hueco**, porque desaparece
con él. Si dos bloques necesitan aire, el aire va en el contenedor (`home.js` lo hace con
`container-x pt-12`). Las vistas que envuelven un hueco en columna propia —`satelite.js` y
`contrasena.js`— consultan `hayHueco(formato)` para no dejar media rejilla en blanco.
(`data-ad-slot` es la excepción: lo exige AdSense.)

**Cifras del artículo que contradicen a la herramienta.** Pasó una vez: el texto de hipoteca decía
«unos 15.000 €» y la calculadora daba 12.744 €. Por eso las matemáticas no triviales viven en
`src/calc/` (`hipoteca`, `gasolina`, `neumaticos`, `interes`) y las importan **tanto la vista como el
satélite**. Si escribes un número en un artículo, sácalo de ahí.

**Clases de Tailwind construidas dinámicamente.** `bg-${variable}` no se genera nunca: el escáner solo
ve literales. Los colores por categoría van como cadenas completas (`'bg-data-1'`).

**Pasos de opacidad.** `bg-accent/12` falla salvo que el 12 esté en `theme.opacity`. Hay una lista
ampliada en `tailwind.config.js`.

**Padding de tablas.** `.data-table` da el estilo base; el padding lateral de las columnas de los
extremos es una decisión explícita: `.data-table-flush` dentro de una caja ya acolchada,
`.data-table-inset` a sangre dentro de una tarjeta. **No lo ajustes con `px-4` en las celdas**: las
reglas `:first-child` del componente tienen más especificidad y lo anulan justo en los bordes.

**Navegación que falla en silencio.** Si un chunk no llega, el router hace una navegación normal del
navegador en lugar de dejar al usuario con la URL cambiada. Una marca en `sessionStorage` evita el
bucle. No quites ese camino de recuperación.

**El 308 de Cloudflare por la barra final.** Pages sirve `hipoteca/index.html` en `/hipoteca/` y
redirige con un 308 desde `/hipoteca`, que es justo la URL de los canonical y del sitemap: Google
habría reportado «página con redirección» en las 20 URLs. Por eso el prerender escribe **ficheros
planos** (`hipoteca.html`), que Pages sirve directamente en `/hipoteca`. **No vuelvas al esquema de
carpeta con `index.html`.** El plugin de `vite preview` y el auditor asumen el esquema plano.

**El sitemap no está en el repositorio y es correcto que no esté.** Se genera en cada build dentro de
`dist/`, que está en `.gitignore`. Committearlo lo dejaría desactualizado en cuanto cambiara una ruta.
Existe solo en el sitio publicado, generado por Cloudflare en cada despliegue.

## Decisiones tomadas y su motivo

| Decisión | Motivo |
| --- | --- |
| El IMC se queda | YMYL exige rigor, no prohíbe. Ya lleva los avisos correctos. |
| Sin conversor de unidades ni de porcentajes | Google responde esas consultas en su propia página: el CTR es ruinoso. |
| Sin generador de docker-compose ni CIDR | Público técnico con tasas de bloqueo altísimas y volumen pequeño en español. |
| Afiliación aplazada | Amazon exige 3 ventas en 180 días o cierra la cuenta. Sin tráfico, se quema. Y en salud contradiría lo que promete `/quienes-somos`. |
| Datos personales opcionales en las páginas legales | Decisión del propietario. `SITE.titular` vacío publica textos coherentes; relleno, completa el aviso del art. 10 LSSI. La obligación solo aplica con actividad económica. |
| Nombre de dominio en `.com` | `utilifast.com` estaba libre (verificado por RDAP); el usuario había buscado `utilfast` sin la «i». |

## Verificaciones hechas a mano

Números contrastados contra cálculo manual, **no cambiar sin recalcular**:

- Hipoteca 180.000 € al 3,1 % a 25 años → cuota **862,97 €**, intereses **78.891,58 €**.
  Con 100 €/mes extra: **21 años y 4 meses** y **12.743,73 €** de ahorro.
- Gasolina 600 km, 6 l/100, 1,559 €/l, 30 € peajes, 2 personas → **43,06 €/persona**.
- IVA: quitar el 21 % a 1.210 € → base **1.000 €** (dividir entre 1,21, nunca restar el 21 %).
- Calorías mujer 30 a / 68 kg / 168 cm → TMB **1.419**, gasto **2.199** (Mifflin-St Jeor).
- 1RM 80 kg × 5 reps → media **91,7 kg** de cinco fórmulas.
- Neumáticos 205/55 R16 → **631,9 mm**; 225/45 R17 → **634,3 mm** (+0,38 %).
- Interés compuesto 5.000 € + 200 €/mes al 6 % durante 20 años → **108.959,20 €**
  (coincide al céntimo con la fórmula cerrada).
- Cable 15 A, 3 m, 12 V, 3 % → 4,375 mm² teóricos → **6 mm²** comerciales.
  El fusible va un 25 % por encima del consumo y el cable debe aguantar más que el fusible.

## Rigor que hay que mantener

Cada herramienta cita su base de cálculo en `/quienes-somos`. Es la ventaja competitiva real:
`calculadoras.io` monetiza con 210 socios publicitarios y no publica ni autoría ni fuentes, y
`calculadoradehipoteca.es` tampoco tiene página de quiénes somos.

Dos correcciones que costó descubrir y conviene no deshacer:

- La tolerancia del ±3 % en neumáticos **sí está en el Manual ITV**, y es uno de **cuatro** criterios
  (carga, velocidad, diámetro, perfil de llanta). El cuarto no es comprobable con la medida del
  neumático y la herramienta lo dice en lugar de fingir que lo valida.
- El equivalente de neumático no se filtra solo por diámetro: sin acotar anchura (±30 mm) y llanta
  (±2"), proponía montar un 155/40 R20 en lugar de un 205/55 R16.

## Pendiente

**Del propietario:**
- Rellenar `SITE.titular` si decide monetizar (nombre, NIF, localidad). Hoy vacío a propósito.
- ~~Activar Cloudflare Web Analytics~~ hecho: mide y registra Core Web Vitals.
- ~~Dar de alta en Bing Webmaster Tools~~ hecho.
- ~~Desactivar *Email Address Obfuscation*~~ hecho: Cloudflare reescribía
  `hola@utilifast.com` como `[email protected]` y sin JavaScript no había contacto visible.
- Solicitar AdSense **a las 2-4 semanas**, con contenido ya indexado. Pedirlo antes es el camino
  corto al rechazo por «contenido de escaso valor».

**Técnico:**
- Más páginas satélite: es el punto de mayor impacto del plan y solo hay tres. **De dos en dos por
  semana, no en tandas**: no existe límite de páginas en Google —el *crawl budget* empieza a importar
  a partir de miles de URLs y aquí hay 20—, pero un dominio recién nacido que pasa de 20 a 50 páginas
  con la misma plantilla en una semana tiene el perfil del contenido generado en masa.
  A partir de la semana 3 (≈10 de septiembre de 2026) hay que escribirlas **contra las impresiones
  reales de Search Console**, no adivinando: qué consultas ya rozan el sitio vale más que cualquier
  lista hecha a priori. Candidatas mientras tanto: «amortizar 200 al mes», «calorías para perder
  5 kilos», «Madrid-Barcelona en coche», «sección de cable para faros LED».
- `public/og-default.png` es un marcador generado sin texto; sustituir por un diseño con la marca.
- AdSense: rellenar `adsense` y `adSlots` en `src/config.js` y todo se activa solo, incluido
  `ads.txt` y los huecos, que hoy no se emiten.

## Comprobado en producción (20 de agosto de 2026)

- Las 20 URLs responden **200 sin redirección** y cada canonical apunta a sí misma.
- `http://` → 301 a https. `www` → 301 a sin www, conservando ruta y parámetros.
- Ruta inexistente → **404 real** con `noindex, follow`. Ninguna otra página lleva `noindex`.
- `robots.txt`, `sitemap.xml`, `og-default.png` y `favicon.svg` accesibles. `ads.txt` da 404 a
  propósito: solo se genera con `SITE.adsense` relleno.
- HTML con **Brotli**; assets con hash en caché inmutable de un año; `nosniff` y `referrer-policy`.
- El HTML servido trae el contenido **sin ejecutar JavaScript**: en `/hipoteca`, 1 `h1`, 11 `h2`,
  JSON-LD y 2.588 palabras.

## Expectativas realistas

Las calculadoras tienen RPM bajo (~1-4 € por mil páginas vistas en España): el usuario entra, calcula
y se va. Para 100 €/mes hacen falta del orden de 30.000-100.000 visitas mensuales. Los primeros meses
lo normal es entre 0 y 20 €. Es un proyecto de año y medio, no de tres semanas.

## Cómo trabajar aquí

- Verificar en el navegador antes de dar algo por bueno; medir, no suponer.
- Los avisos sanitarios y legales de las herramientas no son relleno: protegen y cuentan para E-E-A-T.
- Si una cifra publicada resulta estar mal, corregirla y decirlo. Ya ha pasado dos veces.
