import { db } from './index.js';
import { widgets, widgetFields } from './schema.js';
import { like } from 'drizzle-orm';

async function addCustomFormWidgetFields() {
  try {
    // Find the Custom Form widget
    const customFormWidgets = await db.select().from(widgets).where(like(widgets.name, '%Custom Form%'));

    if (customFormWidgets.length === 0) {
      console.error('Custom Form widget not found!');
      process.exit(1);
    }

    const customFormWidget = customFormWidgets[0];
    console.log('Found Custom Form widget:', customFormWidget);

    // Add Form GUID field (mp-select from Forms table)
    const formGuidField = await db.insert(widgetFields).values({
      widgetId: customFormWidget.id,
      fieldKey: 'formguid',
      label: 'Form GUID',
      fieldType: 'mp-select',
      placeholder: 'Select a Form',
      helpText: 'Identifies the desired Custom Form.',
      isRequired: true,
      sortOrder: 1,
      dataSourceType: 'mp_table',
      dataSourceConfig: {
        table: 'Forms',
        valueField: 'Form_GUID',
        labelField: 'Form_Title',
        orderBy: 'Form_Title'
      },
      dataParamMapping: null, // This becomes an attribute, not a data-param
    }).returning();

    console.log('✓ Added Form GUID field:', formGuidField);

    // Add Custom CSS field (text input)
    const customCssField = await db.insert(widgetFields).values({
      widgetId: customFormWidget.id,
      fieldKey: 'customcss',
      label: 'Custom CSS',
      fieldType: 'text',
      placeholder: 'https://example.com/custom.css',
      helpText: 'Optional Path to a CustomCSS Style Sheet to be applied to this widget.',
      isRequired: false,
      sortOrder: 2,
      dataSourceType: null,
      dataSourceConfig: null,
      dataParamMapping: null,
    }).returning();

    console.log('✓ Added Custom CSS field:', customCssField);

    console.log('\n✅ Successfully added widget fields for Custom Form!');
  } catch (error) {
    console.error('Error adding widget fields:', error);
    process.exit(1);
  }
}

addCustomFormWidgetFields();
