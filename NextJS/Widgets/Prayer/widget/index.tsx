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

    // Add CSS reset and Tailwind layer variables for Shadow DOM
    const resetCSS = `
      *, *::before, *::after {
        box-sizing: border-box;
      }

      /* Initialize Tailwind's layer variables */
      * {
        --tw-border-spacing-x: 0;
        --tw-border-spacing-y: 0;
        --tw-translate-x: 0;
        --tw-translate-y: 0;
        --tw-rotate: 0;
        --tw-skew-x: 0;
        --tw-skew-y: 0;
        --tw-scale-x: 1;
        --tw-scale-y: 1;
        --tw-pan-x: ;
        --tw-pan-y: ;
        --tw-pinch-zoom: ;
        --tw-scroll-snap-strictness: proximity;
        --tw-gradient-from-position: ;
        --tw-gradient-via-position: ;
        --tw-gradient-to-position: ;
        --tw-ordinal: ;
        --tw-slashed-zero: ;
        --tw-numeric-figure: ;
        --tw-numeric-spacing: ;
        --tw-numeric-fraction: ;
        --tw-ring-inset: ;
        --tw-ring-offset-width: 0px;
        --tw-ring-offset-color: #fff;
        --tw-ring-color: rgb(59 130 246 / 0.5);
        --tw-ring-offset-shadow: 0 0 #0000;
        --tw-ring-shadow: 0 0 #0000;
        --tw-shadow: 0 0 #0000;
        --tw-shadow-colored: 0 0 #0000;
        --tw-inset-shadow: 0 0 #0000;
        --tw-inset-ring-shadow: 0 0 #0000;
        --tw-blur: ;
        --tw-brightness: ;
        --tw-contrast: ;
        --tw-grayscale: ;
        --tw-hue-rotate: ;
        --tw-invert: ;
        --tw-saturate: ;
        --tw-sepia: ;
        --tw-drop-shadow: ;
        --tw-backdrop-blur: ;
        --tw-backdrop-brightness: ;
        --tw-backdrop-contrast: ;
        --tw-backdrop-grayscale: ;
        --tw-backdrop-hue-rotate: ;
        --tw-backdrop-invert: ;
        --tw-backdrop-opacity: ;
        --tw-backdrop-saturate: ;
        --tw-backdrop-sepia: ;
        --tw-contain-size: ;
        --tw-contain-layout: ;
        --tw-contain-paint: ;
        --tw-contain-style: ;
      }
    `;

    // Replace :root and body selectors for Shadow DOM compatibility
    // :host in Shadow DOM is equivalent to :root in regular DOM
    // #prayer-widget-app is our mount point, equivalent to body
    let shadowCSS = styleText
      .replace(/:root\b/g, ':host')
      .replace(/\bbody\b/g, '#prayer-widget-app');

    // Inject reset first, then Tailwind styles
    const style = document.createElement('style');
    style.textContent = resetCSS + '\n' + shadowCSS;
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
