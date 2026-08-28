import { respuestaDeRuta } from './_ruta.js';

/**
 * Ruta Madrid–Barcelona. Réplica del patrón que funcionó en Madrid–Valencia:
 * los kilómetros y el tiempo delante, el coste justo detrás.
 *
 * Distancia y duración contrastadas con el mapa de carreteras del RACE.
 * El dato diferencial de esta ruta es que **ya no tiene peajes**: la concesión
 * de la AP-2 entre Zaragoza y Barcelona terminó en 2021 y mucha gente sigue
 * planificando el viaje como si hubiera que pagar.
 */

const KM = 620;
const MINUTOS = 375; // 6 h 15 min

export default {
  cta: 'Calcular tu propia ruta en la calculadora',
  entradilla:
    'Es el trayecto largo por excelencia entre las dos ciudades más grandes de España: más de seis horas al volante. Esto es lo que tardas, lo que gastas y cuándo compensa frente al AVE.',
  supuesto:
    '620 km por la A-2, consumo medio de 6 l/100 km en autovía y gasolina a 1,559 €/l. El tiempo es de conducción efectiva, sin contar paradas.',

  responde: () =>
    respuestaDeRuta({
      km: KM,
      minutos: MINUTOS,
      via: 'A-2',
      peajes: 'desde 2021 se puede hacer entero sin pagar un solo peaje',
    }),

  contenido: `
    <h2>La ruta: cuántos kilómetros y cuánto se tarda</h2>
    <p>
      Madrid y Barcelona están separadas por unos <strong>620 kilómetros</strong> por la <strong>A-2</strong>,
      que atraviesa Guadalajara, Zaragoza y Lleida. El tiempo de conducción efectiva ronda las
      <strong>6 horas y 15 minutos</strong>, y ahí está la clave de todo lo demás: no es un trayecto que se
      haga del tirón. Contando la parada obligada para repostar, comer y estirar las piernas, la planificación
      realista es de <strong>siete horas de puerta a puerta</strong>.
    </p>
    <p>
      A esa distancia la fatiga deja de ser un detalle y pasa a ser parte del cálculo. La recomendación
      habitual es parar cada dos horas o cada doscientos kilómetros, lo que dan dos paradas mínimo en este
      viaje. Si vais dos conductores y os turnáis, la cosa cambia bastante; si vas solo, plantéate salir
      temprano y no encadenarlo con una jornada de trabajo.
    </p>
    <h2>La AP-2 ya no tiene peaje, y casi nadie se ha enterado</h2>
    <p>
      Durante décadas el Madrid–Barcelona obligaba a elegir entre pagar la autopista o alargar el viaje por
      carreteras más lentas. <strong>Eso se acabó en 2021</strong>, cuando terminó la concesión de la
      <strong>AP-2</strong> entre Zaragoza y Barcelona y el tramo pasó a ser gratuito.
    </p>
    <p>
      Hoy el trayecto completo se puede hacer <strong>sin pagar un solo euro de peaje</strong>, algo que
      mucha gente sigue sin saber y que cambia la cuenta por completo: lo que antes eran veintitantos euros
      de peaje ahora son cero. Si estás comparando presupuestos que encontraste en internet, comprueba la
      fecha: los anteriores a 2021 siguen sumando un peaje que ya no existe.
    </p>
    <h2>Qué hace variar el consumo en un viaje tan largo</h2>
    <p>
      En trayectos cortos el consumo casi da igual; en 620 kilómetros, cada litro de más se multiplica. El
      cálculo de arriba usa 6 l/100 km, razonable para un turismo de gasolina a velocidad constante. Un diésel
      moderno baja de 5 y un SUV cargado con equipaje de vacaciones, baca y aire acondicionado a tope puede
      pasar de 8. Entre esos dos extremos hay más de veinte euros de diferencia solo en la ida.
    </p>
    <p>
      La velocidad es el factor que más se nota y el que más se subestima. Rodar a 130 en lugar de a 110
      dispara el consumo por la resistencia aerodinámica, que crece con el cuadrado de la velocidad, y en un
      viaje de seis horas te ahorra apenas media hora. En este trayecto concreto, ir más despacio sale
      claramente a cuenta.
    </p>
    <h2>Aquí el AVE es un rival serio</h2>
    <p>
      En rutas cortas el coche gana casi siempre. En esta no. El <strong>AVE cubre el Madrid–Barcelona en
      unas dos horas y media</strong>, frente a las más de seis del coche: son casi cuatro horas de diferencia
      por trayecto, ocho en un viaje de ida y vuelta. Eso es un día entero de tu fin de semana.
    </p>
    <p>
      Yendo solo, el tren gana sin discusión en cuanto reservas con antelación. Yendo dos, la comparación se
      iguala. A partir de tres o cuatro ocupantes el coche vuelve a ser más barato, pero sigues pagando esas
      cuatro horas por sentido, y en Barcelona además tendrás que aparcar, que no es ni fácil ni barato.
    </p>
    <p>
      La regla práctica: si vais varios, lleváis equipaje voluminoso o vuestro destino no es el centro de
      Barcelona, el coche tiene sentido. Si vas solo o en pareja y os movéis por la ciudad, el tren te sale
      mejor aunque el billete parezca más caro que la gasolina.
    </p>
    <h2>Lo que este cálculo no incluye</h2>
    <p>
      Solo cuenta el combustible. En esta ruta ya no hay peajes que sumar, pero sí conviene contar el
      aparcamiento en destino y el <strong>coste real de usar el coche</strong>: neumáticos, mantenimiento,
      seguro y depreciación. En un viaje de 1.240 kilómetros entre ida y vuelta, ese desgaste es dinero de
      verdad. Una regla habitual para repartir con honestidad es sumar entre 0,03 y 0,06 € por kilómetro a
      lo que salga de carburante.
    </p>`,
};
