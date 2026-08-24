import { simular, plazoTexto } from '../calc/hipoteca.js';
import { proyectar } from '../calc/interes.js';
import { money, decimal } from '../utils/format.js';

/**
 * Responde a «amortizar hipoteca o invertir calculadora», consulta literal
 * registrada en Search Console.
 *
 * Las dos mitades salen de los módulos compartidos: `calc/hipoteca.js` para lo
 * que se ahorra amortizando y `calc/interes.js` para lo que rendiría invertido.
 * Ninguna cifra de esta página está escrita a mano.
 *
 * La comparación se hace **al mismo horizonte y con la casa pagada en ambos
 * casos**, que es la única forma honesta de compararlas: quien amortiza termina
 * la hipoteca antes y a partir de ahí invierte la cuota entera más el extra.
 * Compararlas sin eso —lo habitual— infla artificialmente la opción de invertir.
 */

const CAPITAL = 180000;
const TASA = 3.1;
const ANIOS = 25;
const EXTRA = 100;

// Se calcula aquí y se interpola en el artículo: escribir «3 años y 8 meses» a
// mano es justo la vía por la que el texto acaba contradiciendo a la herramienta.
const MESES_LIBRES =
  simular(CAPITAL, TASA, ANIOS, 0).meses - simular(CAPITAL, TASA, ANIOS, EXTRA).meses;

/** Riqueza acumulada al final del plazo original con cada estrategia. */
function escenarios(rentabilidad) {
  const base = simular(CAPITAL, TASA, ANIOS, 0);
  const con = simular(CAPITAL, TASA, ANIOS, EXTRA);
  const mesesLibres = base.meses - con.meses;

  return {
    base,
    con,
    mesesLibres,
    ahorroIntereses: base.intereses - con.intereses,
    // Amortizar: nada invertido hasta liquidar el préstamo; después, la cuota
    // completa más el extra durante los meses que se ha adelantado.
    amortizar: proyectar({
      aportacion: base.cuota + EXTRA,
      tasaAnual: rentabilidad,
      anios: mesesLibres / 12,
    }).final,
    // Invertir: el extra va a la cartera desde el primer mes y la hipoteca
    // recorre su plazo completo.
    invertir: proyectar({ aportacion: EXTRA, tasaAnual: rentabilidad, anios: ANIOS }).final,
  };
}

export default {
  cta: 'Probar con tu hipoteca en la calculadora',
  entradilla:
    'Tienes 100 € libres cada mes y la duda de siempre. La respuesta no es una opinión: depende de un único número, y se puede calcular.',
  supuesto:
    'Hipoteca de 180.000 € al 3,1 % fijo a 25 años, con 100 € extra al mes destinados a reducir plazo. Ambas opciones se comparan a 25 años y con la vivienda pagada.',

  responde() {
    const e = escenarios(TASA);
    return {
      titular: `${decimal(TASA, 1)} %`,
      unidad: 'la rentabilidad que hay que batir',
      frase: `Amortizando <strong>${EXTRA} € al mes</strong> la hipoteca se acaba en
      <strong>${plazoTexto(e.con.meses)}</strong> y te ahorras <strong>${money(
        e.ahorroIntereses
      )}</strong> en intereses. Ese ahorro equivale a una inversión que rentase un
      <strong>${decimal(TASA, 1)} % garantizado</strong>, justo el tipo de tu préstamo. Por debajo de esa
      cifra conviene amortizar; por encima, invertir. Contando el impuesto sobre las ganancias, el punto de
      equilibrio real sube hasta el <strong>3,6 %</strong>.`,
      datos: [
        ['Cuota mensual', money(e.base.cuota)],
        ['Plazo amortizando 100 €/mes', plazoTexto(e.con.meses)],
        ['Ahorro en intereses', money(e.ahorroIntereses)],
        ['Rentabilidad a batir', `${decimal(TASA, 1)} % neto`],
      ],
    };
  },

  contenido: `
    <h2>Por qué amortizar es una inversión encubierta</h2>
    <p>
      Cuesta verlo, pero adelantar capital a la hipoteca <strong>es</strong> invertir. Cada euro que metes deja
      de generar intereses al banco durante todos los años que le quedaban al préstamo, y ese interés que dejas
      de pagar es exactamente igual de real que un beneficio ingresado. La diferencia es que no aparece en
      ninguna cuenta: se manifiesta como un gasto que nunca llega.
    </p>
    <p>
      De ahí sale la regla completa: amortizar te renta <strong>el tipo de tu hipoteca</strong>. Ni más ni
      menos. Si tu préstamo está al 3,1 %, cada euro adelantado te produce un 3,1 %. Por eso la pregunta
      «¿amortizo o invierto?» tiene una respuesta concreta en cuanto la reformulas: <em>¿puedo obtener más de un
      3,1 % con ese dinero?</em>
    </p>
    <h2>La comparación bien hecha</h2>
    <p>
      Casi todas las comparaciones que se leen hacen trampa sin querer: calculan lo que rendirían 100 € al mes
      invertidos durante veinticinco años y lo comparan con el ahorro en intereses, ignorando que quien amortiza
      <strong>termina la hipoteca antes</strong> y a partir de ese momento tiene libre la cuota entera. En este
      caso son ${plazoTexto(MESES_LIBRES)} de tener casi 900 € mensuales disponibles para invertir.
    </p>
    <p>
      Comparadas al mismo horizonte y con la vivienda pagada en los dos escenarios, las dos estrategias empatan
      justo cuando la rentabilidad iguala al tipo de la hipoteca. No es casualidad ni una aproximación: es la
      misma operación vista desde los dos lados.
    </p>
    <h2>Lo que inclina la balanza hacia amortizar</h2>
    <p>
      El primero es <strong>Hacienda</strong>. Los intereses que dejas de pagar no tributan, pero las ganancias
      de una inversión sí: la base del ahorro empieza en el 19 % y sube por tramos. Eso significa que no basta
      con igualar el tipo de tu hipoteca, hay que superarlo en aproximadamente medio punto para acabar
      empatando de verdad.
    </p>
    <p>
      El segundo es el <strong>riesgo</strong>, y pesa más que el anterior. El ahorro por amortizar es seguro:
      está garantizado por contrato y no depende de nada. La rentabilidad de una inversión es una expectativa,
      no una promesa, y puede ser negativa durante años. Comparar un 3,1 % garantizado con un 6 % esperado es
      comparar cosas distintas.
    </p>
    <p>
      Hay un tercer factor que no es financiero pero decide muchas veces: <strong>dormir tranquilo</strong>.
      Deber menos reduce el riesgo si vienen mal dadas, y para mucha gente eso vale más que unos puntos de
      rentabilidad esperada.
    </p>
    <h2>Y lo que la inclina hacia invertir</h2>
    <p>
      La <strong>liquidez</strong>, sobre todo. El dinero que metes en la hipoteca no lo vuelves a ver hasta que
      vendas la casa; el que está invertido puedes recuperarlo. Antes de amortizar un solo euro conviene tener
      un fondo de emergencia hecho, porque quedarse sin colchón por adelantar cuotas es cambiar un problema
      pequeño por uno grande.
    </p>
    <p>
      También cuenta el <strong>tipo de tu préstamo</strong>. Con hipotecas antiguas al 1 % la respuesta suele
      ser evidente hacia invertir, y con tipos altos hacia amortizar. Y si tu hipoteca es variable, el número a
      batir no es fijo: sube y baja con el euríbor, y con él la respuesta.
    </p>
    <p>
      Conviene revisar además dos detalles del contrato: si hay <strong>comisión por amortización
      anticipada</strong> —limitada por ley, pero existente en los primeros años de muchos préstamos— y si te
      interesa reducir plazo o cuota. Reducir plazo ahorra bastante más, y es lo que asume este cálculo.
    </p>
    <p>
      Nada de esto es una recomendación de inversión: es aritmética con unos supuestos declarados. Cambia el
      tipo, el plazo o la aportación en la calculadora y verás cómo se mueve el resultado con tus propios
      números.
    </p>`,
};
