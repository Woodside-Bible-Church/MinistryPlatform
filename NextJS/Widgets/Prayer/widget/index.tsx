/**
 * Prayer Widget - Embeddable Bundle Entry Point
 *
 * This file creates a standalone widget that can be embedded on any page.
 * It uses the same React components as the Next.js app but bundles them
 * into a single JavaScript file.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import PrayerPage from '../src/app/(app)/page';
import '../src/app/globals.css';

// Widget configuration
interface WidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

class PrayerWidget {
  private root: ReturnType<typeof createRoot> | null = null;
  private config: WidgetConfig;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || window.location.origin,
      containerId: config.containerId || 'prayer-widget-root',
      ...config
    };
  }

  /**
   * Initialize and render the widget
   */
  init() {
    const container = document.getElementById(this.config.containerId!);

    if (!container) {
      console.error(`Prayer Widget: Container #${this.config.containerId} not found`);
      return;
    }

    // Create React root and render
    this.root = createRoot(container);
    this.root.render(
      <React.StrictMode>
        <PrayerPage />
      </React.StrictMode>
    );

    console.log('Prayer Widget initialized');
  }

  /**
   * Cleanup and unmount the widget
   */
  destroy() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

// Auto-initialize if config is present
if (typeof window !== 'undefined') {
  const config = (window as any).PRAYER_WIDGET_CONFIG || {};

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const widget = new PrayerWidget(config);
      widget.init();
      (window as any).PrayerWidget = widget;
    });
  } else {
    const widget = new PrayerWidget(config);
    widget.init();
    (window as any).PrayerWidget = widget;
  }
}

export default PrayerWidget;
