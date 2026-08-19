// Configuración global del sitio. Cambia SITE_URL antes de desplegar:
// el prerender la usa para generar canonical, Open Graph y sitemap.xml.
export const SITE = {
  name: 'UtiliFast',
  url: 'https://utilifast.com',
  locale: 'es_ES',
  // Vacío si no hay cuenta: la etiqueta twitter:site no se emite y así no se
  // apunta a un perfil inexistente.
  twitter: '',
  themeColor: '#1b6ff5',
  ogImage: '/og-default.png',
  // Fecha mostrada en las fichas de herramienta ('Actualizado en ...')
  updated: 'agosto de 2026',
  /**
   * Dirección pública de contacto. Conviene que sea del propio dominio y no una
   * personal: un correo con nombre y apellidos publica exactamente los datos que
   * el aviso legal deja fuera. Cloudflare Email Routing la reenvía gratis a tu
   * bandeja de siempre sin crear ninguna cuenta nueva.
   */
  email: 'hola@utilifast.com',
  /**
   * Datos del titular para el aviso legal (art. 10 LSSI-CE).
   *
   * Solo son exigibles si el sitio tiene actividad económica: publicidad, afiliación
   * o cualquier ingreso. Sin monetizar, la web queda fuera del ámbito de ese artículo.
   *
   * Déjalos vacíos y la página legal se publica sin bloques a medias: mantiene
   * privacidad y cookies —que es lo que de verdad se fiscaliza y lo que pide
   * AdSense— y sustituye la identificación por el correo de contacto.
   */
  titular: {
    nombre: '', // 'Nombre y apellidos'
    nif: '', //    '00000000X'
    localidad: '', // 'Localidad (Provincia)' — no hace falta la dirección completa
    // Solo para /quienes-somos, sin efecto legal. Refuerzan la señal de autoría.
    perfil: '', // 'Una línea sobre tu perfil'
    bio: '', //   'Dos o tres frases sobre por qué existe el sitio'
  },
  // --- Monetización -------------------------------------------------------
  // 1) Tu identificador de editor, cuando AdSense apruebe el sitio.
  //    Mientras esté vacío no se carga ningún script externo ni se genera ads.txt.
  adsense: '', // 'ca-pub-XXXXXXXXXXXXXXXX'
  // 2) Identificadores de cada bloque creado en el panel de AdSense (numéricos).
  //    Con estos tres rellenos, todos los huecos del sitio sirven anuncios reales.
  adSlots: {
    leaderboard: '', // 728x90 escritorio / 300x250 móvil
    rectangle: '', //   300x250 dentro del artículo
    halfpage: '', //    300x600 columna lateral
  },
  titleTemplate: (t) => (t ? `${t} · UtiliFast` : 'UtiliFast'),
};
