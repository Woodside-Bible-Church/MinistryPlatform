-- Migration: Add widget_url_parameters table
-- Purpose: Document URL parameters that can be passed to widgets
-- These are separate from data-params and provide additional customization via URL

CREATE TABLE IF NOT EXISTS widget_url_parameters (
  id SERIAL PRIMARY KEY,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  parameter_key VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  example_value VARCHAR(255),
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups by widget
CREATE INDEX idx_widget_url_parameters_widget_id ON widget_url_parameters(widget_id);

-- Add URL parameters for RSVP widget
INSERT INTO widget_url_parameters (widget_id, parameter_key, description, example_value, is_required, sort_order)
SELECT
  w.id,
  'campus',
  'Pre-select a specific campus in the dropdown. Accepts campus slug (e.g., "troy", "lake-orion", "online").',
  'troy',
  FALSE,
  1
FROM widgets w
WHERE w.key = 'rsvp';

INSERT INTO widget_url_parameters (widget_id, parameter_key, description, example_value, is_required, sort_order)
SELECT
  w.id,
  'project',
  'Override the project specified in data-params. Accepts project slug or numeric ID.',
  'christmas-2024',
  FALSE,
  2
FROM widgets w
WHERE w.key = 'rsvp';

-- Add URL parameters for Custom Forms widget (if exists)
INSERT INTO widget_url_parameters (widget_id, parameter_key, description, example_value, is_required, sort_order)
SELECT
  w.id,
  'id',
  'Specify which MinistryPlatform form to display. Accepts Form GUID from MP.',
  '[FormGUIDGoesHere]',
  TRUE,
  1
FROM widgets w
WHERE w.key = 'custom-forms';

COMMENT ON TABLE widget_url_parameters IS 'Documents URL parameters that can be passed to widgets for additional customization';
COMMENT ON COLUMN widget_url_parameters.parameter_key IS 'The URL parameter key (e.g., "campus", "id")';
COMMENT ON COLUMN widget_url_parameters.description IS 'Explanation of what this parameter does and how to use it';
COMMENT ON COLUMN widget_url_parameters.example_value IS 'Example value to show users (e.g., "troy", "[FormGUID]")';
COMMENT ON COLUMN widget_url_parameters.is_required IS 'Whether this parameter is required for the widget to function';
