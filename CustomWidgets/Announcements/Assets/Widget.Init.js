(function () {
  const widgetId = "Announcements";
  const storedProc = "api_custom_AnnouncementsWidget_JSON";

  // --- Environment detection ---
  const hostname = location.hostname;
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isHostedApp = /(^|\.)announcements-black\.vercel\.app$/i.test(hostname);

  // Where to load the Liquid template from
  const templatePath = isLocalDev
    ? `/CustomWidgets/${widgetId}/Template/widget.html`
    : isHostedApp
    ? `/Template/widget.html`
    : `https://announcements-black.vercel.app/Template/widget.html`;

  // --- Accepted query params to forward to the SP ---
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
      ([k, v]) => allowedKeys.includes(k) && v?.trim()
    )
  );

  const filteredParams = Array.from(paramMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  // NOTE: render the inner widget with a different id to avoid duplicate #Announcements
  const innerId = `${widgetId}Inner`;
  const tag = `
    <div id="${innerId}"
         data-component="CustomWidget"
         data-sp="${storedProc}"
         data-params="${filteredParams}"
         data-template="${templatePath}"
         data-requireUser="false"
         data-cache="false"
         data-host="woodsidebible"
         data-debug="true">
    </div>`;

  const widgetRoot = document.getElementById(widgetId);
  const loader = document.getElementById("loader");

  if (widgetRoot) {
    if (loader) loader.classList.remove("hidden");
    widgetRoot.innerHTML = tag;

    const waitForReInit = setInterval(() => {
      if (typeof window.ReInitWidget === "function") {
        clearInterval(waitForReInit);
        window.ReInitWidget(widgetId); // keep passing the outer container id
      }
    }, 50);
  }

  window.addEventListener("widgetLoaded", function (event) {
    if (loader) loader.classList.add("hidden");
    if (event.detail?.widgetId !== widgetId) return;
    console.log("✅ Widget loaded:", event.detail);

    // Optional: any post-load hooks
    if (typeof initDatePicker === "function") {
      setTimeout(initDatePicker, 100);
    }
  });

  // ---------- helpers ----------
  function cleanMap(map) {
    for (const [k, v] of map) if (!v?.trim()) map.delete(k);
    return map;
  }

  function syncParamsToUrl(paramMap) {
    const newUrl = new URL(window.location.href);
    allowedKeys.forEach((key) => newUrl.searchParams.delete(key));
    for (const [k, v] of cleanMap(paramMap)) newUrl.searchParams.set(k, v);
    window.history.replaceState({}, "", newUrl);
  }

  function parseParams(str) {
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

  function applyParams(paramMap) {
    cleanMap(paramMap);

    const newParams = Array.from(paramMap.entries())
      .map(([k, v]) => `@${k}=${v}`)
      .join("&");

    const root = document.getElementById(widgetId);
    if (!root) return;

    const tag = `
      <div id="${innerId}"
           data-component="CustomWidget"
           data-sp="${storedProc}"
           data-params="${newParams}"
           data-template="${templatePath}"
           data-requireUser="false"
           data-cache="false"
           data-host="woodsidebible"
           data-debug="true">
      </div>`;

    root.innerHTML = tag;
    syncParamsToUrl(paramMap);

    if (typeof ReInitWidget === "function") {
      ReInitWidget(widgetId);
    }
  }

  // expose (optional)
  window.applyAnnouncementsParams = applyParams;
})();
