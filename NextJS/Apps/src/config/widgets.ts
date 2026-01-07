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

  announcements: {
    id: "announcements",
    name: "Announcements Widget",
    description: "Display church announcements in grid or carousel layout with images and call-to-action",
    widgetUrl: "http://localhost:3004",
    globalName: "AnnouncementsWidget",
    fields: [
      {
        id: "mode",
        label: "Display Mode",
        type: "select",
        helpText: "Choose how announcements are displayed",
        options: [
          { value: "grid", label: "Grid Layout" },
          { value: "carousel", label: "Carousel Layout" },
        ],
        defaultValue: "grid",
      },
      {
        id: "dataParams",
        label: "Data Params",
        type: "text",
        placeholder: "@CongregationID=1,@NumPerPage=6",
        helpText: "Optional parameters (e.g., @CongregationID=1,@NumPerPage=6). Leave empty for defaults.",
      },
    ],
    generateEmbedCode: (values) => {
      const mode = values.mode || "grid";
      const dataParamsValue = values.dataParams || "";
      const dataMode = mode !== "grid" ? ` data-mode="${mode}"` : "";
      const dataParams = dataParamsValue ? ` data-params="${dataParamsValue}"` : "";

      return `<div id="announcements-widget-root"${dataMode}${dataParams}></div>
<script src="https://announcements.vercel.app/widget/announcements-widget.js"></script>`;
    },
  },
};

export function getWidgetConfig(widgetId: string): WidgetConfig | undefined {
  return widgetConfigs[widgetId];
}

export function getAllWidgets(): WidgetConfig[] {
  return Object.values(widgetConfigs);
}
