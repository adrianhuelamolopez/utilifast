import { viaje } from '../calc/gasolina.js';
import { decimal, integer } from '../utils/format.js';

/**
 * Responde a «coste km coche» y «precio gasolina kilometraje», dos consultas
 * reales registradas en Search Console.
 *
 * El combustible sale de `calc/gasolina.js`, el mismo módulo que usa la
 * calculadora: si mañana cambia la fórmula, cambia también esta página.
 * El resto de partidas son estimaciones declaradas, no cifras oficiales, y se
 * publican desglosadas para que cualquiera pueda sustituirlas por las suyas.
 */

/** Kilómetros al año de un conductor particular medio en España. */
const KM_ANIO = 15000;

/** Gastos anuales del vehículo que no dependen de cuánto repostes (€/año). */
const COSTES_FIJOS = [
  ['Seguro', 400, 'A todo riesgo con franquicia, coche de gama media'],
  ['Mantenimiento, ITV y neumáticos', 600, 'Revisiones, aceite, filtros y un juego de ruedas cada cuatro años'],
  ['Impuesto de circulación', 100, 'Varía mucho según el municipio'],
  ['Depreciación', 1500, 'Lo que pierde de valor al año un coche de unos 20.000 €'],
];

/** Importe exento de IRPF por kilómetro (Orden HFP/792/2023, vigente en 2026). */
const HACIENDA = 0.26;

/** Combustible del supuesto, sacado del mismo módulo que la calculadora. */
const COMBUSTIBLE_KM = viaje({ km: 100, consumo: 6, precio: 1.559, ocupantes: 1 }).porKm;

/** Desglose que se publica en la tabla del artículo, combustible incluido. */
const DESGLOSE = [
  ['Combustible', COMBUSTIBLE_KM * KM_ANIO, '6 l/100 km a 1,559 €/l'],
  ...COSTES_FIJOS,
];
const TOTAL_ANUAL = DESGLOSE.reduce((t, [, importe]) => t + importe, 0);

export default {
  cta: 'Calcular el coste de tu próximo viaje',
  entradilla:
    'El combustible es lo único que se ve, pero no llega a ser la tercera parte de lo que cuesta mover un coche. Esto es lo que sale al contarlo todo.',
  supuesto:
    'Turismo de gasolina con consumo medio de 6 l/100 km, carburante a 1,559 €/l y 15.000 km al año. Las partidas fijas son estimaciones para un coche de gama media.',

  responde() {
    const totalAnual = TOTAL_ANUAL;
    const totalPorKm = totalAnual / KM_ANIO;
    const peso = (COMBUSTIBLE_KM / totalPorKm) * 100;

    return {
      titular: `${decimal(totalPorKm, 2)} €`,
      unidad: 'por kilómetro, contándolo todo',
      frase: `El combustible cuesta <strong>${decimal(
        COMBUSTIBLE_KM,
        3
      )} € por kilómetro</strong>, que es lo que nota tu bolsillo cada vez que repostas. Pero sumando
      seguro, mantenimiento, impuestos y depreciación el coste real sube a <strong>${decimal(
        totalPorKm,
        2
      )} €/km</strong>: el carburante es solo el <strong>${decimal(peso, 0)} %</strong> del total.
      Son unos ${integer(totalAnual)} € al año en ${integer(KM_ANIO)} kilómetros.`,
      datos: [
        ['Solo combustible', `${decimal(COMBUSTIBLE_KM, 3)} €/km`],
        ['Coste real completo', `${decimal(totalPorKm, 2)} €/km`],
        // Sin céntimos: las partidas fijas son estimaciones declaradas y dar el
        // total al céntimo aparentaría una precisión que este cálculo no tiene.
        ['Gasto anual del coche', `unos ${integer(totalAnual)} €`],
        ['Referencia de Hacienda', `${decimal(HACIENDA, 2)} €/km`],
      ],
    };
  },

  contenido: `
    <h2>Por qué el combustible engaña</h2>
    <p>
      Cuando alguien calcula lo que le cuesta un viaje piensa en lo que va a dejarse en la gasolinera, porque
      es el único gasto que aparece en el momento de hacer el kilómetro. Los demás ya están pagados o se
      pagarán más adelante: el seguro se domicilia una vez al año, las ruedas se cambian cada varios años y la
      depreciación no se paga nunca —se descubre el día que vendes el coche y te ofrecen menos de lo que
      esperabas—. Esa asimetría hace que casi todo el mundo estime el coste de conducir en torno a un tercio
      de lo que realmente es.
    </p>
    <h2>Las partidas que hay que sumar</h2>
    <p>
      Este es el desglose completo del que sale la cifra. Las partidas fijas son estimaciones para un coche de
      gama media, no cifras oficiales: se publican una a una precisamente para que puedas sustituirlas por las
      tuyas y rehacer la cuenta.
    </p>
    <div class="overflow-x-auto">
      <table class="data-table data-table-flush w-full min-w-[420px]">
        <caption class="sr-only">Coste anual y por kilómetro de un turismo que recorre 15.000 km al año</caption>
        <thead>
          <tr>
            <th scope="col" class="text-left">Partida</th>
            <th scope="col" class="text-right">€/año</th>
            <th scope="col" class="text-right">€/km</th>
          </tr>
        </thead>
        <tbody>
          ${DESGLOSE.map(
            ([concepto, importe, nota]) => `
          <tr>
            <th scope="row" class="py-2.5 text-left font-medium">
              ${concepto}
              <span class="mt-0.5 block text-xs font-normal text-content-subtle">${nota}</span>
            </th>
            <td class="py-2.5 text-right tabular-nums">${integer(importe)}</td>
            <td class="py-2.5 text-right tabular-nums">${decimal(importe / KM_ANIO, 3)}</td>
          </tr>`
          ).join('')}
          <tr class="font-semibold">
            <th scope="row" class="py-2.5 text-left">Total</th>
            <td class="py-2.5 text-right tabular-nums">${integer(TOTAL_ANUAL)}</td>
            <td class="py-2.5 text-right tabular-nums">${decimal(TOTAL_ANUAL / KM_ANIO, 3)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      El <strong>seguro</strong> y el <strong>impuesto de circulación</strong> son fijos: los pagas conduzcas
      mil kilómetros o treinta mil, así que cuantos más hagas, menos pesan por kilómetro. El
      <strong>mantenimiento</strong> sí crece con el uso —revisiones por kilometraje, aceite, filtros,
      pastillas de freno y un juego de neumáticos cada cierto tiempo—.
    </p>
    <p>
      Y luego está la <strong>depreciación</strong>, que es la partida más grande y la que nadie contabiliza.
      Un coche pierde valor por años y por kilómetros a la vez, y en los primeros años esa pérdida supera con
      holgura lo que gastas en repostar. En la tabla es la línea mayor de todas, por encima del combustible.
    </p>
    <h2>La cifra oficial de Hacienda y por qué es tan útil</h2>
    <p>
      La Agencia Tributaria fija en <strong>0,26 € por kilómetro</strong> la cantidad que una empresa puede
      abonar a un trabajador que usa su coche particular por motivos laborales sin que tribute en el IRPF.
      Está regulada en la Orden HFP/792/2023, que la subió desde los 0,19 € anteriores, y sigue vigente.
    </p>
    <p>
      Lo interesante es que ese importe está pensado para <strong>compensar el coste real</strong> de poner un
      coche particular a trabajar, no solo el carburante, y por eso se acerca tanto al total que sale del
      desglose. Si necesitas una cifra rápida y defendible —para repartir gastos, para facturar un
      desplazamiento o simplemente para decidir si te compensa el coche— usar 0,26 €/km es mucho más
      realista que contar únicamente la gasolina.
    </p>
    <h2>Cuándo conviene usar cada número</h2>
    <p>
      Depende de qué decisión estés tomando. Para <strong>repartir un viaje entre amigos</strong> lo justo es
      contar el combustible y los peajes: el coche lo ibas a tener igualmente y el desgaste extra de un fin de
      semana es pequeño. Nadie espera que sus acompañantes le paguen la depreciación.
    </p>
    <p>
      Para <strong>decidir entre coche, tren o autobús</strong>, o para valorar si te merece la pena vender el
      coche y tirar de alquiler y transporte público, hay que usar el coste completo. Es ahí donde la
      comparación cambia de resultado: un trayecto que en combustible parece baratísimo deja de serlo cuando
      le sumas la parte proporcional de todo lo demás. Y para <strong>cobrar un desplazamiento de trabajo</strong>,
      la referencia es directamente la de Hacienda.
    </p>`,
};
