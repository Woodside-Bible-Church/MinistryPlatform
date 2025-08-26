(function () {
  // ---------- tiny utils ----------
  function ensureStylesheet(href) {
    if (!href) return Promise.resolve();
    const already = Array.from(document.styleSheets).some(
      (s) => s.href && s.href.includes(href)
    );
    if (already) return Promise.resolve();
    return new Promise((res, rej) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.crossOrigin = "anonymous";
      link.onload = () => res();
      link.onerror = rej;
      document.head.appendChild(link);
    });
  }
  function ensureScript(src) {
    if (!src) return Promise.resolve();
    if (document.querySelector(`script[src*="${src}"]`))
      return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.crossOrigin = "anonymous";
      s.onload = () => res();
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const joinPath = (root, seg) =>
    root.replace(/\/+$/, "") + "/" + String(seg || "").replace(/^\/+/, "");

  // ---------- anchors ----------
  const mount = document.getElementById("groupFinder");
  if (!mount) return;
  const currentScript =
    document.currentScript ||
    Array.from(document.scripts).find((s) =>
      (s.src || "").includes("Assets/embed.js")
    );

  // ---------- root inference ----------
  function inferRootFromScript() {
    if (!currentScript || !currentScript.src) return "";
    const url = new URL(currentScript.src, document.baseURI);
    // strip "/Assets/<file>.js"
    return url.pathname.replace(/\/Assets\/[^/]+\.js$/, "");
  }
  const inferred = inferRootFromScript();
  const isVercel = /\.vercel\.app$/i.test(location.hostname);

  // On Vercel, assets live at /Assets & /Template (root),
  // otherwise use the folder the script is in (e.g. /CustomWidgets/GroupFinder)
  const ROOT = isVercel ? "" : inferred;

  // ---------- config ----------
  const host = mount.dataset.host || "woodsidebible";
  const templatePath = joinPath(ROOT, "/Template/widget.html");
  const cssUrl = joinPath(ROOT, "/Assets/widget.css");
  const widgetsUrl = joinPath(ROOT, "/Assets/CustomWidgets.js");

  // preview flag via URL
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true")
      document.body.classList.add("preview");
  } catch {}

  // ---------- deps ----------
  const FA6 =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  Promise.resolve()
    .then(() => ensureStylesheet(FA6))
    .then(() => ensureStylesheet(cssUrl))
    .then(() => ensureScript(widgetsUrl))
    .then(initWidget)
    .catch((e) =>
      console.warn("GroupFinder embed failed to load a dependency:", e)
    );

  // ---------- main ----------
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

    // cookie → @CongregationID fallback
    const cookieJwt = getCookie("tbx-ws__selected-location");
    const fallbackCongregationID = safeDecodeLocation(cookieJwt);
    if (!paramMap.has("@CongregationID") && fallbackCongregationID) {
      paramMap.set("@CongregationID", String(fallbackCongregationID));
    }

    mount.style.position = "relative";
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

    // first render
    if (loader) loader.classList.remove("hidden");
    if (typeof ReInitWidget === "function") ReInitWidget(widgetId);

    // hide loader + wire interactions
    window.addEventListener("widgetLoaded", function (event) {
      if (event.detail?.widgetId !== widgetId) return;
      if (loader) loader.classList.add("hidden");
      document
        .querySelectorAll(".loading-pill")
        .forEach((el) => el.classList.remove("loading-pill"));

      // typeahead selects
      document.querySelectorAll(".search-select").forEach((select) => {
        const input = select.querySelector(".search-input");
        const dropdown = select.querySelector(".search-options");
        const options = dropdown.querySelectorAll(".search-option");
        const filterKey = (select.dataset.filter || "").replace(/^@+/, "");

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
            applyParams(map);
            prepReload();
            ReInitWidget(widgetId);
          });
        });
      });
    });

    // shared helpers
    function prepReload() {
      if (loader) loader.classList.remove("hidden");
      const el = document.getElementById("groupFinder") || mount;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        try {
          const url = new URL(window.location.href);
          url.hash = "groupFinder";
          history.replaceState({}, "", url);
        } catch {}
      }
    }
    function parseParams(str = "") {
      return new Map(
        str
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
      map = cleanMap(new Map(map));
      const newParams = Array.from(map.entries())
        .map(([k, v]) => `@${k}=${v}`)
        .join("&");
      const w = document.getElementById(widgetId);
      if (w) w.setAttribute("data-params", newParams);

      // also sync to URL using @-prefixed keys
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

    // click pills (add/remove)
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

      applyParams(map);
      prepReload();

      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.classList.add("loading-pill");

      setTimeout(() => ReInitWidget(widgetId), 20);
    });

    // select dropdowns
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

      applyParams(map);
      prepReload();
      ReInitWidget(widgetId);
    });

    // enter in search inputs
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

      applyParams(map);
      prepReload();
      ReInitWidget(widgetId);
    });

    // cookie helpers
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
  }
})();
