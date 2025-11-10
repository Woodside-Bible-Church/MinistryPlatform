import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

/**
 * Applications Table
 * Stores app-level configuration (replaces MinistryPlatform Applications table)
 */
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  key: varchar('key', { length: 50 }).notNull().unique(), // URL-safe key (e.g., 'widgets', 'projects')
  description: text('description'),
  route: varchar('route', { length: 255 }).notNull(), // Route path (e.g., '/widgets', '/projects')
  icon: varchar('icon', { length: 50 }), // Lucide icon name
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  requiresAuth: boolean('requires_auth').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Widgets Table
 * Stores widget configuration (replaces hardcoded widget configs)
 */
export const widgets = pgTable('widgets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  key: varchar('key', { length: 50 }).notNull().unique(), // e.g., 'rsvp', 'prayer'
  description: text('description'),
  scriptUrl: varchar('script_url', { length: 500 }).notNull(), // Widget JS file URL
  containerElementId: varchar('container_element_id', { length: 100 }).notNull(), // e.g., 'rsvp-widget-root'
  globalName: varchar('global_name', { length: 100 }), // Global JS variable (e.g., 'RSVPWidget')
  previewUrl: varchar('preview_url', { length: 500 }), // For local development preview
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Widget Fields Table
 * Defines configurable fields for each widget
 */
export const widgetFields = pgTable('widget_fields', {
  id: serial('id').primaryKey(),
  widgetId: integer('widget_id').notNull().references(() => widgets.id, { onDelete: 'cascade' }),
  fieldKey: varchar('field_key', { length: 50 }).notNull(), // e.g., 'dataParams', 'primaryColor'
  label: varchar('label', { length: 100 }).notNull(),
  fieldType: varchar('field_type', { length: 20 }).notNull(), // 'text', 'number', 'select', 'color', 'checkbox', 'mp-select'
  placeholder: varchar('placeholder', { length: 255 }),
  helpText: text('help_text'),
  defaultValue: text('default_value'),
  options: jsonb('options'), // For static select fields: [{ value: '1', label: 'Option 1' }]
  isRequired: boolean('is_required').default(false),
  sortOrder: integer('sort_order').default(0),

  // MinistryPlatform data source configuration
  dataSourceType: varchar('data_source_type', { length: 20 }), // 'static', 'mp_table', 'mp_proc'
  dataSourceConfig: jsonb('data_source_config'), // { table: 'Congregations', valueField: 'Congregation_ID', labelField: 'Congregation_Name' } or { proc: 'api_GetCampuses' }
  dataParamMapping: varchar('data_param_mapping', { length: 100 }), // e.g., 'CongregationID' - how the value maps to data-params

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * App Permissions Table
 * Controls which users/roles have access to which apps
 */
export const appPermissions = pgTable('app_permissions', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  userEmail: varchar('user_email', { length: 255 }), // Optional: specific user email
  roleName: varchar('role_name', { length: 255 }), // Optional: MinistryPlatform User Group Name (e.g., 'Project Budgets - Admin')
  canView: boolean('can_view').default(true),
  canEdit: boolean('can_edit').default(false),
  canDelete: boolean('can_delete').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * App Simulations Table
 * Allows admins to simulate non-admin permissions for testing app-specific access control
 */
export const appSimulations = pgTable('app_simulations', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  userEmail: varchar('user_email', { length: 255 }).notNull(), // The admin user testing permissions
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export types
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Widget = typeof widgets.$inferSelect;
export type NewWidget = typeof widgets.$inferInsert;
export type WidgetField = typeof widgetFields.$inferSelect;
export type NewWidgetField = typeof widgetFields.$inferInsert;
export type AppPermission = typeof appPermissions.$inferSelect;
export type NewAppPermission = typeof appPermissions.$inferInsert;
export type AppSimulation = typeof appSimulations.$inferSelect;
export type NewAppSimulation = typeof appSimulations.$inferInsert;
