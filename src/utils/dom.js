export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escucha eventos y devuelve una función para desconectarlos todos (limpieza de vista). */
export function listeners() {
  const bag = [];
  return {
    on(target, type, handler, opts) {
      if (!target) return;
      target.addEventListener(type, handler, opts);
      bag.push(() => target.removeEventListener(type, handler, opts));
    },
    destroy() {
      bag.forEach((off) => off());
      bag.length = 0;
    },
  };
}

/** Debounce sencillo para inputs de búsqueda. */
export function debounce(fn, ms = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
