// site-header.js — opens/closes the mobile nav menu (below 1024px).
// Loaded by every page with the site header (index.html, contact/). Also closes the menu when a nav link is tapped,
// and highlights the nav link whose section is currently in view.
const header = document.querySelector(".site-header");
const toggle = header?.querySelector(".site-header__toggle");

if (header && toggle) {
  const isOpen = () => header.classList.contains("site-header--open");

  const setOpen = (open) => {
    header.classList.toggle("site-header--open", open);
    document.documentElement.classList.toggle("has-site-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!isOpen()));
  header.querySelector(".site-header__scrim")?.addEventListener("click", () => setOpen(false));

  // Tapping a nav link (e.g. Admin Work → #admin-work) closes the menu. The open
  // menu locks page scroll, so it must close before the link's jump can scroll.
  header.querySelector(".site-nav")?.addEventListener("click", (event) => {
    if (event.target.closest("a") && isOpen()) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Growing past the breakpoint hides the mobile menu, so reset its state.
  matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

// Scroll-aware active link: Admin Work / Field Work turn active while their
// section crosses a line 40% down the viewport. Links with href="#" are skipped.
const sectionLinks = new Map();
document.querySelectorAll('.site-nav__link[href^="#"]').forEach((link) => {
  const id = link.getAttribute("href").slice(1);
  const section = id && document.getElementById(id);
  if (section) sectionLinks.set(section, link);
});

if (sectionLinks.size) {
  const setActive = (activeLink) => {
    sectionLinks.forEach((link) => {
      const active = link === activeLink;
      link.classList.toggle("site-nav__link--active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const inView = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) inView.add(entry.target);
      else inView.delete(entry.target);
    });
    const [current] = inView;
    setActive(current ? sectionLinks.get(current) : null);
  }, { rootMargin: "-40% 0px -60% 0px" });

  sectionLinks.forEach((_, section) => observer.observe(section));
}
