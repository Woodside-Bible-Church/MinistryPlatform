(function () {
  const isLocalDev =
    location.hostname.includes("localhost") ||
    location.hostname.includes("127.0.0.1");

  const templatePath = isLocalDev
    ? "/CustomWidgets/GroupFinder/Template/widget.html"
    : "/Template/widget.html";

  const tag = `
  <div class="container">
    <div id="GroupFinderWidget" 
        data-component="CustomWidget" 
        data-sp="api_custom_GroupFinderWidget_JSON" 
        data-params="" 
        data-template="${templatePath}"
        data-requireUser="false" 
        data-cache="false" 
        data-host="woodsidebible" 
        data-debug="true">
    </div>  
  </div>`;

  const widgetRoot = document.getElementById("groupTag");
  const loader = document.getElementById("loader");

  if (widgetRoot) {
    if (loader) loader.classList.remove("hidden");
    widgetRoot.innerHTML = tag;
    ReInitWidget("GroupFinderWidget");
  }

  window.addEventListener("widgetLoaded", function (event) {
    if (event.detail?.widgetId !== "GroupFinderWidget") return;
    if (loader) loader.classList.add("hidden");
    document.querySelectorAll(".loading-pill").forEach((el) => {
      el.classList.remove("loading-pill");
    });
  });

  document.addEventListener("click", function (e) {
    const widget = document.getElementById("GroupFinderWidget");
    if (!widget) return;

    const btn = e.target.closest(".filterBtn");
    if (!btn) return;

    e.preventDefault();
    const filter = btn.dataset.filter?.replace(/^@+/, "");
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    let currentParams = widget.getAttribute("data-params") || "";
    currentParams = currentParams.replace(/@@/g, "@");

    const paramEntries = currentParams
      .split("&")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const clean = p.replace(/^@+/, "");
        const [key, val] = clean.split("=");
        return [key, val];
      });

    const paramMap = new Map(paramEntries);

    if (action === "remove") {
      paramMap.delete(filter);
    } else if (action === "add" && filter && id) {
      paramMap.set(filter, id);
    }

    const newParams = Array.from(paramMap.entries())
      .map(([k, v]) => `@${k}=${v}`)
      .join("&");

    console.log("Updated data-params:", newParams);
    widget.setAttribute("data-params", newParams);
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
    clone.classList.add("loading-pill");

    setTimeout(() => {
      ReInitWidget("GroupFinderWidget");
    }, 20);
  });

  document.addEventListener("change", function (e) {
    const widget = document.getElementById("GroupFinderWidget");
    if (!widget) return;

    const select = e.target.closest(".filterSelect");
    if (!select) return;

    const filter = select.name?.replace(/^@+/, "");
    const id = select.value;
    if (!filter) return;

    let currentParams = widget.getAttribute("data-params") || "";
    currentParams = currentParams.replace(/@@/g, "@");

    const paramEntries = currentParams
      .split("&")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const clean = p.replace(/^@+/, "");
        const [key, val] = clean.split("=");
        return [key, val];
      });

    const paramMap = new Map(paramEntries);
    if (id) {
      paramMap.set(filter, id);
    } else {
      paramMap.delete(filter);
    }

    const newParams = Array.from(paramMap.entries())
      .map(([k, v]) => `@${k}=${v}`)
      .join("&");

    widget.setAttribute("data-params", newParams);
    ReInitWidget("GroupFinderWidget");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;

    const input = e.target.closest(".filterSearch");
    if (!input) return;

    const widget = document.getElementById("GroupFinderWidget");
    if (!widget) return;

    const filter = input.name?.replace(/^@+/, "");
    const value = input.value;
    if (!filter || !value) return;

    let currentParams = widget.getAttribute("data-params") || "";
    currentParams = currentParams.replace(/@@/g, "@");

    const paramEntries = currentParams
      .split("&")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const clean = p.replace(/^@+/, "");
        const [key, val] = clean.split("=");
        return [key, val];
      });

    const paramMap = new Map(paramEntries);
    paramMap.set(filter, value);

    const newParams = Array.from(paramMap.entries())
      .map(([k, v]) => `@${k}=${v}`)
      .join("&");

    widget.setAttribute("data-params", newParams);
    ReInitWidget("GroupFinderWidget");
  });
})();
