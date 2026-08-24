/**
 * Sistemas de medida del consumo de combustible.
 *
 * Por qué existe esto: el 18 % de las impresiones del sitio viene de
 * Latinoamérica y un 11 % de Estados Unidos, y allí **no se razona en
 * l/100 km**. México y buena parte de Latinoamérica piensan en kilómetros por
 * litro; Estados Unidos, en millas por galón. Quien escribía «12» pensando en
 * km/l recibía el coste de un coche que gasta 12 l/100 km: casi cinco veces más
 * caro, y sin ningún aviso de que se había entendido otra cosa.
 *
 * El cálculo interno sigue siendo siempre km + l/100 km, que es lo que espera
 * `calc/gasolina.js`. Aquí solo se traduce lo que escribe el usuario.
 *
 * Nota: Colombia y Perú combinan kilómetros con galones (km/gal). No está
 * cubierto a propósito — son dos casos frente a tres sistemas ya soportados, y
 * cada opción extra es una decisión más que tomar antes de calcular nada.
 */

/** Factores de conversión exactos. */
const MILLA_EN_KM = 1.609344;
const GALON_EN_LITROS = 3.785411784; // galón estadounidense, no imperial

// mpg -> l/100 km. La constante 235,215 sale de (100 × 3,785411784) / 1,609344.
const MPG_A_L100 = (100 * GALON_EN_LITROS) / MILLA_EN_KM;

export const SISTEMAS = {
  l100km: {
    id: 'l100km',
    etiqueta: 'l/100 km',
    donde: 'España y Europa',
    unidadConsumo: 'l/100 km',
    unidadDistancia: 'km',
    unidadVolumen: 'l',
    // Precio por litro
    volumenPorUnidad: 'l',
    aL100km: (v) => v,
    desdeL100km: (v) => v,
    presets: [
      { label: 'Ciudad', value: 8 },
      { label: 'Mixto', value: 6 },
      { label: 'Carretera', value: 5 },
    ],
  },
  kml: {
    id: 'kml',
    etiqueta: 'km/l',
    donde: 'México, Argentina, Chile',
    unidadConsumo: 'km/l',
    unidadDistancia: 'km',
    unidadVolumen: 'l',
    volumenPorUnidad: 'l',
    // Relación inversa: 12 km/l son 8,33 l/100 km.
    aL100km: (v) => (v > 0 ? 100 / v : 0),
    desdeL100km: (v) => (v > 0 ? 100 / v : 0),
    presets: [
      { label: 'Ciudad', value: 12.5 },
      { label: 'Mixto', value: 16.7 },
      { label: 'Carretera', value: 20 },
    ],
  },
  mpg: {
    id: 'mpg',
    etiqueta: 'mi/gal',
    donde: 'Estados Unidos',
    unidadConsumo: 'mpg',
    unidadDistancia: 'mi',
    unidadVolumen: 'gal',
    volumenPorUnidad: 'gal',
    aL100km: (v) => (v > 0 ? MPG_A_L100 / v : 0),
    desdeL100km: (v) => (v > 0 ? MPG_A_L100 / v : 0),
    presets: [
      { label: 'Ciudad', value: 29 },
      { label: 'Mixto', value: 39 },
      { label: 'Carretera', value: 47 },
    ],
  },
};

export const SISTEMA_POR_DEFECTO = 'l100km';

/** El sistema pedido, o el de España si el identificador no existe. */
export const sistema = (id) => SISTEMAS[id] || SISTEMAS[SISTEMA_POR_DEFECTO];

/* --- Distancia --------------------------------------------------------- */
export const aKm = (valor, id) => (sistema(id).unidadDistancia === 'mi' ? valor * MILLA_EN_KM : valor);
export const desdeKm = (km, id) => (sistema(id).unidadDistancia === 'mi' ? km / MILLA_EN_KM : km);

/* --- Volumen ----------------------------------------------------------- */
export const desdeLitros = (litros, id) =>
  sistema(id).volumenPorUnidad === 'gal' ? litros / GALON_EN_LITROS : litros;

/**
 * Precio por litro a partir del precio que escribe el usuario.
 * En el sistema estadounidense el surtidor marca el precio por galón.
 */
export const aPrecioPorLitro = (precio, id) =>
  sistema(id).volumenPorUnidad === 'gal' ? precio / GALON_EN_LITROS : precio;
