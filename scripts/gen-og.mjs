/**
 * Genera public/og-default.png (1200x630) sin dependencias externas.
 * Ejecútalo una vez con `npm run og` y sustituye la imagen cuando tengas
 * un diseño definitivo con el nombre de marca.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-default.png');

const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const A = [49, 42, 145]; // indigo profundo
const B = [124, 58, 237]; // violeta de marca

// Rayo (mismo símbolo que el logotipo), en coordenadas normalizadas 0..1
const BOLT = [
  [0.56, 0.06],
  [0.24, 0.55],
  [0.45, 0.55],
  [0.4, 0.94],
  [0.76, 0.42],
  [0.54, 0.42],
];

const S = 320; // lado del cuadro del rayo en píxeles
const OX = (W - S) / 2;
const OY = (H - S) / 2;

function insideBolt(px, py) {
  const x = (px - OX) / S;
  const y = (py - OY) / S;
  if (x < 0 || x > 1 || y < 0 || y > 1) return false;
  let inside = false;
  for (let i = 0, j = BOLT.length - 1; i < BOLT.length; j = i++) {
    const [xi, yi] = BOLT[i];
    const [xj, yj] = BOLT[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const raw = Buffer.alloc((W * 3 + 1) * H);
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // filtro "none"
  for (let x = 0; x < W; x++) {
    const t = (x / W) * 0.65 + (y / H) * 0.35;
    if (insideBolt(x, y)) {
      raw[o++] = 255;
      raw[o++] = 255;
      raw[o++] = 255;
    } else {
      raw[o++] = lerp(A[0], B[0], t);
      raw[o++] = lerp(A[1], B[1], t);
      raw[o++] = lerp(A[2], B[2], t);
    }
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
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log(`og-default.png generado (${(png.length / 1024).toFixed(1)} kB)`);
