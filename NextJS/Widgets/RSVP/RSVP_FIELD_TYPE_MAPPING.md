# RSVP Form Field Type Mapping

## Overview

This document maps custom RSVP field types to MinistryPlatform's native `Form_Field_Types` and defines the `Custom_Field_Configuration` JSON structure for each type.

## Purpose

- **Neon Database Reference** - Store this mapping in Neon for field type management
- **Fallback Support** - If RSVP widget breaks, forms still work in MP with native field types
- **Configuration Guide** - Defines required JSON structure for each custom field type

## Field Type Mapping Table

| Custom Component | MP Fallback Type | Description | Custom Config Required |
|-----------------|------------------|-------------|----------------------|
| Counter | Text Field | Numeric input with +/- buttons | Yes |
| Checkbox | Checkbox | Single yes/no checkbox | No |
| Text | Text Field | Single-line text input | No |
| Textarea | Text Area | Multi-line text input | No |
| Dropdown | Dropdown | Select from options | Yes (options) |
| Radio | Radio Button | Single choice from options | Yes (options) |
| Multi-Checkbox | Checkbox | Multiple checkboxes | Yes (options) |
| Searchable Dropdown | Dropdown | Searchable select dropdown | Yes (options) |
| Multi-Select Dropdown | Dropdown | Multiple selection dropdown | Yes (options) |
| Tag Input | Text Field | Comma-separated tags | No |
| Button Group | Radio Button | Button-style radio options | Yes (options) |
| Multi-Button Group | Checkbox | Button-style checkboxes | Yes (options) |
| Slider | Text Field | Numeric slider input | Yes (min/max) |
| Rating | Text Field | Star/number rating | Yes (max) |
| Date | Date Picker | Date selection | No |
| Time | Text Field | Time selection | No |
| Email | Email Address | Email input with validation | No |
| Phone | Phone Number | Phone input with formatting | No |
| File Upload | Text Field | File upload (stores URL) | Yes (accept types) |
| Color Picker | Text Field | Color selection (hex code) | No |

## Custom Field Configuration Schema

### 1. Counter (Party Size, Quantity)

**Use Case:** "How many people will attend?"

**MP Fallback:** Text Field

**Custom Config:**
```json
{
  "component": "Counter",
  "min_value": 1,
  "max_value": 99,
  "default_value": 1,
  "step": 1,
  "icon": "Users",
  "helper_text": "How many people will be attending with you?"
}
```

**Frontend Behavior:**
- Shows numeric input with +/- buttons
- Validates min/max range
- Displays icon (lucide-react icon name)

---

### 2. Checkbox (Boolean Yes/No)

**Use Case:** "I am a first-time visitor"

**MP Fallback:** Checkbox

**Custom Config:** None (uses MP native)

**Frontend Behavior:**
- Standard checkbox
- Returns true/false

---

### 3. Text (Short Answer)

**Use Case:** "What is your preferred seating section?"

**MP Fallback:** Text Field

**Custom Config:**
```json
{
  "component": "Text",
  "placeholder": "e.g., Front, Middle, Back",
  "max_length": 100,
  "helper_text": "Optional preference"
}
```

---

### 4. Textarea (Long Answer)

**Use Case:** "Special requests or questions?"

**MP Fallback:** Text Area

**Custom Config:**
```json
{
  "component": "Textarea",
  "placeholder": "Tell us about any special needs...",
  "max_length": 500,
  "rows": 4,
  "helper_text": "Optional"
}
```

---

### 5. Dropdown (Select One)

**Use Case:** "Which service time?"

**MP Fallback:** Dropdown

**Custom Config:**
```json
{
  "component": "Dropdown",
  "placeholder": "Select a time...",
  "options": [
    {"value": "5pm", "label": "5:00 PM"},
    {"value": "7pm", "label": "7:00 PM"},
    {"value": "9pm", "label": "9:00 PM"}
  ],
  "helper_text": "Choose your preferred service time"
}
```

**Options Schema:**
```typescript
interface Option {
  value: string;    // Stored value
  label: string;    // Display text
  disabled?: boolean; // Optional: disable option
}
```

---

### 6. Radio (Single Choice with Visible Options)

**Use Case:** "Childcare needed?"

**MP Fallback:** Radio Button

**Custom Config:**
```json
{
  "component": "Radio",
  "options": [
    {"value": "yes", "label": "Yes, I need childcare"},
    {"value": "no", "label": "No childcare needed"}
  ],
  "default_value": "no"
}
```

---

### 7. Multi-Checkbox (Multiple Selection)

**Use Case:** "Which events will you attend?" (Christmas Eve + Christmas Day)

**MP Fallback:** Checkbox (first option only)

**Custom Config:**
```json
{
  "component": "Multi-Checkbox",
  "options": [
    {"value": "christmas-eve", "label": "Christmas Eve Service"},
    {"value": "christmas-day", "label": "Christmas Day Service"}
  ],
  "min_selections": 1,
  "max_selections": null,
  "helper_text": "Select all that apply"
}
```

**Stored Value:** JSON array `["christmas-eve", "christmas-day"]`

---

### 8. Searchable Dropdown (Large Option List)

**Use Case:** "Which campus?" (14 campuses)

**MP Fallback:** Dropdown

**Custom Config:**
```json
{
  "component": "Searchable Dropdown",
  "placeholder": "Search for your campus...",
  "options": [
    {"value": "1", "label": "Lake Orion Campus"},
    {"value": "2", "label": "Farmington Hills Campus"},
    ...
  ],
  "helper_text": "Type to search"
}
```

---

### 9. Multi-Select Dropdown

**Use Case:** "Dietary restrictions?" (multiple allowed)

**MP Fallback:** Dropdown (first selection only)

**Custom Config:**
```json
{
  "component": "Multi-Select Dropdown",
  "placeholder": "Select all that apply...",
  "options": [
    {"value": "vegetarian", "label": "Vegetarian"},
    {"value": "vegan", "label": "Vegan"},
    {"value": "gluten-free", "label": "Gluten-Free"},
    {"value": "dairy-free", "label": "Dairy-Free"},
    {"value": "nut-allergy", "label": "Nut Allergy"}
  ]
}
```

---

### 10. Tag Input (Free-Form Multi-Value)

**Use Case:** "Names of children needing childcare"

**MP Fallback:** Text Field (comma-separated)

**Custom Config:**
```json
{
  "component": "Tag Input",
  "placeholder": "Press Enter after each name",
  "max_tags": 10,
  "helper_text": "Add one name at a time"
}
```

**Stored Value:** JSON array `["Emma", "Noah", "Olivia"]`

---

### 11. Button Group (Radio with Button UI)

**Use Case:** "T-shirt size?"

**MP Fallback:** Radio Button

**Custom Config:**
```json
{
  "component": "Button Group",
  "options": [
    {"value": "s", "label": "S"},
    {"value": "m", "label": "M"},
    {"value": "l", "label": "L"},
    {"value": "xl", "label": "XL"},
    {"value": "xxl", "label": "2XL"}
  ],
  "allow_deselect": false
}
```

---

### 12. Multi-Button Group (Checkbox with Button UI)

**Use Case:** "Which meals?" (Breakfast, Lunch, Dinner)

**MP Fallback:** Checkbox (first option only)

**Custom Config:**
```json
{
  "component": "Multi-Button Group",
  "options": [
    {"value": "breakfast", "label": "Breakfast"},
    {"value": "lunch", "label": "Lunch"},
    {"value": "dinner", "label": "Dinner"}
  ]
}
```

---

### 13. Slider (Numeric Range)

**Use Case:** "Comfort level with worship music volume?"

**MP Fallback:** Text Field

**Custom Config:**
```json
{
  "component": "Slider",
  "min_value": 1,
  "max_value": 10,
  "default_value": 5,
  "step": 1,
  "show_value": true,
  "labels": {
    "min": "Quiet",
    "max": "Loud"
  }
}
```

---

### 14. Rating (Star/Number Rating)

**Use Case:** "How likely are you to invite a friend?"

**MP Fallback:** Text Field

**Custom Config:**
```json
{
  "component": "Rating",
  "max_rating": 5,
  "icon": "Star",
  "allow_half": false,
  "labels": {
    "1": "Not Likely",
    "5": "Very Likely"
  }
}
```

---

### 15. Date (Date Picker)

**Use Case:** "Preferred volunteer date?"

**MP Fallback:** Date Picker (native MP)

**Custom Config:**
```json
{
  "component": "Date",
  "min_date": "today",
  "max_date": "2025-12-31",
  "disable_weekends": false,
  "helper_text": "Select your preferred date"
}
```

---

### 16. Time (Time Picker)

**Use Case:** "Preferred arrival time?"

**MP Fallback:** Text Field

**Custom Config:**
```json
{
  "component": "Time",
  "format": "12h",
  "min_time": "08:00",
  "max_time": "20:00",
  "step_minutes": 15
}
```

---

### 17. Email (Email Validation)

**Use Case:** "Backup email address"

**MP Fallback:** Email Address (native MP)

**Custom Config:** None (uses MP native validation)

---

### 18. Phone (Phone Formatting)

**Use Case:** "Emergency contact number"

**MP Fallback:** Phone Number (native MP)

**Custom Config:**
```json
{
  "component": "Phone",
  "format": "US",
  "allow_international": false
}
```

---

### 19. File Upload (Document/Image)

**Use Case:** "Upload proof of vaccination"

**MP Fallback:** Text Field (stores URL)

**Custom Config:**
```json
{
  "component": "File Upload",
  "accept": ".pdf,.jpg,.jpeg,.png",
  "max_size_mb": 5,
  "upload_endpoint": "/api/upload",
  "helper_text": "PDF or image files only"
}
```

**Stored Value:** URL to uploaded file

---

### 20. Color Picker

**Use Case:** "Preferred badge color"

**MP Fallback:** Text Field

**Custom Config:**
```json
{
  "component": "Color Picker",
  "default_color": "#61BC47",
  "preset_colors": [
    "#61BC47",
    "#FF5733",
    "#3498DB",
    "#9B59B6"
  ]
}
```

**Stored Value:** Hex color code `#61BC47`

---

## Database Schema for Neon

### Table: `rsvp_field_types`

```sql
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
```

### Sample Data

```sql
INSERT INTO rsvp_field_types (component_name, display_name, description, mp_fallback_type, requires_options, requires_min_max, icon, example_config) VALUES

('Counter', 'Counter (Party Size)', 'Numeric input with +/- buttons for quantities like party size', 'Text Field', FALSE, TRUE, 'Users',
'{"component":"Counter","min_value":1,"max_value":99,"default_value":1,"icon":"Users","helper_text":"How many people?"}'),

('Dropdown', 'Dropdown (Select One)', 'Select single option from dropdown list', 'Dropdown', TRUE, FALSE, 'ChevronDown',
'{"component":"Dropdown","placeholder":"Select...","options":[{"value":"option1","label":"Option 1"}],"helper_text":"Choose one"}'),

('Multi-Checkbox', 'Multiple Checkboxes', 'Select multiple options from checkbox list', 'Checkbox', TRUE, FALSE, 'CheckSquare',
'{"component":"Multi-Checkbox","options":[{"value":"opt1","label":"Option 1"}],"min_selections":1,"helper_text":"Select all that apply"}'),

('Button Group', 'Button Group (Single)', 'Single selection button group with visual buttons', 'Radio Button', TRUE, FALSE, 'Square',
'{"component":"Button Group","options":[{"value":"s","label":"S"},{"value":"m","label":"M"}],"allow_deselect":false}'),

('Slider', 'Slider (Range)', 'Numeric slider for range selection', 'Text Field', FALSE, TRUE, 'SlidersHorizontal',
'{"component":"Slider","min_value":1,"max_value":10,"default_value":5,"show_value":true,"labels":{"min":"Low","max":"High"}}');

-- Add remaining 15 field types...
```

### Query Examples

```sql
-- Get all field types that require options
SELECT * FROM rsvp_field_types WHERE requires_options = TRUE;

-- Get field type with example config
SELECT component_name, example_config
FROM rsvp_field_types
WHERE component_name = 'Counter';

-- Get MP fallback type
SELECT mp_fallback_type
FROM rsvp_field_types
WHERE component_name = 'Multi-Checkbox';
```

## Frontend Component Mapping

```typescript
// Component registry for dynamic rendering
const FIELD_COMPONENTS = {
  'Counter': CounterField,
  'Checkbox': CheckboxField,
  'Text': TextField,
  'Textarea': TextareaField,
  'Dropdown': DropdownField,
  'Radio': RadioField,
  'Multi-Checkbox': MultiCheckboxField,
  'Searchable Dropdown': SearchableDropdownField,
  'Multi-Select Dropdown': MultiSelectField,
  'Tag Input': TagInputField,
  'Button Group': ButtonGroupField,
  'Multi-Button Group': MultiButtonGroupField,
  'Slider': SliderField,
  'Rating': RatingField,
  'Date': DateField,
  'Time': TimeField,
  'Email': EmailField,
  'Phone': PhoneField,
  'File Upload': FileUploadField,
  'Color Picker': ColorPickerField,
};

// Render field based on config
function renderField(field: FormField) {
  const config = JSON.parse(field.Custom_Field_Configuration || '{}');
  const Component = FIELD_COMPONENTS[config.component] || TextField;
  return <Component field={field} config={config} />;
}
```

## Migration from Old Schema

```sql
-- Map old Question_Types to new field types
UPDATE Form_Fields
SET Custom_Field_Configuration = JSON_OBJECT(
    'component', qt.Component_Name,
    'min_value', q.Min_Value,
    'max_value', q.Max_Value,
    'icon', q.Icon_Name,
    'helper_text', q.Helper_Text
)
FROM Form_Fields ff
INNER JOIN Project_RSVP_Questions q ON ff.Field_Order = q.Field_Order
INNER JOIN Question_Types qt ON q.Question_Type_ID = qt.Question_Type_ID;
```

## Validation Rules

1. **Required Options:** Dropdown, Radio, Multi-Checkbox, Button Group, Multi-Button Group, Searchable Dropdown, Multi-Select Dropdown
2. **Required Min/Max:** Counter, Slider, Rating
3. **Optional Config:** All others can use MP defaults
4. **JSON Validation:** All configs must be valid JSON (enforced by CHECK constraint)

## Usage in RSVP Widget

1. **Form Builder** - Staff selects field type from Neon database
2. **Configuration UI** - Show relevant config options based on field type
3. **Save to MP** - Store config as JSON in `Custom_Field_Configuration`
4. **Render Form** - Parse JSON and render appropriate React component
5. **Fallback** - If widget fails, MP displays with native fallback type
