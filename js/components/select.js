class UISelect extends HTMLElement {
  static formAssociated = true;
  #internals = this.attachInternals();

  connectedCallback() {
    const options = [...this.querySelectorAll("option")].map((o) => o.outerHTML).join("");
    const disabled = this.hasAttribute("disabled");
    this.innerHTML = `
      <div class="select ${disabled ? "select--disabled" : ""} ${this.getAttribute("class") || ""}">
        <select class="select__control"
          name="${this.getAttribute("name") || ""}"
          aria-label="${this.getAttribute("aria-label") || ""}"
          ${disabled ? "disabled" : ""}>${options}</select>
        <span class="select__caret" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>`;
    const select = this.querySelector("select");
    if (this.hasAttribute("value")) select.value = this.getAttribute("value");
    this.#internals.setFormValue(select.value);
    select.addEventListener("change", () => {
      this.#internals.setFormValue(select.value);
      this.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: select.value } }));
    });
  }

  get value() { return this.querySelector("select")?.value; }
}
customElements.define("ui-select", UISelect);
