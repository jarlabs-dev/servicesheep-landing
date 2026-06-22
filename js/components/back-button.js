class UIBackButton extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute("title");
    this.innerHTML = `
      <button class="back-button" type="button" aria-label="${title || "Back"}">
        <span class="back-button__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        ${title ? `<span class="back-button__title">${title}</span>` : ""}
      </button>`;
    this.querySelector("button").addEventListener("click", () => {
      const href = this.dataset.href;
      const evt = new CustomEvent("ui-back", { bubbles: true, cancelable: true });
      if (this.dispatchEvent(evt) && !evt.defaultPrevented) {
        if (href) location.assign(href); else history.back();
      }
    });
  }
}
customElements.define("ui-back-button", UIBackButton);
