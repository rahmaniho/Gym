/* ==========================================================================
   IRON ARENA — pages.js
   Page controllers (registered on IA.pages[...]) + shared UI renderers
   (IA.ui.*) reused across pages: program cards, coach cards & modal,
   gallery masonry, pricing, meal-plan accordion, workout plan, exercise
   motion loops, testimonials, before/after, virtual tour, forms.
   ========================================================================== */
(function () {
  "use strict";
  const IA = window.IA, D = window.IA_DATA;
  if (!IA || !D) return;
  const { $, $$, fa, money, num, esc, icon, img, toast, modal, lightbox, validate, reveal, media, store } = IA;

  /* ------------------------------------------------------------------ */
  /* CONFIG — TODO: replace with your real Formspree endpoint             */
  /* (https://formspree.io → New form → copy the endpoint). While the     */
  /* placeholder is present, forms fall back to the visitor's mail app.  */
  /* ------------------------------------------------------------------ */
  const CONFIG = {
    formEndpoint: "https://formspree.io/f/YOUR_FORM_ID",
    email: "info@ironarena.ir",
  };
  const endpointReady = () => !/YOUR_FORM_ID/.test(CONFIG.formEndpoint);

  const ui = (IA.ui = {});
  const levelLabel = ["", "مبتدی", "متوسط", "پیشرفته"];
  const stars = (n, max = 5) => `<span class="stars" aria-label="${fa(n)} از ${fa(max)}">${Array.from({ length: max }, (_, i) => icon("star", i < n ? "" : "is-off")).join("")}</span>`;

  /* ------------------------------------------------------------- programs */
  ui.programCards = (el) => {
    el.innerHTML = D.programs.map((p, i) => `
      <a class="program-card" href="programs.html#routine-${p.id}" data-reveal>
        ${img(p.img, { small: true, sizes: "(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 25vw" })}
        <span class="program-card__num latin">0${i + 1}</span>
        <span class="program-card__arrow">${icon("arrow-up")}</span>
        <span class="badge">${esc(p.level)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        <span class="program-card__meta">
          <span>${icon("calendar")} ${fa(p.weeks)} هفته</span>
          <span>${icon("timer")} ${fa(p.days)} جلسه در هفته</span>
        </span>
      </a>`).join("");
  };

  /* -------------------------------------------------------------- coaches */
  ui.coachCard = (c) => `
    <article class="coach-card card card--hover" data-reveal id="coach-${c.id}">
      <div style="position:relative">
        <div class="coach-card__badges">${c.badges.map((b) => `<span class="badge latin">${esc(b)}</span>`).join("")}</div>
        ${img(c.img, { alt: `${c.name} — ${c.role}`, sizes: "(max-width: 767px) 82vw, 25vw" })}
      </div>
      <div class="coach-card__body">
        <h3>${esc(c.name)}</h3>
        <p class="coach-card__role">${esc(c.role)}</p>
        <div class="coach-card__foot">
          <a class="coach-card__ig" href="https://instagram.com/${esc(c.ig)}" target="_blank" rel="noopener" aria-label="اینستاگرام ${esc(c.name)}">${icon("b-instagram")} @${esc(c.ig)}</a>
          <button type="button" class="link-arrow" data-coach="${c.id}">پروفایل ${icon("arrow-left")}</button>
        </div>
      </div>
    </article>`;

  ui.coachModal = (id) => {
    const c = D.coaches.find((x) => x.id === id);
    if (!c) return;
    modal.open({
      label: `پروفایل ${c.name}`,
      content: `<div class="coach-modal">
        ${img(c.img, { alt: c.name, sizes: "(max-width: 1023px) 100vw, 420px" })}
        <div class="coach-modal__body">
          <div class="row">${c.badges.map((b) => `<span class="badge latin">${esc(b)}</span>`).join("")}<span class="badge badge--accent">${esc(c.shift)}</span></div>
          <div><h2 class="h2">${esc(c.name)}</h2><p class="text-muted">${esc(c.role)} · <span class="latin" style="letter-spacing:.06em">${esc(c.en)}</span></p></div>
          <div class="coach-modal__stats">
            <div><b>${fa(c.years)}</b><span>سال تجربه</span></div>
            <div><b>${fa(c.clients)}+</b><span>شاگرد</span></div>
            <div><b>${fa(c.titles)}</b><span>عنوان قهرمانی</span></div>
          </div>
          <p>${esc(c.bio)}</p>
          <div><h3 class="h3" style="margin-block-end:10px">مدارک و افتخارات</h3><ul class="list-check">${c.certs.map((x) => `<li>${icon("badge-check")}<span>${esc(x)}</span></li>`).join("")}</ul></div>
          <div><h3 class="h3" style="margin-block-end:10px">تخصص‌ها</h3><div class="chips">${c.specialties.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div></div>
          <div class="row">
            <a class="btn btn--gold" href="contact.html?topic=pt&amp;coach=${c.id}#form">${icon("calendar")} رزرو جلسه با ${esc(c.name.split(" ")[0])}</a>
            <a class="btn btn--ghost" href="https://instagram.com/${esc(c.ig)}" target="_blank" rel="noopener">${icon("b-instagram")} اینستاگرام</a>
          </div>
        </div>
      </div>`,
    });
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-coach]");
    if (b) ui.coachModal(b.dataset.coach);
  });

  /* -------------------------------------------------------------- gallery */
  ui.gallery = (el, filterBar) => {
    const limit = parseInt(el.dataset.limit || "0", 10);
    const items = limit ? D.gallery.slice(0, limit) : D.gallery;
    el.innerHTML = items.map((g, i) => {
      const r = IA.IMGS[g.img] || [1200, 800];
      return `<button type="button" class="masonry__item" data-i="${i}" data-cat="${g.cat}" data-reveal="fade" aria-label="نمایش بزرگ: ${esc(g.cap)}">
        ${img(g.img, { small: true, alt: g.cap, sizes: "(max-width: 767px) 50vw, 25vw", style: `aspect-ratio:${r[0]}/${r[1]}` })}
        <span class="masonry__cap"><span>${esc(g.cap)}</span>${icon("maximize-2")}</span>
      </button>`;
    }).join("");
    const visible = () => $$(".masonry__item:not(.is-hidden)", el);
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".masonry__item");
      if (!b) return;
      const vis = visible();
      lightbox.open(vis.map((n) => { const g = items[+n.dataset.i]; return { src: `assets/img/${g.img}.webp`, alt: g.cap, caption: g.cap }; }), vis.indexOf(b));
    });
    if (filterBar) {
      filterBar.innerHTML = D.galleryCats.map((c, i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-filter="${c.id}">${esc(c.label)}</button>`).join("");
      filterBar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-filter]");
        if (!b) return;
        $$("[data-filter]", filterBar).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        $$(".masonry__item", el).forEach((n) => n.classList.toggle("is-hidden", b.dataset.filter !== "all" && n.dataset.cat !== b.dataset.filter));
      });
    }
  };

  /* -------------------------------------------------------------- pricing */
  ui.pricing = (el, billingBar) => {
    const P = D.pricing;
    let cycle = store.get("billing", "monthly");
    const render = () => {
      el.innerHTML = P.tiers.map((t) => {
        const yearly = cycle === "yearly";
        const perMonth = yearly ? t.monthly * (1 - P.yearlyDiscount) : t.monthly;
        return `<article class="price-card card card--hover tier-${t.id}${t.featured ? " price-card--featured" : ""}" data-reveal>
          ${t.featured ? `<span class="price-card__ribbon badge badge--solid">${icon("star")} محبوب‌ترین</span>` : ""}
          <div class="price-card__tier">
            <span class="price-card__gem">${icon(t.icon)}</span>
            <div><h3>${esc(t.name)}</h3><small>${t.en}</small></div>
          </div>
          <p class="text-muted">${esc(t.desc)}</p>
          <div class="price" aria-live="polite">
            <div class="price__amount"><b class="num">${money(perMonth / 1000)}</b><span>هزار تومان / ماه</span></div>
            ${yearly
              ? `<span class="price__old">${money(t.monthly * 12 / 1000)} هزار تومان در سال</span><span class="price__note">پرداخت سالانه: ${money(perMonth * 12 / 1000)} هزار تومان · ${money(t.monthly * 12 * P.yearlyDiscount / 1000)} هزار تومان صرفه‌جویی</span>`
              : `<span class="price__note">با عضویت سالانه ${fa(P.yearlyDiscount * 100)}٪ کمتر بپردازید</span>`}
          </div>
          <ul>${t.features.map(([f, on]) => `<li class="${on ? "" : "is-off"}">${icon(on ? "check" : "x")}<span>${esc(f)}</span></li>`).join("")}</ul>
          <a class="btn ${t.featured ? "btn--gold" : "btn--outline"} btn--block" href="contact.html?topic=membership&amp;plan=${t.id}#form">انتخاب پلن ${esc(t.name)}</a>
        </article>`;
      }).join("");
      reveal(el);
    };
    if (billingBar) {
      const sync = () => $$("[data-cycle]", billingBar).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cycle === cycle)));
      billingBar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cycle]");
        if (!b || b.dataset.cycle === cycle) return;
        cycle = b.dataset.cycle; store.set("billing", cycle); sync(); render();
        $$(".price-card", el).forEach((c) => c.classList.add("is-visible"));
      });
      sync();
    }
    render();
  };

  /* -------------------------------------------------------------- meal plan */
  ui.mealPlan = (el, plan) => {
    el.innerHTML = `<div class="accordion" data-single>${plan.map((d, i) => `
      <div class="acc${i === 0 ? " is-open" : ""}">
        <button type="button" class="acc__btn" aria-expanded="${i === 0}">
          <span class="meal-day__head"><span class="acc__num">${fa(i + 1)}</span><span>${esc(d.day)}</span><span class="meal-day__kcal">≈ ${money(d.total)} کیلوکالری</span></span>
          <span class="acc__icon">${icon("chevron-down")}</span>
        </button>
        <div class="acc__panel"><div><div class="acc__content"><div class="meals">
          ${d.meals.map((m) => `<div class="meal"><span class="meal__slot"><span>${esc(m.label)}</span>${icon(m.icon)}</span><span class="meal__name">${esc(m.text)}</span><span class="meal__kcal">≈ ${money(m.kcal)} کیلوکالری</span></div>`).join("")}
        </div></div></div></div>
      </div>`).join("")}</div>`;
  };

  /* -------------------------------------------------------------- workout plan */
  ui.workoutPlan = (el, plan, gender) => {
    const extra = gender === "female"
      ? "نکته برای بانوان: در فاز لوتئال (هفتهٔ پیش از قاعدگی) حجم تمرین را ۱۰ تا ۲۰٪ کاهش دهید و روی تکنیک تمرکز کنید."
      : "نکته برای آقایان: پیش از افزایش وزنه، دامنهٔ حرکتی کامل و تکنیک را تثبیت کنید؛ ایگو را پشت در باشگاه بگذارید.";
    el.innerHTML = `
      <div class="routine-head">
        <div class="stack" style="gap:6px"><span class="badge badge--accent">${icon("dumbbell")} برنامهٔ پیشنهادی</span><h3 class="h2">${esc(plan.title)}</h3><p class="text-muted">${esc(plan.sub)}</p></div>
      </div>
      <div class="plan-days">${plan.days.map((d) => `<div class="plan-day"><h4><span>${esc(d.d)}</span><span class="badge">${esc(d.f)}</span></h4><ul>${d.x.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>
      <ul class="list-check">${plan.tips.concat(extra).map((t) => `<li>${icon("sparkles")}<span>${esc(t)}</span></li>`).join("")}</ul>`;
  };

  /* -------------------------------------------------------------- motion loop (exercise "GIF") */
  const PATHS = {
    press: "M50 86 C47 62 47 38 50 14",
    squat: "M50 14 C56 40 56 60 50 86",
    pull: "M14 50 C38 44 62 44 86 50",
    curl: "M72 86 A62 62 0 0 1 28 20",
    raise: "M16 78 Q50 -8 84 78",
    hinge: "M22 26 Q34 82 84 84",
    crunch: "M24 82 Q30 34 78 22",
    run: "M50 16 A34 34 0 1 1 49.9 16",
    stretch: "M8 50 Q29 18 50 50 T92 50",
  };
  ui.motion = (type) => {
    const d = PATHS[type] || PATHS.press;
    const loop = type === "run";
    if (IA.reduced) return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="track" d="${d}"/><path class="trail" d="${d}"/></svg>`;
    const spline = 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" keyTimes="0;.5;1"';
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <path class="track" d="${d}"/>
      <path class="trail" d="${d}" pathLength="100" stroke-dasharray="${loop ? "28 72" : "100 100"}" stroke-dashoffset="100">
        ${loop ? '<animate attributeName="stroke-dashoffset" values="100;0" dur="1.6s" repeatCount="indefinite"/>' : `<animate attributeName="stroke-dashoffset" values="100;0;100" ${spline} dur="2.6s" repeatCount="indefinite"/>`}
      </path>
      <circle class="dot" r="5">
        ${loop ? `<animateMotion dur="1.6s" repeatCount="indefinite" path="${d}"/>` : `<animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;1;0" ${spline} path="${d}"/>`}
      </circle>
    </svg>`;
  };

  ui.exerciseCard = (x) => {
    const cat = D.exerciseCats.find((c) => c.id === x.cat);
    const im = IA.IMGS[cat.img] || [1200, 800];
    const src = IA.imgSrc(cat.img, true);
    return `<article class="exercise card card--hover" data-cat="${x.cat}" data-reveal>
      <div class="exercise__media">
        <img src="${src}" width="${im[0]}" height="${im[1]}" alt="" loading="lazy" decoding="async">
        <span class="exercise__tag badge badge--solid">${esc(cat.label)}</span>
        <div class="motion">${ui.motion(x.motion)}</div>
        <span class="exercise__loop">${icon("rotate-ccw")} RANGE OF MOTION</span>
      </div>
      <div class="exercise__body">
        <div class="exercise__title"><h3>${esc(x.fa)}</h3><span>${esc(x.en)}</span></div>
        <div class="exercise__specs">
          <span class="chip">${icon("list")} ${fa(x.sets)} ست × ${esc(x.reps)}</span>
          ${x.rest !== "—" ? `<span class="chip">${icon("timer")} ${esc(x.rest)}</span>` : ""}
        </div>
        <div class="row" style="justify-content:space-between">
          <span class="difficulty">${stars(x.level, 3)} ${levelLabel[x.level]}</span>
        </div>
        <div class="chips">${x.muscles.map((m) => `<span class="badge">${esc(m)}</span>`).join("")}</div>
        <p class="exercise__tip">${icon("info")}<span>${esc(x.tip)}</span></p>
      </div>
    </article>`;
  };

  /* -------------------------------------------------------------- forms */
  function submitForm(form, data, { subject, onDone }) {
    const btn = $("[type=submit]", form);
    if (btn) btn.classList.add("is-loading");
    const finish = (ok) => { if (btn) btn.classList.remove("is-loading"); onDone(ok); };
    if (endpointReady()) {
      fetch(CONFIG.formEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then((r) => finish(r.ok))
        .catch(() => finish(false));
    } else {
      // No backend configured → open the visitor's mail client with the message prefilled.
      const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setTimeout(() => finish(true), 400);
    }
  }

  function newsletter() {
    const form = $("[data-newsletter]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      const email = IA.en(form.email.value.trim());
      const done = () => {
        const list = store.get("newsletter", []);
        if (!list.includes(email)) list.push(email);
        store.set("newsletter", list);
        form.hidden = true;
        const ok = $("[data-newsletter-success]");
        ok.hidden = false;
        IA.lottieSuccess($("[data-lottie]", ok));
        toast({ title: "عضویت در خبرنامه با موفقیت انجام شد", msg: email });
      };
      if (endpointReady()) submitForm(form, { email, form: "newsletter" }, { subject: "Newsletter", onDone: (ok) => ok ? done() : toast({ type: "error", title: "ارسال ناموفق بود", msg: "لطفاً اتصال اینترنت را بررسی و دوباره تلاش کنید." }) });
      else done();
    });
  }

  /* -------------------------------------------------------------- testimonials */
  function quotes() {
    const box = $("[data-quotes]"), dots = $("[data-quote-dots]");
    if (!box) return;
    box.innerHTML = D.testimonials.map((t, i) => `
      <figure class="quote${i === 0 ? " is-active" : ""}" aria-hidden="${i !== 0}">
        <svg class="quote__mark" aria-hidden="true"><use href="#i-quote"></use></svg>
        <blockquote>«${esc(t.text)}»</blockquote>
        <figcaption class="quote__author">
          <span class="quote__avatar" style="display:grid;place-items:center;background:var(--gold-grad);color:#0a0a0a;font-weight:900">${esc(t.name.charAt(0))}</span>
          <span><b>${esc(t.name)}</b><span>${esc(t.meta)}</span></span>
        </figcaption>
        <div class="row">${stars(t.stars)}<span class="badge badge--accent">${icon("trophy")} ${esc(t.result)}</span></div>
      </figure>`).join("");
    dots.innerHTML = D.testimonials.map((t, i) => `<button type="button" aria-label="نظر ${fa(i + 1)}: ${esc(t.name)}" aria-current="${i === 0}"></button>`).join("");
    const qs = $$(".quote", box), ds = $$("button", dots);
    let i = 0, timer;
    const show = (n) => {
      i = (n + qs.length) % qs.length;
      qs.forEach((q, k) => { q.classList.toggle("is-active", k === i); q.setAttribute("aria-hidden", String(k !== i)); });
      ds.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
    };
    const play = () => { if (!IA.reduced) { clearInterval(timer); timer = setInterval(() => show(i + 1), 6500); } };
    ds.forEach((d, k) => d.addEventListener("click", () => { show(k); play(); }));
    [box, dots].forEach((n) => { n.addEventListener("mouseenter", () => clearInterval(timer)); n.addEventListener("mouseleave", play); n.addEventListener("focusin", () => clearInterval(timer)); });
    play();
  }

  function beforeAfter() {
    $$("[data-ba]").forEach((ba) => {
      const r = $("input[type=range]", ba);
      const set = () => ba.style.setProperty("--ba", r.value + "%");
      r.addEventListener("input", set); set();
    });
  }

  /* -------------------------------------------------------------- split / wings */
  function split() {
    const s = $("[data-split-panels]");
    if (!s) return;
    const fine = matchMedia("(min-width: 768px) and (hover: hover)");
    s.addEventListener("mousemove", (e) => {
      if (!fine.matches) return;
      const r = s.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      s.style.setProperty("--pos", IA.clamp(0.5 + (0.5 - x) * 0.9, 0.28, 0.72).toFixed(3));
    });
    s.addEventListener("mouseleave", () => s.style.setProperty("--pos", "0.5"));
    $$("[data-wing]", s).forEach((b) => b.addEventListener("click", () => wingModal(b.dataset.wing)));
  }
  function wingModal(g) {
    const male = g === "male";
    const list = male
      ? ["سالن ۸۰۰ متری وزنه با تجهیزات Hammer Strength و Eleiko", "رینگ MMA، قفس اکتاگون و سالن بوکس", "زون کراس‌فیت با ریگ اختصاصی", "سونای خشک و بخار، جکوزی و استخر آب سرد", "رختکن VIP با کمد هوشمند"]
      : ["پرایوت استودیو با ورودی و رختکن کاملاً مستقل", "تمام مربیان، کارکنان و ماساژورها خانم هستند", "سالن هوازی اختصاصی بانوان با چشم‌انداز", "کلاس‌های پیلاتس، یوگا و فانکشنال گروه‌های کوچک", "سونا و اسپای اختصاصی بانوان"];
    const team = D.coaches.filter((c) => c.gender === g);
    const m = modal.open({
      label: male ? "بخش آقایان" : "بخش بانوان",
      cls: "wing-modal",
      content: `${img(male ? "men-section" : "women-section", { sizes: "980px", style: "aspect-ratio:21/9", alt: male ? "بخش آقایان" : "بخش بانوان" })}
        <div class="modal__body">
          <span class="badge badge--accent latin">${male ? "MEN'S ARENA" : "WOMEN'S STUDIO"}</span>
          <h2 class="h2">${male ? "بخش آقایان" : "بخش بانوان"}</h2>
          <ul class="list-check">${list.map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}</ul>
          <div><h3 class="h3" style="margin-block-end:12px">تیم مربیان این بخش</h3>
            <div class="row">${team.map((c) => `<button type="button" class="chip" data-coach="${c.id}">${esc(c.name)}</button>`).join("")}</div></div>
          <div class="row">
            <a class="btn btn--gold" href="contact.html?topic=booking&amp;gender=${g}#form">${icon("calendar")} رزرو بازدید رایگان</a>
            <button type="button" class="btn btn--ghost" data-activate-gender="${g}">فعال‌سازی حالت ${male ? "آقایان" : "بانوان"}</button>
          </div>
        </div>`,
    });
    $("[data-activate-gender]", m).addEventListener("click", (e) => { IA.setGender(g, e); m.close(); });
    $$("[data-coach]", m).forEach((b) => b.addEventListener("click", () => m.close()));
  }

  /* -------------------------------------------------------------- virtual tour */
  function tour() {
    const btn = $("[data-tour-open]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const T = D.tour;
      const m = modal.open({
        label: "تور مجازی باشگاه",
        content: `<div class="tour" data-tourbox>
          <div class="tour__progress">${T.map(() => "<span><i></i></span>").join("")}</div>
          ${T.map((s, i) => `<div class="tour__slide${i === 0 ? " is-active" : ""}"><img src="assets/img/${s.img}.webp" alt="${esc(s.t)}" loading="${i < 2 ? "eager" : "lazy"}"></div>`).join("")}
          <div class="tour__cap"><div><span class="eyebrow latin">VIRTUAL TOUR</span><h3 data-tour-title></h3><p data-tour-desc style="color:rgba(245,245,245,.75)"></p></div>
            <div class="row"><button type="button" class="icon-btn" style="color:#fff" data-tour-prev aria-label="قبلی">${icon("chevron-right")}</button><button type="button" class="icon-btn" style="color:#fff" data-tour-next aria-label="بعدی">${icon("chevron-left")}</button></div></div>
        </div>`,
        onClose: () => clearTimeout(timer),
      });
      const slides = $$(".tour__slide", m), bars = $$(".tour__progress span", m);
      let i = 0, timer;
      const show = (n) => {
        i = (n + T.length) % T.length;
        slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
        bars.forEach((b, k) => { b.classList.toggle("is-done", k < i); b.classList.remove("is-active"); });
        void bars[i].offsetWidth; bars[i].classList.add("is-active");
        $("[data-tour-title]", m).textContent = T[i].t;
        $("[data-tour-desc]", m).textContent = T[i].d;
        clearTimeout(timer);
        timer = setTimeout(() => show(i + 1), 5000);
      };
      $("[data-tour-next]", m).addEventListener("click", () => show(i + 1));
      $("[data-tour-prev]", m).addEventListener("click", () => show(i - 1));
      m.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(i + 1); if (e.key === "ArrowRight") show(i - 1); });
      show(0);
    });
  }

  /* -------------------------------------------------------------- shift status (Tehran time) */
  function shiftStatus() {
    const cards = $$("[data-shift]");
    if (!cards.length) return;
    let h, wd;
    try {
      const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "numeric", minute: "numeric", weekday: "short", hour12: false }).formatToParts(new Date());
      const get = (t) => (p.find((x) => x.type === t) || {}).value;
      h = parseInt(get("hour"), 10) + parseInt(get("minute"), 10) / 60; wd = get("weekday");
    } catch (e) { return; }
    const hours = wd === "Fri" ? { morning: [8, 12], evening: null } : wd === "Thu" ? { morning: [7, 12], evening: [16, 21] } : { morning: [6, 12], evening: [16, 23] };
    cards.forEach((c) => {
      const b = $("[data-shift-status]", c), r = hours[c.dataset.shift];
      if (!b) return;
      b.hidden = false;
      if (!r) { b.textContent = "جمعه‌ها تعطیل"; return; }
      if (h >= r[0] && h < r[1]) { b.className = "badge badge--live"; b.textContent = "هم‌اکنون باز است"; }
      else b.textContent = h < r[0] ? `امروز از ساعت ${fa(r[0])}` : "فردا منتظرتان هستیم";
    });
  }

  /* -------------------------------------------------------------- carousel */
  function carousel() {
    const track = $("[data-coach-carousel]");
    if (!track) return;
    track.innerHTML = D.coaches.map(ui.coachCard).join("");
    const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 24 : 300);
    const next = $("[data-carousel-next]"), prev = $("[data-carousel-prev]");
    if (next) next.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: IA.reduced ? "auto" : "smooth" }));
    if (prev) prev.addEventListener("click", () => track.scrollBy({ left: step(), behavior: IA.reduced ? "auto" : "smooth" }));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); track.scrollBy({ left: -step() }); }
      if (e.key === "ArrowRight") { e.preventDefault(); track.scrollBy({ left: step() }); }
    });
  }

  /* ================================================================== */
  /* PAGE CONTROLLERS                                                    */
  /* ================================================================== */
  IA.pages.home = () => {
    const pg = $("[data-programs]"); if (pg) ui.programCards(pg);
    carousel();
    const gal = $("[data-gallery]"); if (gal) ui.gallery(gal);
    const pr = $("[data-pricing]"); if (pr) ui.pricing(pr, $("[data-billing]"));
    const bp = $("[data-blog-preview]");
    if (bp && window.IA_BLOG && IA.postCard) bp.innerHTML = window.IA_BLOG.slice(0, 3).map(IA.postCard).join("");
    quotes(); beforeAfter(); split(); tour(); shiftStatus(); newsletter();
  };

  IA.pages.programs = () => {
    // exercise library
    const bar = $("[data-ex-filters]"), grid = $("[data-ex-grid]"), count = $("[data-ex-count]");
    bar.innerHTML = `<button type="button" class="chip" aria-pressed="true" data-ex="all">همه</button>` +
      D.exerciseCats.map((c) => `<button type="button" class="chip" aria-pressed="false" data-ex="${c.id}">${esc(c.label)}</button>`).join("");
    grid.innerHTML = D.exercises.map(ui.exerciseCard).join("");
    const apply = (cat) => {
      let n = 0;
      $$(".exercise", grid).forEach((x) => { const on = cat === "all" || x.dataset.cat === cat; x.hidden = !on; if (on) { n++; x.classList.add("is-visible"); } });
      count.textContent = `${fa(n)} حرکت`;
    };
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ex]");
      if (!b) return;
      $$("[data-ex]", bar).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply(b.dataset.ex);
    });
    apply("all");

    // ready-made routines
    const tabBar = $("[data-routine-tabs]"), panels = $("[data-routine-panels]");
    tabBar.innerHTML = D.routines.map((r, i) => `<button type="button" class="chip" role="tab" data-tab="${r.id}" aria-selected="${i === 0}" aria-controls="routine-${r.id}" id="tab-${r.id}">${esc(r.title)}</button>`).join("");
    panels.innerHTML = D.routines.map((r, i) => `
      <section class="tab-panel routine" role="tabpanel" data-panel="${r.id}" id="routine-${r.id}" aria-labelledby="tab-${r.id}"${i ? " hidden" : ""}>
        <div class="routine-head">
          <div class="stack" style="gap:6px"><h3 class="h2">${esc(r.title)}</h3><p class="text-muted">${esc(r.sub)}</p></div>
          <div class="row no-print">
            <button type="button" class="btn btn--gold btn--sm" data-print="one">${icon("printer")} چاپ این برنامه</button>
            <button type="button" class="btn btn--outline btn--sm" data-print="all">${icon("download")} چاپ همهٔ برنامه‌ها</button>
          </div>
        </div>
        <div class="table-wrap"><table class="routine-table">
          <caption class="sr-only">جدول هفتگی برنامهٔ ${esc(r.title)}</caption>
          <thead><tr><th scope="col">روز</th><th scope="col">تمرکز</th><th scope="col">حرکات (ست × تکرار)</th></tr></thead>
          <tbody>${r.days.map((d) => `<tr><td>${esc(d.d)}</td><td>${d.rest ? `<span class="rest">${esc(d.f)}</span>` : `<span class="badge">${esc(d.f)}</span>`}</td><td>${d.x.map(esc).join(" · ")}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="disclaimer" style="margin-block-start:20px">${icon("info")}<span>${esc(r.note)}</span></p>
      </section>`).join("");
    const activate = IA.tabs(tabBar, panels);
    panels.addEventListener("click", (e) => {
      const b = e.target.closest("[data-print]");
      if (!b) return;
      document.body.classList.toggle("print-all", b.dataset.print === "all");
      window.print();
    });
    window.addEventListener("afterprint", () => document.body.classList.remove("print-all"));
    const fromHash = () => { const m = location.hash.match(/^#routine-(\w+)/); if (m && D.routines.some((r) => r.id === m[1])) { activate(m[1]); $("#routines").scrollIntoView(); } };
    fromHash(); window.addEventListener("hashchange", fromHash);
  };

  IA.pages.diet = () => {
    // reference profiles per BMI group (so plans are realistic for each tab)
    const PROFILES = {
      male: { under: { kg: 56, cm: 178 }, normal: { kg: 74, cm: 178 }, over: { kg: 88, cm: 178 }, ob1: { kg: 104, cm: 178 } },
      female: { under: { kg: 47, cm: 164 }, normal: { kg: 58, cm: 164 }, over: { kg: 72, cm: 164 }, ob1: { kg: 88, cm: 164 } },
    };
    const TABS = [{ id: "under", label: "کمبود وزن" }, { id: "normal", label: "وزن نرمال" }, { id: "over", label: "اضافه وزن" }, { id: "ob1", label: "چاقی" }];
    const bar = $("[data-diet-tabs]"), sum = $("[data-diet-summary]"), out = $("[data-diet-plan]");
    let current = store.get("diet-tab", "normal");
    bar.innerHTML = TABS.map((t) => `<button type="button" class="chip" role="tab" data-tab="${t.id}" aria-selected="${t.id === current}">${esc(t.label)}</button>`).join("");
    const render = () => {
      const g = IA.gender();
      const p = PROFILES[g][current];
      const T = D.calc.targets({ gender: g, kg: p.kg, cm: p.cm, age: 30, act: 1.55 });
      const plan = D.mealPlan({ goal: T.cat.goal, kcal: T.kcal, seed: current.length });
      const goalLabel = { bulk: "افزایش وزن سالم (مازاد ۴۰۰ کالری)", maintain: "حفظ وزن و ترکیب بدنی", cut: "کاهش چربی (کسری ۵۰۰ کالری)", safe: "کاهش وزن ایمن و پایدار" }[T.cat.goal];
      sum.innerHTML = `
        <div class="stat card"><span class="stat__icon">${icon("flame")}</span><b class="num">${money(T.kcal)}</b><small>کیلوکالری روزانه</small></div>
        <div class="stat card"><span class="stat__icon">${icon("beef")}</span><b class="num">${fa(T.protein)} گرم</b><small>پروتئین</small></div>
        <div class="stat card"><span class="stat__icon">${icon("wheat")}</span><b class="num">${fa(T.carbs)} گرم</b><small>کربوهیدرات</small></div>
        <div class="stat card"><span class="stat__icon">${icon("droplets")}</span><b class="num">${fa(T.fat)} گرم</b><small>چربی</small></div>`;
      $("[data-diet-goal]").textContent = `${goalLabel} · نمونه برای ${g === "female" ? "خانم" : "آقای"} ۳۰ ساله با قد ${fa(p.cm)} و وزن ${fa(p.kg)} کیلوگرم`;
      ui.mealPlan(out, plan);
    };
    IA.tabs(bar, document.createElement("div"), (id) => { current = id; store.set("diet-tab", id); render(); });
    document.addEventListener("ia:gender", render);
    render();

    // supplements
    $("[data-supps]").innerHTML = D.supplements.map((s, i) => `
      <div class="acc${i === 0 ? " is-open" : ""}">
        <button type="button" class="acc__btn" aria-expanded="${i === 0}"><span class="acc__num">${icon(s.icon)}</span><span>${esc(s.name)} <span class="latin text-muted" style="font-size:.9rem">${esc(s.en)}</span></span><span class="acc__icon">${icon("chevron-down")}</span></button>
        <div class="acc__panel"><div><div class="acc__content">
          <p>${esc(s.what)}</p>
          <ul class="list-check"><li>${icon("scale")}<span><strong>مقدار مصرف:</strong> ${esc(s.dose)}</span></li><li>${icon("clock")}<span><strong>زمان مصرف:</strong> ${esc(s.when)}</span></li><li>${icon("triangle-alert")}<span><strong>نکته:</strong> ${esc(s.note)}</span></li></ul>
        </div></div></div>
      </div>`).join("");

    // water calculator
    const wf = $("[data-water]");
    const saved = store.get("water", null);
    if (saved) { wf.weight.value = saved.w; wf.minutes.value = saved.m; wf.climate.value = saved.c; }
    const water = (notify) => {
      const w = parseFloat(IA.en(wf.weight.value)), m = parseFloat(IA.en(wf.minutes.value || "0")) || 0, hot = wf.climate.value === "hot";
      const liters = w * 0.033 + (m / 30) * 0.35 + (hot ? 0.5 : 0);
      const glasses = fa(Math.ceil(liters / 0.25));
      store.set("water", { w, m, c: wf.climate.value });
      $("[data-water-fill]").style.height = `${IA.clamp((liters / 5) * 100, 8, 100)}%`;
      $("[data-water-l]").textContent = num(liters, 1);
      $("[data-water-g]").textContent = glasses;
      if (notify) toast({ title: `روزانه ${num(liters, 1)} لیتر آب بنوشید`, msg: `معادل ${glasses} لیوان ۲۵۰ میلی‌لیتری` });
    };
    wf.addEventListener("submit", (e) => { e.preventDefault(); if (validate(wf)) water(true); });
    if (saved) water(false);
  };

  IA.pages.coaches = () => {
    const grid = $("[data-coaches-grid]"), bar = $("[data-coach-filters]");
    grid.innerHTML = D.coaches.map(ui.coachCard).join("");
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cf]");
      if (!b) return;
      $$("[data-cf]", bar).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$(".coach-card", grid).forEach((c) => {
        const co = D.coaches.find((x) => "coach-" + x.id === c.id);
        c.hidden = b.dataset.cf !== "all" && co.gender !== b.dataset.cf;
        c.classList.add("is-visible");
      });
    });
    const m = location.hash.match(/^#coach-(\w+)/);
    if (m) setTimeout(() => ui.coachModal(m[1]), 400);
  };

  IA.pages.pricing = () => {
    ui.pricing($("[data-pricing]"), $("[data-billing]"));
    const P = D.pricing;
    const cell = (v) => v === 1 ? `<span class="yes">${icon("circle-check")}<span class="sr-only">دارد</span></span>` : v === 0 ? `<span class="no">${icon("minus")}<span class="sr-only">ندارد</span></span>` : esc(v);
    $("[data-compare]").innerHTML = `<caption class="sr-only">مقایسهٔ امکانات پلن‌ها</caption>
      <thead><tr><th scope="col">امکانات</th>${P.tiers.map((t) => `<th scope="col" class="${t.featured ? "is-featured" : ""}">${esc(t.name)}</th>`).join("")}</tr></thead>
      <tbody>${P.compare.map((r) => r.group ? `<tr class="group"><td colspan="4">${esc(r.group)}</td></tr>` : `<tr><th scope="row" style="font-weight:500;text-align:start">${esc(r.f)}</th>${r.v.map((v) => `<td>${cell(v)}</td>`).join("")}</tr>`).join("")}</tbody>`;
    $("[data-faq]").innerHTML = P.faq.map((f, i) => `
      <div class="acc${i === 0 ? " is-open" : ""}" data-reveal>
        <button type="button" class="acc__btn" aria-expanded="${i === 0}"><span>${esc(f.q)}</span><span class="acc__icon">${icon("chevron-down")}</span></button>
        <div class="acc__panel"><div><div class="acc__content"><p>${esc(f.a)}</p></div></div></div>
      </div>`).join("");
  };

  IA.pages.gallery = () => ui.gallery($("[data-gallery]"), $("[data-gallery-filters]"));

  IA.pages.contact = () => {
    const form = $("[data-contact]");
    const q = new URLSearchParams(location.search);
    const topicMap = { booking: "booking", morning: "morning", evening: "evening", pt: "pt", membership: "membership" };
    if (topicMap[q.get("topic")]) form.topic.value = topicMap[q.get("topic")];
    if (q.get("topic") === "morning") $("#shift-m").checked = true;
    if (q.get("topic") === "evening") $("#shift-e").checked = true;
    const g = q.get("gender") || IA.gender();
    const gEl = $(`#g-${g === "female" ? "f" : "m"}`); if (gEl) gEl.checked = true;
    const coach = D.coaches.find((c) => c.id === q.get("coach"));
    const plan = D.pricing.tiers.find((t) => t.id === q.get("plan"));
    if (coach) form.message.value = `مایلم یک جلسهٔ تمرین خصوصی با ${coach.name} رزرو کنم.`;
    if (plan) form.message.value = `مایلم دربارهٔ پلن عضویت ${plan.name} اطلاعات بیشتری دریافت کنم.`;
    const draft = store.get("contact-draft", null);
    if (draft && !coach && !plan) { ["name", "phone", "email"].forEach((k) => { if (draft[k]) form[k].value = draft[k]; }); }
    form.addEventListener("input", () => store.set("contact-draft", { name: form.name.value, phone: form.phone.value, email: form.email.value }));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      const data = {
        "نام": form.name.value.trim(), "موبایل": IA.en(form.phone.value.trim()), "ایمیل": form.email.value.trim() || "—",
        "موضوع": form.topic.options[form.topic.selectedIndex].text,
        "بخش": (form.querySelector("[name=gender]:checked") || {}).value || "—",
        "سانس": (form.querySelector("[name=shift]:checked") || {}).value || "—",
        "پیام": form.message.value.trim() || "—",
      };
      submitForm(form, data, {
        subject: "درخواست از وب‌سایت آیرون آرنا — " + data["موضوع"],
        onDone: (ok) => {
          if (!ok) { toast({ type: "error", title: "ارسال پیام ناموفق بود", msg: "لطفاً دوباره تلاش کنید یا با شمارهٔ ۰۲۱۲۲۰۰۰۰۰۰ تماس بگیرید." }); return; }
          form.hidden = true;
          const s = $("[data-contact-success]"); s.hidden = false;
          IA.lottieSuccess($("[data-lottie]", s));
          store.set("contact-draft", null);
          toast({ title: "درخواست شما ثبت شد", msg: endpointReady() ? "کارشناسان ما حداکثر تا ۲ ساعت کاری آینده با شما تماس می‌گیرند." : "پیام در برنامهٔ ایمیل شما آماده شد؛ کافی است آن را ارسال کنید." });
        },
      });
    });
    const again = $("[data-contact-again]");
    if (again) again.addEventListener("click", () => { form.reset(); form.hidden = false; $("[data-contact-success]").hidden = true; });
    newsletter();
  };
})();
