(function () {
  const hostname = location.hostname;
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");

  const isHostedApp = hostname.includes("groupfinder-five.vercel.app");

  const templatePath = isLocalDev
    ? "/CustomWidgets/GroupFinder/Template/widget.html"
    : isHostedApp
    ? "/Template/widget.html"
    : "https://groupfinder-five.vercel.app/Template/widget.html";

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
  // Helper to get a cookie by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // Decode base64url (padding fix)
  function base64UrlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return decodeURIComponent(
      atob(str)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  }

  // Try to get location_id from cookie if @CongregationID is missing
  const cookieJwt = getCookie("tbx-ws__selected-location");
  console.log("Cookie JWT:", cookieJwt);

  let fallbackCongregationID = null;

  if (cookieJwt) {
    try {
      const decodedJwt = decodeURIComponent(cookieJwt);
      const parts = decodedJwt.split(".");

      if (parts.length === 3) {
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        if (payload?.location_id) {
          console.log("Found location_id in JWT payload:", payload.location_id);
          fallbackCongregationID = payload.location_id;
        }
      }
    } catch (e) {
      console.warn("Invalid JWT in cookie:", e);
    }
  }

  // Build URL params map
  const paramMap = new Map(
    Array.from(urlParams.entries()).filter(
      ([k, v]) => allowedKeys.includes(k) && v && v.trim() !== ""
    )
  );

  // Fallback to cookie-based CongregationID if missing
  if (!paramMap.has("@CongregationID") && fallbackCongregationID) {
    paramMap.set("@CongregationID", fallbackCongregationID.toString());
  }

  const filteredParams = Array.from(paramMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const tag = `
    <div class="container">
      <div id="GroupFinderWidget" 
          data-component="CustomWidget" 
          data-sp="api_custom_GroupFinderWidget_JSON" 
          data-params="${filteredParams}" 
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

    const widget = document.getElementById("GroupFinderWidget");
    if (widget) {
      widget.setAttribute("data-params", newParams);
    }
    syncParamsToUrl(paramMap);
  }

  document.addEventListener("click", function (e) {
    const widget = document.getElementById("GroupFinderWidget");
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

    let paramMap = parseParams(widget.getAttribute("data-params") || "");

    if (id) {
      paramMap.set(filter, id);
    } else {
      paramMap.delete(filter);
    }

    applyParams(paramMap);
    ReInitWidget("GroupFinderWidget");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;

    const input = e.target.closest(".filterSearch");
    if (!input) return;

    const filter = input.name?.replace(/^@+/, "");
    const value = input.value;

    const widget = document.getElementById("GroupFinderWidget");
    if (!widget || !filter) return;

    let paramMap = parseParams(widget.getAttribute("data-params") || "");

    if (value) {
      paramMap.set(filter, value);
    } else {
      paramMap.delete(filter);
    }

    applyParams(paramMap);
    ReInitWidget("GroupFinderWidget");
  });
})();
