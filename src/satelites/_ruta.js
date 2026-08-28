import { viaje } from '../calc/gasolina.js';
import { money, decimal, integer } from '../utils/format.js';

/**
 * Bloque de respuesta común a las satélites de ruta.
 *
 * Existe por el mismo motivo que `src/calc/`: con tres rutas copiando la misma
 * aritmética, arreglar algo en una y olvidarse de las otras es cuestión de
 * tiempo. El cálculo sale de `calc/gasolina.js`, el mismo módulo que usa la
 * calculadora, así que ninguna cifra publicada puede contradecirla.
 *
 * El orden lo decidió Search Console: la satélite de Madrid–Valencia se escribió
 * respondiendo «cuánto cuesta», pero **trece de las catorce consultas que la
 * traían preguntaban los kilómetros o el tiempo**. Por eso el titular son los km
 * y el tiempo, y el coste va justo detrás.
 */

/** 225 -> «3 h 45 min». */
export const tiempoTexto = (min) =>
  min % 60 === 0 ? `${min / 60} h` : `${Math.floor(min / 60)} h ${min % 60} min`;

/**
 * [195, 255] -> «3 h 15 min y 4 h 15 min».
 *
 * Se publica un rango y no un número único porque un tiempo único siempre miente
 * en una de las dos direcciones: la cifra conservadora del RACE incluye tráfico
 * en los accesos, y quien conoce la ruta y sale con la carretera despejada la
 * hace en bastante menos. Prometer el tiempo optimista es peor error que el
 * contrario —quien salga confiado un domingo de agosto pensará que le mentimos—,
 * así que el rango cubre los dos escenarios y el artículo explica de qué depende.
 */
export const rangoTexto = ([a, b]) => `${tiempoTexto(a)} y ${tiempoTexto(b)}`;

/** Supuestos por defecto: turismo de gasolina en autovía, precio medio en España. */
export const CONSUMO = 6; // l/100 km
export const PRECIO = 1.559; // €/l

/**
 * @param {object} r
 * @param {number}   r.km       Distancia por la ruta principal.
 * @param {number[]} r.minutos  Conducción efectiva sin paradas, como [mínimo, máximo].
 * @param {string}   r.via      Nombre de la vía («A-3», «A-2»…).
 * @param {string}   r.peajes   Frase corta sobre peajes, ya redactada.
 */
export function respuestaDeRuta({ km, minutos, via, peajes, consumo = CONSUMO, precio = PRECIO }) {
  const solo = viaje({ km, consumo, precio, ocupantes: 1 });
  const cuatro = viaje({ km, consumo, precio, ocupantes: 4 });
  const idaVuelta = viaje({ km, consumo, precio, ocupantes: 4, idaVuelta: true });
  const rango = rangoTexto(minutos);

  return {
    titular: `${integer(km)} km`,
    unidad: `y entre ${rango} al volante`,
    frase: `El trayecto por la <strong>${via}</strong> son <strong>${integer(
      km
    )} kilómetros</strong> que se recorren en <strong>entre ${rango}</strong> según el tráfico y sin
    contar paradas, y ${peajes}. En combustible se van <strong>${decimal(
      solo.litros,
      1
    )} litros</strong>, unos <strong>${money(solo.total)}</strong>. Yendo cuatro personas salen
    <strong>${money(cuatro.porPersona)} por cabeza</strong>, y el viaje completo —ida y vuelta— sube a
    ${money(idaVuelta.porPersona)} cada uno.`,
    datos: [
      ['Distancia', `${integer(solo.km)} km`],
      // Con guion y no con «y»: en una ficha de dato suelta, «3 h 15 min y
      // 4 h 15 min» se lee como dos cosas en vez de como una franja.
      ['Tiempo al volante', `${tiempoTexto(minutos[0])} – ${tiempoTexto(minutos[1])}`],
      ['Gasolina solo la ida', money(solo.total)],
      ['Ida y vuelta entre 4', `${money(idaVuelta.porPersona)} por persona`],
    ],
  };
}
