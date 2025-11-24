import 'dotenv/config';
import { db } from './index';
import { widgets, widgetFields } from './schema';
import { eq } from 'drizzle-orm';

async function updateWidgetFields() {
  console.log('🔄 Updating widget fields...');

  // Find the RSVP widget
  const rsvpWidget = await db.query.widgets.findFirst({
    where: eq(widgets.key, 'rsvp'),
  });

  if (!rsvpWidget) {
    console.error('❌ RSVP widget not found');
    process.exit(1);
  }

  console.log('Found RSVP widget:', rsvpWidget.name);

  // Delete existing widget fields for RSVP
  await db.delete(widgetFields).where(eq(widgetFields.widgetId, rsvpWidget.id));
  console.log('Deleted existing fields');

  // Insert new widget fields with MP data source
  await db.insert(widgetFields).values([
    {
      widgetId: rsvpWidget.id,
      fieldKey: 'project',
      label: 'Project',
      fieldType: 'mp-select',
      helpText: 'Select which RSVP project this widget is for (required)',
      defaultValue: '',
      isRequired: true,
      sortOrder: 1,
      dataSourceType: 'mp_table',
      dataSourceConfig: {
        table: 'Projects',
        valueField: 'RSVP_Slug',
        labelField: 'Project_Title',
        filter: 'RSVP_Is_Active = 1 AND RSVP_Slug IS NOT NULL',
        orderBy: 'Project_Title',
      },
      dataParamMapping: 'Project',
    },
    {
      widgetId: rsvpWidget.id,
      fieldKey: 'campus',
      label: 'Campus (Optional)',
      fieldType: 'mp-select',
      helpText: 'Optionally filter events by campus',
      defaultValue: '',
      isRequired: false,
      sortOrder: 2,
      dataSourceType: 'mp_table',
      dataSourceConfig: {
        table: 'Congregations',
        valueField: 'Congregation_ID',
        labelField: 'Congregation_Name',
        filter: 'Congregation_ID > 0',
      },
      dataParamMapping: 'CongregationID',
    },
  ]);

  console.log('✅ Widget fields updated!');
}

updateWidgetFields()
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
