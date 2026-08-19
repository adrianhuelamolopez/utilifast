/**
 * Hueco publicitario con alto reservado por CSS (nunca provoca CLS).
 *
 * Ni el fichero ni las clases llevan «ad» en el nombre a propósito: los
 * bloqueadores de anuncios filtran por patrones como `adslot` o `ad-slot`, y un
 * chunk con ese nombre se queda sin descargar. Como este módulo lo importan todas
 * las vistas, eso rompía la navegación entera para quien usa bloqueador.
 * Para activar AdSense, sustituye el <div class="hueco-marco"> por el
 * <ins class="adsbygoogle"> manteniendo el contenedor y su clase de tamaño.
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

export function hueco({ id, format = 'leaderboard', label = 'Publicidad', className = '', slot } = {}) {
  const tamano = SIZES[format] || SIZES.leaderboard;
  // El identificador puede venir por parámetro o, lo habitual, del bloque por formato.
  const adSlotId = slot || SITE.adSlots?.[format] || '';

  // Con AdSense configurado se emite el bloque real; sin él, el marcador.
  // En ambos casos el contenedor reserva exactamente el mismo alto (CLS = 0).
  const contenido =
    SITE.adsense && adSlotId
      ? `<ins class="adsbygoogle ${tamano}" style="display:block"
             data-ad-client="${SITE.adsense}" data-ad-slot="${adSlotId}"></ins>`
      : `<div class="hueco-marco ${tamano}"><span aria-hidden="true">${label}</span></div>`;

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
