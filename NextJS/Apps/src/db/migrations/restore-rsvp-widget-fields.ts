/**
 * Migration: Restore RSVP Widget Fields
 * Restores the project and campus widget fields that were accidentally removed
 * These are NOT duplicates - they serve a different purpose than URL parameters:
 * - Widget fields: Hardcoded in embed code (removes dropdown from widget)
 * - URL parameters: Dynamic via page URL (pre-selects dropdown value but keeps it visible)
 */

import { db } from '@/db';
import { widgetFields, widgets } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔄 Restoring RSVP widget fields...\n');

  try {
    // Get the RSVP widget ID
    const [rsvpWidget] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.key, 'rsvp'));

    if (!rsvpWidget) {
      throw new Error('RSVP widget not found');
    }

    console.log(`✓ Found RSVP widget (ID: ${rsvpWidget.id})\n`);

    // Restore project field
    await db.insert(widgetFields).values({
      widgetId: rsvpWidget.id,
      fieldKey: 'project',
      label: 'Project',
      fieldType: 'mp-select',
      isRequired: true,
      sortOrder: 1,
      dataSourceType: 'mp_table',
      dataSourceConfig: {
        table: 'Project_RSVPs',
        valueField: 'RSVP_Slug',
        labelField: 'RSVP_Title',
        filter: 'Is_Active = 1 AND RSVP_Slug IS NOT NULL',
        orderBy: 'RSVP_Title',
      },
      dataParamMapping: 'Project',
      helpText: 'Select which RSVP project this widget is for (required)',
    });

    console.log('✓ Restored project field');

    // Restore campus field
    await db.insert(widgetFields).values({
      widgetId: rsvpWidget.id,
      fieldKey: 'campus',
      label: 'Campus',
      fieldType: 'mp-select',
      isRequired: false,
      sortOrder: 2,
      dataSourceType: 'mp_table',
      dataSourceConfig: {
        table: 'Congregations',
        valueField: 'Congregation_ID',
        labelField: 'Congregation_Name',
        filter: 'Available_Online = 1',
        orderBy: 'Congregation_Name',
      },
      dataParamMapping: 'CongregationID',
      helpText: 'Optionally hardcode a specific campus (removes campus dropdown from widget)',
    });

    console.log('✓ Restored campus field');

    console.log('\n✅ Widget fields restored successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('\nMigration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
