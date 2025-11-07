/**
 * RSVP Widget - Shadow DOM Embed Script
 *
 * This script creates an iframe that loads the RSVP widget and prevents
 * WordPress styles from interfering with the widget's styling.
 *
 * Usage on WordPress:
 * <div id="rsvp-widget-container"></div>
 * <script src="https://your-vercel-app.vercel.app/embed.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const WIDGET_URL = window.RSVP_WIDGET_URL || 'http://localhost:3003';
  const CONTAINER_ID = 'rsvp-widget-container';
  const MIN_HEIGHT = '800px';

  // Find the container element
  const container = document.getElementById(CONTAINER_ID);
  if (!container) {
    console.error(`RSVP Widget: Container element with id "${CONTAINER_ID}" not found`);
    return;
  }

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = WIDGET_URL;
  iframe.style.width = '100%';
  iframe.style.minHeight = MIN_HEIGHT;
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  iframe.title = 'Christmas Service RSVP';
  iframe.setAttribute('scrolling', 'no');

  // Handle iframe resize messages
  window.addEventListener('message', function(event) {
    // Verify origin in production
    if (WIDGET_URL !== 'http://localhost:3003' && event.origin !== new URL(WIDGET_URL).origin) {
      return;
    }

    if (event.data.type === 'rsvp-widget-height') {
      iframe.style.height = event.data.height + 'px';
    }
  });

  // Insert iframe into container
  container.appendChild(iframe);

  // Add responsive container styles
  container.style.width = '100%';
  container.style.maxWidth = '100%';
  container.style.margin = '0 auto';
})();
