import { respuestaDeRuta } from './_ruta.js';

/**
 * Ruta Madrid–Valencia.
 *
 * Se escribió para responder «cuánto cuesta», pero Search Console demostró que
 * Google la sube sobre todo por **consultas de distancia**: trece de las catorce
 * que la traen preguntan los kilómetros o el tiempo, no el precio
 * (*distancia madrid valencia*, *km de madrid a valencia*, *madrid valencia
 * coche tiempo*). El dato estaba, pero enterrado en una fila de la tabla.
 * De ahí salió el patrón que ahora comparten las tres rutas en `_ruta.js`.
 *
 * Distancia y duración contrastadas con el mapa de carreteras del RACE. La cifra
 * anterior —355 km y «tres horas y media»— se quedaba veinte minutos corta.
 */

const KM = 360;
const MINUTOS = 225; // 3 h 45 min

export default {
  cta: 'Calcular tu propia ruta en la calculadora',
  entradilla:
    'Los 360 kilómetros de la A-3 son una de las rutas más transitadas de España, y se hacen en algo menos de cuatro horas. Esto es lo que tardas y lo que cuesta.',
  supuesto:
    '360 km por la A-3, consumo medio de 6 l/100 km en autovía y gasolina a 1,559 €/l. La A-3 no tiene peajes. El tiempo es de conducción, sin contar paradas.',

  responde: () =>
    respuestaDeRuta({
      km: KM,
      minutos: MINUTOS,
      via: 'A-3',
      peajes: 'no tiene ni un peaje',
    }),

  contenido: `
    <h2>La ruta: cuántos kilómetros y cuánto se tarda</h2>
    <p>
      Madrid y Valencia están separadas por unos <strong>360 kilómetros</strong> por la <strong>A-3</strong>,
      la autovía del Este, que une las dos ciudades prácticamente en línea recta. El trayecto se hace en
      <strong>unas 3 horas y 45 minutos</strong> de conducción efectiva, sin contar paradas.
    </p>
    <p>
      Esa cifra baila según de dónde salgas y a dónde vayas: no es lo mismo arrancar desde el centro de Madrid
      que desde la A-3 ya tomada, y en Valencia hay varios kilómetros de diferencia entre el centro y los
      pueblos de la costa. Cuenta también que los accesos a Madrid —M-30, M-40 y M-50— son donde se acumula
      casi todo el retraso los viernes por la tarde y los domingos por la noche. En hora punta de operación
      salida, el trayecto se puede ir con facilidad por encima de las cuatro horas y media.
    </p>
    <p>
      La buena noticia es que la <strong>A-3 no tiene peajes</strong> en ningún tramo, así que el único gasto
      del camino es el combustible y lo que te tomes en el área de servicio.
    </p>
    <h2>Qué hace variar el precio</h2>
    <p>
      La cifra de arriba usa un consumo de 6 litros cada 100 kilómetros, razonable para un turismo de gasolina
      rodando a velocidad constante por autovía. Ese número puede moverse bastante: un diésel moderno baja de
      5 litros en ese mismo trayecto, mientras que un SUV cargado con equipaje, con el aire acondicionado a
      tope o rodando a 130 en lugar de a 110 puede irse por encima de 8.
    </p>
    <p>
      El precio del carburante es el otro factor, y varía entre comunidades y entre estaciones. Repostar en
      una gasolinera de autovía suele salir bastante más caro que hacerlo en la ciudad antes de salir, con
      diferencias que en un depósito completo compensan el pequeño desvío.
    </p>
    <h2>Compartir coche cambia por completo la cuenta</h2>
    <p>
      Es donde está el ahorro real. El coste del trayecto es el mismo vayas solo o vayáis cuatro, así que cada
      ocupante adicional divide la factura sin aumentarla. La comparación con otras opciones se vuelve
      interesante: yendo cuatro personas el coche es difícil de batir; yendo solo, tren y autobús suelen salir
      a cuenta.
    </p>
    <h2>Lo que este cálculo no incluye</h2>
    <p>
      Solo cuenta el combustible. Como la A-3 no tiene peajes, en esta ruta concreta no hay nada que sumar por
      ese concepto, pero sí conviene contar el aparcamiento en destino, que en Valencia capital no es barato.
    </p>
    <p>
      Tampoco incluye el <strong>coste real de usar el coche</strong>: neumáticos, aceite, mantenimiento,
      seguro y depreciación. Si quieres una cifra completa para repartir con honestidad entre los ocupantes,
      una regla habitual es sumar entre 0,03 y 0,06 € por kilómetro a lo que salga de combustible.
    </p>
    <h2>Cuándo sale mejor el coche y cuándo el tren</h2>
    <p>
      Con estas cifras la comparación se hace sola. Yendo solo, el combustible ya se acerca al precio de un
      billete de tren comprado con antelación, y encima pones casi cuatro horas de conducción frente a menos
      de dos de trayecto en AVE. A partir de dos ocupantes el coche empieza a ganar, y con tres o cuatro no
      hay discusión: el coste por persona baja a menos de la mitad de cualquier alternativa.
    </p>
    <p>
      Hay un matiz que suele olvidarse: el coche te deja en el destino exacto, mientras que el tren te deja en
      la estación. Si vas a moverte por Valencia capital, el transporte público resuelve; si tu destino es la
      playa, un pueblo del interior o vas cargado con equipaje, la comodidad del coche vale más que la
      diferencia de precio. Y si viajas en temporada alta, sumar el aparcamiento en destino puede cambiar por
      completo el resultado de la comparación.
    </p>`,
};
