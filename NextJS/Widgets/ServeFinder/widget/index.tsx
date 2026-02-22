import React from 'react';
import { createRoot } from 'react-dom/client';
import ServeFinderPage from '../src/components/serve-finder/ServeFinderPage';
import styleText from '../src/app/globals.css?inline';

interface WidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

declare global {
  interface Window {
    SERVE_FINDER_WIDGET_CONFIG?: WidgetConfig;
    ServeFinderWidget?: ServeFinderWidgetClass;
  }
}

const resetCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :host { display: block; font-family: Montserrat, Helvetica, Arial, sans-serif; }
`;

class ServeFinderWidgetClass {
  private root: ReturnType<typeof createRoot> | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private config: WidgetConfig;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || window.location.origin,
      containerId: config.containerId || 'serve-finder-widget-root',
      ...config,
    };
  }

  init() {
    const container = document.getElementById(this.config.containerId!);
    if (!container) {
      console.error(`ServeFinder Widget: Container #${this.config.containerId} not found`);
      return;
    }

    // Shadow DOM for style encapsulation
    this.shadowRoot = container.attachShadow({ mode: 'open' });

    const mountPoint = document.createElement('div');
    mountPoint.id = 'serve-finder-widget-app';
    this.shadowRoot.appendChild(mountPoint);

    // Style injection
    this.injectStyles();

    // Render React
    this.root = createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <ServeFinderPage />
      </React.StrictMode>
    );
  }

  private injectStyles() {
    let shadowCSS = styleText
      .replace(/:root\b/g, ':host')
      .replace(/\bbody\b/g, '#serve-finder-widget-app');

    const style = document.createElement('style');
    style.textContent = resetCSS + '\n' + shadowCSS;
    this.shadowRoot!.appendChild(style);
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  const config: WidgetConfig = {
    apiBaseUrl: 'https://serve-finder.vercel.app',
    containerId: 'serve-finder-widget-root',
    ...window.SERVE_FINDER_WIDGET_CONFIG,
  };

  window.SERVE_FINDER_WIDGET_CONFIG = config;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const widget = new ServeFinderWidgetClass(config);
      widget.init();
      window.ServeFinderWidget = widget;
    });
  } else {
    const widget = new ServeFinderWidgetClass(config);
    widget.init();
    window.ServeFinderWidget = widget;
  }
}

export default ServeFinderWidgetClass;
