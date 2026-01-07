/**
 * Announcements Widget - Embeddable Bundle Entry Point
 *
 * This file creates a standalone widget that can be embedded on any page.
 * It uses Shadow DOM for style isolation and bundles all React components
 * into a single JavaScript file.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import AnnouncementsPage from '../src/app/page';
import styleText from '../src/app/globals.css?inline';

// Widget configuration
interface WidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
  mode?: 'grid' | 'carousel';
}

// Extend window interface for widget globals
declare global {
  interface Window {
    ANNOUNCEMENTS_WIDGET_CONFIG?: WidgetConfig;
    AnnouncementsWidget?: AnnouncementsWidget;
  }
}

class AnnouncementsWidget {
  private root: ReturnType<typeof createRoot> | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private config: WidgetConfig;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'https://announcements-widget.vercel.app',
      containerId: config.containerId || 'announcements-widget-root',
      mode: config.mode || 'grid',
      ...config
    };
  }

  /**
   * Initialize and render the widget
   */
  init() {
    const container = document.getElementById(this.config.containerId!);

    if (!container) {
      console.error(`Announcements Widget: Container #${this.config.containerId} not found`);
      return;
    }

    // Read data-params attribute from container
    const dataParams = container.getAttribute('data-params');

    // Create Shadow DOM for style encapsulation
    this.shadowRoot = container.attachShadow({ mode: 'open' });

    // Create a mount point inside shadow DOM
    const mountPoint = document.createElement('div');
    mountPoint.id = 'announcements-widget-app';
    this.shadowRoot.appendChild(mountPoint);

    // Inject styles into shadow DOM
    this.injectStyles();

    // Store config globally for API client to access (include dataParams)
    (window as any).__ANNOUNCEMENTS_WIDGET_CONFIG__ = {
      ...this.config,
      dataParams
    };

    console.log('Announcements Widget initialized with Shadow DOM', {
      mode: this.config.mode,
      dataParams,
      config: (window as any).__ANNOUNCEMENTS_WIDGET_CONFIG__
    });

    // Create React root and render inside shadow DOM
    this.root = createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <AnnouncementsPage />
      </React.StrictMode>
    );
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

      /* Make the mount point and shadow root fill container */
      :host {
        display: block;
        width: 100%;
      }

      #announcements-widget-app {
        width: 100%;
        min-width: 100%;
        max-width: 100%;
      }

      /* Initialize Tailwind's layer variables on :host */
      :host {
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
        --tw-border-style: solid;
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

      /* Utility class for hiding scrollbars */
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;

    // Replace :root and body selectors for Shadow DOM compatibility
    let shadowCSS = styleText
      .replace(/:root\b/g, ':host')
      .replace(/\bbody\b/g, '#announcements-widget-app');

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

// Auto-initialize all widget instances
if (typeof window !== 'undefined') {
  const initializeWidgets = () => {
    // Find all elements with IDs starting with 'announcements-widget-root'
    const containers = document.querySelectorAll('[id^="announcements-widget-root"]');

    containers.forEach((container) => {
      const htmlContainer = container as HTMLElement;
      const containerId = htmlContainer.id;

      // Read data attributes from container
      const dataMode = htmlContainer.getAttribute('data-mode') as 'grid' | 'carousel' | null;
      const dataParams = htmlContainer.getAttribute('data-params');

      const config: WidgetConfig = {
        apiBaseUrl: window.ANNOUNCEMENTS_WIDGET_CONFIG?.apiBaseUrl || 'https://announcements-widget.vercel.app',
        containerId: containerId,
        mode: dataMode || 'grid',
      };

      // Store config globally for API client to access
      (window as any)[`__ANNOUNCEMENTS_WIDGET_CONFIG_${containerId}__`] = {
        ...config,
        dataParams
      };

      const widget = new AnnouncementsWidget(config);
      widget.init();

      // Store first widget as default
      if (!window.AnnouncementsWidget) {
        window.AnnouncementsWidget = widget;
      }
    });
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
  } else {
    initializeWidgets();
  }
}

export default AnnouncementsWidget;
