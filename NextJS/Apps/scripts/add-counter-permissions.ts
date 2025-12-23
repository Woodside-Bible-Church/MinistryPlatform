import 'dotenv/config';
import { db, applications, appPermissions } from '../src/db';
import { eq } from 'drizzle-orm';

async function addCounterPermissions() {
  try {
    console.log('Finding counter application...');

    // Find the counter app
    const counterApp = await db
      .select()
      .from(applications)
      .where(eq(applications.key, 'counter'))
      .limit(1);

    if (!counterApp || counterApp.length === 0) {
      console.error('Counter application not found in database');
      console.log('Please create the counter app first');
      process.exit(1);
    }

    const appId = counterApp[0].id;
    console.log(`Found counter app with ID: ${appId}`);

    // Check if permission already exists
    const existing = await db
      .select()
      .from(appPermissions)
      .where(eq(appPermissions.applicationId, appId));

    console.log(`\nExisting permissions for counter app:`);
    console.log(existing);

    // Check if "All Staff" already has permission
    const existingAllStaff = existing.find(p => p.roleName === 'All Staff');

    if (existingAllStaff) {
      console.log('\n"All Staff" permission already exists:');
      console.log(existingAllStaff);
      console.log('\nSkipping insert.');
      process.exit(0);
    }

    // Insert the new permission
    console.log('\nInserting "All Staff" permission...');
    const result = await db
      .insert(appPermissions)
      .values({
        applicationId: appId,
        roleName: 'All Staff',
        canView: true,
        canEdit: true,
        canDelete: true,
      })
      .returning();

    console.log('\n✓ Successfully added permission:');
    console.log(result[0]);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

addCounterPermissions();
