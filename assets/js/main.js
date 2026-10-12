/* ==========================================================================
   IRON ARENA — main.js  (shared shell, loaded on every page)
   --------------------------------------------------------------------------
   Exposes a tiny global namespace `IA` with helpers used by page scripts:
     IA.$ / IA.$$          query helpers
     IA.fa(n) / IA.en(s)   Persian ⇄ Latin digits, IA.money(n) → "۳٬۵۰۰٬۰۰۰"
     IA.store              safe localStorage wrapper
     IA.icon(name)         <svg><use> markup for the inline sprite
     IA.img(name, opts)    responsive <img> markup with blur-up wrapper
     IA.toast({...})       gold toast notifications
     IA.modal.open({...})  accessible modal dialog
     IA.lightbox.open()    keyboard / swipe image viewer
     IA.validate(form)     client-side validation with Persian messages
     IA.reveal(root)       scroll-reveal for dynamically rendered nodes
     IA.loadScript(src)    lazy loader (used for jsPDF, html2canvas, Lottie)
     IA.lottieSuccess(el)  plays the gold success check animation
   Page scripts register themselves in IA.pages[<body data-page>].
   Everything is 100% client-side — no network APIs are called.
   ========================================================================== */
(function () {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine) and (hover: hover)").matches;

  /* ---------------------------------------------------------------- utils */
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const fa = (v) => String(v).replace(/\d/g, (d) => FA[d]);
  const en = (v) => String(v).replace(/[۰-۹]/g, (d) => FA.indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const money = (n) => new Intl.NumberFormat("fa-IR").format(Math.round(n));
  const num = (n, digits = 0) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(k, d = null) { try { const v = localStorage.getItem("ia-" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("ia-" + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    raw(k, v) { try { localStorage.setItem("ia-" + k, v); } catch (e) { /* ignore */ } },
  };

  const icon = (name, cls = "") => {
    const id = name.startsWith("b-") ? name : "i-" + name;
    return `<svg class="ic ${cls}" aria-hidden="true"><use href="#${id}"></use></svg>`;
  };

  /* image registry: name → [width, height, smallVariant] */
  const IMGS = {
    hero: [1376, 768, "800"], "shift-morning": [1376, 768, "800"], "shift-evening": [1376, 768, "800"],
    mma: [1408, 768, "800"], "program-mass": [1408, 768, "800"], "program-fatloss": [1408, 768, "800"],
    "program-women": [1408, 768, "800"], "program-competitive": [1408, 768, "800"],
    "men-section": [768, 1376, "480"], "women-section": [768, 1376, "480"],
    "coach-1": [640, 800], "coach-2": [640, 800], "coach-3": [640, 800], "coach-4": [640, 800], "coach-5": [640, 800], "coach-6": [640, 800],
    "detail-racks": [820, 768], "detail-bags": [760, 768], "detail-yoga": [700, 600], "detail-squat": [900, 700, "800"],
    "transform-before": [720, 800], "transform-after": [720, 800],
  };
  const imgSrc = (name, small) => `assets/img/${name}${small && IMGS[name] && IMGS[name][2] ? "-" + IMGS[name][2] : ""}.webp`;
  function img(name, o = {}) {
    const meta = IMGS[name] || [1200, 800];
    const [w, h, v] = meta;
    const set = v ? ` srcset="assets/img/${name}-${v}.webp ${v}w, assets/img/${name}.webp ${w}w" sizes="${o.sizes || "(max-width: 767px) 100vw, 50vw"}"` : "";
    const load = o.eager ? ' fetchpriority="high"' : ' loading="lazy"';
    return `<div class="media ${o.cls || ""}"${o.style ? ` style="${o.style}"` : ""}><img src="assets/img/${name}${v && o.small ? "-" + v : ""}.webp"${set} width="${w}" height="${h}" alt="${esc(o.alt || "")}"${load} decoding="async"></div>`;
  }

  /* lazy script loader (cached promises) */
  const scriptCache = {};
  function loadScript(src) {
    if (!scriptCache[src]) {
      scriptCache[src] = new Promise((res, rej) => {
        const s = doc.createElement("script");
        s.src = src; s.async = true;
        s.onload = res; s.onerror = () => { delete scriptCache[src]; rej(new Error("load failed: " + src)); };
        doc.head.appendChild(s);
      });
    }
    return scriptCache[src];
  }

  /* ---------------------------------------------------------- toasts */
  function toast({ title = "", msg = "", type = "success", timeout = 4200 } = {}) {
    const host = $("[data-toasts]");
    if (!host) return;
    const el = doc.createElement("div");
    el.className = `toast toast--${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.innerHTML = `<span class="toast__icon">${icon(type === "error" ? "triangle-alert" : "check")}</span>
      <div><b>${esc(title)}</b>${msg ? `<p>${esc(msg)}</p>` : ""}</div>
      <button type="button" class="toast__close" aria-label="بستن اعلان">${icon("x")}</button>`;
    const kill = () => { el.classList.add("is-leaving"); setTimeout(() => el.remove(), 350); };
    el.querySelector(".toast__close").addEventListener("click", kill);
    host.appendChild(el);
    if (host.children.length > 3) host.firstElementChild.remove();
    setTimeout(kill, timeout);
  }

  /* ---------------------------------------------------------- focus trap */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
  function trap(container, e) {
    if (e.key !== "Tab") return;
    const f = $$(FOCUSABLE, container).filter((n) => n.offsetParent !== null || n === doc.activeElement);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  let lockCount = 0;
  const lock = (on) => { lockCount = Math.max(0, lockCount + (on ? 1 : -1)); doc.body.classList.toggle("is-locked", lockCount > 0); };

  /* ---------------------------------------------------------- modal */
  const modal = {
    open({ content = "", label = "پنجره", cls = "", onClose } = {}) {
      const prev = doc.activeElement;
      const m = doc.createElement("div");
      m.className = `modal ${cls}`;
      m.innerHTML = `<div class="modal__backdrop" data-close></div>
        <div class="modal__dialog" role="dialog" aria-modal="true" aria-label="${esc(label)}" tabindex="-1">
          <button type="button" class="icon-btn modal__close" data-close aria-label="بستن">${icon("x")}</button>
          <div class="modal__content"></div>
        </div>`;
      const box = $(".modal__content", m);
      if (typeof content === "string") box.innerHTML = content; else box.appendChild(content);
      doc.body.appendChild(m);
      lock(true);
      const close = () => {
        m.classList.remove("is-open");
        doc.removeEventListener("keydown", onKey);
        lock(false);
        setTimeout(() => { m.remove(); if (prev && prev.focus) prev.focus(); }, 450);
        if (onClose) onClose();
      };
      const onKey = (e) => { if (e.key === "Escape") close(); trap(m, e); };
      m.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
      doc.addEventListener("keydown", onKey);
      requestAnimationFrame(() => { m.classList.add("is-open"); $(".modal__dialog", m).focus({ preventScroll: true }); });
      media(m); reveal(m);
      m.close = close;
      return m;
    },
  };

  /* ---------------------------------------------------------- lightbox */
  const lightbox = (() => {
    let items = [], idx = 0, prevFocus = null, lb, imgEl, cap, count;
    function render() {
      const it = items[idx];
      imgEl.classList.add("is-swapping");
      const pre = new Image();
      pre.onload = pre.onerror = () => {
        imgEl.src = it.src; imgEl.alt = it.alt || "";
        imgEl.width = pre.naturalWidth || 1200; imgEl.height = pre.naturalHeight || 800;
        requestAnimationFrame(() => imgEl.classList.remove("is-swapping"));
      };
      pre.src = it.src;
      cap.textContent = it.caption || it.alt || "";
      count.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    }
    const go = (d) => { idx = (idx + d + items.length) % items.length; render(); };
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(1);   // RTL: left = next
      else if (e.key === "ArrowRight") go(-1);
      trap(lb, e);
    }
    function open(list, i = 0) {
      lb = $("[data-lightbox]"); if (!lb || !list.length) return;
      imgEl = $(".lightbox__img", lb); cap = $("[data-lb-caption]", lb); count = $("[data-lb-count]", lb);
      items = list; idx = i; prevFocus = doc.activeElement;
      render();
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
      lock(true);
      doc.addEventListener("keydown", onKey);
      $("[data-lb-close]", lb).focus();
    }
    function close() {
      if (!lb) return;
      lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true");
      lock(false);
      doc.removeEventListener("keydown", onKey);
      if (prevFocus) prevFocus.focus();
    }
    function bind() {
      lb = $("[data-lightbox]"); if (!lb) return;
      $("[data-lb-close]", lb).addEventListener("click", close);
      $("[data-lb-next]", lb).addEventListener("click", () => go(1));
      $("[data-lb-prev]", lb).addEventListener("click", () => go(-1));
      lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
      let sx = 0;
      lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
    }
    return { open, close, bind };
  })();

  /* ---------------------------------------------------------- validation */
  const MSG = {
    required: "پر کردن این فیلد الزامی است.",
    email: "لطفاً یک ایمیل معتبر وارد کنید (مثال: name@mail.com).",
    phone: "شمارهٔ موبایل معتبر نیست؛ مثال: ۰۹۱۲۱۲۳۴۵۶۷",
    number: "لطفاً فقط عدد وارد کنید.",
    range: (a, b) => `مقدار باید بین ${fa(a)} تا ${fa(b)} باشد.`,
    minlength: (n) => `حداقل ${fa(n)} کاراکتر وارد کنید.`,
    choice: "لطفاً یکی از گزینه‌ها را انتخاب کنید.",
    consent: "برای ادامه، پذیرش این مورد الزامی است.",
  };
  function fieldError(input) {
    const v = en(input.value || "").trim();
    if (input.type === "radio") {
      const group = $$(`input[name="${input.name}"]`, input.form);
      return input.required && !group.some((r) => r.checked) ? MSG.choice : "";
    }
    if (input.type === "checkbox") return input.required && !input.checked ? MSG.consent : "";
    if (input.required && !v) return MSG.required;
    if (!v) return "";
    if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MSG.email;
    if (input.dataset.validate === "phone" && !/^(\+98|0098|0)?9\d{9}$/.test(v.replace(/[\s-]/g, ""))) return MSG.phone;
    if (input.dataset.type === "number" || input.type === "number") {
      const n = parseFloat(v);
      if (isNaN(n)) return MSG.number;
      const min = parseFloat(input.min || input.dataset.min), max = parseFloat(input.max || input.dataset.max);
      if ((!isNaN(min) && n < min) || (!isNaN(max) && n > max)) return MSG.range(min, max);
    }
    if (input.minLength > 0 && v.length < input.minLength) return MSG.minlength(input.minLength);
    return "";
  }
  function showError(input, msg) {
    const field = input.closest(".field");
    if (!field) return;
    let err = $(".field__error", field);
    if (!err) {
      err = doc.createElement("p");
      err.className = "field__error";
      err.id = (input.id || input.name) + "-error";
      field.appendChild(err);
    }
    field.classList.toggle("is-invalid", !!msg);
    err.textContent = msg;
    if (msg) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", err.id); }
    else input.removeAttribute("aria-invalid");
  }
  function validate(form) {
    const inputs = $$("input, select, textarea", form).filter((i) => !i.disabled && i.type !== "hidden" && i.type !== "submit");
    let firstBad = null;
    const seen = new Set();
    inputs.forEach((i) => {
      if (i.type === "radio") { if (seen.has(i.name)) return; seen.add(i.name); }
      const m = fieldError(i);
      showError(i, m);
      if (m && !firstBad) firstBad = i;
    });
    form.dataset.touched = "1";
    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      toast({ type: "error", title: "لطفاً خطاهای فرم را برطرف کنید", msg: fieldError(firstBad) });
    }
    return !firstBad;
  }
  doc.addEventListener("input", (e) => {
    const i = e.target;
    if (i.form && i.form.dataset.touched && i.closest(".field")) showError(i, fieldError(i));
  });
  doc.addEventListener("focusout", (e) => {
    const i = e.target;
    if (i.matches && i.matches("[data-validate-live] input, [data-validate-live] textarea, [data-validate-live] select") && i.value) showError(i, fieldError(i));
  });

  /* ---------------------------------------------------------- lottie */
  const SUCCESS_LOTTIE = {
    v: "5.7.4", fr: 60, ip: 0, op: 60, w: 100, h: 100, nm: "success", ddd: 0, assets: [],
    layers: [
      { ddd: 0, ind: 1, ty: 4, nm: "ring", sr: 1, ao: 0, ip: 0, op: 60, st: 0, bm: 0,
        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ t: 0, s: [70, 70, 100], o: { x: [0.3], y: [0] }, i: { x: [0.2], y: [1] } }, { t: 26, s: [100, 100, 100] }] } },
        shapes: [{ ty: "gr", nm: "g", it: [
          { ty: "el", nm: "e", d: 1, p: { a: 0, k: [0, 0] }, s: { a: 0, k: [84, 84] } },
          { ty: "st", nm: "s", c: { a: 0, k: [0.831, 0.686, 0.216, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 5 }, lc: 2, lj: 2 },
          { ty: "tm", nm: "t", s: { a: 0, k: 0 }, o: { a: 0, k: 0 }, m: 1,
            e: { a: 1, k: [{ t: 0, s: [0], o: { x: [0.4], y: [0] }, i: { x: [0.2], y: [1] } }, { t: 30, s: [100] }] } },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: -90 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ] }] },
      { ddd: 0, ind: 2, ty: 4, nm: "check", sr: 1, ao: 0, ip: 0, op: 60, st: 0, bm: 0,
        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
        shapes: [{ ty: "gr", nm: "g", it: [
          { ty: "sh", nm: "p", ks: { a: 0, k: { i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[-18, 1], [-5, 14], [19, -12]], c: false } } },
          { ty: "st", nm: "s", c: { a: 0, k: [0.831, 0.686, 0.216, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 6 }, lc: 2, lj: 2 },
          { ty: "tm", nm: "t", s: { a: 0, k: 0 }, o: { a: 0, k: 0 }, m: 1,
            e: { a: 1, k: [{ t: 22, s: [0], o: { x: [0.4], y: [0] }, i: { x: [0.2], y: [1] } }, { t: 46, s: [100] }] } },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ] }] },
    ],
  };
  function lottieSuccess(container) {
    if (!container) return;
    if (reduced) { container.innerHTML = icon("circle-check", "ic--lg text-gold"); return; }
    loadScript("assets/vendor/lottie_light.min.js")
      .then(() => { container.innerHTML = ""; window.lottie.loadAnimation({ container, renderer: "svg", loop: false, autoplay: true, animationData: JSON.parse(JSON.stringify(SUCCESS_LOTTIE)) }); })
      .catch(() => { container.innerHTML = icon("circle-check", "ic--lg text-gold"); });
  }

  /* ---------------------------------------------------------- reveal / media / counters */
  let io;
  function reveal(scope = doc) {
    const els = $$("[data-reveal]:not(.is-visible)", scope);
    $$("[data-stagger]", scope).forEach((g) => {
      $$(":scope > [data-reveal]", g).forEach((c, i) => c.style.setProperty("--d", `${Math.min(i, 10) * 80}ms`));
    });
    if (reduced || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-visible")); return; }
    if (!io) {
      io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }
    els.forEach((e) => io.observe(e));
  }
  function media(scope = doc) {
    const lq = window.IA_LQIP || {};
    $$(".media > img", scope).forEach((im) => {
      if (im.dataset.bound) return;
      im.dataset.bound = "1";
      if (im.complete && im.naturalWidth) return;
      const key = (im.getAttribute("src") || "").split("/").pop().replace(/\.webp$/, "").replace(/-(800|480)$/, "");
      const box = im.parentElement;
      if (lq[key]) box.style.backgroundImage = `url("${lq[key]}")`;
      box.classList.add("is-loading");
      const done = () => box.classList.remove("is-loading");
      im.addEventListener("load", done, { once: true });
      im.addEventListener("error", done, { once: true });
    });
  }
  function countUp(el) {
    const target = parseFloat(en(el.dataset.count));
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    if (reduced) { el.textContent = prefix + num(target, dec) + suffix; return; }
    const dur = parseInt(el.dataset.duration || "1600", 10);
    const t0 = performance.now();
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + num(target * e, dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function counters(scope = doc) {
    const els = $$("[data-count]", scope);
    if (!("IntersectionObserver" in window)) { els.forEach(countUp); return; }
    const o = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { countUp(e.target); o.unobserve(e.target); } }), { threshold: 0.4 });
    els.forEach((e) => o.observe(e));
  }

  /* ---------------------------------------------------------- theme & gender */
  function circleReveal(e, apply) {
    const btn = e && e.currentTarget;
    let x = innerWidth / 2, y = 0;
    if (e && e.detail !== 0 && e.clientX) { x = e.clientX; y = e.clientY; }
    else if (btn && btn.getBoundingClientRect) { const r = btn.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    if (!doc.startViewTransition || reduced) { apply(); return; }
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = doc.startViewTransition(apply);
    t.ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" });
    }).catch(() => {});
  }
  function setGender(g, e, silent) {
    if (g !== "male" && g !== "female") return;
    const apply = () => {
      root.setAttribute("data-gender", g);
      $$("[data-gender-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.genderBtn === g)));
    };
    if (e) circleReveal(e, apply); else apply();
    store.raw("gender", g);
    doc.dispatchEvent(new CustomEvent("ia:gender", { detail: g }));
    if (!silent) toast({ title: g === "female" ? "بخش بانوان فعال شد" : "بخش آقایان فعال شد", msg: g === "female" ? "محتوا، رنگ‌ها و برنامه‌ها برای بانوان تنظیم شد." : "محتوا، رنگ‌ها و برنامه‌ها برای آقایان تنظیم شد.", timeout: 2600 });
  }
  function setTheme(t, e) {
    const apply = () => {
      root.setAttribute("data-theme", t);
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", t === "light" ? "#F7F4EE" : "#0A0A0A");
    };
    if (e) circleReveal(e, apply); else apply();
    store.raw("theme", t);
    doc.dispatchEvent(new CustomEvent("ia:theme", { detail: t }));
  }
  const gender = () => root.getAttribute("data-gender") || "male";

  /* ---------------------------------------------------------- shell init */
  function initLoader(done) {
    const loader = $(".loader");
    if (!loader || root.classList.contains("no-loader")) { done(); return; }
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      loader.classList.add("is-done");
      try { sessionStorage.setItem("ia-loaded", "1"); } catch (e) { /* ignore */ }
      setTimeout(done, 150);
    };
    const t0 = performance.now();
    window.addEventListener("load", () => setTimeout(finish, Math.max(0, 900 - (performance.now() - t0))), { once: true });
    setTimeout(finish, 1300); // hard cap — never block longer than ~1.5s
  }

  function initHeader() {
    const header = $("[data-header]");
    const toTop = $("[data-to-top]");
    const ring = toTop && $("circle", toTop);
    const bar = $("[data-book-bar]");
    let ticking = false;
    const onScroll = () => {
      const y = scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 80);
      const max = doc.documentElement.scrollHeight - innerHeight;
      if (toTop) {
        toTop.classList.toggle("is-visible", y > 600);
        if (ring) ring.style.strokeDashoffset = String(182 * (1 - clamp(y / (max || 1), 0, 1)));
      }
      if (bar) bar.classList.toggle("is-visible", y > 420 && y < max - 200);
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    if (toTop) toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
  }

  function initDrawer() {
    const drawer = $("#drawer");
    const openBtn = $("[data-drawer-open]");
    if (!drawer || !openBtn) return;
    const onKey = (e) => { if (e.key === "Escape") close(); trap(drawer, e); };
    function open() {
      drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false");
      openBtn.setAttribute("aria-expanded", "true"); lock(true);
      doc.addEventListener("keydown", onKey);
      setTimeout(() => { const f = $(".drawer__links a", drawer); if (f) f.focus(); }, 60);
    }
    function close() {
      if (!drawer.classList.contains("is-open")) return;
      drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false"); lock(false);
      doc.removeEventListener("keydown", onKey);
      openBtn.focus();
    }
    openBtn.addEventListener("click", open);
    $$("[data-drawer-close]", drawer).forEach((b) => b.addEventListener("click", close));
    $$(".drawer__links a", drawer).forEach((a) => a.addEventListener("click", close));
    matchMedia("(min-width: 1280px)").addEventListener("change", (m) => { if (m.matches) close(); });
  }

  function initToggles() {
    const g = gender();
    $$("[data-gender-btn]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.genderBtn === g));
      b.addEventListener("click", (e) => { if (b.dataset.genderBtn !== gender()) setGender(b.dataset.genderBtn, e); });
    });
    $$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", (e) => setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light", e)));
    const meta = $('meta[name="theme-color"]');
    if (meta && root.getAttribute("data-theme") === "light") meta.setAttribute("content", "#F7F4EE");
  }

  function initCursor() {
    if (!finePointer || reduced) return;
    const dot = $(".cursor-dot"), ring = $(".cursor-ring");
    if (!dot || !ring) return;
    let mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    root.classList.add("has-cursor");
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!shown) { shown = true; rx = mx; ry = my; }
    }, { passive: true });
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    const HOVER = "a, button, label, select, [role='button'], [data-cursor], input[type='range'], .masonry__item, .split__panel";
    doc.addEventListener("mouseover", (e) => { if (e.target.closest(HOVER)) ring.classList.add("is-hover"); });
    doc.addEventListener("mouseout", (e) => { if (e.target.closest(HOVER) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HOVER))) ring.classList.remove("is-hover"); });
    doc.addEventListener("mousedown", () => ring.classList.add("is-down"));
    doc.addEventListener("mouseup", () => ring.classList.remove("is-down"));
    doc.addEventListener("mouseleave", () => { dot.style.opacity = "0"; ring.style.opacity = "0"; });
    doc.addEventListener("mouseenter", () => { dot.style.opacity = ""; ring.style.opacity = ""; });
  }

  function initRipple() {
    doc.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".btn");
      if (!b || reduced) return;
      const r = b.getBoundingClientRect();
      const s = Math.max(r.width, r.height);
      const span = doc.createElement("span");
      span.className = "ripple";
      span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      b.appendChild(span);
      setTimeout(() => span.remove(), 700);
    });
  }

  function initAccordions() {
    doc.addEventListener("click", (e) => {
      const btn = e.target.closest(".acc__btn");
      if (!btn) return;
      const acc = btn.closest(".acc");
      const open = !acc.classList.contains("is-open");
      const group = acc.closest("[data-single]");
      if (group && open) $$(".acc.is-open", group).forEach((a) => { if (a !== acc) { a.classList.remove("is-open"); $(".acc__btn", a).setAttribute("aria-expanded", "false"); } });
      acc.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  /** Generic tab group: buttons [data-tab] inside `bar`, panels [data-panel] inside `scope`. */
  function tabs(bar, scope, onChange) {
    const btns = $$("[data-tab]", bar);
    const activate = (id, focus) => {
      btns.forEach((b) => { const on = b.dataset.tab === id; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      $$("[data-panel]", scope).forEach((p) => {
        const on = p.dataset.panel === id;
        p.hidden = !on;
        if (on) { p.classList.remove("is-entering"); void p.offsetWidth; p.classList.add("is-entering"); reveal(p); media(p); }
      });
      if (onChange) onChange(id);
    };
    btns.forEach((b, i) => {
      b.addEventListener("click", () => activate(b.dataset.tab));
      b.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
        if (d) { e.preventDefault(); activate(btns[(i + d + btns.length) % btns.length].dataset.tab, true); }
      });
    });
    return activate;
  }

  function initChat() {
    const c = $("[data-chat]");
    if (!c) return;
    const t = $("[data-chat-toggle]", c);
    t.addEventListener("click", () => { const o = c.classList.toggle("is-open"); t.setAttribute("aria-expanded", String(o)); });
    doc.addEventListener("click", (e) => { if (!c.contains(e.target) && c.classList.contains("is-open")) { c.classList.remove("is-open"); t.setAttribute("aria-expanded", "false"); } });
  }

  /* Map facade: loads the heavy Google Maps iframe only on demand (Lighthouse-friendly). */
  const MAP_SRC = "https://maps.google.com/maps?q=35.7700,51.4140&z=15&hl=fa&output=embed"; // TODO: مختصات واقعی
  function initMaps() {
    $$("[data-map-facade]").forEach((b) => b.addEventListener("click", () => {
      const f = doc.createElement("iframe");
      f.src = MAP_SRC; f.title = "موقعیت باشگاه آیرون آرنا روی نقشه"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      f.setAttribute("allowfullscreen", "");
      b.innerHTML = ""; b.appendChild(f); b.style.cursor = "default";
    }, { once: true }));
  }

  function initYear() {
    let y;
    try { y = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date()); } catch (e) { y = fa(new Date().getFullYear()); }
    $$("[data-year]").forEach((el) => { el.textContent = y.replace(/[^\d۰-۹]/g, ""); });
  }

  /* Hero headline: word-by-word slide-up (GSAP) */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(" ")); return; }
            const w = doc.createElement("span"); w.className = "word";
            const i = doc.createElement("span"); i.className = "word__inner"; i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el.classList.add("is-split");
  }
  function intro() {
    const gsap = window.gsap;
    const split = $("[data-split]");
    if (split) splitWords(split);
    if (!gsap || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    if (split) tl.from($$(".word__inner", split), { yPercent: 115, opacity: 0, duration: 1.1, stagger: 0.08 });
    const fades = $$("[data-intro]");
    if (fades.length) tl.from(fades, { y: 28, opacity: 0, duration: 1, stagger: 0.1, clearProps: "transform,opacity" }, split ? "-=0.7" : 0);
    const pageHero = $$(".page-hero__inner > *, .article-hero__inner > *");
    if (pageHero.length) tl.from(pageHero, { y: 30, opacity: 0, duration: 1, stagger: 0.08, clearProps: "transform,opacity" }, 0);
  }

  /* ---------------------------------------------------------- boot */
  const IA = window.IA = {
    $, $$, fa, en, money, num, clamp, esc, store, icon, img, imgSrc, IMGS, reduced, loadScript,
    toast, modal, lightbox, validate, reveal, media, counters, countUp, lottieSuccess, tabs,
    setGender, setTheme, gender, pages: {},
  };

  function boot() {
    initHeader(); initDrawer(); initToggles(); initCursor(); initRipple(); initAccordions();
    initChat(); initMaps(); initYear(); lightbox.bind();
    const page = doc.body.dataset.page;
    if (page && IA.pages[page]) {
      try { IA.pages[page](); } catch (err) { console.error("[IRON ARENA] page init failed:", err); }
    }
    media(); reveal(); counters();
    initLoader(intro);
  }
  // deferred scripts run while readyState is "interactive" — wait for DOMContentLoaded so page scripts can register first
  if (doc.readyState === "complete") boot(); else doc.addEventListener("DOMContentLoaded", boot, { once: true });
})();
