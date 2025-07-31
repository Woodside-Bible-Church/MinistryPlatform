(function () {
  const widgetId = "EventFinder";
  const storedProc = "api_custom_EventFinderWidget_JSON";

  const hostname = location.hostname;
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isHostedApp = hostname.includes(
    "https://event-finder-alpha.vercel.app"
  );

  const templatePath = isLocalDev
    ? `/CustomWidgets/${widgetId.replace("Widget", "")}/Template/widget.html`
    : isHostedApp
    ? "/Template/widget.html"
    : "https://event-finder-alpha.vercel.app/Template/widget.html";

  const allowedKeys = [
    "@CongregationID",
    "@MinistryIDs",
    "@Search",
    "@EventIDs",
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

  const tag = `
    <div id="${widgetId}" 
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
        window.ReInitWidget(widgetId);
      }
    }, 50);
  }

  window.addEventListener("widgetLoaded", function (event) {
    loader?.classList.add("hidden");
    if (event.detail?.widgetId !== widgetId) return;
    console.log("✅ Widget loaded:", event.detail);

    setTimeout(() => {
      if (typeof initDatePicker === "function") {
        initDatePicker();
      }
    }, 100);
  });

  function cleanMap(map) {
    for (let [k, v] of map) {
      if (!v?.trim()) {
        map.delete(k);
      }
    }
    return map;
  }

  function syncParamsToUrl(paramMap) {
    const newUrl = new URL(window.location.href);
    allowedKeys.forEach((key) => newUrl.searchParams.delete(key));
    for (let [k, v] of cleanMap(paramMap)) {
      newUrl.searchParams.set(k, v);
    }
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

    const widgetRoot = document.getElementById(widgetId);
    if (!widgetRoot) return;

    const tag = `
      <div id="${widgetId}" 
           data-component="CustomWidget" 
           data-sp="${storedProc}" 
           data-params="${newParams}" 
           data-template="${templatePath}" 
           data-requireUser="false" 
           data-cache="false" 
           data-host="woodsidebible" 
           data-debug="true">
      </div>`;

    widgetRoot.innerHTML = tag;
    syncParamsToUrl(paramMap);

    if (typeof ReInitWidget === "function") {
      ReInitWidget(widgetId);
    }
  }

  // Optional: expose helper if needed elsewhere
  window.applyEventFinderParams = applyParams;
})();
