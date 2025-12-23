import 'dotenv/config';
import { db, applications, appPermissions } from '../src/db';
import { eq } from 'drizzle-orm';

async function addRsvpAdminPermissions() {
  try {
    console.log('Finding RSVP application...');

    // Find the RSVP app
    const rsvpApp = await db
      .select()
      .from(applications)
      .where(eq(applications.key, 'rsvp'))
      .limit(1);

    if (!rsvpApp || rsvpApp.length === 0) {
      console.error('RSVP application not found in database');
      console.log('Please create the RSVP app first');
      process.exit(1);
    }

    const appId = rsvpApp[0].id;
    console.log(`Found RSVP app with ID: ${appId}`);

    // Check if permission already exists
    const existing = await db
      .select()
      .from(appPermissions)
      .where(eq(appPermissions.applicationId, appId));

    console.log(`\nExisting permissions for RSVP app:`);
    console.log(existing);

    // Check if "RSVPs - Admin" already has permission
    const existingRsvpAdmin = existing.find(p => p.roleName === 'RSVPs - Admin');

    if (existingRsvpAdmin) {
      console.log('\n"RSVPs - Admin" permission already exists:');
      console.log(existingRsvpAdmin);
      console.log('\nSkipping insert.');
      process.exit(0);
    }

    // Insert the new permission
    console.log('\nInserting "RSVPs - Admin" permission with full rights...');
    const result = await db
      .insert(appPermissions)
      .values({
        applicationId: appId,
        roleName: 'RSVPs - Admin',
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

addRsvpAdminPermissions();
