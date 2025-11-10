import 'dotenv/config';
import { db } from './index';
import { applications } from './schema';
import { eq } from 'drizzle-orm';

async function updateWidgetsAppName() {
  console.log('🔄 Updating Widgets app name...');

  await db.update(applications)
    .set({ name: 'Widget Configurator' })
    .where(eq(applications.key, 'widgets'));

  console.log('✅ Updated app name to "Widget Configurator"');
}

updateWidgetsAppName()
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
