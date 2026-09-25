class UITextField extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["label", "error", "helper-text", "maxlength", "counter", "required", "private", "type", "placeholder", "value", "autocomplete"];

  #internals = this.attachInternals();

  connectedCallback() { this.#render(); }
  attributeChangedCallback() { if (this.isConnected) this.#render(); }

  get value() { return this.querySelector(".text-field__input")?.value ?? ""; }
  set value(v) { const i = this.querySelector(".text-field__input"); if (i) { i.value = v; this.#internals.setFormValue(v); } }

  // The host submits the value (form-associated), so the inner <input> has no
  // `name` — otherwise the form would submit the field twice.
  #render() {
    const id = this.id || `tf-${Math.random().toString(36).slice(2, 8)}`;
    const error = this.getAttribute("error");
    const helper = this.getAttribute("helper-text");
    const max = this.getAttribute("maxlength");
    const counter = max && this.hasAttribute("counter"); // maxlength alone just caps input
    const message = error || helper;
    const prefix = this.querySelector('[slot="prefix"]')?.outerHTML ?? "";
    const suffix = this.querySelector('[slot="suffix"]');

    this.innerHTML = `
      <div class="text-field ${error ? "text-field--error" : ""} ${this.getAttribute("class") || ""}">
        <label class="text-field__label" for="${id}">
          ${this.getAttribute("label") ?? ""}
          ${this.hasAttribute("required") ? '<span class="text-field__required" aria-hidden="true">*</span>' : ""}
          ${this.hasAttribute("private") ? '<span class="text-field__lock" aria-hidden="true">🔒</span>' : ""}
        </label>
        <div class="text-field__control">
          ${prefix ? `<span class="text-field__icon">${prefix}</span>` : ""}
          <input id="${id}" class="text-field__input"
            type="${this.getAttribute("type") || "text"}"
            placeholder="${this.getAttribute("placeholder") || ""}"
            value="${this.getAttribute("value") || ""}"
            ${max ? `maxlength="${max}"` : ""}
            ${this.hasAttribute("autocomplete") ? `autocomplete="${this.getAttribute("autocomplete")}"` : ""}
            ${this.hasAttribute("required") ? 'required aria-required="true"' : ""}
            ${message ? `aria-describedby="${id}-helper"` : ""}
            ${error ? 'aria-invalid="true"' : ""} />
          ${suffix ? `<${suffix.dataset.button ? "button" : "span"} class="text-field__icon ${suffix.dataset.button ? "text-field__icon--button" : ""}" data-suffix>${suffix.innerHTML}</${suffix.dataset.button ? "button" : "span"}>` : ""}
        </div>
        ${message || counter ? `<div class="text-field__meta">
          ${message ? `<span class="text-field__helper" id="${id}-helper">${message}</span>` : "<span></span>"}
          ${counter ? `<span class="text-field__counter">0/${max}</span>` : ""}
        </div>` : ""}
      </div>`;

    const input = this.querySelector(".text-field__input");
    const counterEl = this.querySelector(".text-field__counter");
    input.addEventListener("input", () => {
      this.#internals.setFormValue(input.value);
      if (counterEl) counterEl.textContent = `${input.value.length}/${max}`;
      this.dispatchEvent(new CustomEvent("input", { bubbles: true }));
    });
    this.querySelector("[data-suffix]")?.addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("ui-suffix-click", { bubbles: true })));
  }
}
customElements.define("ui-text-field", UITextField);
