import 'dotenv/config';
import { db } from './index';
import { applications } from './schema';

async function addRemainingApps() {
  console.log('➕ Adding remaining applications...');

  await db.insert(applications).values([
    {
      name: 'People Search',
      key: 'people-search',
      description: 'Need some basic info on someone from church? You\'re in the right place!',
      route: '/people-search',
      icon: 'UserRoundSearch',
      sortOrder: 3,
      isActive: true,
      requiresAuth: true,
    },
    {
      name: 'Counter',
      key: 'counter',
      description: 'Every number tells a story. Record counts to see how God\'s work is growing the church.',
      route: '/counter',
      icon: 'PlusCircle',
      sortOrder: 4,
      isActive: true,
      requiresAuth: true,
    },
    {
      name: 'Prayer',
      key: 'prayer',
      description: 'Submit and pray for prayer requests with the church community',
      route: '/prayer',
      icon: 'Heart',
      sortOrder: 5,
      isActive: true,
      requiresAuth: false, // Public app
    },
  ]);

  console.log('✅ Added remaining applications!');
}

addRemainingApps()
  .catch((error) => {
    console.error('❌ Failed to add apps:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
