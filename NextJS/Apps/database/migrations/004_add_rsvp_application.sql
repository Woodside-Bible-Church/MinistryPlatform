-- =============================================
-- Migration: Add RSVP Application
-- Description: Registers the RSVP Events app in the applications table
-- =============================================

-- Insert RSVP application
INSERT INTO applications (name, key, description, route, icon, sort_order, is_active, requires_auth)
VALUES (
  'RSVP Events',
  'rsvp',
  'Manage event series and RSVPs for special services (Christmas, Easter, etc.)',
  '/rsvp',
  'CalendarCheck',
  5,
  true,
  true
)
ON CONFLICT (key) DO NOTHING;

-- Grant access to All Staff user group
-- Note: Update this with appropriate role names for your organization
INSERT INTO app_permissions (application_id, role_name, can_view, can_edit, can_delete)
SELECT
  id,
  'All Staff',
  true,
  true,
  false
FROM applications
WHERE key = 'rsvp'
ON CONFLICT DO NOTHING;

-- Grant admin permissions to IT Team
INSERT INTO app_permissions (application_id, role_name, can_view, can_edit, can_delete)
SELECT
  id,
  'IT Team Group',
  true,
  true,
  true
FROM applications
WHERE key = 'rsvp'
ON CONFLICT DO NOTHING;

-- Grant admin permissions to Communications team
INSERT INTO app_permissions (application_id, role_name, can_view, can_edit, can_delete)
SELECT
  id,
  'Communications',
  true,
  true,
  true
FROM applications
WHERE key = 'rsvp'
ON CONFLICT DO NOTHING;
