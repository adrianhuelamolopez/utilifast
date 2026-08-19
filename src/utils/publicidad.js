import { SITE } from '../config.js';
import { isAllowed, onConsentChange } from './consent.js';

/**
 * Carga de Google AdSense supeditada al consentimiento.
 *
 * El script NO se descarga hasta que el usuario acepta la categoría «publicitarias».
 * Esto es lo que exige el art. 22.2 LSSI-CE: sin consentimiento previo no puede
 * instalarse nada que no sea estrictamente necesario.
 *
 * Para activarlo:
 *   1. Date de alta en AdSense y espera la aprobación del sitio.
 *   2. Copia tu identificador (ca-pub-XXXXXXXXXXXXXXXX) en SITE.adsense (src/config.js).
 *   3. Pon ese mismo identificador en public/ads.txt.
 *   4. Crea los bloques en AdSense y pega sus data-hueco-caja en hueco().
 *
 * Mientras SITE.adsense esté vacío no ocurre nada: los huecos siguen reservados
 * y la página no hace ni una petición externa.
 */

let cargado = false;

function inyectarScript() {
  if (cargado || !SITE.adsense) return;
  cargado = true;

  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsense}`;
  document.head.appendChild(s);
}

/** Pide a AdSense que rellene los bloques presentes en la página actual. */
export function refrescarAnuncios(root = document) {
  if (!cargado || !window.adsbygoogle) return;
  root.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').forEach(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* bloqueador de anuncios activo: no es un error que debamos mostrar */
    }
  });
}

/**
 * Arranca el sistema. Se llama una vez desde main.js.
 * Si el usuario ya había aceptado, carga de inmediato; si acepta después, reacciona.
 */
export function iniciarAnuncios() {
  if (!SITE.adsense) return;
  if (isAllowed('publicitarias')) inyectarScript();
  onConsentChange((c) => {
    if (c.publicitarias) inyectarScript();
  });
}
