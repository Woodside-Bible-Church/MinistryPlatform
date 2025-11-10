import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

import { db } from './index';
import { applications, appPermissions } from './schema';
import { eq } from 'drizzle-orm';

async function addProjectBudgetsPermissions() {
  try {
    console.log('Starting permission setup...');
    console.log('(Skipping schema migration - already applied)\n');

    // Find the Project Budgets application
    const projectBudgetsApp = await db.query.applications.findFirst({
      where: eq(applications.key, 'projects'),
    });

    if (!projectBudgetsApp) {
      console.error('❌ Project Budgets application not found!');
      console.log('Available applications:');
      const allApps = await db.query.applications.findMany();
      allApps.forEach(app => console.log(`  - ${app.name} (key: ${app.key})`));
      return;
    }

    console.log(`✓ Found Project Budgets app (ID: ${projectBudgetsApp.id})`);

    // Define the permissions to add
    const permissionsToAdd = [
      {
        roleName: 'Project Budgets - Admin',
        canView: true,
        canEdit: true,
        canDelete: true,
      },
      {
        roleName: 'Project Budgets - Edit',
        canView: true,
        canEdit: true,
        canDelete: false,
      },
      {
        roleName: 'Project Budgets - View',
        canView: true,
        canEdit: false,
        canDelete: false,
      },
    ];

    // Add permissions
    for (const perm of permissionsToAdd) {
      // Check if permission already exists
      const existing = await db.query.appPermissions.findFirst({
        where: (appPermissions, { and, eq }) =>
          and(
            eq(appPermissions.applicationId, projectBudgetsApp.id),
            eq(appPermissions.roleName, perm.roleName)
          ),
      });

      if (existing) {
        console.log(`  ⚠ Permission already exists for: ${perm.roleName}`);
        continue;
      }

      await db.insert(appPermissions).values({
        applicationId: projectBudgetsApp.id,
        roleName: perm.roleName,
        canView: perm.canView,
        canEdit: perm.canEdit,
        canDelete: perm.canDelete,
      });

      console.log(`  ✓ Added permission for: ${perm.roleName}`);
    }

    console.log('\n✅ Permission setup complete!');
    console.log('\nNext steps:');
    console.log('1. Make sure users are added to the appropriate user groups in MinistryPlatform');
    console.log('2. Test by impersonating a user with one of these roles');
    console.log('3. They should now see the Project Budgets app in the APPS dropdown');

  } catch (error) {
    console.error('❌ Error setting up permissions:', error);
    throw error;
  }
}

// Run the script
addProjectBudgetsPermissions()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
