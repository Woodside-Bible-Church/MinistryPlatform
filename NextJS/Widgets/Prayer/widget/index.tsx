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
import styleText from '../src/app/globals.css?inline';

// Widget configuration
interface WidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

// Extend window interface for widget globals
declare global {
  interface Window {
    PRAYER_WIDGET_CONFIG?: WidgetConfig;
    PrayerWidget?: PrayerWidget;
  }
}

class PrayerWidget {
  private root: ReturnType<typeof createRoot> | null = null;
  private shadowRoot: ShadowRoot | null = null;
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

    // Create Shadow DOM for style encapsulation
    this.shadowRoot = container.attachShadow({ mode: 'open' });

    // Create a mount point inside shadow DOM
    const mountPoint = document.createElement('div');
    mountPoint.id = 'prayer-widget-app';
    this.shadowRoot.appendChild(mountPoint);

    // Inject styles into shadow DOM
    // Note: Vite's css-injected-by-js plugin will inject styles into document.head
    // We need to copy those styles into our shadow DOM
    this.injectStyles();

    // Create React root and render inside shadow DOM
    this.root = createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <PrayerPage />
      </React.StrictMode>
    );

    console.log('Prayer Widget initialized with Shadow DOM');
  }

  /**
   * Inject styles into Shadow DOM
   */
  private injectStyles() {
    if (!this.shadowRoot) return;

    // Inject imported CSS into Shadow DOM
    const style = document.createElement('style');
    style.textContent = styleText;
    this.shadowRoot.appendChild(style);
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
  // Set default config if not provided
  const defaultConfig: WidgetConfig = {
    apiBaseUrl: 'https://prayer-gamma.vercel.app',
    containerId: 'prayer-widget-root'
  };

  const config: WidgetConfig = {
    ...defaultConfig,
    ...window.PRAYER_WIDGET_CONFIG || {}
  };

  // Store config globally for API client to access
  window.PRAYER_WIDGET_CONFIG = config;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const widget = new PrayerWidget(config);
      widget.init();
      window.PrayerWidget = widget;
    });
  } else {
    const widget = new PrayerWidget(config);
    widget.init();
    window.PrayerWidget = widget;
  }
}

export default PrayerWidget;
