import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

import { db } from './index';
import { applications } from './schema';
import { eq } from 'drizzle-orm';

async function updateProjectsRoute() {
  try {
    console.log('Starting route update...');

    // Find the Projects application
    const projectsApp = await db.query.applications.findFirst({
      where: eq(applications.key, 'projects'),
    });

    if (!projectsApp) {
      console.error('❌ Projects application not found!');
      console.log('Available applications:');
      const allApps = await db.query.applications.findMany();
      allApps.forEach(app => console.log(`  - ${app.name} (key: ${app.key}, route: ${app.route})`));
      return;
    }

    console.log(`✓ Found Projects app (ID: ${projectsApp.id})`);
    console.log(`  Current route: ${projectsApp.route}`);

    // Update the route to /budgets
    await db.update(applications)
      .set({
        route: '/budgets',
        updatedAt: new Date()
      })
      .where(eq(applications.id, projectsApp.id));

    console.log(`  ✓ Updated route to: /budgets`);
    console.log('\n✅ Route update complete!');
    console.log('\nThe Projects app now directs to /budgets instead of /projects');

  } catch (error) {
    console.error('❌ Error updating route:', error);
    throw error;
  }
}

// Run the script
updateProjectsRoute()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
