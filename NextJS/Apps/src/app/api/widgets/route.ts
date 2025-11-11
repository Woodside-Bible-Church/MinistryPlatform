import { NextResponse } from 'next/server';
import { db } from '@/db';
import { widgets, widgetFields } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all active widgets
    const allWidgets = await db.query.widgets.findMany({
      where: eq(widgets.isActive, true),
      orderBy: (widgets, { asc }) => [asc(widgets.sortOrder)],
      with: {
        // This will be populated once we add the relation
      },
    });

    // Fetch all widget fields and group by widget
    const allFields = await db.query.widgetFields.findMany({
      orderBy: (widgetFields, { asc }) => [asc(widgetFields.sortOrder)],
    });

    // Map widgets with their fields
    const widgetsWithFields = allWidgets.map((widget) => ({
      id: widget.key,
      name: widget.name,
      description: widget.description,
      source: widget.source,
      widgetUrl: widget.previewUrl || '',
      globalName: widget.globalName || '',
      scriptUrl: widget.scriptUrl,
      containerElementId: widget.containerElementId,
      fields: allFields
        .filter((field) => field.widgetId === widget.id)
        .map((field) => ({
          id: field.fieldKey,
          fieldKey: field.fieldKey,
          label: field.label,
          type: field.fieldType as 'text' | 'number' | 'select' | 'color' | 'checkbox' | 'mp-select',
          placeholder: field.placeholder || undefined,
          helpText: field.helpText || undefined,
          options: field.options as { value: string; label: string }[] | undefined,
          defaultValue: field.defaultValue || undefined,
          required: field.isRequired,
          dataSourceType: field.dataSourceType || undefined,
          dataSourceConfig: field.dataSourceConfig || undefined,
          dataParamMapping: field.dataParamMapping || undefined,
        })),
    }));

    return NextResponse.json(widgetsWithFields);
  } catch (error) {
    console.error('Error fetching widgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widgets' },
      { status: 500 }
    );
  }
}
