/**
 * Coste de un trayecto en coche y reparto entre ocupantes.
 * Compartido entre la calculadora y las páginas satélite de rutas concretas.
 */
export function viaje({ km, consumo, precio, peajes = 0, ocupantes = 1, idaVuelta = false }) {
  const distancia = Math.max(0, km) * (idaVuelta ? 2 : 1);
  const litros = (distancia * Math.max(0, consumo)) / 100;
  const combustible = litros * Math.max(0, precio);
  const total = combustible + Math.max(0, peajes);
  const personas = Math.max(1, Math.round(ocupantes));
  return {
    km: distancia,
    litros,
    combustible,
    peajes: Math.max(0, peajes),
    total,
    ocupantes: personas,
    porPersona: total / personas,
    porKm: distancia > 0 ? total / distancia : 0,
  };
}
