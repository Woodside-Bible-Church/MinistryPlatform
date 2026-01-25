/**
 * Cancellations Widget - Embeddable Bundle Entry Point
 *
 * This file creates a standalone widget that can be embedded on any page.
 * It uses Shadow DOM for style isolation and bundles all React components
 * into a single JavaScript file.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import CancellationsPage from '../src/app/page';
import styleText from '../src/app/globals.css?inline';

// Widget configuration
interface WidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

// Extend window interface for widget globals
declare global {
  interface Window {
    CANCELLATIONS_WIDGET_CONFIG?: WidgetConfig;
    CancellationsWidget?: CancellationsWidget;
  }
}

class CancellationsWidget {
  private root: ReturnType<typeof createRoot> | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private config: WidgetConfig;
  private themeObserver: MutationObserver | null = null;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'https://cancellations-widget.vercel.app',
      containerId: config.containerId || 'cancellations-widget-root',
      ...config
    };
  }

  /**
   * Initialize and render the widget
   */
  init() {
    const container = document.getElementById(this.config.containerId!);

    if (!container) {
      console.error(`Cancellations Widget: Container #${this.config.containerId} not found`);
      return;
    }

    // Read data-params attribute from container
    const dataParams = container.getAttribute('data-params');

    // Create Shadow DOM for style encapsulation
    this.shadowRoot = container.attachShadow({ mode: 'open' });

    // Create a mount point inside shadow DOM
    const mountPoint = document.createElement('div');
    mountPoint.id = 'cancellations-widget-app';
    this.shadowRoot.appendChild(mountPoint);

    // Apply initial theme
    this.applyTheme(container);

    // Watch for theme changes on container
    this.observeThemeChanges(container);

    // Inject styles into shadow DOM
    this.injectStyles();

    // Store config globally for API client to access (include dataParams)
    (window as any).__CANCELLATIONS_WIDGET_CONFIG__ = {
      ...this.config,
      dataParams
    };

    console.log('Cancellations Widget initialized with Shadow DOM', {
      dataParams,
      config: (window as any).__CANCELLATIONS_WIDGET_CONFIG__
    });

    // Create React root and render inside shadow DOM
    this.root = createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <CancellationsPage />
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

      #cancellations-widget-app {
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
    `;

    // Replace :root and body selectors for Shadow DOM compatibility
    let shadowCSS = styleText
      .replace(/:root\b/g, ':host')
      .replace(/\bbody\b/g, '#cancellations-widget-app');

    // Inject reset first, then Tailwind styles
    const style = document.createElement('style');
    style.textContent = resetCSS + '\n' + shadowCSS;
    this.shadowRoot.appendChild(style);
  }

  /**
   * Reinitialize the widget with updated configuration from container attributes
   */
  reinit() {
    const container = document.getElementById(this.config.containerId!);

    if (!container) {
      console.error(`Cancellations Widget: Container #${this.config.containerId} not found`);
      return;
    }

    console.log('Reinitializing widget...');

    // Destroy existing React root
    this.destroy();

    // Read updated attributes from container
    const dataParams = container.getAttribute('data-params');

    // Reuse existing shadow root (can't detach and reattach)
    if (!this.shadowRoot) {
      this.shadowRoot = container.shadowRoot as ShadowRoot;
    }

    if (!this.shadowRoot) {
      console.error('Shadow root not found. Creating new widget...');
      this.init();
      return;
    }

    // Clear shadow DOM content
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

    // Create a new mount point inside shadow DOM
    const mountPoint = document.createElement('div');
    mountPoint.id = 'cancellations-widget-app';
    this.shadowRoot.appendChild(mountPoint);

    // Apply theme and start observing
    this.applyTheme(container);
    this.observeThemeChanges(container);

    // Re-inject styles
    this.injectStyles();

    // Update global config
    (window as any).__CANCELLATIONS_WIDGET_CONFIG__ = {
      ...this.config,
      dataParams
    };

    console.log('Widget reinitialized with new config:', {
      params: dataParams,
      config: (window as any).__CANCELLATIONS_WIDGET_CONFIG__
    });

    // Create new React root and render
    this.root = createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <CancellationsPage />
      </React.StrictMode>
    );
  }

  /**
   * Apply theme from data-theme attribute to the mount point
   */
  private applyTheme(container: HTMLElement) {
    const theme = container.getAttribute('data-theme');
    const mountPoint = this.shadowRoot?.getElementById('cancellations-widget-app');

    if (mountPoint) {
      if (theme === 'dark') {
        mountPoint.classList.add('dark');
      } else {
        mountPoint.classList.remove('dark');
      }
    }
  }

  /**
   * Watch for changes to data-theme attribute
   */
  private observeThemeChanges(container: HTMLElement) {
    // Disconnect any existing observer
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }

    // Create a new observer to watch for attribute changes
    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.applyTheme(container);
        }
      });
    });

    // Start observing
    this.themeObserver.observe(container, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /**
   * Cleanup and unmount the widget
   */
  destroy() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
  }
}

// Store widget instances globally
const widgetInstances = new Map<string, CancellationsWidget>();

// Auto-initialize all widget instances
if (typeof window !== 'undefined') {
  const initializeWidgets = () => {
    // Find all elements with IDs starting with 'cancellations-widget-root'
    const containers = document.querySelectorAll('[id^="cancellations-widget-root"]');

    containers.forEach((container) => {
      const htmlContainer = container as HTMLElement;
      const containerId = htmlContainer.id;

      // Read data attributes from container
      const dataParams = htmlContainer.getAttribute('data-params');

      const config: WidgetConfig = {
        apiBaseUrl: window.CANCELLATIONS_WIDGET_CONFIG?.apiBaseUrl || 'https://cancellations-widget.vercel.app',
        containerId: containerId,
      };

      // Store config globally for API client to access
      (window as any)[`__CANCELLATIONS_WIDGET_CONFIG_${containerId}__`] = {
        ...config,
        dataParams
      };

      const widget = new CancellationsWidget(config);
      widget.init();

      // Store widget instance for later reinit
      widgetInstances.set(containerId, widget);

      // Store first widget as default
      if (!window.CancellationsWidget) {
        window.CancellationsWidget = widget;
      }
    });
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
  } else {
    initializeWidgets();
  }

  /**
   * Global function to reinitialize a widget from outside the shadow DOM
   * Usage: ReInitCancellationsWidget('cancellations-widget-root')
   */
  (window as any).ReInitCancellationsWidget = function(containerId: string = 'cancellations-widget-root') {
    const widget = widgetInstances.get(containerId);

    if (!widget) {
      console.error(`No widget found with container ID: ${containerId}`);
      console.log('Available widget IDs:', Array.from(widgetInstances.keys()));
      return false;
    }

    widget.reinit();
    return true;
  };

  /**
   * Global function to set the theme for a widget
   * Usage: SetCancellationsWidgetTheme('cancellations-widget-root', 'dark')
   * or: SetCancellationsWidgetTheme('cancellations-widget-root', 'light')
   */
  (window as any).SetCancellationsWidgetTheme = function(containerId: string = 'cancellations-widget-root', theme: 'light' | 'dark') {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Container #${containerId} not found`);
      return false;
    }

    container.setAttribute('data-theme', theme);
    return true;
  };

  console.log('Cancellations Widget: ReInitCancellationsWidget() and SetCancellationsWidgetTheme() functions are now available globally');
}

export default CancellationsWidget;
