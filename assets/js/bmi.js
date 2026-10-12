/* ==========================================================================
   IRON ARENA — bmi.js
   BMI (WHO classes) · BMR (Mifflin-St Jeor) · TDEE · ideal weight · macros
   Chart.js half-doughnut gauge with animated needle + macros doughnut
   7-day Persian meal plan · goal-based workout plan · PDF (jsPDF + html2canvas,
   lazy-loaded) · mailto summary · inputs persisted in localStorage
   ========================================================================== */
(function () {
  "use strict";
  const IA = window.IA, D = window.IA_DATA;
  if (!IA || !D) return;
  const { $, $$, fa, en, money, num, esc, store, toast, validate, icon, clamp } = IA;

  const GAUGE_MIN = 15, GAUGE_MAX = 45;
  const GOAL_TEXT = {
    bulk: "هدف: افزایش وزن سالم با مازاد ۴۰۰ کالری",
    maintain: "هدف: حفظ وزن و بهبود ترکیب بدنی",
    cut: "هدف: کاهش چربی با کسری ۵۰۰ کالری (حدود نیم کیلو در هفته)",
    safe: "هدف: کاهش وزن ایمن و پایدار با کسری معتدل کالری",
  };
  const CAT_TEXT = {
    under: "وزن شما کمتر از محدودهٔ سالم است. با مازاد کالری کنترل‌شده و تمرین مقاومتی، وزن را به‌صورت عضله اضافه کنید، نه چربی.",
    normal: "عالی است! وزن شما در محدودهٔ سالم قرار دارد. حالا تمرکز را روی افزایش قدرت، عضله‌سازی و بهبود ترکیب بدنی بگذارید.",
    over: "کمی بالاتر از محدودهٔ سالم هستید. با کسری ۵۰۰ کالری و ۳ تا ۵ جلسه تمرین در هفته، کاهش نیم کیلوگرم در هفته کاملاً دست‌یافتنی است.",
    ob1: "در این محدوده ریسک بیماری‌های قلبی و متابولیک افزایش می‌یابد. تمرین کم‌فشار، پیاده‌روی روزانه و کسری کالری معتدل بهترین شروع است.",
    ob2: "سلامت مفاصل و قلب در اولویت است. پیش از شروع تمرینات شدید با پزشک مشورت کنید و با پیاده‌روی و تمرینات کم‌فشار شروع کنید.",
    ob3: "توصیهٔ جدی ما مشورت با پزشک پیش از شروع است. با برنامهٔ کم‌فشار، صبر و پیگیری منظم، تغییرات بزرگ کاملاً ممکن است.",
  };
  const ACT_FA = Object.fromEntries(D.activity.map((a) => [a.id, a.label]));

  const form = $("[data-bmi-form]"), results = $("[data-results]");
  if (!form) return;
  const actSel = $("[data-activity]");
  actSel.innerHTML = D.activity.map((a) => `<option value="${a.id}"${a.id === "moderate" ? " selected" : ""}>${esc(a.label)}</option>`).join("");

  let state = null, seed = 0, gaugeChart = null, macroChart = null;

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fontFamily = () => getComputedStyle(document.body).fontFamily;

  /* ------------------------------------------------------------ restore */
  const saved = store.get("bmi", null);
  const setRadio = (g) => { const r = form.querySelector(`input[name="gender"][value="${g}"]`); if (r) r.checked = true; };
  if (saved) {
    setRadio(saved.gender);
    form.age.value = fa(saved.age); form.height.value = fa(saved.cm); form.weight.value = fa(saved.kg);
    if (ACT_FA[saved.act]) actSel.value = saved.act;
  } else setRadio(IA.gender());

  /* ------------------------------------------------------------ charts */
  const needlePlugin = {
    id: "needle",
    afterDatasetsDraw(chart) {
      const arc = chart.getDatasetMeta(0).data[0];
      if (!arc) return;
      const { ctx } = chart, { x, y, outerRadius: R, innerRadius: r } = arc;
      const v = chart.$needle == null ? GAUGE_MIN : chart.$needle;
      const a = Math.PI + ((clamp(v, GAUGE_MIN, GAUGE_MAX) - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * Math.PI;
      const len = R - 4, txt = css("--text-primary") || "#f5f5f5", gold = css("--accent-gold") || "#D4AF37";
      ctx.save();
      // tick labels
      ctx.fillStyle = css("--text-muted") || "#9CA3AF";
      ctx.font = `600 ${Math.max(10, R * 0.075)}px ${fontFamily()}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      [18.5, 25, 30, 35, 40].forEach((t) => {
        const ta = Math.PI + ((t - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * Math.PI;
        ctx.fillText(fa(t).replace(".", "٫"), x + Math.cos(ta) * (r - R * 0.13), y + Math.sin(ta) * (r - R * 0.13));
      });
      // needle
      ctx.translate(x, y); ctx.rotate(a);
      ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(len, -1.2); ctx.lineTo(len, 1.2); ctx.lineTo(0, 5); ctx.closePath();
      ctx.fillStyle = txt; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fillStyle = css("--bg-primary") || "#0A0A0A"; ctx.fill();
      ctx.restore();
    },
  };

  function drawGauge(bmi) {
    const cats = Object.values(D.bmiCats);
    const bounds = [GAUGE_MIN, 18.5, 25, 30, 35, 40, GAUGE_MAX];
    const data = bounds.slice(1).map((b, i) => b - bounds[i]);
    if (!gaugeChart) {
      gaugeChart = new window.Chart($("[data-gauge]"), {
        type: "doughnut",
        data: { labels: cats.map((c) => c.label), datasets: [{ data, backgroundColor: cats.map((c) => c.color), borderWidth: 0, spacing: 3, borderRadius: 3 }] },
        options: {
          rotation: -90, circumference: 180, cutout: "70%", responsive: true, maintainAspectRatio: false,
          layout: { padding: { top: 8, left: 8, right: 8, bottom: 14 } },
          events: [], animation: IA.reduced ? false : { duration: 700 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
        },
        plugins: [needlePlugin],
      });
    }
    // animate needle
    const from = gaugeChart.$needle == null ? GAUGE_MIN : gaugeChart.$needle, to = bmi;
    if (IA.reduced) { gaugeChart.$needle = to; gaugeChart.draw(); return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), c1 = 1.1, e = 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); // easeOutBack
      gaugeChart.$needle = from + (to - from) * e;
      gaugeChart.draw();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function drawMacros(T) {
    const cols = [css("--accent-gold") || "#D4AF37", css("--accent") || "#E11D2E", "#8b8f99"];
    const kc = [T.protein * 4, T.carbs * 4, T.fat * 9];
    const labels = ["پروتئین", "کربوهیدرات", "چربی"];
    if (macroChart) macroChart.destroy();
    macroChart = new window.Chart($("[data-macros]"), {
      type: "doughnut",
      data: { labels, datasets: [{ data: kc, backgroundColor: cols, borderWidth: 0, spacing: 4, borderRadius: 6, hoverOffset: 8 }] },
      options: {
        cutout: "64%", responsive: true, maintainAspectRatio: false, animation: IA.reduced ? false : { duration: 900 },
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true, textDirection: "rtl", bodyFont: { family: fontFamily() }, titleFont: { family: fontFamily() },
            callbacks: { label: (c) => ` ${labels[c.dataIndex]}: ${money(c.raw)} کیلوکالری` },
          },
        },
      },
    });
    const total = kc.reduce((a, b) => a + b, 0);
    const grams = [T.protein, T.carbs, T.fat];
    $("[data-macro-list]").innerHTML = labels.map((l, i) => {
      const pct = Math.round((kc[i] / total) * 100);
      return `<div class="macro">
        <span class="macro__dot" style="background:${cols[i]}"></span>
        <span><b>${l}</b> <span class="text-muted small">· ${fa(pct)}٪</span></span>
        <span class="num"><b>${fa(grams[i])}</b> <span class="text-muted small">گرم</span></span>
        <span class="macro__bar"><span style="background:${cols[i]};transform:scaleX(${pct / 100})"></span></span>
      </div>`;
    }).join("");
  }

  /* ------------------------------------------------------------ render */
  function renderPlan() {
    const plan = D.mealPlan({ goal: state.T.cat.goal, kcal: state.T.kcal, seed });
    state.plan = plan;
    IA.ui.mealPlan($("[data-meal-plan]"), plan);
  }

  function render(input, { scroll = false } = {}) {
    const T = D.calc.targets({ gender: input.gender, kg: input.kg, cm: input.cm, age: input.age, act: D.activity.find((a) => a.id === input.act).f });
    state = { input, T };
    results.classList.remove("is-empty");

    $("[data-bmi-value]").textContent = num(T.bmi, 1);
    const lab = $("[data-bmi-label]");
    lab.textContent = T.cat.label; lab.style.color = T.cat.color;
    $("[data-bmi-text]").textContent = CAT_TEXT[T.cat.key];
    $("[data-gauge]").setAttribute("aria-label", `شاخص توده بدنی شما ${num(T.bmi, 1)} است؛ در دستهٔ ${T.cat.label}`);
    $('[data-out="bmr"]').textContent = money(T.bmr);
    $('[data-out="tdee"]').textContent = money(T.tdee);
    $('[data-out="kcal"]').textContent = money(T.kcal);
    $('[data-out="ideal"]').textContent = `${fa(Math.round(T.ideal[0]))} – ${fa(Math.round(T.ideal[1]))}`;
    $("[data-goal-text]").textContent = `${GOAL_TEXT[T.cat.goal]} · مجموع ${money(T.kcal)} کیلوکالری در روز`;
    $("[data-plan-sub]").textContent = `۶ وعده در روز با غذاهای ایرانی · میانگین ${money(T.kcal)} کیلوکالری · ${input.gender === "female" ? "بانوان" : "آقایان"}`;

    // charts need the panel visible before measuring
    requestAnimationFrame(() => { drawGauge(T.bmi); drawMacros(T); });
    seed = 0; renderPlan();
    IA.ui.workoutPlan($("[data-workout]"), D.workoutPlans[T.cat.goal], input.gender);
    IA.reveal(results); IA.media(results);
    if (scroll) {
      const top = results.getBoundingClientRect().top + scrollY - 100;
      scrollTo({ top, behavior: IA.reduced ? "auto" : "smooth" });
    }
  }

  const read = () => ({
    gender: (form.querySelector('input[name="gender"]:checked') || {}).value || "male",
    age: Math.round(parseFloat(en(form.age.value))),
    cm: parseFloat(en(form.height.value)),
    kg: parseFloat(en(form.weight.value)),
    act: actSel.value,
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    const input = read();
    store.set("bmi", input);
    render(input, { scroll: true });
    toast({ title: "برنامهٔ شما آماده است", msg: `شاخص توده بدنی: ${num(state.T.bmi, 1)} · ${state.T.cat.label}` });
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      store.set("bmi", null);
      setRadio(IA.gender()); actSel.value = "moderate";
      $$(".field.is-invalid", form).forEach((f) => f.classList.remove("is-invalid"));
      results.classList.add("is-empty");
      if (macroChart) { macroChart.destroy(); macroChart = null; }
      if (gaugeChart) { gaugeChart.destroy(); gaugeChart = null; }
      state = null;
    });
  });

  $("[data-reshuffle]").addEventListener("click", () => {
    if (!state) return;
    seed += 1; renderPlan();
    toast({ title: "منوی تازه آماده شد", msg: "کالری و درشت‌مغذی‌ها ثابت ماند؛ فقط غذاها تغییر کرد." });
  });

  // re-colour charts when theme / accent change
  const recolor = () => { if (!state) return; if (gaugeChart) gaugeChart.draw(); drawMacros(state.T); };
  document.addEventListener("ia:theme", recolor);
  document.addEventListener("ia:gender", recolor);

  /* ------------------------------------------------------------ PDF */
  function pdfSheet() {
    const { input, T, plan } = state;
    const wp = D.workoutPlans[T.cat.goal];
    const today = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
    const el = document.createElement("div");
    el.className = "pdf-sheet";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="pdf-head" data-pdf-block><div><b>IRON ARENA</b><small>باشگاه بدنسازی لاکچری آیرون آرنا</small></div><div style="text-align:left"><strong>برنامهٔ اختصاصی تغذیه و تمرین</strong><small>${today}</small></div></div>
      <div class="pdf-block" data-pdf-block>
        <h2 class="pdf-title">مشخصات و نتایج</h2>
        <p style="margin:0 0 10px;color:#52525b">${input.gender === "female" ? "خانم" : "آقا"} · ${fa(input.age)} ساله · قد ${fa(input.cm)} سانتی‌متر · وزن ${fa(input.kg)} کیلوگرم · فعالیت: ${esc(ACT_FA[input.act])}</p>
        <div class="pdf-grid">
          <div class="pdf-box"><span>شاخص توده بدنی</span><b>${num(T.bmi, 1)}</b> <span style="display:inline;color:${T.cat.color};font-weight:700">${T.cat.label}</span></div>
          <div class="pdf-box"><span>BMR · کالری پایه</span><b>${money(T.bmr)}</b></div>
          <div class="pdf-box"><span>TDEE · مصرف روزانه</span><b>${money(T.tdee)}</b></div>
          <div class="pdf-box"><span>کالری هدف</span><b style="color:#a16207">${money(T.kcal)}</b></div>
          <div class="pdf-box"><span>وزن ایده‌آل</span><b>${fa(Math.round(T.ideal[0]))} – ${fa(Math.round(T.ideal[1]))}</b> <span style="display:inline">کیلوگرم</span></div>
          <div class="pdf-box"><span>پروتئین</span><b>${fa(T.protein)}</b> <span style="display:inline">گرم</span></div>
          <div class="pdf-box"><span>کربوهیدرات</span><b>${fa(T.carbs)}</b> <span style="display:inline">گرم</span></div>
          <div class="pdf-box"><span>چربی</span><b>${fa(T.fat)}</b> <span style="display:inline">گرم</span></div>
        </div>
        <p style="margin:10px 0 0;color:#52525b">${esc(GOAL_TEXT[T.cat.goal])}</p>
      </div>
      <div class="pdf-block" data-pdf-block style="padding-bottom:0"><h2 class="pdf-title">برنامهٔ غذایی ۷ روزه</h2></div>
      ${plan.map((d) => `<div class="pdf-block" data-pdf-block style="padding-block:6px">
        <div class="pdf-day"><span>${esc(d.day)}</span><span>≈ ${money(d.total)} کیلوکالری</span></div>
        <table class="pdf-table">${d.meals.map((m) => `<tr><th>${esc(m.label)}</th><td>${esc(m.text)}</td><td>${money(m.kcal)} کیلوکالری</td></tr>`).join("")}</table>
      </div>`).join("")}
      <div class="pdf-block" data-pdf-block>
        <h2 class="pdf-title">${esc(wp.title)}</h2>
        <p style="margin:0 0 10px;color:#52525b">${esc(wp.sub)}</p>
        <div class="pdf-days">${wp.days.map((d) => `<div class="pdf-box"><div style="display:flex;justify-content:space-between;font-weight:800"><span>${esc(d.d)}</span><span style="color:#a16207">${esc(d.f)}</span></div><ul>${d.x.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>
      </div>
      <div class="pdf-block" data-pdf-block>
        <h2 class="pdf-title">نکات کلیدی</h2>
        <ul class="pdf-tips">${wp.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="pdf-foot">این برنامه به‌صورت خودکار بر اساس فرمول‌های علمی (Mifflin-St Jeor) تهیه شده و جایگزین مشاورهٔ پزشک یا متخصص تغذیه نیست. برای بررسی رایگان برنامه با مربیان ما تماس بگیرید: ۰۲۱-۲۲۰۰۰۰۰۰ · ironarena.ir</p>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  const pdfBtn = $("[data-pdf]");
  pdfBtn.addEventListener("click", async () => {
    if (!state || pdfBtn.disabled) return;
    pdfBtn.disabled = true;
    const label = pdfBtn.innerHTML;
    pdfBtn.innerHTML = `${icon("loader-circle", "spin")} در حال ساخت PDF…`;
    let sheet;
    try {
      await Promise.all([IA.loadScript("assets/vendor/html2canvas.min.js"), IA.loadScript("assets/vendor/jspdf.umd.min.js")]);
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      sheet = pdfSheet();
      const W = 794, PAGE = Math.floor((W * 297) / 210);
      // page breaks at block boundaries
      const blocks = $$("[data-pdf-block]", sheet).map((b) => ({ top: b.offsetTop, bottom: b.offsetTop + b.offsetHeight }));
      const breaks = [0];
      let start = 0;
      blocks.forEach((b) => { if (b.bottom - start > PAGE && b.top > start) { start = b.top; breaks.push(start); } });
      const total = sheet.offsetHeight;
      const canvas = await window.html2canvas(sheet, {
        scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: W,
        onclone: (doc) => { const s = doc.querySelector(".pdf-sheet"); if (s) s.style.left = "0"; },
      });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
      const k = canvas.width / W;
      breaks.forEach((y, i) => {
        const h = Math.min((breaks[i + 1] || total) - y, PAGE);
        const c = document.createElement("canvas");
        c.width = canvas.width; c.height = Math.ceil(h * k);
        const cx = c.getContext("2d");
        cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height);
        cx.drawImage(canvas, 0, Math.floor(y * k), canvas.width, c.height, 0, 0, canvas.width, c.height);
        if (i) pdf.addPage();
        pdf.addImage(c.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, (h * 210) / W);
        pdf.setFontSize(8); pdf.setTextColor(150);
        pdf.text(`IRON ARENA  ·  ${i + 1} / ${breaks.length}`, 105, 290, { align: "center" });
      });
      pdf.save("iron-arena-plan.pdf");
      toast({ title: "فایل PDF آماده شد", msg: "برنامه در پوشهٔ دانلودهای شما ذخیره شد." });
    } catch (err) {
      console.warn("[IRON ARENA] PDF failed:", err);
      toast({ type: "error", title: "ساخت PDF ممکن نشد", msg: "لطفاً از دکمهٔ «چاپ» و گزینهٔ ذخیره به‌صورت PDF استفاده کنید." });
    } finally {
      if (sheet) sheet.remove();
      pdfBtn.disabled = false; pdfBtn.innerHTML = label;
    }
  });

  /* ------------------------------------------------------------ email / print */
  $("[data-email]").addEventListener("click", () => {
    if (!state) return;
    const { input, T, plan } = state;
    const wp = D.workoutPlans[T.cat.goal];
    const lines = [
      "برنامهٔ اختصاصی من از آیرون آرنا",
      "",
      `شاخص توده بدنی: ${num(T.bmi, 1)} (${T.cat.label})`,
      `کالری پایه (BMR): ${money(T.bmr)} | مصرف روزانه (TDEE): ${money(T.tdee)}`,
      `کالری هدف: ${money(T.kcal)} کیلوکالری`,
      `پروتئین ${fa(T.protein)} گرم | کربوهیدرات ${fa(T.carbs)} گرم | چربی ${fa(T.fat)} گرم`,
      `وزن ایده‌آل: ${fa(Math.round(T.ideal[0]))} تا ${fa(Math.round(T.ideal[1]))} کیلوگرم`,
      "",
      `نمونه منوی ${plan[0].day}:`,
      ...plan[0].meals.map((m) => `• ${m.label}: ${m.text} (${money(m.kcal)} کیلوکالری)`),
      "",
      `برنامهٔ تمرینی: ${wp.title} — ${wp.sub}`,
      "",
      `مشخصات: ${input.gender === "female" ? "خانم" : "آقا"}، ${fa(input.age)} ساله، ${fa(input.cm)} سانتی‌متر، ${fa(input.kg)} کیلوگرم`,
      `نسخهٔ کامل: ${location.href.split("#")[0]}`,
    ];
    location.href = `mailto:?subject=${encodeURIComponent("برنامهٔ تغذیه و تمرین من — آیرون آرنا")}&body=${encodeURIComponent(lines.join("\n"))}`;
  });

  $("[data-print-plan]").addEventListener("click", () => {
    $$(".acc", results).forEach((a) => { a.classList.add("is-open"); const b = $(".acc__btn", a); if (b) b.setAttribute("aria-expanded", "true"); });
    window.print();
  });

  /* ------------------------------------------------------------ init */
  if (saved && saved.kg && saved.cm && saved.age && ACT_FA[saved.act]) render(saved);
})();
