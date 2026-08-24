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
      'Sobre una hipoteca de 180.000 € al 3,1 % a 25 años, aportar 100 € más cada mes recorta el plazo y ahorra intereses. Cuánto exactamente y por qué compensa tanto.',
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
      'El combustible no llega a un tercio de lo que cuesta mover un coche. El desglose completo con seguro, mantenimiento y depreciación, y la cifra oficial de Hacienda.',
    h1: '¿Cuánto cuesta un kilómetro en coche?',
    load: () => import('./satelites/gasolina-coste-por-kilometro.js'),
  },
  {
    path: '/gasolina/madrid-valencia',
    herramienta: '/gasolina',
    title: 'Cuánto cuesta ir de Madrid a Valencia en coche',
    description:
      'El coste real de combustible del trayecto Madrid–Valencia por la A-3, con el desglose por persona si viajáis varios y la cuenta del fin de semana completo.',
    h1: '¿Cuánto cuesta ir de Madrid a Valencia en coche?',
    load: () => import('./satelites/gasolina-madrid-valencia.js'),
  },
];

/** Satélites que cuelgan de una herramienta concreta. */
export const satelitesDe = (herramienta) => SATELITES.filter((s) => s.herramienta === herramienta);
