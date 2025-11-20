-- ===================================================================
-- Neon Migration: Create RSVP Field Types Table
-- ===================================================================
-- Purpose: Store metadata for custom RSVP form field types
-- Database: Neon (Postgres)
-- ===================================================================

-- Drop table if exists (for clean re-runs)
DROP TABLE IF EXISTS rsvp_field_types;

-- Create table
CREATE TABLE rsvp_field_types (
  id SERIAL PRIMARY KEY,
  component_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  mp_fallback_type VARCHAR(50) NOT NULL,
  requires_options BOOLEAN DEFAULT FALSE,
  requires_min_max BOOLEAN DEFAULT FALSE,
  icon VARCHAR(50),
  example_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rsvp_field_types_component ON rsvp_field_types(component_name);
CREATE INDEX idx_rsvp_field_types_fallback ON rsvp_field_types(mp_fallback_type);

-- Insert all 20 field types
INSERT INTO rsvp_field_types (component_name, display_name, description, mp_fallback_type, requires_options, requires_min_max, icon, example_config) VALUES

-- 1. Counter
('Counter', 'Counter (Party Size)', 'Numeric input with +/- buttons for quantities like party size', 'Text Field', FALSE, TRUE, 'Users',
'{"component":"Counter","min_value":1,"max_value":99,"default_value":1,"step":1,"icon":"Users","helper_text":"How many people will be attending with you?"}'::jsonb),

-- 2. Checkbox
('Checkbox', 'Checkbox (Yes/No)', 'Single checkbox for boolean yes/no questions', 'Checkbox', FALSE, FALSE, 'CheckSquare',
'{"component":"Checkbox","default_value":false,"helper_text":"Check if yes"}'::jsonb),

-- 3. Text
('Text', 'Text Input (Short)', 'Single-line text input for short answers', 'Text Field', FALSE, FALSE, 'Type',
'{"component":"Text","placeholder":"Enter text...","max_length":100,"helper_text":"Short answer"}'::jsonb),

-- 4. Textarea
('Textarea', 'Text Area (Long)', 'Multi-line text input for long answers', 'Text Area', FALSE, FALSE, 'AlignLeft',
'{"component":"Textarea","placeholder":"Enter details...","max_length":500,"rows":4,"helper_text":"Provide details"}'::jsonb),

-- 5. Dropdown
('Dropdown', 'Dropdown (Select One)', 'Select single option from dropdown list', 'Dropdown', TRUE, FALSE, 'ChevronDown',
'{"component":"Dropdown","placeholder":"Select an option...","options":[{"value":"option1","label":"Option 1"},{"value":"option2","label":"Option 2"}],"helper_text":"Choose one option"}'::jsonb),

-- 6. Radio
('Radio', 'Radio Buttons', 'Single choice with visible radio button options', 'Radio Button', TRUE, FALSE, 'Circle',
'{"component":"Radio","options":[{"value":"yes","label":"Yes"},{"value":"no","label":"No"}],"default_value":"no"}'::jsonb),

-- 7. Multi-Checkbox
('Multi-Checkbox', 'Multiple Checkboxes', 'Select multiple options from checkbox list', 'Checkbox', TRUE, FALSE, 'CheckSquare',
'{"component":"Multi-Checkbox","options":[{"value":"opt1","label":"Option 1"},{"value":"opt2","label":"Option 2"}],"min_selections":1,"max_selections":null,"helper_text":"Select all that apply"}'::jsonb),

-- 8. Searchable Dropdown
('Searchable Dropdown', 'Searchable Dropdown', 'Searchable select dropdown for large option lists', 'Dropdown', TRUE, FALSE, 'Search',
'{"component":"Searchable Dropdown","placeholder":"Search...","options":[{"value":"1","label":"Lake Orion Campus"},{"value":"2","label":"Farmington Hills Campus"}],"helper_text":"Type to search"}'::jsonb),

-- 9. Multi-Select Dropdown
('Multi-Select Dropdown', 'Multi-Select Dropdown', 'Select multiple options from dropdown', 'Dropdown', TRUE, FALSE, 'ListChecks',
'{"component":"Multi-Select Dropdown","placeholder":"Select multiple...","options":[{"value":"veg","label":"Vegetarian"},{"value":"gf","label":"Gluten-Free"}]}'::jsonb),

-- 10. Tag Input
('Tag Input', 'Tag Input (Free-Form)', 'Free-form text input that creates tags', 'Text Field', FALSE, FALSE, 'Tags',
'{"component":"Tag Input","placeholder":"Press Enter after each item","max_tags":10,"helper_text":"Add one item at a time"}'::jsonb),

-- 11. Button Group
('Button Group', 'Button Group (Single)', 'Single selection with visual button UI', 'Radio Button', TRUE, FALSE, 'Square',
'{"component":"Button Group","options":[{"value":"s","label":"S"},{"value":"m","label":"M"},{"value":"l","label":"L"}],"allow_deselect":false}'::jsonb),

-- 12. Multi-Button Group
('Multi-Button Group', 'Button Group (Multiple)', 'Multiple selection with visual button UI', 'Checkbox', TRUE, FALSE, 'SquareCheckBig',
'{"component":"Multi-Button Group","options":[{"value":"breakfast","label":"Breakfast"},{"value":"lunch","label":"Lunch"}]}'::jsonb),

-- 13. Slider
('Slider', 'Slider (Range)', 'Numeric slider for selecting value from range', 'Text Field', FALSE, TRUE, 'SlidersHorizontal',
'{"component":"Slider","min_value":1,"max_value":10,"default_value":5,"step":1,"show_value":true,"labels":{"min":"Low","max":"High"}}'::jsonb),

-- 14. Rating
('Rating', 'Rating (Stars)', 'Star rating or numeric rating input', 'Text Field', FALSE, TRUE, 'Star',
'{"component":"Rating","max_rating":5,"icon":"Star","allow_half":false,"labels":{"1":"Poor","5":"Excellent"}}'::jsonb),

-- 15. Date
('Date', 'Date Picker', 'Date selection with calendar picker', 'Date Picker', FALSE, FALSE, 'Calendar',
'{"component":"Date","min_date":"today","max_date":"2025-12-31","disable_weekends":false,"helper_text":"Select a date"}'::jsonb),

-- 16. Time
('Time', 'Time Picker', 'Time selection input', 'Text Field', FALSE, FALSE, 'Clock',
'{"component":"Time","format":"12h","min_time":"08:00","max_time":"20:00","step_minutes":15}'::jsonb),

-- 17. Email
('Email', 'Email Address', 'Email input with validation', 'Email Address', FALSE, FALSE, 'Mail',
'{"component":"Email","placeholder":"email@example.com","helper_text":"Enter your email"}'::jsonb),

-- 18. Phone
('Phone', 'Phone Number', 'Phone number input with formatting', 'Phone Number', FALSE, FALSE, 'Phone',
'{"component":"Phone","format":"US","allow_international":false,"placeholder":"(555) 123-4567"}'::jsonb),

-- 19. File Upload
('File Upload', 'File Upload', 'File upload input for documents or images', 'Text Field', FALSE, FALSE, 'Upload',
'{"component":"File Upload","accept":".pdf,.jpg,.jpeg,.png","max_size_mb":5,"upload_endpoint":"/api/upload","helper_text":"PDF or image files only"}'::jsonb),

-- 20. Color Picker
('Color Picker', 'Color Picker', 'Color selection input', 'Text Field', FALSE, FALSE, 'Palette',
'{"component":"Color Picker","default_color":"#61BC47","preset_colors":["#61BC47","#FF5733","#3498DB","#9B59B6"]}'::jsonb);

-- Add comments
COMMENT ON TABLE rsvp_field_types IS 'Metadata for custom RSVP form field types with MP fallback mapping';
COMMENT ON COLUMN rsvp_field_types.component_name IS 'React component name for frontend rendering';
COMMENT ON COLUMN rsvp_field_types.mp_fallback_type IS 'MinistryPlatform native field type to use as fallback';
COMMENT ON COLUMN rsvp_field_types.requires_options IS 'True if field type requires options array (dropdowns, radio, etc)';
COMMENT ON COLUMN rsvp_field_types.requires_min_max IS 'True if field type requires min/max values (counter, slider, etc)';
COMMENT ON COLUMN rsvp_field_types.example_config IS 'Example JSON configuration for this field type';
