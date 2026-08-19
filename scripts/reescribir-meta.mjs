/**
 * Ajusta títulos y descripciones a lo que Google llega a mostrar.
 *
 * Un título de más de ~60 caracteres se corta en los resultados y pierde las
 * palabras del final; una descripción de más de ~158 desperdicia lo que sobra.
 * Se ejecuta una sola vez: después, edita src/meta.js directamente.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Títulos <= 50 (con el sufijo « · UtiliFast» quedan por debajo de 63)
// y descripciones entre 120 y 158.
const NUEVOS = {
  home: [
    'Calculadoras online gratis y sin registro',
    'Calculadoras que funcionan al instante en tu navegador: hipoteca, IVA, calorías, IMC, gasolina compartida y más. Sin registro y sin enviar datos.',
  ],
  gasolina: [
    'Calculadora de gasolina y gastos compartidos',
    'Calcula el coste real de gasolina de un viaje y divídelo entre los ocupantes. Kilómetros, consumo, precio y peajes, con resumen listo para WhatsApp.',
  ],
  neumaticos: [
    'Equivalencia de neumáticos para la ITV',
    'Comprueba si una medida es equivalente según los cuatro criterios del Manual ITV: diámetro con tolerancia del 3 %, índice de carga y categoría de velocidad.',
  ],
  cable: [
    'Calculadora de sección de cable para 12V',
    'Calcula la sección en mm² y su equivalencia AWG según amperios y longitud. Con caída de tensión, intensidad máxima admisible y el fusible que corresponde.',
  ],
  calorias: [
    'Calculadora de calorías diarias',
    'Calcula tu metabolismo basal con la fórmula Mifflin-St Jeor, tu gasto diario según actividad y las calorías para perder, mantener o ganar peso.',
  ],
  macros: [
    'Calculadora de macros por comida',
    'Calcula tus calorías diarias y reparte proteínas, carbohidratos y grasas entre 3, 4 o 5 comidas, con los gramos exactos de cada toma en una tabla editable.',
  ],
  imc: [
    'Calculadora de IMC y peso saludable',
    'Calcula tu índice de masa corporal con los rangos de la OMS, tu peso saludable según la altura y complétalo con el perímetro de cintura.',
  ],
  rm: [
    'Calculadora de 1RM con cinco fórmulas',
    'Estima tu repetición máxima a partir del peso y las repeticiones que has hecho, comparando Epley, Brzycki, Lombardi, O’Conner y Lander, con tabla de series.',
  ],
  iva: [
    'Calculadora de IVA e IRPF para facturas',
    'Añade el IVA a una base o quítalo de un precio final con el 21 %, 10 % o 4 %. Incluye recargo de equivalencia y retención de IRPF para autónomos.',
  ],
  hipoteca: [
    'Calculadora de hipoteca y amortización',
    'Calcula la cuota de tu hipoteca, los intereses totales y el cuadro año a año. Simula amortización anticipada y descubre cuánto ahorras y cuánto plazo quitas.',
  ],
  interes: [
    'Calculadora de interés compuesto',
    'Proyecta cuánto crece tu ahorro: capital inicial, aportación periódica, rentabilidad y plazo. Con el desglose anual y qué parte del total ponen los intereses.',
  ],
  cuenta: [
    'Dividir la cuenta del restaurante',
    'Reparte la cuenta entre los comensales, añade propina y calcula cuánto pone cada uno. Con reparto desigual si no todos habéis consumido lo mismo.',
  ],
  fechas: [
    'Días entre fechas, edad y días laborables',
    'Calcula cuántos días hay entre dos fechas, incluidos los laborables, suma o resta plazos a partir de un día y averigua tu edad exacta en años, meses y días.',
  ],
  contrasena: [
    'Generador de contraseñas seguras',
    'Genera contraseñas aleatorias con el motor criptográfico de tu navegador. Elige longitud y tipos de carácter y comprueba su entropía real en bits.',
  ],
  whatsapp: [
    'Generador de enlaces y QR de WhatsApp',
    'Crea un enlace wa.me con mensaje predefinido y su código QR descargable en PNG. Sin guardar tu número y sin que nadie tenga que añadirte a contactos.',
  ],
  quienesSomos: [
    'Quiénes somos y cómo trabajamos',
    'Quién está detrás de UtiliFast, de dónde salen las fórmulas de cada calculadora y por qué todo el cálculo ocurre dentro de tu propio navegador.',
  ],
  legal: [
    'Aviso legal, privacidad y cookies',
    'Aviso legal, política de privacidad y política de cookies de UtiliFast, conforme al RGPD y a la LSSI-CE. Los cálculos se ejecutan en local, sin servidores.',
  ],
};

const mod = await import(pathToFileURL(resolve('src/meta.js')).href);
const entradas = Object.keys(mod).map((k) => [k, { ...mod[k] }]);

for (const [clave, meta] of entradas) {
  const nuevo = NUEVOS[clave];
  if (!nuevo) continue;
  const [titulo, desc] = nuevo;
  if (titulo.length > 50) throw new Error(`título largo en ${clave}: ${titulo.length}`);
  if (desc.length > 158 || desc.length < 120) throw new Error(`descripción fuera de rango en ${clave}: ${desc.length}`);
  meta.title = titulo;
  meta.description = desc;
}

const cabecera = readFileSync('src/meta.js', 'utf8').split('*/')[0] + '*/\n\n';
const cuerpo = entradas
  .map(([clave, meta]) => `export const ${clave} = ${JSON.stringify(meta, null, 2)};`)
  .join('\n\n');

writeFileSync('src/meta.js', cabecera + cuerpo + '\n', 'utf8');
console.log(`Reescritos ${Object.keys(NUEVOS).length} metadatos de ${entradas.length}.`);
