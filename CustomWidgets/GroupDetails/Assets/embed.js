(function () {
  // ---- Mount ----
  const mount = document.getElementById("groupDetails");
  if (!mount) return;

  // ---- Resolve paths from this script's URL ----
  const currentScript =
    document.currentScript ||
    Array.from(document.scripts).find((s) =>
      (s.src || "").includes("/Assets/embed.js")
    );
  if (!currentScript) {
    console.warn("Group Details embed: script tag not found.");
    return;
  }

  const SCRIPT_URL = new URL(currentScript.src, document.baseURI);
  const ASSETS_DIR = new URL(".", SCRIPT_URL); // /Assets/
  const TEMPLATE_URL = new URL("../Template/widget.html", ASSETS_DIR);
  const CSS_URL = new URL("widget.css", ASSETS_DIR);
  const WIDGETS_URL = new URL("CustomWidgets.js", ASSETS_DIR);

  // ---- Font Awesome ----
  const FA6 =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";

  // ---- Helpers to load deps ----
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

  // ---- Read ?id= ----
  let groupId = null;
  try {
    const sp = new URLSearchParams(window.location.search);
    groupId = (sp.get("id") || "").trim();
  } catch {}

  // ---- Host (optional override via data-host) ----
  const host = mount.dataset.host || "woodsidebible";

  // ---- Render content ----
  function renderWidget() {
    if (!groupId) {
      mount.innerHTML = `
        <section class="groupFinderContainer">
          <h1 class="sectionHeading">Group Details</h1>
          <p style="margin:1rem 0;">Missing <code>?id=</code> in the URL.</p>
        </section>`;
      return;
    }

    // Only @GroupIDs is sent
    const params = `@GroupIDs=${encodeURIComponent(groupId)}`;

    mount.innerHTML = `
      <div id="GroupDetailsWidget"
           data-component="CustomWidget"
           data-sp="api_custom_GroupFinderWidget_JSON"
           data-params="${params}"
           data-template="${TEMPLATE_URL.href}"
           data-requireUser="false"
           data-cache="false"
           data-host="${host}"
           data-debug="false"></div>
    `;

    if (typeof ReInitWidget === "function") {
      ReInitWidget("GroupDetailsWidget");
    }
  }

  // ---- Boot ----
  Promise.resolve()
    .then(() => ensureStylesheet(FA6))
    .then(() => ensureStylesheet(CSS_URL.href))
    .then(() => ensureScript(WIDGETS_URL.href))
    .then(renderWidget)
    .catch((e) => console.warn("Group Details embed failed to load:", e));
})();
