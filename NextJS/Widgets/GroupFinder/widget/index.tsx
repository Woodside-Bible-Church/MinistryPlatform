import React from 'react';
import { createRoot } from 'react-dom/client';
import GroupFinderPage from '../src/components/group-finder/GroupFinderPage';
import styleText from '../src/app/globals.css?inline';

interface WidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

declare global {
  interface Window {
    GROUP_FINDER_WIDGET_CONFIG?: WidgetConfig;
    GroupFinderWidget?: GroupFinderWidgetClass;
  }
}

const resetCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :host { display: block; font-family: Montserrat, Helvetica, Arial, sans-serif; }
`;

class GroupFinderWidgetClass {
  private root: ReturnType<typeof createRoot> | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private config: WidgetConfig;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || window.location.origin,
      containerId: config.containerId || 'group-finder-widget-root',
      ...config,
    };
  }

  init() {
    const container = document.getElementById(this.config.containerId!);
    if (!container) {
      console.error(`GroupFinder Widget: Container #${this.config.containerId} not found`);
      return;
    }

    // Shadow DOM for style encapsulation
    this.shadowRoot = container.attachShadow({ mode: 'open' });

    const mountPoint = document.createElement('div');
    mountPoint.id = 'group-finder-widget-app';
    this.shadowRoot.appendChild(mountPoint);

    // Style injection
    this.injectStyles();

    // Render React
    this.root = createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <GroupFinderPage />
      </React.StrictMode>
    );
  }

  private injectStyles() {
    // Convert :root → :host, body → #group-finder-widget-app for Shadow DOM
    let shadowCSS = styleText
      .replace(/:root\b/g, ':host')
      .replace(/\bbody\b/g, '#group-finder-widget-app');

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
    apiBaseUrl: 'https://group-finder.vercel.app',
    containerId: 'group-finder-widget-root',
    ...window.GROUP_FINDER_WIDGET_CONFIG,
  };

  window.GROUP_FINDER_WIDGET_CONFIG = config;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const widget = new GroupFinderWidgetClass(config);
      widget.init();
      window.GroupFinderWidget = widget;
    });
  } else {
    const widget = new GroupFinderWidgetClass(config);
    widget.init();
    window.GroupFinderWidget = widget;
  }
}

export default GroupFinderWidgetClass;
