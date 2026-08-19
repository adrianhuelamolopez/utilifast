import { SITE } from './config.js';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function absolute(path = '/') {
  return SITE.url.replace(/\/$/, '') + path;
}

/**
 * Devuelve el bloque <head> gestionado como string.
 * Lo usan tanto el prerender (build) como el router (navegación en cliente).
 */
export function buildHead(meta) {
  const title = SITE.titleTemplate(meta.title);
  const url = absolute(meta.path);
  const image = absolute(meta.ogImage || SITE.ogImage);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    meta.robots ? `<meta name="robots" content="${esc(meta.robots)}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    SITE.twitter ? `<meta name="twitter:site" content="${esc(SITE.twitter)}" />` : '',
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].filter(Boolean);

  const ld = jsonLd(meta);
  if (ld) tags.push(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
  return tags.join('\n    ');
}

function jsonLd(meta) {
  const url = absolute(meta.path);
  if (meta.path === '/') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: absolute('/'),
      inLanguage: 'es-ES',
      description: meta.description,
    };
  }
  if (meta.path === '/quienes-somos') {
    // Señal de autoría: quién publica el sitio. Cuenta para E-E-A-T, que es
    // determinante en temas de salud y dinero.
    return {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      url,
      name: meta.title,
      description: meta.description,
      inLanguage: 'es-ES',
      publisher: {
        '@type': 'Organization',
        name: SITE.name,
        url: absolute('/'),
        logo: absolute('/favicon.svg'),
        email: SITE.email,
      },
    };
  }
  if (!meta.isTool) return null;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: meta.title,
        url,
        description: meta.description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (navegador web)',
        browserRequirements: 'Requiere JavaScript',
        inLanguage: 'es-ES',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: absolute('/') },
          { '@type': 'ListItem', position: 2, name: meta.navLabel || meta.title, item: url },
        ],
      },
    ],
  };
}

/* ---------- Aplicación en cliente (SPA) ---------- */

const START = 'seo:start';
const END = 'seo:end';

function findMarkers() {
  const walker = document.createTreeWalker(document.head, NodeFilter.SHOW_COMMENT);
  let start = null;
  let end = null;
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim() === START) start = node;
    if (node.nodeValue.trim() === END) end = node;
  }
  return { start, end };
}

/** Sustituye en caliente todo el bloque SEO del <head> al cambiar de vista. */
export function applyMeta(meta) {
  const { start, end } = findMarkers();
  if (!start || !end) return;
  const range = document.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);
  range.deleteContents();
  const tpl = document.createElement('template');
  tpl.innerHTML = buildHead(meta);
  // Los <script> insertados vía innerHTML no se ejecutan; el JSON-LD no lo necesita,
  // pero sí hay que recrearlo para que el DOM quede idéntico al prerender.
  const frag = document.createDocumentFragment();
  tpl.content.childNodes.forEach((n) => {
    if (n.nodeName === 'SCRIPT') {
      const s = document.createElement('script');
      s.type = n.type;
      s.textContent = n.textContent;
      frag.appendChild(s);
    } else {
      frag.appendChild(n.cloneNode(true));
    }
  });
  range.insertNode(frag);
  document.documentElement.lang = 'es';
}
