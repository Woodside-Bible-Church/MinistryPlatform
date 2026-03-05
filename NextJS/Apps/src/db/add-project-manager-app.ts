import 'dotenv/config';
import { db } from './index';
import { applications, appPermissions } from './schema';
import { eq } from 'drizzle-orm';

async function addProjectManagerApp() {
  try {
    console.log('Starting Project Manager app setup...\n');

    // Check if it already exists
    const existing = await db.query.applications.findFirst({
      where: eq(applications.key, 'project-manager'),
    });

    if (existing) {
      console.log('⚠ Project Manager app already exists (ID:', existing.id, ')');
      console.log('  Skipping application insert.\n');
    } else {
      // Insert the application
      const [app] = await db.insert(applications).values({
        name: 'Projects',
        key: 'project-manager',
        description: 'Manage projects, campuses, and linked events',
        route: '/projects',
        icon: 'FolderKanban',
        sortOrder: 2,
        isActive: true,
        requiresAuth: true,
      }).returning();

      console.log(`✓ Created Project Manager app (ID: ${app.id})`);
    }

    // Find the app for permissions
    const projectManagerApp = await db.query.applications.findFirst({
      where: eq(applications.key, 'project-manager'),
    });

    if (!projectManagerApp) {
      console.error('❌ Could not find Project Manager app after insert!');
      return;
    }

    // Add permissions (same roles as budgets since they manage the same projects)
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

    for (const perm of permissionsToAdd) {
      const existingPerm = await db.query.appPermissions.findFirst({
        where: (ap, { and, eq: eqFn }) =>
          and(
            eqFn(ap.applicationId, projectManagerApp.id),
            eqFn(ap.roleName, perm.roleName)
          ),
      });

      if (existingPerm) {
        console.log(`  ⚠ Permission already exists for: ${perm.roleName}`);
        continue;
      }

      await db.insert(appPermissions).values({
        applicationId: projectManagerApp.id,
        roleName: perm.roleName,
        canView: perm.canView,
        canEdit: perm.canEdit,
        canDelete: perm.canDelete,
      });

      console.log(`  ✓ Added permission for: ${perm.roleName}`);
    }

    console.log('\n✅ Project Manager app setup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addProjectManagerApp()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
