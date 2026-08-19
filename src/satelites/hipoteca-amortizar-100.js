import { simular, plazoTexto } from '../calc/hipoteca.js';
import { money } from '../utils/format.js';

/**
 * Contenido de la página satélite. Se carga bajo demanda: no entra en el núcleo.
 * `responde()` usa el MISMO módulo de cálculo que la calculadora, de modo que las
 * cifras del artículo no pueden desviarse de las que devuelve el formulario.
 */
export default {
  cta: 'Probar con tus números en la calculadora',
  entradilla:
    'Es la duda más repetida de quien tiene hipoteca y algo de margen a fin de mes. La respuesta sorprende, porque el efecto no es proporcional al dinero aportado.',
  supuesto: 'Hipoteca de 180.000 € al 3,1 % a 25 años, destinando el extra a reducir plazo.',

  responde() {
    const base = simular(180000, 3.1, 25, 0);
    const con = simular(180000, 3.1, 25, 100);
    const ahorro = base.intereses - con.intereses;
    const cuotasMenos = base.meses - con.meses;
    return {
      titular: money(ahorro),
      unidad: 'de ahorro en intereses',
      frase: `Aportando <strong>100 € más cada mes</strong> terminas de pagar en <strong>${plazoTexto(
        con.meses
      )}</strong> en lugar de ${plazoTexto(base.meses)}, y te ahorras <strong>${money(
        ahorro
      )}</strong> en intereses. Son <strong>${cuotasMenos} cuotas menos</strong>.`,
      datos: [
        ['Cuota mensual', money(base.cuota)],
        ['Intereses sin amortizar', money(base.intereses)],
        ['Intereses amortizando', money(con.intereses)],
        ['Plazo final', plazoTexto(con.meses)],
      ],
    };
  },

  contenido: `
    <h2>Por qué 100 € rinden tanto</h2>
    <p>
      La clave está en que el dinero extra <strong>no paga intereses: amortiza capital directamente</strong>.
      Cada euro que adelantas elimina todos los intereses que ese euro habría generado durante los años que le
      quedaban de vida al préstamo. Por eso el ahorro total supera con mucho a la suma de las aportaciones.
    </p>
    <p>
      En el sistema francés, que es el que usan casi todas las hipotecas españolas, las primeras cuotas se van
      casi enteras en intereses y apenas tocan el capital. Adelantar capital en esa fase inicial es cuando más
      efecto tiene, porque reduce la base sobre la que se calculan los intereses de todos los meses siguientes.
    </p>
    <h2>Reducir plazo o reducir cuota</h2>
    <p>
      Al amortizar puedes elegir entre dos cosas, y la diferencia no es menor. <strong>Reducir plazo</strong>
      mantiene la cuota igual y recorta meses por el final: elimina las últimas cuotas, que son las que
      arrastran capital pendiente durante más tiempo, y por eso ahorra más intereses. <strong>Reducir
      cuota</strong> mantiene los años y te deja más aire cada mes, pero el ahorro es bastante menor.
    </p>
    <p>
      El cálculo de arriba usa reducción de plazo. Si tu situación económica es ajustada, reducir cuota es una
      decisión perfectamente razonable aunque el ahorro sea inferior: la tranquilidad mensual también vale.
    </p>
    <h2>Lo que conviene comprobar antes</h2>
    <p>
      Revisa si tu escritura contempla <strong>comisión por amortización anticipada</strong>. La ley limita
      esa comisión y en muchos contratos recientes es cero, pero no en todos, y en hipotecas variables depende
      del momento en que amortices. Comprueba también si tu banco exige un importe mínimo por operación:
      algunos no admiten aportaciones pequeñas cada mes y obligan a acumular y amortizar una o dos veces al
      año, lo que reduce ligeramente el efecto.
    </p>
    <p>
      Y antes de destinar ese dinero a la hipoteca, ten cubierto un fondo de emergencia. Un capital amortizado
      no se puede recuperar si un imprevisto te deja sin liquidez.
    </p>`,
};
