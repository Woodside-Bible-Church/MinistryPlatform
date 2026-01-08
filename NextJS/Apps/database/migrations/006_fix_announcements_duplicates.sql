-- =============================================
-- Migration: Fix Announcements Widget Duplicate Fields
-- Description: Remove duplicate widget fields for announcements
-- Date: 2026-01-08
-- =============================================

-- Delete all widget fields for announcements widget
DELETE FROM widget_fields
WHERE widget_id IN (
  SELECT id FROM widgets WHERE key = 'announcements'
);

-- Delete all URL parameters for announcements widget
DELETE FROM widget_url_parameters
WHERE widget_id IN (
  SELECT id FROM widgets WHERE key = 'announcements'
);

-- Re-insert widget fields (only once)
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
WHERE w.key = 'announcements';

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
WHERE w.key = 'announcements';

-- Re-insert URL parameters
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
WHERE w.key = 'announcements';

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
WHERE w.key = 'announcements';

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
WHERE w.key = 'announcements';

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
WHERE w.key = 'announcements';

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
WHERE w.key = 'announcements';

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
WHERE w.key = 'announcements';

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
WHERE w.key = 'announcements';
