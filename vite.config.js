import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { defineConfig } from 'vite';

const distDir = resolve(process.cwd(), 'dist');

/**
 * `vite preview` usa un fallback SPA que devolvería index.html para /macros
 * antes de encontrar dist/macros/index.html. Este plugin reproduce en local el
 * comportamiento real de Cloudflare Pages y Vercel: sirve el HTML prerenderizado
 * de cada ruta y responde 404.html con código 404 en el resto.
 */
function previewPrerendered() {
  return {
    name: 'utilifast:preview-prerendered',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [pathname, query = ''] = req.url.split('?');
        if (pathname === '/' || extname(pathname)) return next();
        const clean = pathname.replace(/\/$/, '');
        if (existsSync(join(distDir, clean, 'index.html'))) {
          req.url = `${clean}/index.html${query ? '?' + query : ''}`;
        } else if (existsSync(join(distDir, '404.html'))) {
          req.url = `/404.html${query ? '?' + query : ''}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  // 'spa' => el dev server hace fallback a index.html en rutas limpias (/gasolina, /macros...)
  appType: 'spa',
  plugins: [previewPrerendered()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // qr-creator sale a un chunk propio: solo se descarga al entrar en /whatsapp
        manualChunks(id) {
          if (id.includes('qr-creator')) return 'qr';
        },
      },
    },
  },
  server: { port: 5173, open: true },
  preview: { port: 4173 },
});
