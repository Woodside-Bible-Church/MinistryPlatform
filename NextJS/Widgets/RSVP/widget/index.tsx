/**
 * RSVP Widget - Embeddable Bundle Entry Point
 *
 * This file creates a standalone widget that can be embedded on any page.
 * It uses the same React components as the Next.js app but bundles them
 * into a single JavaScript file.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SessionProvider } from 'next-auth/react';
import RSVPPage from '../src/app/(app)/page';
import styleText from '../src/app/globals.css?inline';

// Widget configuration
interface WidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

// Extend window interface for widget globals
declare global {
  interface Window {
    RSVP_WIDGET_CONFIG?: WidgetConfig;
    RSVPWidget?: RSVPWidget;
  }
}

class RSVPWidget {
  private root: ReturnType<typeof createRoot> | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private config: WidgetConfig;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || window.location.origin,
      containerId: config.containerId || 'rsvp-widget-root',
      ...config
    };
  }

  /**
   * Initialize and render the widget
   */
  init() {
    const container = document.getElementById(this.config.containerId!);

    if (!container) {
      console.error(`RSVP Widget: Container #${this.config.containerId} not found`);
      return;
    }

    // Create Shadow DOM for style encapsulation
    this.shadowRoot = container.attachShadow({ mode: 'open' });

    // Create a mount point inside shadow DOM
    const mountPoint = document.createElement('div');
    mountPoint.id = 'rsvp-widget-app';
    this.shadowRoot.appendChild(mountPoint);

    // Create portal container for Radix UI portals (Select, Dialog, etc.)
    const portalContainer = document.createElement('div');
    portalContainer.id = 'rsvp-widget-portals';
    this.shadowRoot.appendChild(portalContainer);

    // Inject styles into shadow DOM
    // Note: Vite's css-injected-by-js plugin will inject styles into document.head
    // We need to copy those styles into our shadow DOM
    this.injectStyles();

    // Inject global body styles to prevent layout shift from dropdowns
    // This must be in the main document, not shadow DOM, because Radix portals render outside
    this.injectGlobalBodyStyles();

    // Store portal container globally for Radix UI components to access
    (window as any).__RSVP_WIDGET_PORTAL_CONTAINER__ = portalContainer;

    // Create React root and render inside shadow DOM
    this.root = createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <SessionProvider
          session={null}
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          <RSVPPage />
        </SessionProvider>
      </React.StrictMode>
    );

    console.log('RSVP Widget initialized with Shadow DOM');
  }

  /**
   * Inject global body styles to prevent layout shift when dropdowns open
   * This must be injected into the main document, not shadow DOM
   *
   * Uses MutationObserver to actively fight Radix UI's inline styles
   */
  private injectGlobalBodyStyles() {
    // Check if we've already injected these styles
    if (document.getElementById('rsvp-widget-global-styles')) return;

    const style = document.createElement('style');
    style.id = 'rsvp-widget-global-styles';
    style.textContent = `
      /* Prevent layout shift when Radix UI dropdowns hide scrollbar */
      body {
        overflow-y: scroll !important;
      }
      /* Override Radix UI's scroll lock padding compensation */
      body[data-scroll-locked] {
        overflow-y: scroll !important;
        padding-right: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // MutationObserver to actively override Radix UI's inline styles
    // Radix applies inline styles which have higher specificity than CSS !important
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const body = document.body;

          // Force overflow-y to scroll (override Radix's inline overflow: hidden)
          if (body.style.overflow === 'hidden' || body.style.overflowY === 'hidden') {
            body.style.setProperty('overflow-y', 'scroll', 'important');
          }

          // Force padding-right to 0 (override Radix's padding compensation)
          if (body.style.paddingRight) {
            body.style.setProperty('padding-right', '0', 'important');
          }
        }
      });
    });

    // Observe body element for style attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    console.log('[RSVP Widget] MutationObserver installed to prevent scrollbar layout shift');
  }

  /**
   * Inject styles into Shadow DOM
   */
  private injectStyles() {
    if (!this.shadowRoot) return;

    // Add CSS reset and Tailwind layer variables for Shadow DOM
    // IMPORTANT: Use :host instead of * to avoid overriding utility classes
    const resetCSS = `
      *, *::before, *::after {
        box-sizing: border-box;
      }

      /* Initialize Tailwind's layer variables on :host so utilities can override them */
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
    // :host in Shadow DOM is equivalent to :root in regular DOM
    // #rsvp-widget-app is our mount point, equivalent to body
    let shadowCSS = styleText
      .replace(/:root\b/g, ':host')
      .replace(/\bbody\b/g, '#rsvp-widget-app');

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
    apiBaseUrl: 'https://rsvp-wine.vercel.app',
    containerId: 'rsvp-widget-root'
  };

  const config: WidgetConfig = {
    ...defaultConfig,
    ...window.RSVP_WIDGET_CONFIG || {}
  };

  // Store config globally for API client to access
  window.RSVP_WIDGET_CONFIG = config;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const widget = new RSVPWidget(config);
      widget.init();
      window.RSVPWidget = widget;
    });
  } else {
    const widget = new RSVPWidget(config);
    widget.init();
    window.RSVPWidget = widget;
  }
}

export default RSVPWidget;
