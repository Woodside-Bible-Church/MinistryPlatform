/**
 * Migration: Make URL Parameters Interactive
 * Updates the RSVP widget URL parameters to support interactive dropdowns
 * with MinistryPlatform data sources
 */

import { db } from '@/db';
import { widgetUrlParameters, widgets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  console.log('🔄 Making URL parameters interactive...\n');

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

    // Update campus parameter
    const [campusParam] = await db
      .select()
      .from(widgetUrlParameters)
      .where(
        and(
          eq(widgetUrlParameters.widgetId, rsvpWidget.id),
          eq(widgetUrlParameters.parameterKey, 'campus')
        )
      );

    if (campusParam) {
      await db
        .update(widgetUrlParameters)
        .set({
          isInteractive: true,
          dataSourceType: 'mp_table',
          dataSourceConfig: {
            table: 'Congregations',
            valueField: 'Campus_Slug',
            labelField: 'Congregation_Name',
            filter: 'Available_Online = 1',
            orderBy: 'Congregation_Name',
          },
          description: 'Pre-select a specific campus for the RSVP widget',
          exampleValue: 'troy',
        })
        .where(eq(widgetUrlParameters.id, campusParam.id));

      console.log('✓ Updated campus parameter to be interactive');
    }

    // Update project parameter
    const [projectParam] = await db
      .select()
      .from(widgetUrlParameters)
      .where(
        and(
          eq(widgetUrlParameters.widgetId, rsvpWidget.id),
          eq(widgetUrlParameters.parameterKey, 'project')
        )
      );

    if (projectParam) {
      await db
        .update(widgetUrlParameters)
        .set({
          isInteractive: true,
          dataSourceType: 'mp_table',
          dataSourceConfig: {
            table: 'Project_RSVPs',
            valueField: 'RSVP_Slug',
            labelField: 'RSVP_Title',
            filter: 'Is_Active = 1 AND RSVP_Slug IS NOT NULL',
            orderBy: 'RSVP_Title',
          },
          description: 'Override the project selection with a specific RSVP project',
          exampleValue: 'christmas-2024',
        })
        .where(eq(widgetUrlParameters.id, projectParam.id));

      console.log('✓ Updated project parameter to be interactive');
    }

    console.log('\n✅ URL parameters are now interactive!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
