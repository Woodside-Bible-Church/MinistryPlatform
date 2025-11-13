"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import { WidgetPreview } from "@/components/widgets/WidgetPreview";
import { SearchableSelect } from "@/components/widgets/SearchableSelect";
import { UrlParametersSection } from "@/components/widgets/UrlParametersSection";

interface WidgetField {
  id: string;
  fieldKey: string;
  label: string;
  type: "text" | "number" | "select" | "color" | "checkbox" | "mp-select";
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
  required?: boolean;
  dataSourceType?: string;
  dataSourceConfig?: any;
  dataParamMapping?: string;
}

interface Widget {
  id: string;
  name: string;
  description: string | null;
  source: 'custom' | 'ministry_platform' | 'third_party';
  scriptUrl: string;
  containerElementId: string;
  globalName: string | null;
  widgetUrl: string;
  fields: WidgetField[];
}

// Friendly names for widget sources
const SOURCE_LABELS: Record<string, string> = {
  custom: 'Custom Dev',
  ministry_platform: 'Ministry Platform',
  third_party: 'Third Party',
};

export default function WidgetConfiguratorPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("");
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [mpFieldOptions, setMpFieldOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());

  // Fetch widgets from API
  useEffect(() => {
    async function fetchWidgets() {
      try {
        const response = await fetch('/api/widgets');
        if (!response.ok) throw new Error('Failed to fetch widgets');
        const data = await response.json();
        setWidgets(data);

        if (data.length > 0) {
          // Group and sort widgets the same way as the dropdown
          const grouped = Object.entries(
            data.reduce((acc: Record<string, Widget[]>, widget: Widget) => {
              const source = widget.source;
              if (!acc[source]) acc[source] = [];
              acc[source].push(widget);
              return acc;
            }, {} as Record<string, Widget[]>)
          )
            .map(([source, sourceWidgets]) => ({
              label: SOURCE_LABELS[source] || source,
              widgets: (sourceWidgets as Widget[]).sort((a, b) => a.name.localeCompare(b.name)),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          // Default to first widget in the first group
          if (grouped.length > 0 && grouped[0].widgets.length > 0) {
            setSelectedWidgetId(grouped[0].widgets[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching widgets:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWidgets();
  }, []);

  // Fetch MP field options when widget changes
  useEffect(() => {
    const currentWidget = widgets.find((w) => w.id === selectedWidgetId);
    if (!currentWidget) return;

    // Find all mp-select fields
    const mpFields = currentWidget.fields.filter((f) => f.type === 'mp-select');

    console.log('MP Select Fields found:', mpFields);

    mpFields.forEach(async (field) => {
      if (mpFieldOptions[field.id]) {
        console.log(`Field ${field.id} already fetched, skipping`);
        return; // Already fetched
      }

      console.log(`Fetching options for field: ${field.id}`);
      setLoadingFields((prev) => new Set(prev).add(field.id));

      try {
        const response = await fetch(`/api/widgets/field-data/${field.id}`);
        console.log(`Response for ${field.id}:`, response.status, response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch ${field.id}:`, errorText);
          throw new Error('Failed to fetch field options');
        }

        const options = await response.json();
        console.log(`Options for ${field.id}:`, options);

        setMpFieldOptions((prev) => ({ ...prev, [field.id]: options }));
      } catch (error) {
        console.error(`Error fetching options for field ${field.id}:`, error);
      } finally {
        setLoadingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(field.id);
          return newSet;
        });
      }
    });
  }, [selectedWidgetId, widgets, mpFieldOptions]);

  const currentConfig = widgets.find((w) => w.id === selectedWidgetId);

  // Group widgets by source for the dropdown
  const groupedWidgets = Object.entries(
    widgets.reduce((acc, widget) => {
      const source = widget.source;
      if (!acc[source]) acc[source] = [];
      acc[source].push(widget);
      return acc;
    }, {} as Record<string, Widget[]>)
  )
    .map(([source, sourceWidgets]) => ({
      label: SOURCE_LABELS[source] || source,
      options: sourceWidgets
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort widgets alphabetically within each group
        .map((widget) => ({
          value: widget.id,
          label: widget.name,
        })),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#61BC47] animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading widgets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentConfig) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No widgets configured</p>
        </div>
      </div>
    );
  }

  // Get form value with fallback to default
  const getFormValue = (fieldId: string) => {
    if (formValues[fieldId] !== undefined) return formValues[fieldId];
    const field = currentConfig.fields.find((f) => f.id === fieldId);
    return field?.defaultValue ?? "";
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Generate embed code with applied values
  const generateEmbedCode = () => {
    if (!currentConfig) return '';

    // Ministry Platform widgets use web component tags
    if (currentConfig.source === 'ministry_platform') {
      const attributes: string[] = [];

      currentConfig.fields.forEach((field) => {
        const value = getFormValue(field.id);
        if (value !== undefined && value !== null && value !== '') {
          // Field key becomes the attribute name (e.g., formguid, customcss)
          attributes.push(`${field.fieldKey}="${value}"`);
        }
      });

      const attrsString = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
      return `<script src="${currentConfig.scriptUrl}"></script>
<${currentConfig.containerElementId}${attrsString}></${currentConfig.containerElementId}>`;
    }

    // Custom widgets use div + data attributes + script
    const dataParams: string[] = [];
    const otherAttributes: string[] = [];

    currentConfig.fields.forEach((field) => {
      const value = getFormValue(field.id);
      if (value !== undefined && value !== null && value !== '') {
        // MP select fields go into data-params
        if (field.type === 'mp-select' && field.dataParamMapping) {
          dataParams.push(`@${field.dataParamMapping}=${value}`);
        } else {
          // Other fields become data attributes
          const attrName = field.id.replace(/([A-Z])/g, '-$1').toLowerCase();
          otherAttributes.push(`data-${attrName}="${value}"`);
        }
      }
    });

    // Add data-params if any
    const allAttributes: string[] = [];
    if (dataParams.length > 0) {
      allAttributes.push(`data-params="${dataParams.join(',')}"`);
    }
    allAttributes.push(...otherAttributes);

    const dataAttrsString = allAttributes.length > 0 ? ` ${allAttributes.join(' ')}` : '';

    return `<div id="${currentConfig.containerElementId}"${dataAttrsString}></div>
<script src="${currentConfig.scriptUrl}"></script>`;
  };

  const embedCode = generateEmbedCode();

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground mb-2">
          Widgets
        </h1>
        <p className="text-muted-foreground">
          Configure and generate embed codes for Woodside widgets
        </p>
      </div>

      <div className="space-y-6">
        {/* Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Widget Selector */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Widget</h2>
            <SearchableSelect
              value={selectedWidgetId}
              onChange={(value) => {
                setSelectedWidgetId(value);
                setFormValues({});
              }}
              groupedOptions={groupedWidgets}
              placeholder="Select a widget"
              className="py-3"
              clearable={false}
            />
            <p className="text-sm text-muted-foreground mt-3">
              {currentConfig.description}
            </p>
          </div>

          {/* Configuration Fields */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Configuration</h2>

            {currentConfig.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No configuration options for this widget
              </p>
            )}

            {currentConfig.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.helpText && (
                    <span className="block text-xs text-muted-foreground font-normal mt-1">
                      {field.helpText}
                    </span>
                  )}
                </label>

                {field.type === "mp-select" ? (
                  loadingFields.has(field.id) ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading options...
                    </div>
                  ) : (
                    <SearchableSelect
                      value={String(getFormValue(field.id))}
                      onChange={(value) => handleFieldChange(field.id, value)}
                      options={mpFieldOptions[field.id] || []}
                      placeholder={`Select ${field.label}`}
                    />
                  )
                ) : field.type === "select" ? (
                  <SearchableSelect
                    value={String(getFormValue(field.id))}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    options={field.options || []}
                    placeholder={field.placeholder}
                  />
                ) : field.type === "color" ? (
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={String(getFormValue(field.id))}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="h-10 w-20 border border-border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={String(getFormValue(field.id))}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                    />
                  </div>
                ) : field.type === "checkbox" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(getFormValue(field.id))}
                      onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                      className="w-4 h-4 text-[#61BC47] border-border rounded focus:ring-[#61bc47]"
                    />
                    <span className="text-sm text-muted-foreground">
                      {field.helpText || "Enable this option"}
                    </span>
                  </div>
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    value={String(getFormValue(field.id))}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  />
                ) : (
                  <input
                    type="text"
                    value={String(getFormValue(field.id))}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  />
                )}
              </div>
            ))}

            {/* URL Parameters Section - now integrated inside Configuration panel */}
            <UrlParametersSection widgetId={currentConfig.id} />
          </div>

          {/* Embed Code */}
          <div className="bg-card border border-border rounded-lg p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Embed Code</h2>
              <button
                onClick={copyEmbedCode}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#61BC47] hover:bg-[#4fa037] text-white rounded-lg transition-colors"
              >
                {copiedEmbed ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="bg-zinc-950 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {embedCode}
            </pre>
          </div>
        </div>

        {/* Preview Panel - Full Width Below */}
        <WidgetPreview
          embedCode={embedCode}
          widgetName={currentConfig.name}
          widgetSource={currentConfig.source}
        />

        {/* Implementation Notes */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">
            Implementation Notes
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>• Copy the embed code and paste it into your WordPress page or HTML</li>
            <li>• The widget is bundled with Vite and loads directly (no iframes)</li>
            <li>• Widget JavaScript will auto-initialize from data attributes</li>
            <li>• System-level configs (API keys) are injected at build time</li>
            <li>• Test on your staging site before deploying to production</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
