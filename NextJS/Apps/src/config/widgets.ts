/**
 * Widget Configuration
 *
 * Defines available widgets and their user-configurable parameters.
 * System-level configs (like API keys) are stored in environment variables
 * and injected at build time - users never see those.
 */

export interface WidgetFieldConfig {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "color" | "checkbox";
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
  required?: boolean;
  /** Maps to data-params attribute for CustomWidgets pattern */
  dataParam?: string;
}

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  widgetUrl: string; // URL where widget.js is hosted
  globalName: string; // Global variable name the widget exposes (e.g., "RSVPWidget")
  fields: WidgetFieldConfig[];
  generateEmbedCode: (values: Record<string, any>) => string;
}

export const widgetConfigs: Record<string, WidgetConfig> = {
  rsvp: {
    id: "rsvp",
    name: "RSVP Widget",
    description: "Event RSVP form with guest management and confirmation view",
    widgetUrl: "http://localhost:3003",
    globalName: "RSVPWidget",
    fields: [
      {
        id: "dataParams",
        label: "Data Params",
        type: "text",
        placeholder: "",
        helpText: "Optional parameters (e.g., @CongregationID=1). Leave empty for no params.",
      },
    ],
    generateEmbedCode: (values) => {
      const dataParamsValue = values.dataParams || "";

      return `<div id="rsvp-widget-root" data-params="${dataParamsValue}"></div>
<script src="https://rsvp-wine.vercel.app/widget/rsvp-widget.js"></script>`;
    },
  },

  prayer: {
    id: "prayer",
    name: "Prayer Widget",
    description: "Submit and pray for prayer requests with social engagement features",
    widgetUrl: "http://localhost:3002",
    globalName: "PrayerWidget",
    fields: [],
    generateEmbedCode: () => {
      return `<div id="prayer-widget-root"></div>
<script src="https://prayer-gamma.vercel.app/widget/prayer-widget.js"></script>`;
    },
  },
};

export function getWidgetConfig(widgetId: string): WidgetConfig | undefined {
  return widgetConfigs[widgetId];
}

export function getAllWidgets(): WidgetConfig[] {
  return Object.values(widgetConfigs);
}
