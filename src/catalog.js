import {
  gasolina, neumaticos, cable,
  calorias, macros, imc, rm,
  iva, hipoteca, interes,
  cuenta, fechas, contrasena, whatsapp,
} from './meta.js';

/** Catálogo de herramientas: alimenta el buscador del home y la navegación. */
// Ordenadas por cluster temático: viajes/compartir, salud, dinero, utilidades.
export const TOOLS = [
  gasolina, neumaticos, cable,
  calorias, macros, imc, rm,
  iva, hipoteca, interes,
  cuenta, fechas, contrasena, whatsapp,
];

export const TAGS = [...new Set(TOOLS.flatMap((t) => t.card.tags))].sort();

// Familias temáticas. Ordenan el directorio y agrupan el enlazado interno,
// que es lo que construye autoridad sobre un tema a ojos de un buscador.
export const CLUSTERS = [
  { id: 'motor', label: 'Coche y viajes' },
  { id: 'salud', label: 'Salud y nutrición' },
  { id: 'dinero', label: 'Dinero e impuestos' },
  { id: 'utilidades', label: 'Día a día' },
].filter((c) => TOOLS.some((t) => t.cluster === c.id));

// La cabecera no lleva enlaces a herramientas sueltas: elegir unas pocas de diez
// es arbitrario y hace que el catálogo parezca más pequeño de lo que es.
// Todas viven en el desplegable, que se genera a partir de TOOLS.
export const NAV = [{ path: '/quienes-somos', label: 'Quiénes somos' }];
