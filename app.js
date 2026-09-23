/* 화면을 그리는 코드 — 내용 수정은 projects.js 에서만 하면 돼요. */
(function () {
  var P = window.PROJECTS || [];
  var S = window.SITE || {};
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 내 컴퓨터에서 미리 볼 때는 같은 서버의 폴더를 보여주고,
     실제 사이트에서는 projects.js 에 적힌 주소를 그대로 써요. */
  function liveUrl(p) {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (local && S.baseUrl && p.url.indexOf(S.baseUrl) === 0) return "/" + p.url.slice(S.baseUrl.length);
    return p.url;
  }

  function fillSite() {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var k = el.getAttribute("data-site");
      if (!S[k]) return;
      if (el.tagName === "A" && k === "github") el.href = S[k];
      else el.textContent = S[k];
    });
  }

  function reveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduce) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- 메인 ---------- */
  function renderList() {
    fillSite();
    document.getElementById("count").textContent = "(" + pad(P.length) + ")";

    /* 흐르는 썸네일 띠 (끊김 없이 두 번 반복) */
    var stripHtml = P.map(function (p) {
      return '<a class="strip__item" href="work.html?id=' + encodeURIComponent(p.id) + '" tabindex="-1"><img src="' + esc(p.thumb) + '" alt="" loading="lazy"></a>';
    }).join("");
    document.getElementById("strip").innerHTML = stripHtml + stripHtml;

    /* 목록 */
    var rows = document.getElementById("rows");
    rows.innerHTML = P.map(function (p, i) {
      return '<a class="row reveal" href="work.html?id=' + encodeURIComponent(p.id) + '" data-cat="' + esc(p.category) + '" data-i="' + i + '">' +
        '<span class="row__thumb"><img src="' + esc(p.thumb) + '" alt="' + esc(p.name) + ' 첫 화면" loading="lazy"></span>' +
        '<span class="row__no mono">' + pad(i + 1) + "</span>" +
        '<span class="row__name">' + esc(p.name) + "</span>" +
        '<span class="row__cat mono">' + esc(p.category) + "</span>" +
        '<span class="row__date mono">' + esc(p.date) + "</span>" +
        '<span class="row__arrow">→</span>' +
      "</a>";
    }).join("");

    /* 필터 */
    var cats = [];
    P.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    var filters = document.getElementById("filters");
    filters.innerHTML = ["All"].concat(cats).map(function (c, i) {
      var n = c === "All" ? P.length : P.filter(function (p) { return p.category === c; }).length;
      return '<button class="chip" type="button" data-filter="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + "<sup>" + n + "</sup></button>";
    }).join("");
    filters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      var f = b.getAttribute("data-filter");
      filters.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      rows.querySelectorAll(".row").forEach(function (r) {
        r.hidden = !(f === "All" || r.getAttribute("data-cat") === f);
        r.classList.add("is-in");
      });
    });

    /* 마우스를 따라다니는 썸네일 */
    var cp = document.getElementById("cursorPreview");
    cp.innerHTML = P.map(function (p) { return '<img src="' + esc(p.thumb) + '" alt="">'; }).join("");
    var imgs = cp.querySelectorAll("img");
    var mx = 0, my = 0, x = 0, y = 0, raf = null;
    function loop() {
      x += (mx - x) * 0.15; y += (my - y) * 0.15;
      cp.style.left = x + "px"; cp.style.top = y + "px";
      raf = Math.abs(mx - x) + Math.abs(my - y) > 0.5 ? requestAnimationFrame(loop) : null;
    }
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (reduce) { x = mx; y = my; cp.style.left = x + "px"; cp.style.top = y + "px"; return; }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    rows.addEventListener("mouseover", function (e) {
      var r = e.target.closest(".row"); if (!r) return;
      var i = +r.getAttribute("data-i");
      imgs.forEach(function (im, k) { im.classList.toggle("is-active", k === i); });
      cp.classList.add("is-on");
    });
    rows.addEventListener("mouseleave", function () { cp.classList.remove("is-on"); });

    reveal();
  }

  /* ---------- 상세 ---------- */
  function renderWork() {
    fillSite();
    var root = document.getElementById("work");
    var id = new URLSearchParams(location.search).get("id");
    var i = P.findIndex(function (p) { return p.id === id; });
    if (i < 0) {
      root.innerHTML = '<div class="notfound wrap"><p class="mono">Not found</p><p><a class="btn" href="./">목록으로</a></p></div>';
      return;
    }
    var p = P[i], prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    var url = liveUrl(p);
    var shortUrl = p.url.replace(/^https?:\/\//, "");
    document.title = p.name + " — " + (S.name || "Portfolio");

    var tools = (p.tools && p.tools.length) ? p.tools.map(esc).join(", ") : "—";

    root.innerHTML =
      '<section class="w-hero wrap">' +
        '<div class="w-hero__top mono"><span>No. ' + pad(i + 1) + " / " + pad(P.length) + "</span><span>" + esc(p.category) + "</span></div>" +
        '<h1 class="w-hero__title"><span>' + esc(p.name) + "</span></h1>" +
        '<dl class="w-meta">' +
          '<div class="w-meta__summary"><dt class="mono">About</dt><dd><p>' + esc(p.summary) + "</p></dd></div>" +
          '<div><dt class="mono">Industry</dt><dd>' + esc(p.category) + "</dd></div>" +
          '<div><dt class="mono">Date</dt><dd>' + esc(p.date) + "</dd></div>" +
          '<div><dt class="mono">AI Tools</dt><dd>' + tools + "</dd></div>" +
        "</dl>" +
      "</section>" +

      '<section class="preview wrap" aria-label="사이트 미리보기">' +
        '<div class="preview__bar">' +
          '<div class="seg" role="group" aria-label="화면 크기">' +
            '<button type="button" data-mode="pc" aria-pressed="true">Desktop</button>' +
            '<button type="button" data-mode="mobile" aria-pressed="false">Mobile</button>' +
          "</div>" +
          '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Visit site ↗</a>' +
        "</div>" +
        '<div class="stage" id="stage" data-mode="pc">' +
          '<div class="browser"><div class="browser__bar"><span class="browser__dots"><i></i><i></i><i></i></span><span class="browser__url">' + esc(shortUrl) + "</span></div>" +
            '<div class="browser__view" id="pcView"><iframe title="' + esc(p.name) + ' PC 화면"></iframe></div></div>' +
          '<div class="phone"><div class="phone__view"><iframe title="' + esc(p.name) + ' 모바일 화면"></iframe></div></div>' +
        "</div>" +
        '<p class="preview__hint mono">미리보기 화면 안에서 스크롤할 수 있어요</p>' +
      "</section>" +

      '<section class="points wrap">' +
        '<div class="points__grid">' +
          '<h2 class="reveal">Design<br>Point</h2>' +
          '<div class="reveal"><h3 class="mono">Key Colors</h3><div class="swatches">' +
            (p.colors || []).map(function (c) { return '<div class="swatch"><i style="background:' + esc(c) + '"></i><span class="mono">' + esc(c) + "</span></div>"; }).join("") +
          "</div></div>" +
          '<div class="reveal"><h3 class="mono">Typefaces</h3><ul class="fonts">' +
            (p.fonts || []).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") +
          "</ul></div>" +
        "</div>" +
      "</section>" +

      '<a class="next wrap" href="work.html?id=' + encodeURIComponent(next.id) + '">' +
        '<span class="next__label mono"><span>Next project</span><span>' + pad((i + 1) % P.length + 1) + "</span></span>" +
        '<span class="next__name">' + esc(next.name) + " →</span>" +
        '<span class="next__img"><img src="' + esc(next.thumb) + '" alt=""></span>' +
      "</a>" +
      '<div class="wrap" style="padding-bottom:40px"><a class="prev-link mono" href="work.html?id=' + encodeURIComponent(prev.id) + '">← Prev: ' + esc(prev.name) + "</a></div>";

    /* PC 화면: 1440px 너비 화면을 영역 크기에 맞게 축소 */
    var pcView = document.getElementById("pcView");
    var pcFrame = pcView.querySelector("iframe");
    var phoneFrame = root.querySelector(".phone iframe");
    function fit() {
      var s = pcView.clientWidth / 1440;
      pcFrame.style.transform = "scale(" + s + ")";
      pcView.style.height = 900 * s + "px";
    }
    fit(); window.addEventListener("resize", fit);

    function load(mode) {
      var f = mode === "pc" ? pcFrame : phoneFrame;
      if (!f.getAttribute("src")) f.setAttribute("src", url);
    }
    load("pc");

    var stage = document.getElementById("stage");
    root.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        var mode = b.getAttribute("data-mode");
        stage.setAttribute("data-mode", mode);
        root.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        load(mode); if (mode === "pc") fit();
      });
    });

    reveal();
  }

  window.Archive = { renderList: renderList, renderWork: renderWork };
})();
