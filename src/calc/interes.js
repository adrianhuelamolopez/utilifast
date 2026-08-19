/**
 * Proyección de interés compuesto con aportaciones periódicas.
 *
 * Se simula periodo a periodo en vez de aplicar la fórmula cerrada: da el mismo
 * resultado y de paso produce el desglose año a año que necesita la tabla, sin
 * arrastrar errores de redondeo entre ambos caminos.
 */

export const PERIODOS = { mensual: 12, trimestral: 4, anual: 1 };

export function proyectar({
  inicial = 0,
  aportacion = 0,
  periodicidad = 'mensual',
  tasaAnual = 0,
  anios = 10,
}) {
  const porAnio = PERIODOS[periodicidad] || 12;
  const total = Math.max(0, Math.round(anios * porAnio));
  const r = tasaAnual / 100 / porAnio;

  let saldo = Math.max(0, inicial);
  let aportado = Math.max(0, inicial);
  const serie = [];

  for (let i = 1; i <= total; i++) {
    saldo = saldo * (1 + r) + Math.max(0, aportacion);
    aportado += Math.max(0, aportacion);

    if (i % porAnio === 0 || i === total) {
      serie.push({
        anio: Math.ceil(i / porAnio),
        saldo,
        aportado,
        intereses: saldo - aportado,
      });
    }
  }

  return {
    final: saldo,
    aportado,
    intereses: saldo - aportado,
    // Cuánto del capital final procede de los intereses, no del ahorro
    pesoIntereses: saldo > 0 ? ((saldo - aportado) / saldo) * 100 : 0,
    serie,
  };
}

/**
 * Regla del 72: años aproximados en duplicar el capital a un interés dado.
 * Es una aproximación clásica, útil para hacerse una idea sin calculadora.
 */
export const aniosEnDuplicar = (tasaAnual) => (tasaAnual > 0 ? 72 / tasaAnual : Infinity);
