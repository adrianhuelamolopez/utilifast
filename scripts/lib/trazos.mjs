/**
 * Tipografía de trazos para generar imágenes sin dependencias.
 *
 * El proyecto no tiene ninguna librería de imagen y `gen-og.mjs` escribe los
 * píxeles del PNG a mano, así que no había forma de dibujar texto: la imagen que
 * se compartía en redes era un rayo sobre un degradado, sin una sola palabra.
 *
 * Cada letra se define como una lista de polilíneas dentro de una caja 0..1
 * (con la Y hacia abajo). Al pintar se mide la distancia de cada píxel al trazo
 * más cercano, lo que da **antialiasing analítico gratis**: no hace falta
 * supermuestrear ni suavizar después.
 *
 * Solo están las mayúsculas que usa la imagen. Si hace falta una letra nueva,
 * se añade aquí; el resto del generador no cambia.
 */

/** Arco elíptico como polilínea. Ángulos en grados, 0 = derecha, sentido horario. */
function arco(cx, cy, rx, ry, desde, hasta, pasos = 18) {
  const pts = [];
  for (let i = 0; i <= pasos; i++) {
    const a = ((desde + ((hasta - desde) * i) / pasos) * Math.PI) / 180;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

const ovalo = (cx, cy, rx, ry) => arco(cx, cy, rx, ry, 0, 360, 28);

/**
 * Glifos: `trazos` son polilíneas y `avance` el ancho que ocupa la letra
 * (1 = alto de mayúscula). El espaciado entre letras lo pone el compositor.
 */
export const GLIFOS = {
  A: { avance: 0.78, trazos: [[[0.04, 1], [0.39, 0], [0.74, 1]], [[0.16, 0.68], [0.62, 0.68]]] },
  C: { avance: 0.76, trazos: [arco(0.38, 0.5, 0.34, 0.5, 310, 50, 24)] },
  D: {
    avance: 0.78,
    trazos: [
      [[0.06, 0], [0.06, 1]],
      [[0.06, 0], [0.36, 0], ...arco(0.36, 0.5, 0.36, 0.5, -90, 90, 14), [0.06, 1]],
    ],
  },
  E: { avance: 0.68, trazos: [[[0.62, 0], [0.06, 0], [0.06, 1], [0.62, 1]], [[0.06, 0.5], [0.5, 0.5]]] },
  F: { avance: 0.64, trazos: [[[0.62, 0], [0.06, 0], [0.06, 1]], [[0.06, 0.5], [0.5, 0.5]]] },
  G: {
    avance: 0.82,
    trazos: [[...arco(0.38, 0.5, 0.34, 0.5, 310, 28, 22), [0.74, 0.52], [0.44, 0.52]]],
  },
  I: { avance: 0.24, trazos: [[[0.12, 0], [0.12, 1]]] },
  L: { avance: 0.62, trazos: [[[0.06, 0], [0.06, 1], [0.58, 1]]] },
  M: { avance: 0.92, trazos: [[[0.06, 1], [0.06, 0], [0.44, 0.62], [0.82, 0], [0.82, 1]]] },
  N: { avance: 0.8, trazos: [[[0.06, 1], [0.06, 0], [0.7, 1], [0.7, 0]]] },
  O: { avance: 0.84, trazos: [ovalo(0.4, 0.5, 0.34, 0.5)] },
  P: {
    avance: 0.74,
    trazos: [[[0.06, 1], [0.06, 0]], [[0.06, 0], [0.36, 0], ...arco(0.36, 0.28, 0.3, 0.28, -90, 90, 12), [0.06, 0.56]]],
  },
  R: {
    avance: 0.78,
    trazos: [
      [[0.06, 1], [0.06, 0]],
      [[0.06, 0], [0.34, 0], ...arco(0.34, 0.27, 0.29, 0.27, -90, 90, 12), [0.06, 0.54]],
      [[0.38, 0.54], [0.72, 1]],
    ],
  },
  S: {
    avance: 0.72,
    trazos: [
      [
        ...arco(0.36, 0.26, 0.29, 0.26, 315, 90, 16),
        ...arco(0.36, 0.74, 0.29, 0.22, 270, 490, 16),
      ],
    ],
  },
  T: { avance: 0.72, trazos: [[[0.02, 0], [0.7, 0]], [[0.36, 0], [0.36, 1]]] },
  U: { avance: 0.8, trazos: [[[0.06, 0], [0.06, 0.62], ...arco(0.38, 0.62, 0.32, 0.38, 180, 0, 16), [0.7, 0]]] },
  Y: { avance: 0.76, trazos: [[[0.04, 0], [0.36, 0.52]], [[0.68, 0], [0.36, 0.52]], [[0.36, 0.52], [0.36, 1]]] },
  // El punto es un segmento de longitud cero: el campo de distancia lo redondea.
  '.': { avance: 0.3, trazos: [[[0.14, 0.98], [0.14, 0.98]]] },
  ' ': { avance: 0.34, trazos: [] },
};

/** Falla pronto si el texto pide una letra que no existe. */
function glifo(ch, texto) {
  const g = GLIFOS[ch];
  if (!g) {
    throw new Error(
      `La tipografía de trazos no tiene «${ch}» (en «${texto}»). ` +
        `Añádela a GLIFOS en scripts/lib/trazos.mjs. Disponibles: ${Object.keys(GLIFOS).join('')}`
    );
  }
  return g;
}

/** Ancho total de un texto a una altura de mayúscula dada. */
export function anchoTexto(texto, alto, espaciado = 0.06) {
  let w = 0;
  for (const ch of texto.toUpperCase()) {
    w += (glifo(ch, texto).avance + espaciado) * alto;
  }
  return w - espaciado * alto;
}

/** Distancia de un punto a un segmento. */
function distSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const largo = dx * dx + dy * dy;
  let t = largo === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / largo;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Convierte un texto en una lista de segmentos ya situados en píxeles, con la
 * caja que los envuelve. `pinta()` la usa para descartar píxeles lejanos sin
 * medir distancias.
 */
export function segmentosDeTexto(texto, { x, y, alto, espaciado = 0.06 }) {
  const segs = [];
  let cursor = x;
  for (const ch of texto.toUpperCase()) {
    const g = glifo(ch, texto);
    for (const linea of g.trazos) {
      for (let i = 0; i < linea.length - 1; i++) {
        segs.push([
          cursor + linea[i][0] * alto,
          y + linea[i][1] * alto,
          cursor + linea[i + 1][0] * alto,
          y + linea[i + 1][1] * alto,
        ]);
      }
    }
    cursor += (g.avance + espaciado) * alto;
  }
  return segs;
}

/**
 * Cobertura de tinta de un píxel (0..1) para un conjunto de segmentos.
 * El medio punto de suavizado a cada lado del borde es lo que produce el
 * antialiasing sin necesidad de supermuestrear.
 */
export function cobertura(px, py, segs, grosor) {
  const r = grosor / 2;
  let d = Infinity;
  for (const [ax, ay, bx, by] of segs) {
    // Descarte rápido por caja del segmento antes de calcular la distancia.
    if (px < Math.min(ax, bx) - r - 1 || px > Math.max(ax, bx) + r + 1) continue;
    if (py < Math.min(ay, by) - r - 1 || py > Math.max(ay, by) + r + 1) continue;
    const dd = distSegmento(px, py, ax, ay, bx, by);
    if (dd < d) d = dd;
    if (d === 0) break;
  }
  if (d === Infinity) return 0;
  return Math.max(0, Math.min(1, r + 0.5 - d));
}
