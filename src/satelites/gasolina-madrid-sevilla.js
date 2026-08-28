import { respuestaDeRuta } from './_ruta.js';

/**
 * Ruta Madrid–Sevilla por la A-4, la Autovía del Sur.
 *
 * Distancia y duración contrastadas con el mapa de carreteras del RACE.
 * Lo propio de esta ruta es el paso de **Despeñaperros** y el calor del verano
 * andaluz, dos cosas que se notan en el consumo y que ninguna calculadora
 * genérica menciona.
 */

const KM = 530;
// Rango, no cifra única: 4 h 45 min con la A-4 despejada, 6 h 15 min con
// tráfico en la salida de Madrid o retenciones en Despeñaperros.
const MINUTOS = [285, 375]; // 4 h 45 min – 6 h 15 min

export default {
  cta: 'Calcular tu propia ruta en la calculadora',
  entradilla:
    'La Autovía del Sur une Madrid y Sevilla en entre cinco y seis horas, y sin un solo peaje. Esto es lo que tardas, lo que cuesta y por qué Despeñaperros te sube el consumo.',
  supuesto:
    '530 km por la A-4, consumo medio de 6 l/100 km en autovía y gasolina a 1,559 €/l. El tiempo es de conducción efectiva, sin contar paradas.',

  responde: () =>
    respuestaDeRuta({
      km: KM,
      minutos: MINUTOS,
      via: 'A-4',
      peajes: 'no tiene ni un peaje en todo el recorrido',
    }),

  contenido: `
    <h2>La ruta: cuántos kilómetros y cuánto se tarda</h2>
    <p>
      Madrid y Sevilla están separadas por unos <strong>530 kilómetros</strong> por la <strong>A-4</strong>,
      la Autovía del Sur, que baja por Ciudad Real, cruza Despeñaperros y sigue por Bailén y Córdoba. El
      tiempo de conducción efectiva va de <strong>4 horas y 45 minutos a 6 horas y cuarto</strong> según el
      tráfico, sin contar paradas.
    </p>
    <p>
      Es una autovía cómoda y bien señalizada, <strong>sin ningún peaje</strong> en todo el recorrido. Los
      puntos donde se pierde tiempo son la salida de Madrid por la M-30 y la M-40 y, en operación salida, el
      embudo histórico de Despeñaperros. En un puente o en el arranque de las vacaciones de agosto, el extremo alto de
      ese rango se queda corto y el viaje se puede ir con facilidad a las siete horas.
    </p>
    <h2>Despeñaperros: el tramo que te sube el consumo</h2>
    <p>
      Hay algo que ninguna calculadora genérica te va a decir y que en esta ruta importa: el paso de
      <strong>Despeñaperros</strong>, entre Castilla-La Mancha y Andalucía, es un desfiladero de montaña con
      pendientes sostenidas. Subirlo cargado obliga al motor a trabajar bastante más que en llano, y el
      consumo del tramo se dispara respecto a la media del viaje.
    </p>
    <p>
      No es para preocuparse —son unos pocos kilómetros de los 530— pero explica por qué el gasto real suele
      salir algo por encima de lo que predice un cálculo hecho con el consumo homologado. Y explica también
      que el sentido importe: bajando hacia Sevilla se gasta algo menos que subiendo de vuelta a Madrid.
    </p>
    <h2>El calor cuenta, y en esta ruta mucho</h2>
    <p>
      Es el factor más ignorado del viaje al sur. En julio y agosto el valle del Guadalquivir pasa
      cómodamente de 40 grados, y con el <strong>aire acondicionado al máximo durante toda la ruta</strong> el
      consumo sube de forma apreciable, del orden de medio litro a un litro cada 100 kilómetros según el coche.
    </p>
    <p>
      A eso se le suma que en pleno verano conviene salir de madrugada o a última hora de la tarde, que es
      justo cuando menos calor hace y menos trabaja el aire. Si viajas en agosto, cuenta con gastar por encima
      de la cifra de arriba y planifica las paradas: los descansos en carretera con calor extremo no son un
      lujo, son seguridad.
    </p>
    <h2>Qué hace variar el precio</h2>
    <p>
      Además del calor y del desnivel, los dos factores de siempre. El <strong>consumo real</strong> de tu
      coche puede estar bastante lejos del homologado: un diésel moderno baja de 5 l/100 km en autovía,
      mientras que un vehículo cargado, con baca o rodando a 130 en lugar de a 110 se va por encima de 8.
    </p>
    <p>
      Y el <strong>precio del carburante</strong>, que varía entre comunidades y entre estaciones. Repostar en
      un área de servicio de autovía suele costar bastante más que hacerlo antes de salir de la ciudad, y en
      un depósito completo esa diferencia paga de sobra el pequeño desvío.
    </p>
    <h2>Coche o AVE</h2>
    <p>
      Sevilla tiene una de las mejores conexiones ferroviarias de España: el AVE la une con Madrid en
      <strong>unas dos horas y media</strong>, frente a las cinco o seis del coche. Yendo solo, y
      comprando con antelación, el tren gana casi siempre: el combustible ya se acerca al precio del billete y
      encima ahorras tres horas por sentido.
    </p>
    <p>
      La cosa se da la vuelta a partir de dos o tres ocupantes, porque el coste del coche se divide y el de los
      billetes se multiplica. Con cuatro personas el coche es difícil de batir. Y si tu destino no es Sevilla
      capital sino un pueblo de la provincia o la costa de Huelva o Cádiz, el coche deja de tener rival: el
      tren te deja en la estación y desde ahí aún te queda viaje.
    </p>
    <h2>Lo que este cálculo no incluye</h2>
    <p>
      Solo el combustible. No hay peajes que sumar en esta ruta, pero sí el aparcamiento en destino y el
      <strong>coste real de usar el coche</strong> —neumáticos, mantenimiento, seguro y depreciación—, que en
      un viaje de más de mil kilómetros entre ida y vuelta es dinero de verdad. Para repartirlo con honestidad
      entre los ocupantes, una regla habitual es sumar entre 0,03 y 0,06 € por kilómetro.
    </p>`,
};
