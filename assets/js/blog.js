/* ==========================================================================
   IRON ARENA — blog.js
   • IA.postCard(post)        card markup (also used on the landing page)
   • IA.pages.blog            grid + live search + category filter + URL state
   • IA.pages.post            ?id=post-N renderer: reading-progress bar, sticky
                              TOC with scroll-spy, share buttons, related posts,
                              dynamic <title>/meta + Article JSON-LD
   ========================================================================== */
(function () {
  "use strict";
  const IA = window.IA, POSTS = window.IA_BLOG || [], AUTH = window.IA_AUTHORS || {};
  if (!IA) return;
  const { $, $$, fa, esc, icon, img } = IA;

  const CATS = ["تمرین", "تغذیه", "انگیزه", "ریکاوری", "مکمل", "سلامت"];
  const dateFa = (iso) => {
    try { return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso + "T12:00:00")); }
    catch (e) { return fa(iso); }
  };
  const textOf = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = (html) => textOf(html).split(" ").length;
  const readMin = (html) => Math.max(1, Math.ceil(words(html) / 180));
  const norm = (s) => String(s).toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\u200f]/g, "").replace(/\s+/g, " ").trim();

  IA.postCard = (p) => {
    const a = AUTH[p.author] || { name: "تیم آیرون آرنا", img: "coach-1" };
    return `<article class="post-card card card--hover" data-reveal>
      <div style="position:relative">
        <span class="post-card__cat badge badge--solid">${esc(p.category)}</span>
        ${img(p.image, { small: true, sizes: "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" })}
      </div>
      <div class="post-card__body">
        <h3><a href="blog-post.html?id=${p.id}">${esc(p.title)}</a></h3>
        <p>${esc(p.excerpt)}</p>
        <div class="post-meta">
          <span class="avatar"><img src="assets/img/${a.img}.webp" width="32" height="32" alt="" loading="lazy" decoding="async"></span>
          <span class="post-meta__author">${esc(a.name)}</span>
          <span>${icon("clock")} ${fa(readMin(p.content))} دقیقه</span>
        </div>
      </div>
    </article>`;
  };

  /* ================================================================ BLOG */
  IA.pages.blog = () => {
    const grid = $("[data-blog-grid]"), chips = $("[data-blog-cats]"), input = $("[data-blog-search]"), count = $("[data-blog-count]");
    const qs = new URLSearchParams(location.search);
    let cat = CATS.includes(qs.get("cat")) ? qs.get("cat") : "all";
    let q = qs.get("q") || "";
    input.value = q;
    chips.innerHTML = `<button type="button" class="chip" data-cat="all">همه</button>` + CATS.map((c) => `<button type="button" class="chip" data-cat="${c}">${c}</button>`).join("");
    const index = POSTS.map((p) => ({ p, hay: norm([p.title, p.excerpt, p.category, textOf(p.content)].join(" ")) }));

    const render = () => {
      $$("[data-cat]", chips).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
      const nq = norm(q);
      const list = index.filter(({ p, hay }) => (cat === "all" || p.category === cat) && (!nq || nq.split(" ").every((w) => hay.includes(w)))).map((x) => x.p);
      grid.innerHTML = list.length
        ? list.map(IA.postCard).join("")
        : `<div class="empty">${icon("search")}<b>مقاله‌ای پیدا نشد</b><p>عبارت دیگری را جست‌وجو کنید یا دسته‌بندی «همه» را انتخاب کنید.</p><button type="button" class="btn btn--outline btn--sm" data-reset>نمایش همهٔ مقالات</button></div>`;
      count.textContent = `${fa(list.length)} مقاله`;
      IA.media(grid); IA.reveal(grid);
      const url = new URL(location.href);
      cat === "all" ? url.searchParams.delete("cat") : url.searchParams.set("cat", cat);
      q ? url.searchParams.set("q", q) : url.searchParams.delete("q");
      history.replaceState(null, "", url);
    };
    chips.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { cat = b.dataset.cat; render(); } });
    let t;
    input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { q = input.value.trim(); render(); }, 160); });
    $("[data-blog-form]").addEventListener("submit", (e) => { e.preventDefault(); q = input.value.trim(); render(); });
    grid.addEventListener("click", (e) => { if (e.target.closest("[data-reset]")) { cat = "all"; q = ""; input.value = ""; render(); } });
    render();
  };

  /* ================================================================ POST */
  IA.pages.post = () => {
    const id = new URLSearchParams(location.search).get("id") || "post-1";
    const p = POSTS.find((x) => x.id === id);
    const root = $("[data-post]");
    if (!p) {
      root.innerHTML = `<section class="notfound"><div class="stack" style="justify-items:center">
        <div class="notfound__num text-grad">404</div><h1 class="h2">این مقاله پیدا نشد</h1>
        <p class="text-muted">ممکن است نشانی اشتباه باشد یا مقاله حذف شده باشد.</p>
        <a class="btn btn--gold" href="blog.html">بازگشت به مجله</a></div></section>`;
      document.title = "مقاله پیدا نشد | آیرون آرنا";
      return;
    }
    const a = AUTH[p.author] || { name: "تیم آیرون آرنا", role: "", img: "coach-1" };
    const url = location.href.split("#")[0];
    const enc = encodeURIComponent;

    root.innerHTML = `
      <div class="read-progress" data-progress aria-hidden="true"></div>
      <header class="article-hero">
        <div class="container">
          <div class="article-hero__inner">
            <nav class="breadcrumb" aria-label="مسیر صفحه" style="color:var(--text-muted)">
              <a href="index.html">خانه</a>${icon("chevron-left")}<a href="blog.html">مجله</a>${icon("chevron-left")}<a href="blog.html?cat=${enc(p.category)}">${esc(p.category)}</a>
            </nav>
            <h1>${esc(p.title)}</h1>
            <p class="lead">${esc(p.excerpt)}</p>
            <div class="post-meta" style="border:0;padding:0;margin:0;gap:18px;flex-wrap:wrap">
              <span class="avatar" style="width:44px;height:44px"><img src="assets/img/${a.img}.webp" width="44" height="44" alt=""></span>
              <span class="post-meta__author" style="flex:0 1 auto">${esc(a.name)}</span>
              <span>${icon("calendar")} <time datetime="${p.date}">${dateFa(p.date)}</time></span>
              <span>${icon("clock")} ${fa(readMin(p.content))} دقیقه مطالعه</span>
            </div>
          </div>
          ${img(p.image, { cls: "article-cover", eager: true, sizes: "(max-width: 1440px) 100vw, 1440px", alt: p.title })}
        </div>
      </header>
      <div class="section" style="padding-block-start:56px">
        <div class="container article-layout">
          <article class="prose" data-article>${p.content}
            <div class="author-box card">
              <span class="avatar"><img src="assets/img/${a.img}.webp" width="72" height="72" alt="${esc(a.name)}" loading="lazy"></span>
              <div><span class="text-muted small">نویسنده</span><p style="margin:0;font-weight:800;font-size:1.2rem">${esc(a.name)}</p><p class="text-muted" style="margin:0">${esc(a.role)} در آیرون آرنا</p></div>
            </div>
          </article>
          <aside class="toc" aria-label="فهرست مطالب و اشتراک‌گذاری">
            <div class="toc__box card">
              <p class="toc__title">${icon("list")} فهرست مطالب</p>
              <ol data-toc></ol>
            </div>
            <div class="toc__box card toc__box--side">
              <p class="toc__title">${icon("share-2")} اشتراک‌گذاری</p>
              <div class="share">
                <a class="icon-btn" href="https://t.me/share/url?url=${enc(url)}&amp;text=${enc(p.title)}" target="_blank" rel="noopener" aria-label="اشتراک در تلگرام">${icon("b-telegram")}</a>
                <a class="icon-btn" href="https://wa.me/?text=${enc(p.title + " " + url)}" target="_blank" rel="noopener" aria-label="اشتراک در واتس‌اپ">${icon("b-whatsapp")}</a>
                <a class="icon-btn" href="https://twitter.com/intent/tweet?url=${enc(url)}&amp;text=${enc(p.title)}" target="_blank" rel="noopener" aria-label="اشتراک در ایکس">${icon("b-x")}</a>
                <button type="button" class="icon-btn" data-copy aria-label="کپی پیوند">${icon("link")}</button>
                <button type="button" class="icon-btn" data-native-share aria-label="اشتراک‌گذاری" hidden>${icon("share-2")}</button>
              </div>
            </div>
            <a class="btn btn--gold btn--block toc__box--side" href="bmi.html">${icon("calculator")} برنامهٔ رایگان من</a>
          </aside>
        </div>
      </div>
      <section class="section section--alt" aria-labelledby="related-title">
        <div class="container">
          <header class="section__head section__head--split"><h2 id="related-title">مقالات <span class="text-gold">مرتبط</span></h2><a class="btn btn--outline" href="blog.html">همهٔ مقالات ${icon("arrow-left")}</a></header>
          <div class="blog-grid" data-related data-stagger></div>
        </div>
      </section>`;

    /* meta + JSON-LD */
    document.title = `${p.title} | مجلهٔ آیرون آرنا`;
    const setMeta = (sel, v) => { const m = $(sel); if (m) m.setAttribute("content", v); };
    setMeta('meta[name="description"]', p.excerpt);
    setMeta('meta[property="og:title"]', p.title); setMeta('meta[name="twitter:title"]', p.title);
    setMeta('meta[property="og:description"]', p.excerpt); setMeta('meta[name="twitter:description"]', p.excerpt);
    setMeta('meta[property="og:url"]', url);
    const base = location.href.replace(/[^/]*$/, "");
    setMeta('meta[property="og:image"]', `${base}assets/img/${p.image}.webp`);
    const canon = $('link[rel="canonical"]'); if (canon) canon.href = canon.href.replace(/blog-post\.html.*$/, `blog-post.html?id=${p.id}`);
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.excerpt,
      image: [`${base}assets/img/${p.image}.webp`], datePublished: p.date, dateModified: p.date, inLanguage: "fa-IR",
      wordCount: words(p.content), articleSection: p.category,
      author: { "@type": "Person", name: a.name, jobTitle: a.role },
      publisher: { "@type": "Organization", name: "IRON ARENA — آیرون آرنا", logo: { "@type": "ImageObject", url: `${base}assets/img/icon-512.png` } },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    });
    document.head.appendChild(ld);

    /* TOC + scroll-spy */
    const art = $("[data-article]"), toc = $("[data-toc]");
    const hs = $$(":scope > h2", art);
    hs.forEach((h, i) => { h.id = `s-${i + 1}`; });
    toc.innerHTML = hs.map((h) => `<li><a href="#${h.id}">${esc(h.textContent)}</a></li>`).join("");
    const links = $$("a", toc);
    if ("IntersectionObserver" in window) {
      const spy = new IntersectionObserver((ents) => ents.forEach((e) => {
        if (e.isIntersecting) links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
      }), { rootMargin: "-20% 0px -70% 0px" });
      hs.forEach((h) => spy.observe(h));
    }

    /* reading progress */
    const bar = $("[data-progress]");
    const prog = () => {
      const r = art.getBoundingClientRect();
      const total = r.height - innerHeight * 0.6;
      bar.style.transform = `scaleX(${IA.clamp(-r.top / (total || 1), 0, 1)})`;
    };
    addEventListener("scroll", () => requestAnimationFrame(prog), { passive: true });
    prog();

    /* share */
    $("[data-copy]").addEventListener("click", () => {
      const ok = () => IA.toast({ title: "پیوند مقاله کپی شد", msg: "اکنون می‌توانید آن را برای دوستانتان بفرستید." });
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, () => IA.toast({ type: "error", title: "کپی ناموفق بود" }));
      else { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); ok(); }
    });
    if (navigator.share) {
      const ns = $("[data-native-share]"); ns.hidden = false;
      ns.addEventListener("click", () => navigator.share({ title: p.title, text: p.excerpt, url }).catch(() => {}));
    }

    /* related */
    const rel = POSTS.filter((x) => x.id !== p.id).sort((x, y) => (y.category === p.category) - (x.category === p.category)).slice(0, 3);
    $("[data-related]").innerHTML = rel.map(IA.postCard).join("");
  };
})();
