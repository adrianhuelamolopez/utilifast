import { criterios, diferencia, medidaCompleta, velocidadReal } from '../calc/neumaticos.js';
import { decimal } from '../utils/format.js';

/** Contenido de la página satélite. Comparte módulo de cálculo con el comparador. */
export default {
  cta: 'Comparar otras medidas en el comparador',
  entradilla:
    'Es el cambio de medida más habitual al pasar de llanta de 16 a 17 pulgadas. Estas son las dos medidas comparadas criterio por criterio.',
  supuesto: 'Comparación entre 205/55 R16 91V y 225/45 R17 94W, medidas de uso corriente en turismo.',

  responde() {
    const act = { ancho: 205, perfil: 55, llanta: 16, carga: 91, velocidad: 'V' };
    const nue = { ancho: 225, perfil: 45, llanta: 17, carga: 94, velocidad: 'W' };
    const dif = diferencia(act, nue);
    const fallan = criterios(act, nue).filter((c) => c.estado === 'no');
    const real = velocidadReal(act, nue, 120);
    return {
      titular: fallan.length === 0 ? 'Sí' : 'No',
      unidad: fallan.length === 0 ? 'cumple los criterios comprobables' : 'no es equivalente',
      frase: `La diferencia de diámetro es de solo <strong>${decimal(
        Math.abs(dif),
        2
      )} %</strong>, muy por debajo del ±3 % que admite el Manual ITV. Con ${medidaCompleta(
        nue
      )} el índice de carga y la categoría de velocidad también superan a los de ${medidaCompleta(
        act
      )}, así que <strong>los tres criterios comprobables se cumplen</strong>.`,
      datos: [
        ['Diferencia de diámetro', `+${decimal(Math.abs(dif), 2)} %`],
        ['Índice de carga', '94 (670 kg) frente a 91 (615 kg)'],
        ['Categoría de velocidad', 'W (270 km/h) frente a V (240 km/h)'],
        ['A 120 km/h marcados', `${decimal(real, 1)} km/h reales`],
      ],
    };
  },

  contenido: `
    <h2>Qué cambia al pasar de 16 a 17 pulgadas</h2>
    <p>
      Este cambio es un caso de <em>plus sizing</em>: se sube una pulgada de llanta y se compensa bajando el
      perfil del neumático, de modo que el diámetro total apenas varía. Aquí la anchura pasa de 205 a 225
      milímetros y el perfil baja del 55 % al 45 %, y el resultado es un diámetro casi idéntico.
    </p>
    <p>
      En carretera se nota: la dirección gana precisión porque hay menos flanco que se deforme al girar, y el
      coche parece más asentado. A cambio la conducción se vuelve más seca sobre bache, el ruido de rodadura
      sube un poco y la llanta queda más expuesta a los golpes contra bordillos. Una banda más ancha mejora el
      agarre en seco pero suele penalizar el consumo.
    </p>
    <h2>El criterio que esta comparación no puede resolver</h2>
    <p>
      El Manual ITV exige cuatro condiciones y aquí solo se pueden verificar tres. La cuarta es que el
      <strong>perfil de llanta de montaje</strong> sea el correspondiente al neumático, y eso depende de la
      anchura de tu llanta, un dato que no aparece en la medida del neumático. Un 225 de ancho pide
      normalmente una llanta de entre 7 y 8,5 pulgadas de anchura; si la tuya es más estrecha, la medida no es
      válida por muy bien que salgan los otros tres criterios.
    </p>
    <h2>Lo que decide de verdad es tu tarjeta ITV</h2>
    <p>
      Que dos medidas sean técnicamente equivalentes no significa automáticamente que puedas montarlas en tu
      coche. El documento que consulta el inspector es la <strong>tarjeta ITV</strong> del vehículo, donde
      figuran las medidas homologadas por el fabricante. Si la que quieres montar no aparece ahí ni cumple los
      cuatro criterios de equivalencia, la inspección puede resultar desfavorable.
    </p>
    <p>
      Comprueba además que la nueva medida no roce con los pasos de rueda al girar a tope o con el coche
      cargado. Eso no lo anticipa ninguna tabla: hay que verlo montado.
    </p>`,
};
