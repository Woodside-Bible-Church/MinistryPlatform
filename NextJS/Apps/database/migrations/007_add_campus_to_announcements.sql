-- =============================================
-- Migration: Add Campus Parameter to Announcements Widget
-- Description: Add interactive campus URL parameter (similar to RSVP)
-- Date: 2026-01-08
-- =============================================

-- Add campus URL parameter that uses Campus_Slug
INSERT INTO widget_url_parameters (
  widget_id,
  parameter_key,
  description,
  example_value,
  is_required,
  sort_order,
  is_interactive,
  data_source_type,
  data_source_config
)
SELECT
  w.id,
  'campus',
  'Pre-select a specific campus for the announcements widget',
  'troy',
  false,
  0, -- Put it first
  true, -- Make it interactive with a dropdown
  'mp_table',
  jsonb_build_object(
    'table', 'Congregations',
    'filter', 'Available_Online = 1',
    'orderBy', 'Congregation_Name',
    'labelField', 'Congregation_Name',
    'valueField', 'Campus_Slug'
  )
FROM widgets w
WHERE w.key = 'announcements';
