/**
 * Prayer Widget - Direct Embed (No Iframe)
 * Loads the Prayer Widget directly into a div on the page
 *
 * Usage:
 * <div id="prayer-widget-root"></div>
 * <script>window.PRAYER_WIDGET_URL = 'https://prayer-gamma.vercel.app';</script>
 * <script src="https://prayer-gamma.vercel.app/prayer-widget.js"></script>
 */

(function() {
  'use strict';

  const WIDGET_BASE_URL = window.PRAYER_WIDGET_URL || 'http://localhost:3002';
  const container = document.getElementById('prayer-widget-root') ||
                   document.querySelector('[data-prayer-widget]');

  if (!container) {
    console.error('Prayer Widget: No container found. Add <div id="prayer-widget-root"></div>');
    return;
  }

  // Create shadow DOM to isolate styles
  const shadow = container.attachShadow({ mode: 'open' });

  // Create mount point inside shadow DOM
  const mountPoint = document.createElement('div');
  mountPoint.id = 'prayer-widget-mount';
  shadow.appendChild(mountPoint);

  // Load widget CSS
  const linkElem = document.createElement('link');
  linkElem.rel = 'stylesheet';
  linkElem.href = `${WIDGET_BASE_URL}/_next/static/css/app.css`;
  shadow.appendChild(linkElem);

  // Load React and widget bundle
  const script = document.createElement('script');
  script.src = `${WIDGET_BASE_URL}/_next/static/chunks/main.js`;
  script.async = true;
  script.onload = function() {
    // Initialize widget
    if (window.PrayerWidget) {
      window.PrayerWidget.init(mountPoint, {
        apiBaseUrl: WIDGET_BASE_URL,
        authToken: localStorage.getItem('mpp-widgets_AuthToken')
      });
    }
  };
  document.head.appendChild(script);

  console.log('Prayer Widget loaded');
})();
