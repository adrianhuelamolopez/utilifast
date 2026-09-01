import { equivalentes, diametro, medida, TOLERANCIA } from '../calc/neumaticos.js';
import { decimal } from '../utils/format.js';

/**
 * Tabla de equivalencias de neumáticos.
 *
 * Nace de un hueco que enseñó Search Console: siete consultas distintas piden
 * literalmente una **tabla** —*tabla equivalencia neumaticos itv*, *tabla de
 * equivalencia de neumaticos*, *tablas equivalencias neumaticos*…— y la
 * herramienta genera una perfectamente válida, pero **solo después de que el
 * usuario rellene el formulario y solo con JavaScript**. Google nunca llegaba a
 * ver una tabla en esta web.
 *
 * Esta página la escribe ya calculada en el HTML, con las medidas más montadas
 * en España. El cálculo sale de `calc/neumaticos.js`, el mismo módulo que usa la
 * calculadora, así que las dos no pueden contradecirse.
 */

/** Medidas de partida: las más habituales en turismos en España. */
const BASES = [
  { ancho: 185, perfil: 65, llanta: 15, coche: 'Utilitarios y compactos pequeños' },
  { ancho: 195, perfil: 65, llanta: 15, coche: 'Compactos de gama media' },
  { ancho: 205, perfil: 55, llanta: 16, coche: 'La medida más extendida en compactos' },
  { ancho: 215, perfil: 60, llanta: 16, coche: 'Berlinas y SUV compactos' },
  { ancho: 225, perfil: 45, llanta: 17, coche: 'Compactos con acabado deportivo' },
  { ancho: 225, perfil: 40, llanta: 18, coche: 'Deportivos y acabados altos' },
];

/** Cuántas alternativas se publican por medida: las más ajustadas en diámetro. */
const POR_MEDIDA = 6;

const signo = (n) => `${n >= 0 ? '+' : '−'}${decimal(Math.abs(n), 2)} %`;

/** Una tabla por medida de partida, con sus equivalentes ya calculados. */
function tablaDe(base) {
  const filas = equivalentes(base).slice(0, POR_MEDIDA);
  return `
    <h3>${medida(base)} <span class="font-normal text-content-subtle">· ${base.coche}</span></h3>
    <p class="text-sm text-content-muted">
      Diámetro exterior: <strong>${decimal(diametro(base), 1)} mm</strong>. Estas son las medidas
      comerciales que se quedan dentro del ±${TOLERANCIA} %, ordenadas de la más ajustada a la que menos.
    </p>
    <div class="overflow-x-auto">
      <table class="data-table data-table-flush w-full min-w-[380px]">
        <caption class="sr-only">Medidas equivalentes a ${medida(base)}</caption>
        <thead>
          <tr>
            <th scope="col" class="text-left">Medida</th>
            <th scope="col" class="text-right">Diámetro</th>
            <th scope="col" class="text-right">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          ${filas
            .map(
              (m) => `
          <tr>
            <th scope="row" class="py-2.5 text-left font-medium">${medida(m)}</th>
            <td class="py-2.5 text-right tabular-nums">${decimal(m.d, 1)} mm</td>
            <td class="py-2.5 text-right tabular-nums">${signo(m.dif)}</td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

export default {
  cta: 'Comprobar tu medida en la calculadora',
  entradilla:
    'Las medidas que puedes montar sin problemas en la ITV, ya calculadas para los neumáticos más habituales en España. Y por qué el diámetro es solo uno de los cuatro criterios.',
  supuesto:
    'Diferencia de diámetro exterior dentro del ±3 % que admite el Manual de Procedimiento de Inspección ITV. Los índices de carga y velocidad hay que comprobarlos aparte en cada neumático concreto.',

  responde() {
    return {
      titular: `±${TOLERANCIA} %`,
      unidad: 'de diferencia de diámetro admite la ITV',
      frase: `Una medida distinta a la de tu ficha técnica se acepta si el <strong>diámetro exterior no se
      aleja más de un ${TOLERANCIA} %</strong> del original. Pero el diámetro es <strong>uno de cuatro
      criterios</strong>: también tienen que cumplirse el índice de carga, la categoría de velocidad y que
      la llanta admita esa anchura. Abajo tienes las equivalencias ya calculadas para las
      <strong>${BASES.length} medidas más montadas en España</strong>.`,
      datos: [
        ['Tolerancia de diámetro', `±${TOLERANCIA} %`],
        ['Criterios que exige la ITV', '4, no solo el diámetro'],
        ['Medidas cubiertas aquí', `${BASES.length}`],
        ['Fuente', 'Manual ITV'],
      ],
    };
  },

  contenido: `
    <h2>Cómo se lee una equivalencia</h2>
    <p>
      El número que manda es el <strong>diámetro exterior</strong>, que se calcula a partir de los tres datos
      del flanco: anchura en milímetros, perfil en porcentaje de esa anchura y diámetro de llanta en pulgadas.
      En un 205/55 R16, la goma mide 205 mm de ancho, el flanco es el 55 % de esos 205 mm y la llanta 16
      pulgadas. Sumando la llanta y los dos flancos sale el diámetro total.
    </p>
    <p>
      Dos medidas son intercambiables cuando ese diámetro no se separa más de un <strong>3 %</strong>. Es la
      tolerancia que recoge el <strong>Manual de Procedimiento de Inspección ITV</strong>, y el motivo es
      directo: el diámetro determina cuánto avanza el coche por vuelta de rueda, así que cambiarlo descuadra
      el velocímetro, el cuentakilómetros y las lecturas del ABS y el control de estabilidad.
    </p>
    <h2>Las tablas</h2>
    <p>
      Cada bloque parte de una medida habitual y lista las alternativas comerciales que caen dentro de la
      tolerancia, de la más ajustada a la que menos. Están acotadas a saltos realistas de anchura y de llanta:
      sin ese filtro aparecerían combinaciones con el diámetro correcto que nadie monta en la práctica.
    </p>
    ${BASES.map(tablaDe).join('\n')}
    <h2>El diámetro no basta: son cuatro criterios</h2>
    <p>
      Es el error más repetido. Que una medida salga en estas tablas significa que <strong>cumple el criterio
      del diámetro</strong>, no que sea legal en tu coche. Los otros tres hay que mirarlos en el neumático
      concreto que te ofrezcan:
    </p>
    <p>
      El <strong>índice de carga</strong> es el número que va detrás de la medida y no puede ser inferior al
      de tu ficha técnica: un 91 aguanta 615 kg por rueda y un 94, 670 kg. La <strong>categoría de
      velocidad</strong> es la letra que le sigue y tampoco puede bajar: una V admite 240 km/h y una H, 210.
      Y el <strong>perfil de la llanta</strong> tiene que admitir la anchura del neumático, algo que no se
      puede deducir de la medida porque depende de la llanta que lleves montada, no de la goma.
    </p>
    <p>
      Por eso ninguna tabla, ni esta ni otra, puede decirte que un cambio es legal. Puede descartarte las
      opciones imposibles, que ya es mucho, pero la última palabra la tiene la ficha técnica de tu vehículo.
    </p>
    <h2>Qué pasa con el velocímetro</h2>
    <p>
      Aunque te mantengas dentro del 3 %, la lectura cambia. Con un neumático de diámetro mayor el coche
      avanza más por vuelta, así que <strong>irás algo más rápido de lo que marca la aguja</strong>; con uno
      menor, algo más despacio. En el extremo de la tolerancia son unos 3-4 km/h a 120, poco pero suficiente
      para explicar por qué el GPS y el velocímetro dejan de coincidir después de un cambio de medida.
    </p>
    <p>
      Conviene saber además que los velocímetros están obligados por normativa a <strong>no marcar nunca
      menos</strong> de la velocidad real, por lo que ya de fábrica van un poco por encima. Montar una medida
      de diámetro mayor recorta ese margen de seguridad.
    </p>`,
};
