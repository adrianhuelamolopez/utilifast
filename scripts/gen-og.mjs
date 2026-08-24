/**
 * Genera public/og-default.png (1200x630), la imagen que aparece al compartir el
 * sitio en WhatsApp, X, Facebook o LinkedIn.
 *
 * Antes era un rayo sobre un degradado y nada más: quien recibía el enlace no
 * podía saber de qué era la web. Ahora lleva la marca, la propuesta y el dominio.
 *
 * Sin dependencias: los píxeles se escriben a mano y el texto sale de la
 * tipografía de trazos de `lib/trazos.mjs`, que da antialiasing por distancia.
 *
 * Se ejecuta a mano con `npm run og`. El PNG resultante se versiona en `public/`,
 * así que este script **no corre en el despliegue** de Cloudflare.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { anchoTexto, segmentosDeTexto, cobertura } from './lib/trazos.mjs';

const W = 1200;
const H = 630;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-default.png');

/* ---- Paleta: los mismos tokens de marca que usa el sitio ---- */
const A = [49, 42, 145]; // indigo profundo
const B = [124, 58, 237]; // violeta de marca
const BLANCO = [255, 255, 255];
const TENUE = [214, 205, 255];

const lerp = (a, b, t) => a + (b - a) * t;
const mezcla = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

/* ---- Rayo del logotipo, en coordenadas normalizadas 0..1 ---- */
const BOLT = [
  [0.56, 0.06],
  [0.24, 0.55],
  [0.45, 0.55],
  [0.4, 0.94],
  [0.76, 0.42],
  [0.54, 0.42],
];

const BOLT_S = 132;
const BOLT_X = 96;
const BOLT_Y = 92;

function dentroDelRayo(px, py) {
  const x = (px - BOLT_X) / BOLT_S;
  const y = (py - BOLT_Y) / BOLT_S;
  if (x < 0 || x > 1 || y < 0 || y > 1) return false;
  let dentro = false;
  for (let i = 0, j = BOLT.length - 1; i < BOLT.length; j = i++) {
    const [xi, yi] = BOLT[i];
    const [xj, yj] = BOLT[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/* ---- Composición ---- */
const MARGEN = 96;

// Todo el texto va en mayúsculas: la tipografía de trazos solo tiene esa caja, y
// así no hay acentos que dibujar. Las frases se eligen con las letras que existen.
const LINEAS = [
  { texto: 'UTILIFAST', alto: 92, grosor: 15, x: MARGEN + BOLT_S + 36, y: 108, color: BLANCO },
  { texto: 'CALCULADORAS ONLINE', alto: 60, grosor: 11, x: MARGEN, y: 296, color: BLANCO },
  { texto: 'GRATIS Y SIN REGISTRO', alto: 60, grosor: 11, x: MARGEN, y: 378, color: BLANCO },
  { texto: 'UTILIFAST.COM', alto: 30, grosor: 6, x: MARGEN, y: 508, color: TENUE, espaciado: 0.18 },
];

const capas = LINEAS.map((l) => ({
  segs: segmentosDeTexto(l.texto, l),
  grosor: l.grosor,
  color: l.color,
}));

// Comprobación de encaje: sin esto una frase larga se sale del lienzo en
// silencio y solo se descubre al mirar el PNG.
for (const l of LINEAS) {
  const ancho = anchoTexto(l.texto, l.alto, l.espaciado ?? 0.06);
  const derecha = Math.round(l.x + ancho);
  if (derecha > W - MARGEN + 1) {
    throw new Error(`«${l.texto}» acaba en ${derecha} px y el margen está en ${W - MARGEN}`);
  }
  console.log(`  · ${l.texto.padEnd(22)} ${String(Math.round(ancho)).padStart(4)} px  →  acaba en ${derecha}`);
}

/* ---- Pintado ---- */
const raw = Buffer.alloc((W * 3 + 1) * H);
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // filtro "none"
  for (let x = 0; x < W; x++) {
    const t = (x / W) * 0.65 + (y / H) * 0.35;
    let c = mezcla(A, B, t);

    if (dentroDelRayo(x, y)) c = BLANCO;

    for (const capa of capas) {
      const a = cobertura(x + 0.5, y + 0.5, capa.segs, capa.grosor);
      if (a > 0) c = mezcla(c, capa.color, a);
    }

    raw[o++] = Math.round(c[0]);
    raw[o++] = Math.round(c[1]);
    raw[o++] = Math.round(c[2]);
  }
}

/* ---- Escritura PNG mínima ---- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // profundidad de bit
ihdr[9] = 2; // color: truecolor
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log(`og-default.png generado (${(png.length / 1024).toFixed(1)} kB)`);
