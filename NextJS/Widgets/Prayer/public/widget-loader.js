/**
 * Prayer Widget Loader
 * Embeds the Prayer Widget into any page and syncs MP Login Widget auth
 *
 * Usage in WordPress:
 * <div id="prayer-widget-container"></div>
 * <script src="https://prayer.woodsidebible.org/widget-loader.js"></script>
 *
 * OR for local testing:
 * <script>window.PRAYER_WIDGET_URL = 'http://localhost:3002';</script>
 * <div id="prayer-widget-container"></div>
 * <script src="http://localhost:3002/widget-loader.js"></script>
 */

(function() {
  'use strict';

  // Configuration - update this when deployed
  const WIDGET_BASE_URL = window.PRAYER_WIDGET_URL || 'http://localhost:3002';

  // Find container element
  const container = document.getElementById('prayer-widget-container') ||
                   document.querySelector('[data-prayer-widget]');

  if (!container) {
    console.error('Prayer Widget: No container element found. Add <div id="prayer-widget-container"></div> to your page.');
    return;
  }

  // Get MP Widget auth token from parent page localStorage
  const authToken = localStorage.getItem('mpp-widgets_AuthToken');

  // Create iframe with no scrollbars - parent page handles all scrolling
  const iframe = document.createElement('iframe');
  iframe.src = WIDGET_BASE_URL;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.style.display = 'block';
  iframe.style.minHeight = '800px'; // Initial height, will be adjusted
  iframe.setAttribute('scrolling', 'no');
  iframe.id = 'prayer-widget-iframe';

  // Send auth token to iframe when it loads
  iframe.onload = function() {
    if (authToken) {
      iframe.contentWindow.postMessage({
        type: 'AUTH_TOKEN',
        token: authToken
      }, WIDGET_BASE_URL);
    }
  };

  // Listen for token changes in parent page and sync to iframe
  window.addEventListener('storage', function(e) {
    if (e.key === 'mpp-widgets_AuthToken' && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'AUTH_TOKEN',
        token: e.newValue
      }, WIDGET_BASE_URL);
    }
  });

  // Handle messages from iframe
  window.addEventListener('message', function(event) {
    // Security: verify origin in production
    // if (event.origin !== WIDGET_BASE_URL) return;

    if (event.data.type === 'RESIZE') {
      iframe.style.height = event.data.height + 'px';
    }

    // Handle login redirect request from iframe
    if (event.data.type === 'LOGIN_REQUIRED') {
      window.location.href = event.data.url;
    }
  });

  container.appendChild(iframe);

  console.log('Prayer Widget loaded successfully');
})();
