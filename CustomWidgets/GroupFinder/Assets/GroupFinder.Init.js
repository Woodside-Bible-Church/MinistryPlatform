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
      const decoded = JSON.parse(base64UrlDecode(cookieJwt));
      console.log("Decoded cookie payload:", decoded);
      if (decoded?.location_id) {
        console.log("Found location_id in cookie:", decoded.location_id);
        fallbackCongregationID = decoded.location_id;
      }
    } catch (e) {
      console.warn("Failed to decode or parse location cookie:", e);
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

    // Custom dropdown filter logic (typeahead + selection)
    document.querySelectorAll(".search-select").forEach((select) => {
      const input = select.querySelector(".search-input");
      const dropdown = select.querySelector(".search-options");
      const options = dropdown.querySelectorAll(".search-option");
      const rawFilterKey = select.dataset.filter || "";
      const filterKey = rawFilterKey.replace(/^@+/, ""); // ✅ strip leading @

      // Show dropdown when focused
      input.addEventListener("focus", () => {
        adjustDropdownPosition(dropdown, input); // ✅ call BEFORE showing
        dropdown.classList.remove("hidden");
        filterOptions("");
      });

      // Hide dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!select.contains(e.target)) {
          dropdown.classList.add("hidden");
        }
      });

      // Filter options as user types
      input.addEventListener("input", () => {
        filterOptions(input.value);
      });

      function filterOptions(query) {
        const lower = query.toLowerCase();
        options.forEach((option) => {
          const text = option.dataset.text.toLowerCase();
          option.style.display = text.includes(lower) ? "block" : "none";
        });
      }

      // When user clicks an option
      options.forEach((option) => {
        option.addEventListener("click", () => {
          const id = option.dataset.id;
          const text = option.dataset.text;

          input.value = ""; // optional: clear input after selection
          dropdown.classList.add("hidden");

          const widget = document.getElementById("GroupFinderWidget");
          if (!widget) return;

          let paramMap = parseParams(widget.getAttribute("data-params") || "");
          let existing = paramMap.get(filterKey) || "";

          // Build new comma-separated list (without duplicates)
          const items = existing
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          if (!items.includes(id)) {
            items.push(id);
          }

          paramMap.set(filterKey, items.join(","));
          applyParams(paramMap);
          ReInitWidget("GroupFinderWidget");
        });
      });
    });
  });

  function adjustDropdownPosition(dropdown, input) {
    const rect = input.getBoundingClientRect();
    const midpoint = window.innerHeight / 2;

    if (rect.top > midpoint) {
      dropdown.classList.add("flipped");
    } else {
      dropdown.classList.remove("flipped");
    }
  }

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
      const current = paramMap.get(filter) || "";
      const updated = current
        .split(",")
        .map((s) => s.trim())
        .filter((val) => val !== id);

      if (updated.length) {
        paramMap.set(filter, updated.join(","));
      } else {
        paramMap.delete(filter);
      }
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
