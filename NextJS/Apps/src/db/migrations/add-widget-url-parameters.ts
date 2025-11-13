/**
 * Migration: Add widget_url_parameters table
 *
 * Tracks URL parameters that can be passed to widgets for additional customization.
 * These are separate from data-params and are appended to the widget URL.
 *
 * Example usage:
 * - RSVP Widget: ?campus=troy (pre-selects Troy campus)
 * - Custom Forms: ?id=[FormGUID] (loads specific form)
 */

import { db } from '../index';
import { widgetUrlParameters, widgets } from '../schema';
import { eq } from 'drizzle-orm';

export async function up() {
  console.log('Adding widget URL parameters...');

  // Get widget IDs
  const rsvpWidget = await db.query.widgets.findFirst({
    where: eq(widgets.name, 'rsvp'),
  });

  const customFormsWidget = await db.query.widgets.findFirst({
    where: eq(widgets.name, 'custom-forms'),
  });

  if (!rsvpWidget) {
    console.warn('RSVP widget not found - skipping URL parameters');
    return;
  }

  // Add URL parameters for RSVP widget
  await db.insert(widgetUrlParameters).values([
    {
      widgetId: rsvpWidget.id,
      parameterKey: 'campus',
      description: 'Pre-select a specific campus in the dropdown. Accepts campus slug (e.g., "troy", "lake-orion", "online").',
      exampleValue: 'troy',
      isRequired: false,
      sortOrder: 1,
    },
    {
      widgetId: rsvpWidget.id,
      parameterKey: 'project',
      description: 'Override the project specified in data-params. Accepts project slug or numeric ID.',
      exampleValue: 'christmas-2024',
      isRequired: false,
      sortOrder: 2,
    },
  ]);

  console.log('✓ Added RSVP widget URL parameters');

  // Add URL parameters for Custom Forms widget (if exists)
  if (customFormsWidget) {
    await db.insert(widgetUrlParameters).values([
      {
        widgetId: customFormsWidget.id,
        parameterKey: 'id',
        description: 'Specify which MinistryPlatform form to display. Accepts Form GUID from MP.',
        exampleValue: '[FormGUIDGoesHere]',
        isRequired: true,
        sortOrder: 1,
      },
    ]);

    console.log('✓ Added Custom Forms widget URL parameters');
  }

  console.log('Migration completed successfully!');
}

export async function down() {
  console.log('Removing widget URL parameters...');

  // Get widget IDs
  const rsvpWidget = await db.query.widgets.findFirst({
    where: eq(widgets.name, 'rsvp'),
  });

  const customFormsWidget = await db.query.widgets.findFirst({
    where: eq(widgets.name, 'custom-forms'),
  });

  // Delete RSVP widget URL parameters
  if (rsvpWidget) {
    await db.delete(widgetUrlParameters).where(eq(widgetUrlParameters.widgetId, rsvpWidget.id));
    console.log('✓ Removed RSVP widget URL parameters');
  }

  // Delete Custom Forms widget URL parameters
  if (customFormsWidget) {
    await db.delete(widgetUrlParameters).where(eq(widgetUrlParameters.widgetId, customFormsWidget.id));
    console.log('✓ Removed Custom Forms widget URL parameters');
  }

  console.log('Rollback completed successfully!');
}
