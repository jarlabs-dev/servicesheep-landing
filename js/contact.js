// contact.js — moves between the form's three steps, enables each step's
// "Next"/"Continue" once its required fields are filled, and formats the
// phone number. Steps 2–3 are for Service Overseers only; any other role goes
// from step 1 to the "redirect" panel. Step 3's Continue runs an invisible
// reCAPTCHA v2, then sends the request through EmailJS (which emails it to
// hello@servicesheep.com and checks the reCAPTCHA token server-side).
import { toast } from "./components/toast.js";

// All public keys (safe in the browser). Recipient, subject and the reCAPTCHA
// secret live in the EmailJS template "ss_demo_request".
const EMAILJS = { serviceId: "service_sheep_contact", templateId: "ss_demo_request", publicKey: "CdSYMSXJqWra5M6tB" };
const RECAPTCHA_SITE_KEY = "6Lent84tAAAAALZ3GRpvbbd79UEYqQY_cO4UT5_A";

const form = document.getElementById("contact-form");
const stepper = form?.querySelector(".stepper");
const steps = form ? [...form.querySelectorAll('.contact-step:not([data-step="redirect"], [data-step="sent"])')] : [];
const redirect = form?.querySelector('.contact-step[data-step="redirect"]');
const sent = form?.querySelector('.contact-step[data-step="sent"]');
const name = form?.querySelector('ui-text-field[name="name"]');
const role = form?.querySelector('ui-select[name="role"]');
const congregation = form?.querySelector('ui-text-field[name="congregation"]');
const phone = form?.querySelector('ui-text-field[name="phone"]');
const methods = form ? [...form.querySelectorAll('input[name="contact-method"]')] : [];

const button = (step, action) => steps[step - 1]?.querySelector(`[data-action="${action}"]`);

// Shows step n (1-based), or the panel for n = "redirect" / "sent". The
// indicator shows on steps 2 and 3 only.
function show(n) {
  steps.forEach((el, i) => { el.hidden = i + 1 !== n; });
  redirect.hidden = n !== "redirect";
  sent.hidden = n !== "sent";
  form.classList.toggle("contact-card--sent", n === "sent"); // its padding + the sheep
  stepper.hidden = n !== 2 && n !== 3;
  stepper.querySelectorAll(".stepper__step").forEach((li, i) => {
    const state = i + 1 < n ? "completed" : i + 1 === n ? "current" : "upcoming";
    li.dataset.state = state;
    if (state === "current") li.setAttribute("aria-current", "step");
    else li.removeAttribute("aria-current");
    li.querySelector(".stepper__status").textContent = state === "completed" ? ", completed" : "";
  });
  ({ redirect, sent }[n] ?? steps[n - 1]).querySelector(".contact-card__title")?.focus();
}

// Fills the redirect panel from step 1: "Thanks, <name>." and "As a/an <role>, …"
// ("Other" drops the "As …" clause). textContent, since both are user input.
function showRedirect() {
  const label = role.value.replace(/-/g, " "); // option values are the role names, e.g. "elder"
  const who = role.value === "other" ? "" : `As ${/^[aeiou]/.test(label) ? "an" : "a"} ${label}, your`;
  redirect.querySelector('[data-fill="name"]').textContent = name.value.trim();
  redirect.querySelector('[data-fill="role-sentence"]').textContent =
    `${who || "Your"} Service Overseer is best placed to help set up your congregation.`;
  show("redirect");
}

// ── Phone number: PH mobile, 10 digits starting with 9, shown as XXX XXX XXXX ──
// Digits only; a pasted "+63 9…" / "09…" loses its prefix; a first digit other
// than 9 is refused, as is an 11th digit.
const phoneDigits = (s) => s.replace(/\D/g, "").replace(/^(?:63|0)(?=9)/, "");
const formatPhone = (d) => [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(" ");
let prevPhone = "";

function onPhoneInput(e) {
  const input = e.target;
  if (!input.matches?.(".text-field__input")) return; // skip the host's own re-dispatched event
  const raw = input.value;
  const deleting = e.inputType?.startsWith("delete");
  let digits = phoneDigits(raw);
  let before = phoneDigits(raw.slice(0, input.selectionStart)).length; // digits left of the caret

  // Backspace over a space: remove the digit before it instead.
  if (e.inputType === "deleteContentBackward" && digits === prevPhone && before > 0) {
    digits = digits.slice(0, before - 1) + digits.slice(before);
    before -= 1;
  }
  const refuse = (!deleting && digits && digits[0] !== "9") ||
                 (digits.length > 10 && e.inputType === "insertText");
  if (refuse) {
    before -= digits.length - prevPhone.length;
    digits = prevPhone;
  }
  digits = digits.slice(0, 10);
  before = Math.max(0, Math.min(before, digits.length));

  const next = formatPhone(digits);
  if (next !== raw) {
    input.value = next;
    let pos = 0;
    for (let n = 0; pos < next.length && n < before; pos++) if (/\d/.test(next[pos])) n++;
    input.setSelectionRange(pos, pos);
  }
  prevPhone = digits;
}

// ── Sending (step 3's Continue) ──
// The invisible widget is rendered as soon as Google's script is ready, so its
// badge shows the whole time the page is open; Continue runs the check and
// the callback gets the token and sends. The spinner shows only while sending:
// if Google shows a picture challenge and it's closed, reCAPTCHA reports
// nothing, so a spinner started on click could never be cleared. Any failure
// keeps the fields.
let widget = null;

function sendFailed(e) {
  console.error("Demo request not sent:", e);
  const cont = button(3, "next");
  cont.removeAttribute("loading");
  cont.removeAttribute("disabled");
  if (widget !== null) window.grecaptcha.reset(widget); // a token works once
  toast.show("error", { title: "Couldn’t send your request", message: "Please try again in a moment.", duration: 5000 });
}

async function send(token) {
  const methodLabels = methods.filter((m) => m.checked)
    .map((m) => m.closest(".checkbox").querySelector(".checkbox__label").textContent.trim());
  button(3, "next").setAttribute("loading", "");
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: {
          name: name.value.trim(),
          role: "Service Overseer", // only Service Overseers reach step 3
          congregation: congregation.value.trim(),
          contact_methods: methodLabels.join(", "),
          phone: `+63 ${formatPhone(phoneDigits(phone.value))}`,
          "g-recaptcha-response": token,
        },
      }),
    });
    if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`);
    button(3, "next").removeAttribute("loading");
    show("sent");
  } catch (e) {
    sendFailed(e);
  }
}

function renderRecaptcha() {
  widget ??= window.grecaptcha.render("recaptcha", {
    sitekey: RECAPTCHA_SITE_KEY,
    size: "invisible",
    badge: "bottomright",
    callback: send,
    "error-callback": () => sendFailed(new Error("reCAPTCHA error")),
  });
}

function submit() {
  if (button(3, "next").hasAttribute("loading")) return; // already sending
  if (widget === null) return sendFailed(new Error("reCAPTCHA didn’t load"));
  try {
    window.grecaptcha.execute(widget);
  } catch (e) {
    sendFailed(e);
  }
}

if (form && stepper && steps.length === 3 && redirect && sent && name && role && congregation && phone && methods.length) {
  const update = () => {
    button(1, "next").toggleAttribute("disabled", !(name.value.trim() && role.value));
    button(2, "next").toggleAttribute("disabled", !congregation.value.trim());
    const reachable = methods.some((m) => m.checked) && /^9\d{9}$/.test(phoneDigits(phone.value));
    button(3, "next").toggleAttribute("disabled", !reachable);
  };

  // Capture phase, so the number is formatted before the component stores its form value.
  phone.addEventListener("input", onPhoneInput, true);
  const phoneInput = phone.querySelector(".text-field__input");
  if (phoneInput) phoneInput.inputMode = "numeric"; // number keypad on phones

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", (e) => e.preventDefault()); // Enter never reloads the page

  button(1, "next").addEventListener("click", () => (role.value === "service-overseer" ? show(2) : showRedirect()));
  button(2, "back").addEventListener("click", () => show(1));
  button(2, "next").addEventListener("click", () => show(3));
  button(3, "back").addEventListener("click", () => show(2));
  button(3, "next").addEventListener("click", submit);

  // Google's script is async: it may have run before this module or not yet.
  // If not, it calls window.onRecaptchaLoad (named in its URL) when ready.
  if (window.grecaptcha?.ready) window.grecaptcha.ready(renderRecaptcha);
  else window.onRecaptchaLoad = renderRecaptcha;

  update();
}
