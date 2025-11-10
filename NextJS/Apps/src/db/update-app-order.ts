import 'dotenv/config';
import { db } from './index';
import { applications } from './schema';
import { eq } from 'drizzle-orm';

async function updateAppOrder() {
  console.log('🔄 Updating application order...');

  // Update sort order for each app
  await db.update(applications)
    .set({ sortOrder: 1 })
    .where(eq(applications.key, 'people-search'));

  await db.update(applications)
    .set({ sortOrder: 2 })
    .where(eq(applications.key, 'counter'));

  await db.update(applications)
    .set({ sortOrder: 3 })
    .where(eq(applications.key, 'projects'));

  await db.update(applications)
    .set({ sortOrder: 4 })
    .where(eq(applications.key, 'widgets'));

  console.log('✅ Application order updated!');
  console.log('New order:');
  console.log('1. People Search');
  console.log('2. Counter');
  console.log('3. Project Budgets');
  console.log('4. Widgets');
}

updateAppOrder()
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
