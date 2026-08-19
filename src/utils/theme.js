const KEY = 'utilifast:theme';

export function storedTheme() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function currentTheme() {
  return document.documentElement.dataset.theme || systemTheme();
}

export function applyTheme(theme, { persist = true } = {}) {
  const root = document.documentElement;
  // Congela las transiciones durante el cambio: si no, cada color de la página
  // se anima a la vez y el conmutador se ve sucio.
  root.classList.add('theme-switching');
  root.dataset.theme = theme;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove('theme-switching'));
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#080b14' : '#ffffff'
  );
  if (persist) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* modo privado: el tema no persiste, pero la sesión funciona */
    }
  }
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

/** Si el usuario no ha elegido tema, sigue al sistema en caliente. */
export function watchSystemTheme() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e) => {
    if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light', { persist: false });
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
