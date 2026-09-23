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

  /* 내 컴퓨터에서 미리 볼 때는 같은 서버의 폴더를 보여주고,
     실제 사이트에서는 projects.js 에 적힌 주소를 그대로 써요. */
  function liveUrl(p) {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (local && S.baseUrl && p.url.indexOf(S.baseUrl) === 0) {
      return "/" + p.url.slice(S.baseUrl.length);
    }
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

  /* ---------- 메인 ---------- */
  function renderList() {
    fillSite();
    var grid = document.getElementById("grid");
    var filters = document.getElementById("filters");
    var cats = [];
    P.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });

    document.getElementById("statProjects").textContent = pad(P.length);
    document.getElementById("statCats").textContent = pad(cats.length);

    grid.innerHTML = P.map(function (p, i) {
      return (
        '<a class="card" href="work.html?id=' + encodeURIComponent(p.id) + '" data-cat="' + esc(p.category) + '">' +
          '<div class="card__thumb">' +
            '<img src="' + esc(p.thumb) + '" alt="' + esc(p.name) + ' 랜딩페이지 첫 화면" loading="' + (i < 4 ? "eager" : "lazy") + '">' +
            '<span class="card__view">자세히 보기 →</span>' +
          "</div>" +
          '<div class="card__meta">' +
            '<span class="card__no mono">' + pad(i + 1) + "</span>" +
            '<span class="card__name">' + esc(p.name) + "</span>" +
            '<span class="card__cat mono">' + esc(p.category) + "<small>" + esc(p.date) + "</small></span>" +
          "</div>" +
        "</a>"
      );
    }).join("");

    var all = ["All"].concat(cats);
    filters.innerHTML = all.map(function (c, i) {
      var n = c === "All" ? P.length : P.filter(function (p) { return p.category === c; }).length;
      return '<button class="chip" type="button" data-filter="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' +
        esc(c) + "<sup>" + n + "</sup></button>";
    }).join("");

    filters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      filters.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      grid.querySelectorAll(".card").forEach(function (card) {
        card.hidden = !(f === "All" || card.getAttribute("data-cat") === f);
      });
    });
  }

  /* ---------- 상세 ---------- */
  function renderWork() {
    fillSite();
    var root = document.getElementById("work");
    var id = new URLSearchParams(location.search).get("id");
    var i = P.findIndex(function (p) { return p.id === id; });
    if (i < 0) {
      root.innerHTML = '<div class="notfound wrap"><p class="mono">Not found</p><p><a class="btn" href="./">목록으로 돌아가기</a></p></div>';
      return;
    }
    var p = P[i];
    var prev = P[(i - 1 + P.length) % P.length];
    var next = P[(i + 1) % P.length];
    var url = liveUrl(p);
    document.title = p.name + " — " + (S.name || "Portfolio");

    var tools = (p.tools && p.tools.length)
      ? '<div><dt class="mono">AI Tools</dt><dd>' + p.tools.map(esc).join(", ") + "</dd></div>" : "";

    root.innerHTML =
      '<section class="work-head wrap">' +
        '<div class="work-head__top mono"><span>No. ' + pad(i + 1) + " / " + pad(P.length) + "</span><span>" + esc(p.category) + "</span></div>" +
        '<h1 class="work-head__title">' + esc(p.name) + "</h1>" +
        '<div class="work-head__body">' +
          '<p class="work-head__summary">' + esc(p.summary) + "</p>" +
          '<dl class="info">' +
            '<div><dt class="mono">Industry</dt><dd>' + esc(p.category) + "</dd></div>" +
            '<div><dt class="mono">Date</dt><dd>' + esc(p.date) + "</dd></div>" +
            tools +
            '<div><dt class="mono">Live</dt><dd><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.url.replace(/^https?:\/\//, "")) + "</a></dd></div>" +
          "</dl>" +
        "</div>" +
      "</section>" +

      '<section class="preview wrap" aria-label="사이트 미리보기">' +
        '<div class="preview__bar">' +
          '<div class="seg" role="group" aria-label="화면 크기">' +
            '<button type="button" data-mode="pc" aria-pressed="true">PC</button>' +
            '<button type="button" data-mode="mobile" aria-pressed="false">Mobile</button>' +
          "</div>" +
          '<a class="btn btn--solid" href="' + esc(url) + '" target="_blank" rel="noopener">새 창에서 크게 보기 ↗</a>' +
        "</div>" +
        '<div class="stage" id="stage" data-mode="pc">' +
          '<div class="browser">' +
            '<div class="browser__bar"><span class="browser__dots"><i></i><i></i><i></i></span>' +
              '<span class="browser__url">' + esc(p.url.replace(/^https?:\/\//, "")) + "</span></div>" +
            '<div class="browser__view" id="pcView"><iframe title="' + esc(p.name) + ' PC 화면" loading="lazy"></iframe></div>' +
          "</div>" +
          '<div class="phone"><div class="phone__view"><iframe title="' + esc(p.name) + ' 모바일 화면" loading="lazy"></iframe></div></div>' +
        "</div>" +
        '<p class="preview__hint mono">미리보기 화면 안에서 스크롤할 수 있어요</p>' +
      "</section>" +

      '<section class="points wrap">' +
        '<div class="points__grid">' +
          "<h2>Design Point</h2>" +
          '<div><h3 class="mono">Key Colors</h3><div class="swatches">' +
            (p.colors || []).map(function (c) {
              return '<div class="swatch"><i style="background:' + esc(c) + '"></i><span class="mono">' + esc(c) + "</span></div>";
            }).join("") +
          "</div></div>" +
          '<div><h3 class="mono">Typefaces</h3><ul class="fonts">' +
            (p.fonts || []).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") +
          "</ul></div>" +
        "</div>" +
      "</section>" +

      '<nav class="pager" aria-label="다른 프로젝트">' +
        '<a href="work.html?id=' + encodeURIComponent(prev.id) + '"><span class="mono">← Prev</span><b>' + esc(prev.name) + "</b></a>" +
        '<a href="work.html?id=' + encodeURIComponent(next.id) + '"><span class="mono">Next →</span><b>' + esc(next.name) + "</b></a>" +
      "</nav>";

    /* PC 화면: 1440px 너비 화면을 영역 크기에 맞게 축소 */
    var pcView = document.getElementById("pcView");
    var pcFrame = pcView.querySelector("iframe");
    var phoneFrame = root.querySelector(".phone iframe");
    function fit() {
      var s = pcView.clientWidth / 1440;
      pcFrame.style.transform = "scale(" + s + ")";
      pcView.style.height = 900 * s + "px";
    }
    fit();
    window.addEventListener("resize", fit);

    /* 보고 있는 화면만 불러와서 가볍게 */
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
        load(mode);
        if (mode === "pc") fit();
      });
    });
  }

  window.Archive = { renderList: renderList, renderWork: renderWork };
})();
