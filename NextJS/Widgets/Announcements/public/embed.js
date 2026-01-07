/**
 * Announcements Widget - Embed Script
 *
 * This script provides an easy way to embed the Announcements widget
 * on any webpage without dealing with Shadow DOM directly.
 *
 * Usage:
 * <div id="announcements-widget-container"></div>
 * <script src="https://your-vercel-app.vercel.app/embed.js"></script>
 */

(function() {
  'use strict';

  // Configuration - can be overridden by setting window.ANNOUNCEMENTS_WIDGET_URL
  const WIDGET_URL = window.ANNOUNCEMENTS_WIDGET_URL || 'http://localhost:3004';
  const CONTAINER_ID = 'announcements-widget-container';

  // Find the container element
  const container = document.getElementById(CONTAINER_ID);
  if (!container) {
    console.error(`Announcements Widget: Container element with id "${CONTAINER_ID}" not found`);
    return;
  }

  // Get mode from container data attribute or default to grid
  const mode = container.dataset.mode || 'grid';

  // Create the widget mount point
  const widgetRoot = document.createElement('div');
  widgetRoot.id = 'announcements-widget-root';
  container.appendChild(widgetRoot);

  // Set widget config before loading the script
  window.ANNOUNCEMENTS_WIDGET_CONFIG = {
    apiBaseUrl: WIDGET_URL,
    containerId: 'announcements-widget-root',
    mode: mode
  };

  // Load the widget script
  const script = document.createElement('script');
  script.src = `${WIDGET_URL}/widget/announcements-widget.js`;
  script.async = true;
  script.onerror = function() {
    console.error('Failed to load Announcements widget script');
    widgetRoot.innerHTML = '<div style="padding:20px;background:#fee;border:1px solid #fcc;color:#c00;">Failed to load Announcements widget. Please check the console for errors.</div>';
  };

  document.head.appendChild(script);
})();
