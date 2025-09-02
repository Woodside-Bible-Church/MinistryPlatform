// Assets/WoodsideCafeWidget.Init.js
(function () {
  const tag = `
            <div
              id="CustomWidgetWoodsideCafe"
              data-component="CustomWidget"
              data-sp="api_Custom_WoodsideCafeWidget"
              data-params=""
              data-template="Widgets/WoodsideCafe/Template/widget.html"
              data-requireUser="false"
              data-cache="false"
              data-host="woodsidebible"
              data-debug="true"
            ></div>`;

  const widgetRoot = document.getElementById("cafeCustomWidget");

  function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function applyTheme() {
    const themeParam = getUrlParam("@theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const theme = themeParam || (prefersDark ? "dark" : "light");

    document.body.dataset.theme = theme;
  }

  function to12HourFormat(timeStr) {
    const [hourStr, minute] = timeStr.split(":");
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "pm" : "am";
    hour = hour % 12 || 12;
    return `${hour}:${minute}${ampm}`;
  }

  function renderCafeWidget(data) {
    const container = document.getElementById("CustomWidgetWoodsideCafe");
    if (!container) return;

    const content = document.createElement("div");
    content.id = "WoodsideCafeWidgetContent";
    content.style.minHeight = "100vh";

    // === HEADER ===
    const headerSection = document.createElement("section");
    headerSection.className = "cafe-header";

    const backButton = document.createElement("a");
    backButton.href = "https://woodsidebible.org";
    backButton.className = "back-button";
    backButton.setAttribute("data-tooltip", "Back to Website");

    backButton.innerHTML = `<img src="Assets/WoodsideLogo.png" alt="Woodside Logo" />`;

    const centerLogoWrapper = document.createElement("div");
    centerLogoWrapper.className = "cafe-logo";

    const logoTop = document.createElement("img");
    logoTop.src = "Assets/WoodsideCafe_Logo__Woodside.svg";
    logoTop.alt = "Woodside Logo";
    logoTop.className = "logo-top";

    const logoBottom = document.createElement("img");
    logoBottom.src = "Assets/WoodsideCafe_Logo__Cafe.svg";
    logoBottom.alt = "Cafe Logo";
    logoBottom.className = "logo-bottom";

    centerLogoWrapper.appendChild(logoTop);
    centerLogoWrapper.appendChild(logoBottom);

    const timesContainer = document.createElement("div");
    timesContainer.className = "hours-inline";

    const table = document.createElement("table");
    table.className = "hours-table";
    const groupedByDay = {};

    data.ShopHours?.forEach((entry) => {
      if (entry.Is_Closed) return;
      if (!groupedByDay[entry.Day]) groupedByDay[entry.Day] = [];
      groupedByDay[entry.Day].push({
        open: to12HourFormat(entry.Open_Time),
        close: to12HourFormat(entry.Close_Time)
      });
    });

    Object.entries(groupedByDay).forEach(([day, ranges]) => {
      const firstRow = document.createElement("tr");
      const dayCell = document.createElement("td");
      dayCell.textContent = day;
      const timeCell = document.createElement("td");
      timeCell.textContent = `${ranges[0].open} - ${ranges[0].close}`;
      firstRow.appendChild(dayCell);
      firstRow.appendChild(timeCell);
      table.appendChild(firstRow);

      for (let i = 1; i < ranges.length; i++) {
        const extraRow = document.createElement("tr");
        extraRow.innerHTML = `<td></td><td>${ranges[i].open} - ${ranges[i].close}</td>`;
        table.appendChild(extraRow);
      }
    });

    timesContainer.appendChild(table);
    headerSection.appendChild(backButton);
    headerSection.appendChild(centerLogoWrapper);
    headerSection.appendChild(timesContainer);
    content.appendChild(headerSection);

    // === MAIN WRAPPER ===
    const mainWrapper = document.createElement("div");
    mainWrapper.className = "cafe-main";

    // === MENU ===
    const menuWrapper = document.createElement("section");
    menuWrapper.className = "cafe-main--section";
    const menuTitle = document.createElement("h2");
    menuTitle.textContent = "Menu";
    menuTitle.className = "section-title";
    menuWrapper.appendChild(menuTitle);

    const menuSection = document.createElement("section");
    menuSection.className = "cafe-menu-grid";

    data.MenuCategories?.forEach((category) => {
      const categoryCard = document.createElement("div");
      categoryCard.className = "menu-box";

      const table = document.createElement("table");
      table.className = "menu-table";

      const allOptionNames = new Set();
      category.MenuItems?.forEach((item) => {
        item.Options?.forEach((opt) =>
          allOptionNames.add(opt.Option_Name || "")
        );
      });

      const optionHeaders = Array.from(allOptionNames);
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      headerRow.innerHTML =
        `<th>${category.Category_Name.toUpperCase()}</th>` +
        optionHeaders.map((opt) => `<th>${opt}</th>`).join("");
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      category.MenuItems?.forEach((item) => {
        const row = document.createElement("tr");
        if (item.Is_Special) row.classList.add("special");

        const nameCell = document.createElement("td");
        nameCell.innerHTML = `<span>${item.Name}</span>`;
        if (item.Description) {
          nameCell.innerHTML += `<div class="item-description">${item.Description}</div>`;
        }
        row.appendChild(nameCell);

        optionHeaders.forEach((optName) => {
          const opt = item.Options?.find(
            (o) => (o.Option_Name || "") === optName
          );
          const cell = document.createElement("td");
          cell.textContent = opt?.Price
            ? `$${parseFloat(opt.Price).toFixed(2)}`
            : "";
          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      categoryCard.appendChild(table);
      menuSection.appendChild(categoryCard);
    });

    menuWrapper.appendChild(menuSection);
    mainWrapper.appendChild(menuWrapper);

    // === CUSTOMIZATION OPTIONS ===
    if (data.CustomizationTypes?.length) {
      const customWrapper = document.createElement("section");
      customWrapper.className = "cafe-main--section";
      const customTitle = document.createElement("h2");
      customTitle.textContent = "Customization";
      customTitle.className = "section-title";
      customWrapper.appendChild(customTitle);

      const customSection = document.createElement("section");
      customSection.className = "cafe-menu-grid";

      data.CustomizationTypes.forEach((type) => {
        const typeBox = document.createElement("div");
        typeBox.className = "menu-box";

        const table = document.createElement("table");
        table.className = "menu-table";

        const thead = document.createElement("thead");
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = type.Type_Name.toUpperCase();
        th.colSpan = 2;
        tr.appendChild(th);
        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        type.Options?.forEach((opt) => {
          const row = document.createElement("tr");
          const nameCell = document.createElement("td");

          nameCell.innerHTML = `<span>${opt.Option_Name}</span>`;
          if (opt.Sugar_Free_Available) {
            nameCell.innerHTML += `<div class="item-description">Sugar Free Available</div>`;
          }

          const priceCell = document.createElement("td");
          priceCell.textContent = opt.Price
            ? `$${parseFloat(opt.Price).toFixed(2)}`
            : "";

          row.appendChild(nameCell);
          row.appendChild(priceCell);
          tbody.appendChild(row);
        });

        table.appendChild(tbody);
        typeBox.appendChild(table);
        customSection.appendChild(typeBox);
      });

      customWrapper.appendChild(customSection);
      mainWrapper.appendChild(customWrapper);
    }

    content.appendChild(mainWrapper);

    // === FOOTER STRIP ===
    const footerStrip = document.createElement("div");
    footerStrip.className = "blackMarble footer-strip";

    const serveLink = document.createElement("a");
    serveLink.href = data.Serve_URL || "#";
    serveLink.textContent = "Serve";
    serveLink.style.textDecoration = "none";
    serveLink.target = "_blank";
    serveLink.rel = "noopener noreferrer";

    const teamLink = document.createElement("a");
    teamLink.href = "#";
    teamLink.textContent = "Meet the Team";
    teamLink.style.textDecoration = "none";
    teamLink.addEventListener("click", () => {
      const oldMain = document.querySelector(".cafe-main");
      if (oldMain) oldMain.remove();

      const teamWrapper = document.createElement("div");
      teamWrapper.className = "cafe-main cafe-team";

      (data.Baristas || []).forEach((person, index) => {
        const card = document.createElement("div");
        card.className = "barista-card";
        card.innerHTML = `
          <img src="${person.Default_Leader_Image}" alt="${person.First_Name} ${person.Last_Name}" class="barista-photo"/>
          <div class="barista-info">
            <h3 class="barista-name">${person.First_Name} ${person.Last_Name}</h3>
            <p class="barista-role">${person.Role}</p>
            <p class="barista-bio">${person.Bio}</p>
          </div>
        `;
        teamWrapper.appendChild(card);
      });

      const backButton = document.createElement("a");
      backButton.href = "#";
      backButton.className = "back-to-menu";
      backButton.textContent = "Back to Menu";
      backButton.onclick = () => {
        document.removeEventListener("keydown", backHandler);
        ReInitWidget("CustomWidgetWoodsideCafe");
      };

      teamWrapper.appendChild(backButton);
      content.insertBefore(teamWrapper, footerStrip);

      // Add keyboard handler
      function backHandler(event) {
        if (event.key === "Backspace") {
          event.preventDefault();
          document.removeEventListener("keydown", backHandler);
          ReInitWidget("CustomWidgetWoodsideCafe");
        }
      }

      document.addEventListener("keydown", backHandler);
    });

    footerStrip.appendChild(serveLink);
    footerStrip.appendChild(teamLink);
    content.appendChild(footerStrip);

    container.innerHTML = "";
    container.appendChild(content);
  }

  window.addEventListener("widgetLoaded", function (event) {
    const rawData = event.detail?.data?.Data;

    if (!rawData) return;

    document.addEventListener("keydown", function (event) {
      if (event.key === "f" || event.key === "F") {
        toggleFullscreen();
      }
    });

    function toggleFullscreen() {
      const elem = document.documentElement;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    }

    applyTheme();
    renderCafeWidget(rawData);
  });

  widgetRoot.innerHTML = tag;
  ReInitWidget("CustomWidgetWoodsideCafe");

  // Auto-refresh every 5 minutes
  setInterval(() => {
    ReInitWidget("CustomWidgetWoodsideCafe");
  }, 300000);
})();
