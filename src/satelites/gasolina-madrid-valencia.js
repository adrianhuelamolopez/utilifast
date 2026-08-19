import { viaje } from '../calc/gasolina.js';
import { money, decimal, integer } from '../utils/format.js';

/** Contenido de la página satélite. Comparte módulo de cálculo con la calculadora. */
export default {
  cta: 'Calcular tu propia ruta en la calculadora',
  entradilla:
    'Los 355 kilómetros de la A-3 son una de las rutas más transitadas de España. Esto es lo que cuesta en combustible con un coche medio.',
  supuesto:
    '355 km por la A-3, consumo medio de 6 l/100 km en autovía y gasolina a 1,559 €/l. La A-3 no tiene peajes.',

  responde() {
    const solo = viaje({ km: 355, consumo: 6, precio: 1.559, ocupantes: 1 });
    const cuatro = viaje({ km: 355, consumo: 6, precio: 1.559, ocupantes: 4 });
    const idaVuelta = viaje({ km: 355, consumo: 6, precio: 1.559, ocupantes: 4, idaVuelta: true });
    return {
      titular: money(solo.total),
      unidad: 'de combustible solo la ida',
      frase: `El trayecto consume unos <strong>${decimal(
        solo.litros,
        1
      )} litros</strong> y cuesta <strong>${money(solo.total)}</strong> en combustible. Yendo cuatro personas
      salen <strong>${money(cuatro.porPersona)} por cabeza</strong>, y el fin de semana completo —ida y
      vuelta— sube a ${money(idaVuelta.porPersona)} cada uno.`,
      datos: [
        ['Distancia', `${integer(solo.km)} km`],
        ['Combustible', `${decimal(solo.litros, 1)} litros`],
        ['Coste por kilómetro', `${decimal(solo.porKm, 3)} €`],
        ['Ida y vuelta entre 4', `${money(idaVuelta.porPersona)} por persona`],
      ],
    };
  },

  contenido: `
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
      Solo cuenta el combustible. La <strong>A-3 no tiene peajes</strong>, así que en esta ruta concreta no
      hay nada que sumar por ese concepto, pero sí conviene contar el aparcamiento en destino, que en Valencia
      capital no es barato.
    </p>
    <p>
      Tampoco incluye el <strong>coste real de usar el coche</strong>: neumáticos, aceite, mantenimiento,
      seguro y depreciación. Si quieres una cifra completa para repartir con honestidad entre los ocupantes,
      una regla habitual es sumar entre 0,03 y 0,06 € por kilómetro a lo que salga de combustible.
    </p>`,
};
