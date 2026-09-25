// Custom dropdown: a combobox button + an in-flow listbox menu (a native
// <select> can't render the styled menu card). Options come from child <option>s.
const CARET_DOWN = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>';
const CHECK = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';

class UISelect extends HTMLElement {
  static formAssociated = true;
  #internals = this.attachInternals();
  #options = [];
  #value = "";
  #active = -1;
  #id = `sel-${Math.random().toString(36).slice(2, 8)}`;
  #control; #menu; #valueEl;
  // Tapping anywhere outside the field closes the menu.
  #onOutside = (e) => { if (this.open && !this.contains(e.target)) this.#setOpen(false); };

  connectedCallback() {
    document.addEventListener("pointerdown", this.#onOutside);
    if (this.#control) return; // already rendered (element moved in the DOM)
    this.#options = [...this.querySelectorAll("option")]
      .filter((o) => o.value !== "")
      .map((o) => ({ value: o.value, label: o.textContent.trim() }));

    const id = this.#id;
    const label = this.getAttribute("label");
    const helper = this.getAttribute("helper-text");
    const required = this.hasAttribute("required");
    const disabled = this.hasAttribute("disabled");

    this.innerHTML = `
      <div class="select ${disabled ? "select--disabled" : ""} ${this.getAttribute("class") || ""}">
        ${label ? `<span class="select__label" id="${id}-label">${label}${required ? '<span class="select__required" aria-hidden="true">*</span>' : ""}</span>` : ""}
        <button type="button" class="select__control" id="${id}" role="combobox"
          aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-menu"
          ${label ? `aria-labelledby="${id}-label"` : `aria-label="${this.getAttribute("aria-label") || ""}"`}
          ${helper ? `aria-describedby="${id}-helper"` : ""}
          ${required ? 'aria-required="true"' : ""}
          ${disabled ? "disabled" : ""}>
          <span class="select__value"></span>
          <span class="select__caret">${CARET_DOWN}</span>
        </button>
        <ul class="select__menu" id="${id}-menu" role="listbox" tabindex="-1" hidden
          ${label ? `aria-labelledby="${id}-label"` : ""}>
          ${this.#options.map((o, i) => `<li class="select__option" id="${id}-opt-${i}" role="option" aria-selected="false" data-index="${i}"><span class="select__option-label">${o.label}</span><span class="select__check">${CHECK}</span></li>`).join("")}
        </ul>
        ${helper ? `<span class="select__helper" id="${id}-helper">${helper}</span>` : ""}
      </div>`;

    this.#control = this.querySelector(".select__control");
    this.#menu = this.querySelector(".select__menu");
    this.#valueEl = this.querySelector(".select__value");
    this.#setValue(this.getAttribute("value") || "", false);

    this.#control.addEventListener("click", () => this.#setOpen(!this.open));
    this.#control.addEventListener("keydown", (e) => this.#onKeydown(e));
    // Keep focus on the combobox while clicking an option.
    this.#menu.addEventListener("mousedown", (e) => e.preventDefault());
    this.#menu.addEventListener("click", (e) => {
      const item = e.target.closest(".select__option");
      if (!item) return;
      this.#setValue(this.#options[item.dataset.index].value, true);
      this.#setOpen(false);
    });
    this.#menu.addEventListener("mousemove", (e) => {
      const item = e.target.closest(".select__option");
      if (item) this.#setActive(Number(item.dataset.index));
    });
  }

  disconnectedCallback() {
    document.removeEventListener("pointerdown", this.#onOutside);
  }

  get open() { return this.#control?.getAttribute("aria-expanded") === "true"; }
  get value() { return this.#value; }
  set value(v) { this.#setValue(v ?? "", false); }

  #setOpen(open) {
    if (this.#control.disabled) return;
    this.#control.setAttribute("aria-expanded", String(open));
    this.#menu.hidden = !open;
    if (open) {
      const selected = this.#options.findIndex((o) => o.value === this.#value);
      this.#setActive(selected >= 0 ? selected : 0);
    } else {
      this.#setActive(-1);
    }
  }

  #setActive(index) {
    this.#active = index;
    this.#menu.querySelectorAll(".select__option").forEach((el, i) =>
      el.classList.toggle("select__option--active", i === index));
    if (index >= 0) this.#control.setAttribute("aria-activedescendant", `${this.#id}-opt-${index}`);
    else this.#control.removeAttribute("aria-activedescendant");
  }

  #setValue(value, emit) {
    const option = this.#options.find((o) => o.value === value);
    this.#value = option ? option.value : "";
    this.#valueEl.textContent = option ? option.label : (this.getAttribute("placeholder") || "");
    this.#valueEl.classList.toggle("select__value--placeholder", !option);
    this.#menu.querySelectorAll(".select__option").forEach((el, i) =>
      el.setAttribute("aria-selected", String(this.#options[i].value === this.#value)));
    this.#internals.setFormValue(this.#value);
    if (emit) this.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: this.#value } }));
  }

  #onKeydown(e) {
    const last = this.#options.length - 1;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!this.open) { this.#setOpen(true); return; }
        this.#setActive(e.key === "ArrowDown" ? Math.min(this.#active + 1, last) : Math.max(this.#active - 1, 0));
        break;
      case "Home":
      case "End":
        if (!this.open) return;
        e.preventDefault();
        this.#setActive(e.key === "Home" ? 0 : last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!this.open) { this.#setOpen(true); return; }
        if (this.#active >= 0) this.#setValue(this.#options[this.#active].value, true);
        this.#setOpen(false);
        break;
      case "Escape":
        if (this.open) { e.preventDefault(); this.#setOpen(false); }
        break;
      case "Tab":
        if (this.open) this.#setOpen(false);
        break;
    }
  }
}
customElements.define("ui-select", UISelect);
