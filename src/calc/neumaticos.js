/**
 * Equivalencia de neumáticos según los criterios del Manual de Procedimiento
 * de Inspección ITV. Compartido entre la herramienta y las páginas satélite.
 */

const PULGADA = 25.4;

/** Tolerancia de diámetro exterior admitida, en porcentaje. */
export const TOLERANCIA = 3;

/** Índice de capacidad de carga -> kilogramos por neumático (norma ETRTO). */
export const CARGA = {
  65: 290, 66: 300, 67: 307, 68: 315, 69: 325, 70: 335, 71: 345, 72: 355, 73: 365, 74: 375,
  75: 387, 76: 400, 77: 412, 78: 425, 79: 437, 80: 450, 81: 462, 82: 475, 83: 487, 84: 500,
  85: 515, 86: 530, 87: 545, 88: 560, 89: 580, 90: 600, 91: 615, 92: 630, 93: 650, 94: 670,
  95: 690, 96: 710, 97: 730, 98: 750, 99: 775, 100: 800, 101: 825, 102: 850, 103: 875, 104: 900,
  105: 925, 106: 950, 107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150,
  114: 1180, 115: 1215, 116: 1250, 117: 1285, 118: 1320, 119: 1360, 120: 1400,
};

/** Categoría de velocidad -> km/h máximos. */
export const VELOCIDAD = {
  N: 140, P: 150, Q: 160, R: 170, S: 180, T: 190, U: 200, H: 210, V: 240, W: 270, Y: 300,
};

export const diametro = (m) => m.llanta * PULGADA + 2 * m.ancho * (m.perfil / 100);
export const circunferencia = (m) => Math.PI * diametro(m);
export const medida = (m) => `${m.ancho}/${m.perfil} R${m.llanta}`;
export const medidaCompleta = (m) => `${medida(m)} ${m.carga}${m.velocidad}`;

/** Diferencia de diámetro entre dos medidas, en porcentaje. */
export function diferencia(actual, nueva) {
  const d = diametro(actual);
  return ((diametro(nueva) - d) / d) * 100;
}

/**
 * Evalúa los cuatro criterios del Manual ITV.
 * El del perfil de llanta no es comprobable con la medida del neumático:
 * depende de la anchura de la llanta, que no forma parte de ella.
 */
export function criterios(actual, nueva) {
  const dif = diferencia(actual, nueva);
  return [
    {
      nombre: 'Diámetro exterior',
      estado: Math.abs(dif) <= TOLERANCIA ? 'ok' : 'no',
      diferencia: dif,
    },
    {
      nombre: 'Índice de capacidad de carga',
      estado: nueva.carga >= actual.carga ? 'ok' : 'no',
    },
    {
      nombre: 'Categoría de velocidad',
      estado: VELOCIDAD[nueva.velocidad] >= VELOCIDAD[actual.velocidad] ? 'ok' : 'no',
    },
    {
      nombre: 'Perfil de llanta de montaje',
      estado: 'nd',
    },
  ];
}

/** Velocidad real al circular con la medida nueva marcando `marcada` en el cuadro. */
export function velocidadReal(actual, nueva, marcada = 120) {
  return marcada * (diametro(nueva) / diametro(actual));
}

/* ------------------------------------------------------------------ *
 * Medidas comerciales y búsqueda de equivalentes
 * ------------------------------------------------------------------ *
 * Vivía dentro del `mount()` de la vista, así que solo existía después de que
 * el usuario rellenara el formulario y solo en el navegador. Las consultas de
 * Search Console piden literalmente «tabla de equivalencia de neumáticos»
 * —siete variantes distintas— y Google nunca llegaba a ver ninguna tabla.
 * Al vivir aquí, la página satélite puede escribirla ya calculada en el HTML.
 */

export const ANCHOS = [135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295];
export const PERFILES = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
export const LLANTAS = [13, 14, 15, 16, 17, 18, 19, 20, 21];

/**
 * Filtrar solo por diámetro no basta: un 155/40 R20 tiene el mismo diámetro que
 * un 205/55 R16 y no es una sustitución que nadie plantee. Se acotan también la
 * anchura y el salto de llanta a lo que se monta en la práctica.
 */
export const MAX_SALTO_ANCHO = 30; // mm arriba o abajo
export const MAX_SALTO_LLANTA = 2; // pulgadas arriba o abajo

/** Medidas comerciales dentro de la tolerancia, de la más parecida a la que menos. */
export function equivalentes(base) {
  const dBase = diametro(base);
  const out = [];
  for (const llanta of LLANTAS) {
    if (Math.abs(llanta - base.llanta) > MAX_SALTO_LLANTA) continue;
    for (const ancho of ANCHOS) {
      if (Math.abs(ancho - base.ancho) > MAX_SALTO_ANCHO) continue;
      for (const perfil of PERFILES) {
        const m = { ancho, perfil, llanta };
        if (m.ancho === base.ancho && m.perfil === base.perfil && m.llanta === base.llanta) continue;
        const dif = ((diametro(m) - dBase) / dBase) * 100;
        if (Math.abs(dif) <= TOLERANCIA) out.push({ ...m, dif, d: diametro(m) });
      }
    }
  }
  return out.sort((a, b) => Math.abs(a.dif) - Math.abs(b.dif));
}
