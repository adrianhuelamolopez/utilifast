/**
 * Amortización de préstamos por el sistema francés.
 *
 * Vive aparte de la vista porque lo usan dos sitios: la calculadora de /hipoteca y
 * las páginas satélite que responden a una pregunta concreta. Compartir la función
 * es lo que garantiza que el número del artículo nunca contradiga al de la herramienta.
 */

/** Cuota mensual constante. Con interés cero es un simple reparto del capital. */
export function cuotaMensual(capital, tasaAnual, anios) {
  const i = tasaAnual / 100 / 12;
  const n = Math.round(anios * 12);
  if (capital <= 0 || n <= 0) return 0;
  return i === 0 ? capital / n : (capital * i) / (1 - Math.pow(1 + i, -n));
}

/**
 * Simula el préstamo cuota a cuota, opcionalmente con una aportación extra
 * mensual destinada a reducir plazo.
 *
 * @returns {{cuota:number, meses:number, intereses:number, total:number, anios:Array}|null}
 */
export function simular(capital, tasaAnual, anios, extra = 0) {
  const i = tasaAnual / 100 / 12;
  const n = Math.round(anios * 12);
  if (capital <= 0 || n <= 0) return null;

  const cuota = cuotaMensual(capital, tasaAnual, anios);

  let saldo = capital;
  let interesesTotal = 0;
  let meses = 0;
  const resumenAnual = [];
  let acumCapital = 0;
  let acumIntereses = 0;

  // Tope de seguridad: nunca más del plazo original.
  while (saldo > 0.005 && meses < n) {
    const interesMes = saldo * i;
    let capitalMes = cuota - interesMes + extra;
    if (capitalMes > saldo) capitalMes = saldo;

    saldo -= capitalMes;
    interesesTotal += interesMes;
    acumCapital += capitalMes;
    acumIntereses += interesMes;
    meses += 1;

    if (meses % 12 === 0 || saldo <= 0.005) {
      resumenAnual.push({
        anio: Math.ceil(meses / 12),
        cuotas: meses,
        capital: acumCapital,
        intereses: acumIntereses,
        pendiente: Math.max(0, saldo),
      });
      acumCapital = 0;
      acumIntereses = 0;
    }
  }

  return { cuota, meses, intereses: interesesTotal, total: capital + interesesTotal, anios: resumenAnual };
}

/** Años y meses a texto legible: 256 -> "21 años y 4 meses". */
export function plazoTexto(meses) {
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  return `${a} ${a === 1 ? 'año' : 'años'}${m ? ` y ${m} ${m === 1 ? 'mes' : 'meses'}` : ''}`;
}
