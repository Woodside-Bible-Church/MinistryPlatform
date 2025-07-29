(function () {
  const widgetId = "NewPersonWidget";
  const containerId = `${widgetId}-container`;
  const storedProc = "api_custom_NewPersonWidget";

  const hostname = location.hostname;
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isHostedApp = hostname.includes("new-person-widget.vercel.app");

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

  const paramMap = new Map(
    Array.from(urlParams.entries()).filter(
      ([k, v]) => allowedKeys.includes(k) && v?.trim()
    )
  );

  // ✅ Inject today's date if @Date is not present
  if (!paramMap.has("@Date")) {
    const today = new Date();
    const mm = today.getMonth() + 1;
    const dd = today.getDate();
    const yyyy = today.getFullYear();
    paramMap.set("@Date", `${mm}/${dd}/${yyyy}`);
  }

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

  const widgetRoot = document.getElementById(containerId);
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
    if (event.detail?.widgetId !== widgetId) return;
    console.log("✅ Widget loaded:", event.detail);

    // 🟢 Initialize the date picker *after* widget is fully rendered
    setTimeout(() => {
      initDatePicker();
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

    const widgetRoot = document.getElementById(containerId);
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

  // 📅 Date Picker Logic
  function formatDateToParam(dateStr) {
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${parseInt(mm)}/${parseInt(dd)}/${yyyy}`;
  }

  function initDatePicker() {
    const picker = document.getElementById("datePicker");
    if (!picker) return;

    const widget = document.getElementById(widgetId);
    if (!widget) return;

    const paramMap = parseParams(widget.getAttribute("data-params") || "");
    const currentDate = paramMap.get("Date");

    if (currentDate) {
      const parsed = new Date(currentDate);
      if (!isNaN(parsed)) {
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, "0");
        const dd = String(parsed.getDate()).padStart(2, "0");
        picker.value = `${yyyy}-${mm}-${dd}`;
      }
    }

    picker.addEventListener("change", () => {
      console.log(
        "📅 Picker changed, reloading widget with date:",
        picker.value
      );
      const formatted = formatDateToParam(picker.value);
      paramMap.set("Date", formatted);
      applyParams(paramMap); // 🚀 rebuilds + re-inits
    });
  }
})();
