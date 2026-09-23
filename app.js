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

  /* 글자를 한 자씩 쪼개서 떨어지는 모션을 줘요.
     [A] 처럼 대괄호로 감싼 글자는 속이 빈 외곽선 글자, | 는 줄바꿈 */
  function bounceText(el, startDelay) {
    var src = el.getAttribute("data-text") || el.textContent;
    var i = 0, html = "";
    src.split("|").forEach(function (line, li) {
      if (li) html += "<br>";
      line.split(" ").forEach(function (word, wi) {
        if (wi) html += " ";
        html += '<span class="w">';
        var hollow = false;
        for (var k = 0; k < word.length; k++) {
          var c = word[k];
          if (c === "[") { hollow = true; continue; }
          if (c === "]") { hollow = false; continue; }
          var rot = ((i * 37) % 24) - 12;
          html += '<span class="ch' + (hollow ? " hollow" : "") + '" style="animation-delay:' + (startDelay + i * 0.045).toFixed(3) + "s;--r:" + rot + 'deg">' + esc(c) + "</span>";
          i++;
        }
        html += "</span>";
      });
    });
    el.setAttribute("aria-label", src.replace(/[\[\]]/g, "").replace("|", " "));
    el.innerHTML = html;
  }

  function reveal() {
    var els = document.querySelectorAll(".reveal, .sec-title");
    if (!("IntersectionObserver" in window) || reduce) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- 메인 ---------- */
  function renderList() {
    fillSite();
    bounceText(document.getElementById("introTitle"), 0.1);
    bounceText(document.getElementById("secTitle"), 0);

    var grid = document.getElementById("grid");
    var filters = document.getElementById("filters");
    var cats = [];
    P.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });

    /* 흐르는 띠 */
    var tick = cats.concat(["Designed with AI"]).map(function (c) { return "<span>" + esc(c) + "</span><span>✦</span>"; }).join("");
    document.getElementById("ticker").innerHTML = tick + tick + tick + tick;

    grid.innerHTML = P.map(function (p, i) {
      return (
        '<a class="card reveal" href="work.html?id=' + encodeURIComponent(p.id) + '" data-cat="' + esc(p.category) + '">' +
          '<div class="card__thumb">' +
            '<span class="card__no">' + pad(i + 1) + "</span>" +
            '<img src="' + esc(p.thumb) + '" alt="' + esc(p.name) + ' 랜딩페이지 첫 화면" loading="' + (i < 4 ? "eager" : "lazy") + '">' +
          "</div>" +
          '<div class="card__meta">' +
            '<div><div class="card__name">' + esc(p.name) + '</div><span class="pill" style="margin-top:10px">' + esc(p.category) + "</span></div>" +
            '<div class="card__side"><span class="card__date">' + esc(p.date) + '</span><span class="card__arrow">→</span></div>' +
          "</div>" +
        "</a>"
      );
    }).join("");

    filters.innerHTML = ["All"].concat(cats).map(function (c, i) {
      var n = c === "All" ? P.length : P.filter(function (p) { return p.category === c; }).length;
      return '<button class="chip" type="button" data-filter="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + "<sup>" + n + "</sup></button>";
    }).join("");
    filters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      var f = b.getAttribute("data-filter");
      filters.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      grid.querySelectorAll(".card").forEach(function (card) {
        card.hidden = !(f === "All" || card.getAttribute("data-cat") === f);
        card.classList.add("is-in");
      });
    });

    reveal();
  }

  /* ---------- 상세 ---------- */
  function renderWork() {
    fillSite();
    var root = document.getElementById("work");
    var id = new URLSearchParams(location.search).get("id");
    var i = P.findIndex(function (p) { return p.id === id; });
    if (i < 0) {
      root.innerHTML = '<div class="notfound wrap"><p class="pill">Not found</p><p><a class="btn" href="./">목록으로</a></p></div>';
      return;
    }
    var p = P[i], prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    var url = liveUrl(p);
    var shortUrl = p.url.replace(/^https?:\/\//, "");
    document.title = p.name + " — " + (S.name || "Portfolio");

    var tools = (p.tools && p.tools.length) ? '<div><dt>AI Tools</dt><dd>' + p.tools.map(esc).join(", ") + "</dd></div>" : "";

    root.innerHTML =
      '<section class="work-head wrap">' +
        '<div class="work-head__top"><a class="btn btn--light" href="./#works">← 목록</a><span class="work-head__tags"><span class="pill pill--dark">No. ' + pad(i + 1) + " / " + pad(P.length) + '</span><span class="pill">' + esc(p.category) + "</span></span></div>" +
        '<h1 class="work-head__title" id="workTitle" data-text="' + esc(p.name) + '">' + esc(p.name) + "</h1>" +
        '<div class="work-head__body">' +
          '<p class="work-head__summary">' + esc(p.summary) + "</p>" +
          '<dl class="info">' +
            "<div><dt>Industry</dt><dd>" + esc(p.category) + "</dd></div>" +
            "<div><dt>Date</dt><dd>" + esc(p.date) + "</dd></div>" +
            tools +
            '<div><dt>Live</dt><dd><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(shortUrl) + "</a></dd></div>" +
          "</dl>" +
        "</div>" +
      "</section>" +

      '<section class="preview wrap" aria-label="사이트 미리보기">' +
        '<div class="preview__bar">' +
          '<div class="seg" role="group" aria-label="화면 크기">' +
            '<button type="button" data-mode="pc" aria-pressed="true">🖥 PC</button>' +
            '<button type="button" data-mode="mobile" aria-pressed="false">📱 Mobile</button>' +
          "</div>" +
          '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">새 창에서 크게 보기 ↗</a>' +
        "</div>" +
        '<div class="stage" id="stage" data-mode="pc">' +
          '<div class="browser"><div class="browser__bar"><span class="browser__dots"><i></i><i></i><i></i></span><span class="browser__url">' + esc(shortUrl) + "</span></div>" +
            '<div class="browser__view" id="pcView"><iframe title="' + esc(p.name) + ' PC 화면"></iframe></div></div>' +
          '<div class="phone"><div class="phone__view"><iframe title="' + esc(p.name) + ' 모바일 화면"></iframe></div></div>' +
        "</div>" +
        '<p class="preview__hint">미리보기 화면 안에서 스크롤할 수 있어요 ✦</p>' +
      "</section>" +

      '<section class="points wrap">' +
        '<div class="points__grid">' +
          '<h2 class="reveal">Design<br>Point</h2>' +
          '<div class="reveal"><h3>Key Colors</h3><div class="swatches">' +
            (p.colors || []).map(function (c) { return '<div class="swatch"><i style="background:' + esc(c) + '"></i><span>' + esc(c) + "</span></div>"; }).join("") +
          "</div></div>" +
          '<div class="reveal"><h3>Typefaces</h3><ul class="fonts">' +
            (p.fonts || []).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") +
          "</ul></div>" +
        "</div>" +
      "</section>" +

      '<nav class="pager wrap" aria-label="다른 프로젝트">' +
        '<a href="work.html?id=' + encodeURIComponent(prev.id) + '"><small>← PREV</small><b>' + esc(prev.name) + "</b></a>" +
        '<a href="work.html?id=' + encodeURIComponent(next.id) + '"><small>NEXT →</small><b>' + esc(next.name) + "</b></a>" +
      "</nav>";

    bounceText(document.getElementById("workTitle"), 0.1);

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
