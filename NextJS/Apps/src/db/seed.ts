import 'dotenv/config';
import { db } from './index';
import { applications, widgets, widgetFields } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed Applications
  console.log('Creating applications...');
  const [projectsApp, widgetsApp] = await db.insert(applications).values([
    {
      name: 'Project Budgets',
      key: 'projects',
      description: 'Manage budgets for large events and ministry projects',
      route: '/projects',
      icon: 'folder',
      sortOrder: 1,
      isActive: true,
      requiresAuth: true,
    },
    {
      name: 'Widgets',
      key: 'widgets',
      description: 'Configure and generate embed codes for Woodside widgets',
      route: '/widgets',
      icon: 'code',
      sortOrder: 2,
      isActive: true,
      requiresAuth: true,
    },
  ]).returning();

  console.log('✓ Created applications:', projectsApp.name, widgetsApp.name);

  // Seed Widgets
  console.log('Creating widgets...');
  const [rsvpWidget, prayerWidget] = await db.insert(widgets).values([
    {
      name: 'RSVP Widget',
      key: 'rsvp',
      description: 'Event RSVP form with guest management and confirmation view',
      scriptUrl: 'https://rsvp-wine.vercel.app/widget/rsvp-widget.js',
      containerElementId: 'rsvp-widget-root',
      globalName: 'RSVPWidget',
      previewUrl: 'http://localhost:3003',
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Prayer Widget',
      key: 'prayer',
      description: 'Submit and pray for prayer requests with social engagement features',
      scriptUrl: 'https://prayer-gamma.vercel.app/widget/prayer-widget.js',
      containerElementId: 'prayer-widget-root',
      globalName: 'PrayerWidget',
      previewUrl: 'http://localhost:3002',
      isActive: true,
      sortOrder: 2,
    },
  ]).returning();

  console.log('✓ Created widgets:', rsvpWidget.name, prayerWidget.name);

  // Seed Widget Fields
  console.log('Creating widget fields...');
  await db.insert(widgetFields).values([
    {
      widgetId: rsvpWidget.id,
      fieldKey: 'campus',
      label: 'Campus',
      fieldType: 'mp-select',
      helpText: 'Select which campus this widget is for',
      defaultValue: '',
      isRequired: false,
      sortOrder: 1,
      dataSourceType: 'mp_table',
      dataSourceConfig: {
        table: 'Congregations',
        valueField: 'Congregation_ID',
        labelField: 'Congregation_Name',
        filter: 'Congregation_ID > 0', // Only active congregations
      },
      dataParamMapping: 'CongregationID',
    },
  ]);

  console.log('✓ Created widget fields');

  console.log('✅ Seed complete!');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
