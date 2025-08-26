(function () {
  /* ======================================================================
   * tiny utils: load CSS/JS (with absolute URL normalization)
   * ==================================================================== */
  function ensureStylesheet(href) {
    if (!href) return Promise.resolve();
    const abs = new URL(href, document.baseURI).href;
    const already = [...document.styleSheets].some((s) => s.href === abs);
    if (already) return Promise.resolve();
    return new Promise((res, rej) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = abs;
      link.crossOrigin = "anonymous";
      link.onload = res;
      link.onerror = rej;
      document.head.appendChild(link);
    });
  }

  function ensureScript(src) {
    if (!src) return Promise.resolve();
    const abs = new URL(src, document.baseURI).href;
    const already = !!document.querySelector(`script[src="${abs}"]`);
    if (already) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = abs;
      s.defer = true;
      s.crossOrigin = "anonymous";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ======================================================================
   * mount & path resolution
   * ==================================================================== */
  const mount = document.getElementById("groupFinder");
  if (!mount) return;
  // ensure overlay anchors correctly even before CSS is loaded
  const cs = getComputedStyle(mount).position;
  if (!cs || cs === "static") mount.style.position = "relative";

  // prefer data on the DIV, then on the <script>, then infer from script src
  const currentScript =
    document.currentScript ||
    Array.from(document.scripts).find(
      (s) => (s.src || "").includes("GroupFinder") && s.src.endsWith(".js")
    );

  const dsDiv = mount.dataset || {};
  const dsScript = (currentScript && currentScript.dataset) || {};

  const host = dsDiv.host || dsScript.host || "woodsidebible";

  // /.../GroupFinder/Assets/GroupFinder.Embed.js -> /.../GroupFinder
  function inferRootFromScript() {
    if (!currentScript || !currentScript.src) return "";
    const url = new URL(currentScript.src, document.baseURI);
    return url.pathname.replace(/\/Assets\/[^/]+\.js$/, "");
  }

  const joinPath = (root, seg) =>
    root.replace(/\/+$/, "") + "/" + String(seg || "").replace(/^\/+/, "");

  const ROOT = dsDiv.root || dsScript.root || inferRootFromScript() || "";

  const templatePath =
    dsDiv.template ||
    dsScript.template ||
    joinPath(ROOT, "/Template/widget.html");
  const cssUrl =
    dsDiv.css || dsScript.css || joinPath(ROOT, "/Assets/widget.css");
  const widgetsUrl =
    dsDiv.widgets ||
    dsScript.widgets ||
    joinPath(ROOT, "/Assets/CustomWidgets.js");
  const wantBootstrap =
    String(dsDiv.bootstrap || dsScript.bootstrap || "false").toLowerCase() ===
    "true";

  // ?preview=true support
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true")
      document.body.classList.add("preview");
  } catch {}

  /* ======================================================================
   * deps: FA6 (+ optional Bootstrap) + your CSS + CustomWidgets.js
   * ==================================================================== */
  const FA6 =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  const BS5 =
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";

  Promise.resolve()
    .then(() => ensureStylesheet(FA6))
    .then(() => (wantBootstrap ? ensureStylesheet(BS5) : null))
    .then(() => ensureStylesheet(cssUrl))
    .then(() => ensureScript(widgetsUrl))
    .then(initWidget)
    .catch((e) =>
      console.warn("GroupFinder embed failed to load a dependency:", e)
    );

  /* ======================================================================
   * main init
   * ==================================================================== */
  function initWidget() {
    const allowedKeys = [
      "@CongregationID",
      "@DaysOfWeek",
      "@Cities",
      "@Leaders",
      "@GroupIDs",
      "@Search",
      "@LifeStageID",
      "@FamilyAccommodationID",
      "@IntendedAudienceID"
    ];

    const urlParams = new URLSearchParams(window.location.search);
    const paramMap = new Map(
      Array.from(urlParams.entries()).filter(
        ([k, v]) => allowedKeys.includes(k) && v && v.trim() !== ""
      )
    );

    // cookie -> @CongregationID fallback
    const cookieJwt = getCookie("tbx-ws__selected-location");
    const fallbackCongregationID = safeDecodeLocation(cookieJwt);
    if (!paramMap.has("@CongregationID") && fallbackCongregationID) {
      paramMap.set("@CongregationID", String(fallbackCongregationID));
    }

    // inject markup
    mount.innerHTML = `
      <div id="loader" class="loader-container">
        <div class="loader-bg"></div>
        <div class="loader"></div>
      </div>
      <div id="GroupFinderWidget"
           data-component="CustomWidget"
           data-sp="api_custom_GroupFinderWidget_JSON"
           data-params="${serializeParams(paramMap)}"
           data-template="${templatePath}"
           data-requireUser="false"
           data-cache="false"
           data-host="${host}"
           data-debug="true"></div>
    `;

    const loader = document.getElementById("loader");
    const widgetId = "GroupFinderWidget";

    /* ------------------------ helpers ------------------------ */
    function scrollToFinder() {
      const el = document.getElementById("groupFinder") || mount;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        const url = new URL(window.location.href);
        url.hash = "groupFinder";
        history.replaceState({}, "", url);
      } catch {}
    }

    function prepReload() {
      loader && loader.classList.remove("hidden");
      scrollToFinder();
    }

    function parseParams(str) {
      return new Map(
        (str || "")
          .replace(/@@/g, "@")
          .split("&")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const clean = p.replace(/^@+/, "");
            const [key, val] = clean.split("=");
            return [key, val];
          })
      );
    }

    function cleanMap(map) {
      for (let [k, v] of map) if (!v || v.trim() === "") map.delete(k);
      return map;
    }

    function serializeParams(map) {
      // keep whatever keys the map has (URL map includes @)
      return Array.from(map.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
    }

    function syncParamsToUrl(map) {
      const newUrl = new URL(window.location.href);
      allowedKeys.forEach((key) => newUrl.searchParams.delete(key));
      for (let [k, v] of cleanMap(new Map(map))) newUrl.searchParams.set(k, v);
      history.replaceState({}, "", newUrl);
    }

    function applyParams(map) {
      cleanMap(map);
      const newParams = Array.from(map.entries())
        .map(([k, v]) => `@${k}=${v}`)
        .join("&");
      const w = document.getElementById(widgetId);
      if (w) w.setAttribute("data-params", newParams);

      const urlMap = new Map(
        Array.from(map.entries()).map(([k, v]) => [`@${k}`, v])
      );
      syncParamsToUrl(urlMap);
    }

    function adjustDropdownPosition(dropdown, input) {
      if (!dropdown || !input) return;
      const rect = input.getBoundingClientRect();
      const midpoint = window.innerHeight / 2;
      if (rect.top > midpoint) dropdown.classList.add("flipped");
      else dropdown.classList.remove("flipped");
    }

    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
    }

    function base64UrlDecode(str) {
      if (!str) return null;
      str = str.replace(/-/g, "+").replace(/_/g, "/");
      while (str.length % 4) str += "=";
      return decodeURIComponent(
        atob(str)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
    }

    function safeDecodeLocation(jwt) {
      try {
        const decoded = JSON.parse(base64UrlDecode(jwt));
        return decoded?.location_id || null;
      } catch {
        return null;
      }
    }

    /* ----------------- widget lifecycle wiring ---------------- */
    // listen BEFORE first render so we catch the initial load
    window.addEventListener("widgetLoaded", function (event) {
      if (event.detail?.widgetId !== widgetId) return;

      loader && loader.classList.add("hidden");
      document
        .querySelectorAll(".loading-pill")
        .forEach((el) => el.classList.remove("loading-pill"));

      // Typeahead (search-select)
      document.querySelectorAll(".search-select").forEach((select) => {
        const input = select.querySelector(".search-input");
        const dropdown = select.querySelector(".search-options");
        const options = dropdown.querySelectorAll(".search-option");
        const rawFilterKey = select.dataset.filter || "";
        const filterKey = rawFilterKey.replace(/^@+/, "");

        input.addEventListener("focus", () => {
          adjustDropdownPosition(dropdown, input);
          dropdown.classList.remove("hidden");
          filterOptions("");
        });
        document.addEventListener("click", (e) => {
          if (!select.contains(e.target)) dropdown.classList.add("hidden");
        });
        input.addEventListener("input", () => filterOptions(input.value));

        function filterOptions(q) {
          const lower = (q || "").toLowerCase();
          options.forEach((opt) => {
            const text = (opt.dataset.text || "").toLowerCase();
            opt.style.display = text.includes(lower) ? "block" : "none";
          });
        }

        options.forEach((opt) => {
          opt.addEventListener("click", () => {
            const id = opt.dataset.id;
            input.value = "";
            dropdown.classList.add("hidden");

            const w = document.getElementById(widgetId);
            if (!w) return;

            let map = parseParams(w.getAttribute("data-params"));
            let existing = map.get(filterKey) || "";

            const items = existing
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (!items.includes(id)) items.push(id);

            map.set(filterKey, items.join(","));
            applyParams(new Map(Array.from(map.entries())));
            prepReload();
            ReInitWidget(widgetId);
          });
        });
      });
    });

    // first render (after listener is attached)
    loader && loader.classList.remove("hidden");
    if (typeof ReInitWidget === "function") ReInitWidget(widgetId);

    /* ---------------- global interactions ---------------- */
    document.addEventListener("click", function (e) {
      const w = document.getElementById(widgetId);
      if (!w) return;

      const btn = e.target.closest(".filterBtn");
      if (!btn) return;

      e.preventDefault();
      const filter = (btn.dataset.filter || "").replace(/^@+/, "");
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      let map = parseParams(w.getAttribute("data-params") || "");

      if (action === "remove") {
        const current = map.get(filter) || "";
        const updated = current
          .split(",")
          .map((s) => s.trim())
          .filter((val) => val !== id);
        if (updated.length) map.set(filter, updated.join(","));
        else map.delete(filter);
      } else if (action === "add" && filter && id && id.trim() !== "") {
        map.set(filter, id);
      }

      applyParams(new Map(Array.from(map.entries())));
      prepReload();

      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.classList.add("loading-pill");

      setTimeout(() => ReInitWidget(widgetId), 20);
    });

    document.addEventListener("change", function (e) {
      const w = document.getElementById(widgetId);
      if (!w) return;

      const select = e.target.closest(".filterSelect");
      if (!select) return;

      const filter = (select.name || "").replace(/^@+/, "");
      const id = select.value;

      let map = parseParams(w.getAttribute("data-params") || "");
      if (id) map.set(filter, id);
      else map.delete(filter);

      applyParams(new Map(Array.from(map.entries())));
      prepReload();
      ReInitWidget(widgetId);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      const input = e.target.closest(".filterSearch");
      if (!input) return;

      const filter = (input.name || "").replace(/^@+/, "");
      const value = input.value;

      const w = document.getElementById(widgetId);
      if (!w || !filter) return;

      let map = parseParams(w.getAttribute("data-params") || "");
      if (value) map.set(filter, value);
      else map.delete(filter);

      applyParams(new Map(Array.from(map.entries())));
      prepReload();
      ReInitWidget(widgetId);
    });
  }
})();
