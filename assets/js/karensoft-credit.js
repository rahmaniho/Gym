/* KarenSoft credit: locale-aware footer badge with an accessible reveal. */
(() => {
  const credits = Array.from(document.querySelectorAll("[data-ks-credit]"));
  if (!credits.length) return;

  const translations = {
    fa: { footer: { designedBy: "طراحی و توسعه:" } },
    en: { footer: { designedBy: "Designed & Developed by" } },
  };
  const language = () => (document.documentElement.lang || "fa").toLowerCase().startsWith("en") ? "en" : "fa";

  function updateCreditLanguage(credit) {
    const currentLanguage = language();
    const direction = currentLanguage === "en" ? "ltr" : "rtl";
    const designedBy = translations[currentLanguage].footer.designedBy;
    const label = credit.querySelector("[data-ks-label]");
    if (label) {
      label.replaceChildren();
      label.lang = currentLanguage;
      label.dir = direction;
      designedBy.split(" ").forEach((word, index) => {
        const wordElement = document.createElement("span");
        wordElement.className = "ks-label-gradient";
        wordElement.style.setProperty("--word-index", String(index));
        wordElement.textContent = word;
        label.appendChild(wordElement);
      });
    }

    credit.dir = direction;
    const accessibleName = `${designedBy} کارن سافت | KarenSoft — www.karen-soft.ir`;
    credit.setAttribute("aria-label", accessibleName);
    credit.title = accessibleName;
  }

  credits.forEach(updateCreditLanguage);

  const reducedMotion = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  let observer = null;

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
  }

  credits.forEach((credit) => {
    credit.classList.add("ks-credit--motion-ready");
    if (observer) observer.observe(credit);
    else credit.classList.add("is-visible");
  });

  const onMotionPreferenceChange = (event) => {
    if (!event.matches) return;
    if (observer) observer.disconnect();
    credits.forEach((credit) => credit.classList.add("is-visible"));
  };
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(onMotionPreferenceChange);
  }

  if ("MutationObserver" in window) {
    const languageObserver = new MutationObserver(() => credits.forEach(updateCreditLanguage));
    languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
})();
