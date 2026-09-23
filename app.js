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
  var ICON_DL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h4v4M13 3L7.5 8.5M11 9.5V13H3V5h3.5"/></svg>';

  /* 내 컴퓨터에서 미리 볼 때는 같은 서버의 폴더를 보여주고,
     실제 사이트에서는 projects.js 에 적힌 주소를 그대로 써요. */
  function liveUrl(p) {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (local && S.baseUrl && p.url.indexOf(S.baseUrl) === 0) return "/" + p.url.slice(S.baseUrl.length);
    return p.url;
  }

  /* 다운로드: 각 프로젝트 GitHub 저장소의 최신 파일을 zip으로 받아요.
     저장소 이름이 id와 다르면 projects.js 에 repo: "저장소이름" 을 적어주세요. */
  function downloadUrl(p) {
    if (p.download) return p.download;
    return (S.github || "").replace(/\/$/, "") + "/" + encodeURIComponent(p.repo || p.id) + "/archive/refs/heads/main.zip";
  }

  function fillSite() {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var k = el.getAttribute("data-site");
      if (!S[k]) return;
      if (el.tagName === "A" && k === "github") { el.href = S[k]; el.textContent = S[k].replace(/^https?:\/\//, ""); }
      else el.textContent = S[k];
    });
  }

  /* ---------- 메인 ---------- */
  function renderList() {
    fillSite();
    var gallery = document.getElementById("gallery");
    var tabs = document.getElementById("tabs");
    var count = document.getElementById("worksCount");
    document.getElementById("propCount").textContent = P.length + "개";

    var cats = [];
    P.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });

    gallery.innerHTML = P.map(function (p, i) {
      return (
        '<article class="card" data-cat="' + esc(p.category) + '">' +
          '<div class="card__cover"><img src="' + esc(p.thumb) + '" alt="' + esc(p.name) + ' 첫 화면" loading="' + (i < 6 ? "eager" : "lazy") + '"></div>' +
          '<div class="card__body">' +
            '<div class="card__row">' +
              '<h3 class="card__title"><small>' + pad(i + 1) + '</small><a href="work.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + "</a></h3>" +
              '<a class="icon-btn card__dl" href="' + esc(downloadUrl(p)) + '" title="' + esc(p.name) + ' 파일 다운로드" aria-label="' + esc(p.name) + ' 파일 다운로드">' + ICON_DL + "</a>" +
            "</div>" +
            '<div class="card__meta"><span class="tag">' + esc(p.category) + "</span><span>" + esc(p.date) + "</span></div>" +
          "</div>" +
        "</article>"
      );
    }).join("");

    function setCount(n) { count.textContent = n + "개"; }
    setCount(P.length);

    tabs.innerHTML = ["All"].concat(cats).map(function (c, i) {
      var n = c === "All" ? P.length : P.filter(function (p) { return p.category === c; }).length;
      return '<button class="tab" type="button" role="tab" data-filter="' + esc(c) + '" aria-selected="' + (i === 0) + '">' + (c === "All" ? "전체" : esc(c)) + "<span>" + n + "</span></button>";
    }).join("");
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (!b) return;
      var f = b.getAttribute("data-filter"), shown = 0;
      tabs.querySelectorAll(".tab").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      gallery.querySelectorAll(".card").forEach(function (card) {
        var on = f === "All" || card.getAttribute("data-cat") === f;
        card.hidden = !on; if (on) shown++;
      });
      setCount(shown);
    });
  }

  /* ---------- 상세 ---------- */
  function renderWork() {
    var root = document.getElementById("work");
    var id = new URLSearchParams(location.search).get("id");
    var i = P.findIndex(function (p) { return p.id === id; });
    if (i < 0) {
      root.innerHTML = '<div class="notfound"><p>페이지를 찾을 수 없어요.</p><p><a class="btn" href="./">목록으로</a></p></div>';
      return;
    }
    var p = P[i], prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    var url = liveUrl(p);
    var shortUrl = p.url.replace(/^https?:\/\//, "");
    document.title = p.name + " — " + (S.name || "Portfolio");

    var tools = (p.tools && p.tools.length)
      ? "<div><dt>AI Tools</dt><dd>" + p.tools.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</dd></div>" : "";

    root.innerHTML =
      '<nav class="crumbs" aria-label="현재 위치"><a href="./">' + esc(S.name || "Home") + '</a><span>/</span><a href="./#works">Works</a><span>/</span><b>' + esc(p.name) + "</b></nav>" +
      '<div class="cover"><img src="' + esc(p.thumb) + '" alt=""></div>' +

      '<header class="w-head">' +
        '<h1 class="head__title">' + esc(p.name) + "</h1>" +
        '<p class="head__desc">' + esc(p.summary) + "</p>" +
        '<dl class="props">' +
          '<div><dt>No.</dt><dd>' + pad(i + 1) + " / " + pad(P.length) + "</dd></div>" +
          '<div><dt>Industry</dt><dd><span class="tag">' + esc(p.category) + "</span></dd></div>" +
          "<div><dt>Date</dt><dd>" + esc(p.date) + "</dd></div>" +
          tools +
          '<div><dt>Live</dt><dd><a class="link" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(shortUrl) + "</a></dd></div>" +
        "</dl>" +
        '<div class="w-actions">' +
          '<a class="btn btn--primary" href="' + esc(url) + '" target="_blank" rel="noopener">' + ICON_OUT + "사이트 열기</a>" +
          '<a class="btn" href="' + esc(downloadUrl(p)) + '">' + ICON_DL + "파일 다운로드 (.zip)</a>" +
        "</div>" +
      "</header>" +

      '<hr class="divider">' +

      '<section class="block" aria-label="사이트 미리보기">' +
        '<div class="preview__bar"><h2 style="margin:0">Preview</h2>' +
          '<div class="seg" role="group" aria-label="화면 크기">' +
            '<button type="button" data-mode="pc" aria-pressed="true">PC</button>' +
            '<button type="button" data-mode="mobile" aria-pressed="false">Mobile</button>' +
          "</div>" +
        "</div>" +
        '<div class="stage" id="stage" data-mode="pc">' +
          '<div class="browser"><div class="browser__bar"><span class="browser__dots"><i></i><i></i><i></i></span><span class="browser__url">' + esc(shortUrl) + "</span></div>" +
            '<div class="browser__view" id="pcView"><iframe title="' + esc(p.name) + ' PC 화면"></iframe></div></div>' +
          '<div class="phone"><div class="phone__view"><iframe title="' + esc(p.name) + ' 모바일 화면"></iframe></div></div>' +
        "</div>" +
        '<p class="hint">미리보기 화면 안에서 스크롤할 수 있어요</p>' +
      "</section>" +

      '<section class="block">' +
        "<h2>Design Point</h2>" +
        '<div class="points">' +
          '<div class="callout"><h3>Key Colors</h3><div class="swatches">' +
            (p.colors || []).map(function (c) { return '<span class="swatch"><i style="background:' + esc(c) + '"></i>' + esc(c) + "</span>"; }).join("") +
          "</div></div>" +
          '<div class="callout"><h3>Typefaces</h3><ul class="fonts">' +
            (p.fonts || []).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") +
          "</ul></div>" +
        "</div>" +
      "</section>" +

      '<nav class="pager" aria-label="다른 프로젝트">' +
        '<a href="work.html?id=' + encodeURIComponent(prev.id) + '"><small>← 이전</small><b>' + esc(prev.name) + "</b></a>" +
        '<a href="work.html?id=' + encodeURIComponent(next.id) + '"><small>다음 →</small><b>' + esc(next.name) + "</b></a>" +
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
  }

  window.Archive = { renderList: renderList, renderWork: renderWork };
})();
