/**
 * Migration: Remove Duplicate RSVP Widget Fields
 * Removes the project and campus widget fields since they've been
 * replaced by interactive URL parameters
 */

import { db } from '@/db';
import { widgetFields, widgets } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

async function main() {
  console.log('🔄 Removing duplicate RSVP widget fields...\n');

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

    // Remove project and campus widget fields (replaced by URL parameters)
    const deleted = await db
      .delete(widgetFields)
      .where(
        and(
          eq(widgetFields.widgetId, rsvpWidget.id),
          inArray(widgetFields.fieldKey, ['project', 'campus'])
        )
      )
      .returning();

    if (deleted.length > 0) {
      console.log(`✓ Removed ${deleted.length} duplicate widget fields:`);
      deleted.forEach(f => {
        console.log(`  - ${f.fieldKey}: ${f.label}`);
      });
    } else {
      console.log('ℹ No duplicate fields found (already removed)');
    }

    console.log('\n✅ Migration complete! Project and campus are now URL parameters only.');
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
