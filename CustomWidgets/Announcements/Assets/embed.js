(function () {
  /* ===== Config toggles ===== */
  const USE_SKELETON_FIRST_LOAD = true;

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
  const mount = document.getElementById("Announcements");
  if (!mount) return;

  // Resolve asset URLs from this script’s location
  const currentScript =
    document.currentScript ||
    Array.from(document.scripts).find((s) =>
      (s.src || "").includes("/Assets/embed.js")
    );
  if (!currentScript) {
    console.warn("Announcements embed: script tag not found.");
    return;
  }
  const SCRIPT_URL = new URL(currentScript.src, document.baseURI);
  const ASSETS_DIR = new URL(".", SCRIPT_URL); // /Assets/
  const TEMPLATE_URL = new URL("../Template/widget.html", ASSETS_DIR); // /Template/widget.html
  const CSS_URL = new URL("widget.css", ASSETS_DIR); // /Assets/widget.css
  const WIDGETS_URL = new URL("CustomWidgets.js", ASSETS_DIR); // /Assets/CustomWidgets.js

  /* ---------- config ---------- */
  const widgetId = "AnnouncementsWidget"; // inner widget container id
  const host = (mount.dataset.host || "woodsidebible").trim();

  // Optional "preview" styling flag
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
      console.warn("Announcements embed failed to load a dependency:", e)
    );

  /* ---------- main ---------- */
  function initWidget() {
    // only the params the SP accepts
    const allowedKeys = [
      "@CongregationID",
      "@GroupID",
      "@EventID",
      "@Search",
      "@AnnouncementIDs",
      "@Page",
      "@NumPerPage",
      "@UserName",
      "@DomainID"
    ];

    const urlParams = new URLSearchParams(window.location.search);
    const paramMap = new Map(
      Array.from(urlParams.entries()).filter(
        ([k, v]) => allowedKeys.includes(k) && v && v.trim() !== ""
      )
    );

    // cookie → @CongregationID fallback (same cookie the other widget uses)
    const cookieJwt = getCookie("tbx-ws__selected-location");
    const fallbackCongregationID = safeDecodeLocation(cookieJwt);
    if (!paramMap.has("@CongregationID") && fallbackCongregationID) {
      paramMap.set("@CongregationID", String(fallbackCongregationID));
    }

    // mount HTML
    mount.style.position = "relative";
    mount.innerHTML = `
      <div id="loader" class="fade-hide loader-container">
        <div class="loader-bg"></div>
        <div class="loader"></div>
      </div>
      <div id="${widgetId}"
           data-component="CustomWidget"
           data-sp="api_custom_AnnouncementsWidget_JSON"
           data-params="${serializeParams(paramMap)}"
           data-template="${TEMPLATE_URL.href}"
           data-requireUser="false"
           data-cache="false"
           data-host="${host}"
           data-debug="true"></div>
    `;

    const loader = document.getElementById("loader");

    /* ---------- SKELETON (simple) ---------- */
    function makeSkelCard() {
      return `
        <article class="ann-card skel" data-skel>
          <div class="ann-img skel-block"></div>
          <div class="ann-meta">
            <div class="skel skel-line w-70"></div>
            <div class="skel skel-line w-40"></div>
          </div>
        </article>`;
    }
    function showSkeletons(count = 4) {
      const hostEl = document.getElementById(widgetId);
      if (!hostEl) return;
      hostEl.innerHTML = `
        <section class="announcements">
          ${Array.from({ length: count }, makeSkelCard).join("")}
        </section>`;
    }
    function clearSkeletons() {
      document.querySelectorAll("[data-skel]").forEach((el) => el.remove());
    }

    /* ---------- first render ---------- */
    if (USE_SKELETON_FIRST_LOAD) showSkeletons(6);
    showLoader();
    if (typeof ReInitWidget === "function") ReInitWidget(widgetId);

    /* ---------- after each render ---------- */
    window.addEventListener("widgetLoaded", function (event) {
      if (event.detail?.widgetId !== widgetId) return;
      clearSkeletons();
      hideLoader();
    });

    /* ---------- helpers ---------- */
    function showLoader() {
      loader && loader.classList.remove("is-hidden");
    }
    function hideLoader() {
      loader && loader.classList.add("is-hidden");
    }
  }

  /* ---------- cookie helpers (same as GF) ---------- */
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

  /* ---------- param helpers ---------- */
  function serializeParams(map) {
    return Array.from(map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
  }
})();
