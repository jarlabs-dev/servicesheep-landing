// button.js
class UIButton extends HTMLElement {
  static observedAttributes = ["variant", "size", "loading", "disabled", "href", "type", "full-width"];

  connectedCallback() { this.#render(); }
  attributeChangedCallback() { if (this.isConnected) this.#render(); }

  #render() {
    const variant = this.getAttribute("variant") || "primary";
    const size = this.getAttribute("size") || "medium";
    const loading = this.hasAttribute("loading");
    const disabled = this.hasAttribute("disabled") || loading;
    const href = this.getAttribute("href");
    const tag = href ? "a" : "button";

    const classes = [
      "button",
      `button--${variant}`,
      `button--${size}`,
      loading && "button--loading",
      this.hasAttribute("full-width") && "button--full-width",
      this.getAttribute("class"), // caller overrides win, appended last
    ].filter(Boolean).join(" ");

    const leading = this.querySelector('[slot="leading"]')?.outerHTML ?? "";
    const trailing = this.querySelector('[slot="trailing"]')?.outerHTML ?? "";
    const label = this.dataset.label ?? this.textContent.trim();

    this.innerHTML = `
      <${tag} class="${classes}"
        ${href ? `href="${href}"` : `type="${this.getAttribute("type") || "button"}"`}
        ${disabled ? (href ? 'aria-disabled="true" tabindex="-1"' : "disabled") : ""}>
        ${leading ? `<span class="button__icon">${leading}</span>` : ""}
        <span class="button__label">${label}</span>
        ${trailing ? `<span class="button__icon">${trailing}</span>` : ""}
        ${loading ? '<ui-spinner class="button__spinner" aria-label="Loading"></ui-spinner>' : ""}
      </${tag}>`;
  }
}
customElements.define("ui-button", UIButton);
