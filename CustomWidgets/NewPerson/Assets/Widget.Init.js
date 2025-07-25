(function () {
  // 🧩 CONFIGURATION
  const widgetId = "NewPersonWidget"; // Only change this for other widgets
  const storedProc = "api_custom_NewPersonWidget";

  const hostname = location.hostname;
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isHostedApp = hostname.includes(
    "https://new-person-widget.vercel.app/"
  );

  const templatePath = isLocalDev
    ? `/CustomWidgets/${widgetId.replace("Widget", "")}/Template/widget.html`
    : isHostedApp
    ? "/Template/widget.html"
    : "https://new-person-widget.vercel.app//Template/widget.html";

  const allowedKeys = [
    "@UserName",
    "@CongregationID",
    "@EventTypeID",
    "@ProgramID",
    "@Date"
  ];

  const urlParams = new URLSearchParams(window.location.search);

  // 🔍 Filter valid params
  const paramMap = new Map(
    Array.from(urlParams.entries()).filter(
      ([k, v]) => allowedKeys.includes(k) && v && v.trim() !== ""
    )
  );

  const filteredParams = Array.from(paramMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  // 🧱 Inject the widget DIV
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

    // Wait for ReInitWidget to be available
    const waitForReInit = setInterval(() => {
      if (typeof window.ReInitWidget === "function") {
        clearInterval(waitForReInit);
        window.ReInitWidget(widgetId);
      }
    }, 50);
  }

  // ✅ Confirm widget load
  window.addEventListener("widgetLoaded", function (event) {
    if (event.detail?.widgetId !== widgetId) return;
    console.log("✅ Widget loaded:", event.detail);
  });

  // 🔁 Utility Functions
  function cleanMap(map) {
    for (let [k, v] of map) {
      if (!v || v.trim() === "") {
        map.delete(k);
      }
    }
    return map;
  }

  function syncParamsToUrl(paramMap) {
    const newUrl = new URL(window.location.href);
    allowedKeys.forEach((key) => newUrl.searchParams.delete(key));
    for (let [k, v] of cleanMap(paramMap)) {
      newUrl.searchParams.set("@" + k, v);
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

    const widget = document.getElementById(widgetId);
    if (widget) {
      widget.setAttribute("data-params", newParams);
    }
    syncParamsToUrl(paramMap);
  }

  // 🧠 Listeners for filters
  document.addEventListener("click", function (e) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;

    const btn = e.target.closest(".filterBtn");
    if (!btn) return;

    e.preventDefault();
    const filter = btn.dataset.filter?.replace(/^@+/, "");
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    let paramMap = parseParams(widget.getAttribute("data-params") || "");

    if (action === "remove") {
      paramMap.delete(filter);
    } else if (action === "add" && filter && id && id.trim() !== "") {
      paramMap.set(filter, id);
    }

    applyParams(paramMap);

    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
    clone.classList.add("loading-pill");

    setTimeout(() => {
      ReInitWidget(widgetId);
    }, 20);
  });

  document.addEventListener("change", function (e) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;

    const select = e.target.closest(".filterSelect");
    if (!select) return;

    const filter = select.name?.replace(/^@+/, "");
    const id = select.value;

    let paramMap = parseParams(widget.getAttribute("data-params") || "");

    if (id) {
      paramMap.set(filter, id);
    } else {
      paramMap.delete(filter);
    }

    applyParams(paramMap);
    ReInitWidget(widgetId);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;

    const input = e.target.closest(".filterSearch");
    if (!input) return;

    const filter = input.name?.replace(/^@+/, "");
    const value = input.value;

    const widget = document.getElementById(widgetId);
    if (!widget || !filter) return;

    let paramMap = parseParams(widget.getAttribute("data-params") || "");

    if (value) {
      paramMap.set(filter, value);
    } else {
      paramMap.delete(filter);
    }

    applyParams(paramMap);
    ReInitWidget(widgetId);
  });
})();
