import './style.css';
import { startRouter } from './router.js';
import { mountCookieBanner } from './components/cookieBanner.js';
import { iniciarAnuncios } from './utils/publicidad.js';

const root = document.getElementById('app');
if (root) startRouter(root);

// Fuera de #app: el router no lo destruye al cambiar de vista.
mountCookieBanner();

// No hace nada hasta que SITE.adsense tenga valor Y el usuario acepte publicidad.
iniciarAnuncios();
