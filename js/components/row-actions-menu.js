class UIRowActionsMenu extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="row-actions-menu">
        <button class="row-actions-menu__trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Row actions">⋮</button>
      </div>`;
    this.querySelector(".row-actions-menu__trigger").addEventListener("click", () => this.#toggle());
  }

  #toggle() {
    if (this.querySelector(".row-actions-menu__panel")) return this.#close();
    const root = this.querySelector(".row-actions-menu");
    const trigger = this.querySelector(".row-actions-menu__trigger");
    trigger.setAttribute("aria-expanded", "true");
    root.insertAdjacentHTML("beforeend", `
      <div class="row-actions-menu__backdrop"></div>
      <div class="row-actions-menu__panel" role="menu">
        <button class="row-actions-menu__item" role="menuitem" data-action="edit">Edit</button>
        <button class="row-actions-menu__item row-actions-menu__item--destructive" role="menuitem" data-action="delete">Delete</button>
      </div>`);
    root.querySelector(".row-actions-menu__backdrop").addEventListener("click", () => this.#close());
    root.querySelectorAll("[data-action]").forEach((btn) =>
      btn.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent(`ui-${btn.dataset.action}`, { bubbles: true }));
        this.#close();
      }));
  }

  #close() {
    this.querySelector(".row-actions-menu__backdrop")?.remove();
    this.querySelector(".row-actions-menu__panel")?.remove();
    this.querySelector(".row-actions-menu__trigger")?.setAttribute("aria-expanded", "false");
  }
}
customElements.define("ui-row-actions-menu", UIRowActionsMenu);
