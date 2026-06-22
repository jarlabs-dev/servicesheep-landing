class UISpinner extends HTMLElement {
  connectedCallback() {
    this.setAttribute("role", "status");
    if (!this.querySelector(".spinner")) {
      this.innerHTML = `<span class="spinner ${this.getAttribute("class") || ""}"></span>`;
    }
  }
}
customElements.define("ui-spinner", UISpinner);
