/** Copia al portapapeles con fallback para navegadores sin Clipboard API o contexto no seguro. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* cae al fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Conecta un botón "copiar" con feedback visual temporal.
 * @param {HTMLElement} btn
 * @param {() => string} getText
 */
export function bindCopyButton(btn, getText, { label = 'Copiar', done = '¡Copiado!' } = {}) {
  if (!btn) return;
  let timer;
  btn.addEventListener('click', async () => {
    const ok = await copyText(getText());
    const target = btn.querySelector('[data-copy-label]') || btn;
    target.textContent = ok ? done : 'Error al copiar';
    btn.classList.toggle('btn-success', ok);
    clearTimeout(timer);
    timer = setTimeout(() => {
      target.textContent = label;
      btn.classList.remove('btn-success');
    }, 1800);
  });
}
