/**
 * Migration: Remove project URL parameter
 *
 * Removes the 'project' URL parameter from the RSVP widget.
 * Projects should only be specified via data-params (@Project=slug),
 * not via URL parameters. This simplifies the widget configuration
 * and prevents confusion between URL params and data-params.
 *
 * The 'campus' URL parameter remains for pre-selecting campuses.
 */

import { db } from '@/db';
import { widgetUrlParameters, widgets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  console.log('🗑️  Removing project URL parameter...\n');

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

    // Delete the project URL parameter
    const result = await db
      .delete(widgetUrlParameters)
      .where(
        and(
          eq(widgetUrlParameters.widgetId, rsvpWidget.id),
          eq(widgetUrlParameters.parameterKey, 'project')
        )
      )
      .returning();

    if (result.length > 0) {
      console.log('✓ Deleted project URL parameter');
      console.log(`  - Parameter Key: ${result[0].parameterKey}`);
      console.log(`  - Description: ${result[0].description}`);
    } else {
      console.log('⚠️  Project URL parameter not found (may have already been deleted)');
    }

    console.log('\n✅ Migration complete! Only campus URL parameter remains.');
    console.log('   Projects should now only be specified via data-params: @Project=slug');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
