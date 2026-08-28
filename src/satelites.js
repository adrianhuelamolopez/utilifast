/**
 * Índice de páginas satélite: cada una responde a UNA pregunta concreta que la
 * calculadora resuelve, pero por la que nadie busca literalmente el nombre de la
 * herramienta.
 *
 * Aquí solo van los datos que la navegación, el `<head>` y el sitemap necesitan en
 * todas las páginas. El artículo y el cálculo viven en `src/satelites/`, que se
 * carga bajo demanda igual que las vistas de las herramientas.
 */
export const SATELITES = [
  {
    path: '/hipoteca/amortizar-100-euros-al-mes',
    herramienta: '/hipoteca',
    title: 'Cuánto ahorro amortizando 100 € al mes en la hipoteca',
    description:
      'Sobre una hipoteca de 180.000 € al 3,1 % a 25 años, aportar 100 € más al mes recorta el plazo y ahorra intereses. Cuánto exactamente y por qué compensa.',
    h1: '¿Cuánto ahorro amortizando 100 € al mes?',
    load: () => import('./satelites/hipoteca-amortizar-100.js'),
  },
  {
    path: '/neumaticos/225-45-r17-en-lugar-de-205-55-r16',
    herramienta: '/neumaticos',
    title: '¿Puedo montar 225/45 R17 si llevo 205/55 R16?',
    description:
      'Las dos medidas comparadas contra los cuatro criterios del Manual ITV: diámetro, carga, velocidad y llanta. Con el efecto real en el velocímetro.',
    h1: '¿Puedo montar 225/45 R17 llevando 205/55 R16?',
    load: () => import('./satelites/neumaticos-225-45-r17.js'),
  },
  {
    path: '/hipoteca/amortizar-o-invertir',
    herramienta: '/hipoteca',
    title: '¿Amortizar hipoteca o invertir? La cuenta con números',
    description:
      'Amortizar renta exactamente el tipo de tu hipoteca. Comparamos las dos opciones al mismo plazo y con la casa pagada, y sale un punto de equilibrio concreto.',
    h1: '¿Amortizar la hipoteca o invertir ese dinero?',
    load: () => import('./satelites/hipoteca-amortizar-o-invertir.js'),
  },
  {
    path: '/gasolina/coste-por-kilometro',
    herramienta: '/gasolina',
    title: 'Cuánto cuesta de verdad un kilómetro en coche',
    description:
      'El combustible no llega a un tercio de lo que cuesta mover un coche. Desglose completo con seguro, mantenimiento y depreciación, y la cifra de Hacienda.',
    h1: '¿Cuánto cuesta un kilómetro en coche?',
    load: () => import('./satelites/gasolina-coste-por-kilometro.js'),
  },
  {
    path: '/gasolina/madrid-valencia',
    herramienta: '/gasolina',
    // Trece de las catorce consultas que traen a esta página preguntan la
    // distancia o el tiempo, no el precio. El título los lleva delante.
    title: 'Madrid a Valencia en coche: km, tiempo y coste',
    description:
      'Los 360 km de la A-3 se hacen en unas 3 h 45 min y sin un solo peaje. Cuánta gasolina gasta el viaje, cuánto sale por persona y qué cuesta ir y volver.',
    h1: 'De Madrid a Valencia en coche: distancia, tiempo y coste',
    load: () => import('./satelites/gasolina-madrid-valencia.js'),
  },
  {
    path: '/gasolina/madrid-barcelona',
    herramienta: '/gasolina',
    title: 'Madrid a Barcelona en coche: km, tiempo y coste',
    description:
      'Son 620 km por la A-2 y unas 6 h 15 min al volante. Desde 2021 no tiene peajes. Cuánta gasolina gasta, cuánto sale por persona y cuándo gana el AVE.',
    h1: 'De Madrid a Barcelona en coche: distancia, tiempo y coste',
    load: () => import('./satelites/gasolina-madrid-barcelona.js'),
  },
  {
    path: '/gasolina/madrid-sevilla',
    herramienta: '/gasolina',
    title: 'Madrid a Sevilla en coche: km, tiempo y coste',
    description:
      'Los 530 km de la A-4 se hacen en unas 5 h 30 min y sin peajes. Cuánta gasolina gasta, por qué Despeñaperros sube el consumo y cuánto sale por persona.',
    h1: 'De Madrid a Sevilla en coche: distancia, tiempo y coste',
    load: () => import('./satelites/gasolina-madrid-sevilla.js'),
  },
];

/** Satélites que cuelgan de una herramienta concreta. */
export const satelitesDe = (herramienta) => SATELITES.filter((s) => s.herramienta === herramienta);
