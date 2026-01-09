-- =============================================
-- Migration: Add Announcements Application
-- Description: Registers the Announcements management app in the applications table
-- Date: 2026-01-08
-- =============================================

-- Insert Announcements application
INSERT INTO applications (name, key, description, route, icon, sort_order, is_active, requires_auth)
VALUES (
  'Announcements',
  'announcements',
  'Manage church-wide and campus-specific announcements',
  '/announcements',
  'Megaphone',
  6,
  true,
  true
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  route = EXCLUDED.route,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Grant access to All Staff user group
INSERT INTO app_permissions (application_id, role_name, can_view, can_edit, can_delete)
SELECT
  id,
  'All Staff',
  true,
  true,
  false
FROM applications
WHERE key = 'announcements'
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
WHERE key = 'announcements'
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
WHERE key = 'announcements'
ON CONFLICT DO NOTHING;
