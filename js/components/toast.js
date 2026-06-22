// toast.js — registers <ui-toast-host> and exports the `toast` API
const ICONS = {
  success: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error:   '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  warning: '<svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info:    '<svg viewBox="0 0 24 24"><path d="M12 16v-5m0-3h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};
const MAX_VISIBLE = 3;

class UIToastHost extends HTMLElement {
  connectedCallback() { this.classList.add("toast-host"); this.setAttribute("aria-live", "polite"); }
}
customElements.define("ui-toast-host", UIToastHost);

function host() {
  let el = document.querySelector("ui-toast-host");
  if (!el) { el = document.createElement("ui-toast-host"); document.body.appendChild(el); }
  return el;
}

export const toast = {
  show(variant, { title, message, duration = 2000 } = {}) {
    const root = host();
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const card = document.createElement("div");
    card.className = `toast toast--${variant}`;
    card.dataset.id = id;
    card.setAttribute("role", "status");
    card.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${ICONS[variant] || ICONS.info}</span>
      <div class="toast__body">
        <span class="toast__title">${title}</span>
        ${message ? `<span class="toast__message">${message}</span>` : ""}
      </div>`;
    root.appendChild(card);

    // Evict oldest beyond the visible cap.
    while (root.children.length > MAX_VISIBLE) this.dismiss(root.firstElementChild.dataset.id);

    setTimeout(() => this.dismiss(id), duration);
    return id;
  },
  dismiss(id) {
    const card = host().querySelector(`[data-id="${id}"]`);
    if (!card) return;
    card.classList.add("toast--leaving");
    card.addEventListener("animationend", () => card.remove(), { once: true });
  },
  success(title, message) { return this.show("success", { title, message }); },
  error(title, message)   { return this.show("error", { title, message }); },
  warning(title, message) { return this.show("warning", { title, message }); },
  info(title, message)    { return this.show("info", { title, message }); },
};
