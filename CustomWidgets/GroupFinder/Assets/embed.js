(function () {
  /* ===== Config toggles ===== */
  const USE_SKELETON_FIRST_LOAD = true; // show skeletons before the very first load
  const SHOW_SKELETON_ON_CHANGES = false; // keep spinner-only during filter changes

  /* ---------- tiny utils ---------- */
  function ensureStylesheet(href) {
    if (!href) return Promise.resolve();
    if ([...document.styleSheets].some((s) => s.href === href))
      return Promise.resolve();
    return new Promise((res, rej) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.crossOrigin = "anonymous";
      link.onload = res;
      link.onerror = rej;
      document.head.appendChild(link);
    });
  }
  function ensureScript(src) {
    if (!src) return Promise.resolve();
    if (document.querySelector(`script[src="${src}"]`))
      return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.crossOrigin = "anonymous";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ---------- anchors ---------- */
  const mount = document.getElementById("groupFinder");
  if (!mount) return;

  // Resolve asset URLs from this script’s location
  const currentScript =
    document.currentScript ||
    Array.from(document.scripts).find((s) =>
      (s.src || "").includes("/Assets/embed.js")
    );
  if (!currentScript) {
    console.warn("GroupFinder embed: script tag not found.");
    return;
  }

  const SCRIPT_URL = new URL(currentScript.src, document.baseURI);
  const ASSETS_DIR = new URL(".", SCRIPT_URL); // /Assets/
  const TEMPLATE_URL = new URL("../Template/widget.html", ASSETS_DIR); // /Template/widget.html
  const CSS_URL = new URL("widget.css", ASSETS_DIR); // /Assets/widget.css
  const WIDGETS_URL = new URL("CustomWidgets.js", ASSETS_DIR); // /Assets/CustomWidgets.js

  /* ---------- config ---------- */
  const host = mount.dataset.host || "woodsidebible";

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true")
      document.body.classList.add("preview");
  } catch {}

  /* ---------- deps ---------- */
  const FA6 =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  Promise.resolve()
    .then(() => ensureStylesheet(FA6))
    .then(() => ensureStylesheet(CSS_URL.href))
    .then(() => ensureScript(WIDGETS_URL.href))
    .then(initWidget)
    .catch((e) =>
      console.warn("GroupFinder embed failed to load a dependency:", e)
    );

  /* ---------- main ---------- */
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
      <div id="loader" class="fade-hide loader-container">
        <div class="loader-bg"></div>
        <div class="loader"></div>
      </div>
      <div id="GroupFinderWidget"
           data-component="CustomWidget"
           data-sp="api_custom_GroupFinderWidget_JSON"
           data-params="${serializeParams(paramMap)}"
           data-template="${TEMPLATE_URL.href}"
           data-requireUser="false"
           data-cache="false"
           data-host="${host}"
           data-debug="true"></div>
    `;

    const loader = document.getElementById("loader");
    const widgetId = "GroupFinderWidget";
    let firstRender = true;

    /* ---------- SKELETON HELPERS (optional) ---------- */
    function makeSkeletonCard() {
      return `
        <div class="groupGrid skel-card" data-skel>
          <h3 class="groupTitle"><span class="skel h-24 w-60"></span></h3>
          <div class="groupDetailsContainer">
            <h6>RHYTHM</h6>
            <div class="groupDetails">
              <span class="skel h-16 w-120"></span><span class="skel h-16 w-120"></span>
              <span class="skel h-16 w-60"></span><span class="skel h-16 w-120"></span>
              <span class="skel h-16 w-70"></span><span class="skel h-16 w-80"></span>
            </div>
          </div>
          <div class="groupLeadersContainer">
            <h6>LEADERS</h6>
            <div><span class="skel h-16 w-60"></span></div>
          </div>
          <div class="groupAboutContainer">
            <h6>ABOUT US</h6>
            <div>
              <div class="skel h-16 w-80"></div>
              <div class="skel h-16 w-70" style="margin-top:.4rem"></div>
              <div class="skel h-16 w-60" style="margin-top:.4rem"></div>
            </div>
          </div>
          <div class="groupTagsContainer">
            <ul class="groupTags">
              <li><span class="skel skel-pill w-120"></span></li>
              <li><span class="skel skel-pill w-120"></span></li>
              <li><span class="skel skel-pill w-120"></span></li>
            </ul>
          </div>
          <div class="groupSignUpBtn">
            <div class="skel h-44 w-120"></div>
          </div>
        </div>`;
    }
    function showSkeletons(count = 5) {
      const host = document.getElementById(widgetId);
      if (!host) return;
      const cards = Array.from({ length: count }, makeSkeletonCard).join("");
      host.innerHTML = `<section id="groupFinder" class="groupFinderContainer"><h1 class="sectionHeading">Find a Group</h1><div class="filterContainer">
        <div class="left">
          <ul class="selectedFilters carousel fadeToBlue">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
          </ul>
        </div>
        <button popovertarget="filterMenu" class="right filterIconContainer">
          <i class="fas fa-filter"></i>
        </button>
      </div><div class="groups" data-skel>${cards}</div></section>`;
    }
    function clearSkeletons() {
      document.querySelectorAll("[data-skel]").forEach((el) => el.remove());
    }

    /* ---------- first render ---------- */
    if (USE_SKELETON_FIRST_LOAD) showSkeletons();
    showLoader(); // keep spinner visible too
    if (typeof ReInitWidget === "function") ReInitWidget(widgetId);

    /* ---------- after each render ---------- */
    window.addEventListener("widgetLoaded", function (event) {
      if (event.detail?.widgetId !== widgetId) return;
      clearSkeletons();
      closeFilterPopover();
      hideLoader();
      document
        .querySelectorAll(".loading-pill")
        .forEach((el) => el.classList.remove("loading-pill"));
      firstRender = false;

      // wire typeahead after content paints
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
            closeFilterPopover();
            prepReload(); // show loader + scroll
            if (SHOW_SKELETON_ON_CHANGES) showSkeletons();
            ReInitWidget(widgetId);
          });
        });
      });
    });

    /* ---------- helpers ---------- */
    function showLoader() {
      loader && loader.classList.remove("is-hidden");
    }
    function hideLoader() {
      loader && loader.classList.add("is-hidden");
    }

    function prepReload() {
      showLoader(); // keep spinner on changes
      const el = document.getElementById("groupFinder") || mount;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" }); // navigate to #groupFinder
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
            const [k, v] = clean.split("=");
            return [k, v];
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

    // pills
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
        const updated = (map.get(filter) || "")
          .split(",")
          .map((s) => s.trim())
          .filter((val) => val !== id);
        updated.length
          ? map.set(filter, updated.join(","))
          : map.delete(filter);
      } else if (action === "add" && filter && id && id.trim() !== "") {
        map.set(filter, id);
      }

      applyParams(map);
      closeFilterPopover();
      prepReload(); // loader + jump
      if (SHOW_SKELETON_ON_CHANGES) showSkeletons();

      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.classList.add("loading-pill");

      setTimeout(() => ReInitWidget(widgetId), 20);
    });

    // selects
    document.addEventListener("change", function (e) {
      const w = document.getElementById(widgetId);
      if (!w) return;
      const select = e.target.closest(".filterSelect");
      if (!select) return;

      const filter = (select.name || "").replace(/^@+/, "");
      const id = select.value;

      let map = parseParams(w.getAttribute("data-params") || "");
      id ? map.set(filter, id) : map.delete(filter);

      applyParams(map);
      closeFilterPopover();
      prepReload();
      if (SHOW_SKELETON_ON_CHANGES) showSkeletons();
      ReInitWidget(widgetId);
    });

    // search enter
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      const input = e.target.closest(".filterSearch");
      if (!input) return;

      const filter = (input.name || "").replace(/^@+/, "");
      const value = input.value;
      const w = document.getElementById(widgetId);
      if (!w || !filter) return;

      let map = parseParams(w.getAttribute("data-params") || "");
      value ? map.set(filter, value) : map.delete(filter);

      applyParams(map);
      closeFilterPopover();
      prepReload();
      if (SHOW_SKELETON_ON_CHANGES) showSkeletons();
      ReInitWidget(widgetId);
    });

    /* ---------- cookie + popover ---------- */
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
    function closeFilterPopover() {
      const fm = document.getElementById("filterMenu");
      if (!fm) return;
      if (typeof fm.hidePopover === "function" && fm.matches(":popover-open")) {
        try {
          fm.hidePopover();
        } catch {}
      } else {
        fm.classList.remove("is-open");
        fm.removeAttribute("open");
      }
    }
  }
})();
