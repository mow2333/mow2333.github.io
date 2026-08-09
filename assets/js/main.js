/* WorldBridge 静态文档站 · 交互脚本 */
(function () {
  "use strict";

  /* ===== 主题切换 ===== */
  var THEME_KEY = "wb-docs-theme";
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-btn");

  function currentTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  applyTheme(currentTheme());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? "dark" : "light");
  });

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* ===== 移动端侧边栏 ===== */
  var menuBtn = document.getElementById("menu-btn");
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("open");
    if (overlay) overlay.hidden = true;
  }

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", function () {
      var open = sidebar.classList.toggle("open");
      if (overlay) overlay.hidden = !open;
    });
    if (overlay) {
      overlay.addEventListener("click", closeSidebar);
    }
  }

  /* ===== 搜索 ===== */
  var searchInput = document.getElementById("search-input");
  var searchDropdown = document.getElementById("search-dropdown");
  var searchData = null;

  function highlight(text, query) {
    var idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text;
    var before = text.slice(0, idx);
    var hit = text.slice(idx, idx + query.length);
    var after = text.slice(idx + query.length);
    return before + "<mark>" + hit + "</mark>" + after;
  }

  function snippetAround(text, query, radius) {
    var idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text.slice(0, 90) + "…";
    var start = Math.max(0, idx - radius);
    var end = Math.min(text.length, idx + query.length + radius);
    return (start > 0 ? "…" : "") + highlight(text.slice(start, end), query) + (end < text.length ? "…" : "");
  }

  function loadSearchData(cb) {
    if (searchData) { cb(); return; }
    var req = new XMLHttpRequest();
    req.open("GET", "search_index.json", true);
    req.onload = function () {
      try {
        searchData = JSON.parse(req.responseText);
      } catch (e) {
        searchData = [];
      }
      cb();
    };
    req.onerror = function () { searchData = []; cb(); };
    req.send();
  }

  function renderResults(query) {
    if (!searchDropdown) return;
    if (!query.trim()) {
      searchDropdown.hidden = true;
      return;
    }
    loadSearchData(function () {
      var q = query.trim().toLowerCase();
      var results = (searchData || []).filter(function (item) {
        return item.title.toLowerCase().indexOf(q) >= 0 || item.text.toLowerCase().indexOf(q) >= 0;
      }).slice(0, 8);

      if (!results.length) {
        searchDropdown.innerHTML = '<div class="search-empty">未找到与 “' + query + '” 相关的结果</div>';
      } else {
        searchDropdown.innerHTML = results.map(function (item) {
          var idx = item.text.toLowerCase().indexOf(q);
          var snippet = idx >= 0 ? snippetAround(item.text, q, 60) : item.text.slice(0, 90) + "…";
          return '<a class="search-item" href="' + item.path + '">' +
            '<div class="search-item-title">' + highlight(item.title, query) + "</div>" +
            '<div class="search-item-snippet">' + snippet + "</div></a>";
        }).join("");
      }
      searchDropdown.hidden = false;
    });
  }

  if (searchInput && searchDropdown) {
    searchInput.addEventListener("input", function () { renderResults(searchInput.value); });
    searchInput.addEventListener("focus", function () {
      if (searchInput.value.trim()) renderResults(searchInput.value);
    });
    document.addEventListener("click", function (e) {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.hidden = true;
      }
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchDropdown.hidden = true;
        searchInput.blur();
      }
    });
  }

  /* ===== 目录滚动高亮 ===== */
  var tocLinks = document.querySelectorAll(".page-toc a");
  var headings = [];
  tocLinks.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var el = document.getElementById(id);
    if (el) headings.push({ el: el, link: a });
  });

  function onScroll() {
    if (!headings.length) return;
    var pos = window.scrollY + 90;
    var current = null;
    headings.forEach(function (h) {
      if (h.el.offsetTop <= pos) current = h;
    });
    tocLinks.forEach(function (a) { a.classList.remove("toc-active"); });
    if (current) current.link.classList.add("toc-active");
  }

  if (headings.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
