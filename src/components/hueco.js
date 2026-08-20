/**
 * Hueco publicitario con alto reservado por CSS (nunca provoca CLS).
 *
 * Ni el fichero ni las clases llevan «ad» en el nombre a propósito: los
 * bloqueadores de anuncios filtran por patrones como `adslot` o `ad-slot`, y un
 * chunk con ese nombre se queda sin descargar. Como este módulo lo importan todas
 * las vistas, eso rompía la navegación entera para quien usa bloqueador.
 *
 * **Sin AdSense configurado no se emite nada.** Un recuadro vacío con la palabra
 * «Publicidad» no aporta al usuario, delata que el sitio está a medio montar y es
 * justo la señal de «página en construcción» que penaliza la revisión de AdSense.
 * Los altos siguen definidos en el CSS: en cuanto `SITE.adsense` y `SITE.adSlots`
 * tengan valor, los bloques aparecen con su espacio ya reservado y CLS = 0.
 * Para ver la maqueta con los huecos durante el desarrollo, pon
 * `SITE.huecosVisibles = true` en `src/config.js`.
 *
 * Formatos:
 *  - leaderboard : 300x250 móvil  -> 728x90  desktop  (cabecera / pie de artículo)
 *  - rectangle   : 300x250 fijo                        (in-article)
 *  - halfpage    : 300x250 móvil  -> 300x600 desktop   (columna lateral)
 */
import { SITE } from '../config.js';

const SIZES = {
  leaderboard: 'hueco-banner',
  rectangle: 'hueco-cuadro',
  halfpage: 'hueco-columna',
};

/** Identificador del bloque de AdSense para un formato, o cadena vacía. */
const idDeBloque = (format) => (SITE.adsense && SITE.adSlots?.[format]) || '';

/**
 * ¿Va a pintar algo `hueco()` con este formato?
 *
 * Las vistas que envuelven un hueco en su propia columna o rejilla lo consultan
 * para no dejar un hueco en el layout cuando no se emite nada.
 */
export const hayHueco = (format = 'leaderboard') =>
  Boolean(idDeBloque(format)) || SITE.huecosVisibles === true;

export function hueco({ id, format = 'leaderboard', label = 'Publicidad', className = '', slot } = {}) {
  const tamano = SIZES[format] || SIZES.leaderboard;
  // El identificador puede venir por parámetro o, lo habitual, del bloque por formato.
  const adSlotId = slot || idDeBloque(format);

  let contenido;
  if (adSlotId) {
    contenido = `<ins class="adsbygoogle ${tamano}" style="display:block"
             data-ad-client="${SITE.adsense}" data-ad-slot="${adSlotId}"></ins>`;
  } else if (SITE.huecosVisibles) {
    contenido = `<div class="hueco-marco ${tamano}"><span aria-hidden="true">${label}</span></div>`;
  } else {
    return '';
  }

  return `
    <aside
      ${id ? `id="${id}"` : ''}
      class="hueco-caja ${className}"
      role="complementary"
      aria-label="Publicidad"
      data-formato="${format}"
    >
      ${contenido}
    </aside>`;
}
