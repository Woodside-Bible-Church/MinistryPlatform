-- =============================================
-- Migration: Add Announcements Widget
-- Description: Registers the Announcements widget in the widgets table
-- Date: 2026-01-06
-- =============================================

-- Insert Announcements Widget
INSERT INTO widgets (
  name,
  key,
  description,
  source,
  script_url,
  container_element_id,
  global_name,
  preview_url,
  is_active,
  sort_order
)
VALUES (
  'Announcements Widget',
  'announcements',
  'Display church announcements in grid or carousel layout with images and call-to-action',
  'custom',
  'https://announcements.vercel.app/widget/announcements-widget.js',
  'announcements-widget-root',
  'AnnouncementsWidget',
  'http://localhost:3004',
  true,
  3
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  script_url = EXCLUDED.script_url,
  container_element_id = EXCLUDED.container_element_id,
  global_name = EXCLUDED.global_name,
  preview_url = EXCLUDED.preview_url,
  updated_at = NOW();

-- Add widget fields for Announcements widget
-- Field 1: Display Mode
INSERT INTO widget_fields (
  widget_id,
  field_key,
  label,
  field_type,
  placeholder,
  help_text,
  default_value,
  options,
  is_required,
  sort_order,
  data_source_type
)
SELECT
  w.id,
  'mode',
  'Display Mode',
  'select',
  NULL,
  'Choose how announcements are displayed',
  'grid',
  '[{"value":"grid","label":"Grid Layout"},{"value":"carousel","label":"Carousel Layout"}]'::jsonb,
  false,
  1,
  'static'
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Field 2: Data Params
INSERT INTO widget_fields (
  widget_id,
  field_key,
  label,
  field_type,
  placeholder,
  help_text,
  default_value,
  is_required,
  sort_order,
  data_source_type
)
SELECT
  w.id,
  'dataParams',
  'Data Params',
  'text',
  '@CongregationID=1,@NumPerPage=6',
  'Optional parameters (e.g., @CongregationID=1,@NumPerPage=6). Leave empty for defaults.',
  NULL,
  false,
  2,
  'static'
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Document URL parameters that can be passed to the Announcements widget
-- Parameter 1: CongregationID (via data-params)
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive
)
SELECT
  w.id,
  'CongregationID',
  'Filter announcements by congregation/campus ID',
  '@CongregationID=1',
  false,
  1,
  false
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Parameter 2: NumPerPage (via data-params)
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive
)
SELECT
  w.id,
  'NumPerPage',
  'Number of announcements to display',
  '@NumPerPage=6',
  false,
  2,
  false
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Parameter 3: GroupID (via data-params)
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive
)
SELECT
  w.id,
  'GroupID',
  'Filter announcements by group ID',
  '@GroupID=123',
  false,
  3,
  false
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Parameter 4: EventID (via data-params)
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive
)
SELECT
  w.id,
  'EventID',
  'Filter announcements by event ID',
  '@EventID=456',
  false,
  4,
  false
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Parameter 5: Search (via data-params)
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive
)
SELECT
  w.id,
  'Search',
  'Search announcements by keyword',
  '@Search=christmas',
  false,
  5,
  false
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Parameter 6: AnnouncementIDs (via data-params)
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive
)
SELECT
  w.id,
  'AnnouncementIDs',
  'Display specific announcements by ID (comma-separated)',
  '@AnnouncementIDs=1,2,3',
  false,
  6,
  false
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;

-- Parameter 7: Page (via data-params)
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive
)
SELECT
  w.id,
  'Page',
  'Page number for pagination',
  '@Page=1',
  false,
  7,
  false
FROM widgets w
WHERE w.key = 'announcements'
ON CONFLICT DO NOTHING;
