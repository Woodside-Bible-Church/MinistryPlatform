(function () {
  // Inject styles
  const head = document.head;

  const faCss = document.createElement("link");
  faCss.rel = "stylesheet";
  faCss.href = "//use.fontawesome.com/releases/v5.0.7/css/all.css";
  head.appendChild(faCss);

  const widgetCss = document.createElement("link");
  widgetCss.rel = "stylesheet";
  widgetCss.href = "https://groupfinder-five.vercel.app/Assets/widget.css";
  head.appendChild(widgetCss);

  // Inject container HTML
  const container = document.getElementById("groupFinderWidgetEmbed");
  if (!container) return;

  container.innerHTML = `
      <div id="groupFinderContainer" class="container">
        <div id="loader" class="loader-container">
          <div class="loader-bg"></div>
          <div class="loader"></div>
        </div>
        <div id="groupTag"></div>
      </div>
    `;

  // Add random loading text
  const loadingText = [
    "Finding the perfect group for you...",
    "We can't wait to get you in a group!",
    "Life is better together!",
    "Did we just become best friends?",
    "I came for the spiritual growth and stay because someone keeps bringing amazing snacks.",
    "They said 'find a group that fits you'—I found one that just feeds me.",
    "I picked my group based on one question: 'Do you believe in long prayer requests or short ones?'",
    "Loading new life-long friends...",
    "I was looking for a Life Group that studies the Bible, but I accidentally joined one that also runs marathons. Send help.",
    "Finding a church group is like finding a good seat at Sunday service. Once you're in, you're never leaving.",
    "I knew I found the right group when the leader said, 'This is a judgment-free zone—except about pineapple on pizza.'",
    "I signed up for a Life Group, but somehow, I am now part of a church softball league.",
    "I came to the group with questions, and I left with inside jokes, group texts, and a new set of besties."
  ];
  const randomText =
    loadingText[Math.floor(Math.random() * loadingText.length)];
  document.documentElement.style.setProperty(
    "--loading-text",
    `'${randomText}'`
  );

  // Inject scripts
  const customWidgetsScript = document.createElement("script");
  customWidgetsScript.src =
    "https://groupfinder-five.vercel.app/Assets/CustomWidgets.js";
  document.body.appendChild(customWidgetsScript);

  const initScript = document.createElement("script");
  initScript.src =
    "https://groupfinder-five.vercel.app/Assets/GroupFinder.Init.js";
  document.body.appendChild(initScript);
})();
