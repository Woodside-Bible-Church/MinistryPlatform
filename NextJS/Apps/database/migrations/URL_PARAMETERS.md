# Widget URL Parameters

This document explains the Widget URL Parameters feature added to the Neon Apps widget configurator.

## Overview

**Widget URL Parameters** allow users to customize widget behavior by appending query parameters to the widget page URL. These are **separate from `data-params`** attributes and provide additional functionality.

### Difference from Data-Params

| Feature | Data-Params | URL Parameters |
|---------|-------------|----------------|
| **Purpose** | Widget configuration (required) | Optional customization |
| **Location** | `data-params` attribute on container element | URL query string |
| **Example** | `data-params="@Project=christmas-2024"` | `?campus=troy` |
| **Set by** | Content editor when embedding widget | End user or shareable link |
| **Use case** | Required widget settings | Pre-fill dropdowns, override defaults |

## Database Schema

### Table: `widget_url_parameters`

```sql
CREATE TABLE widget_url_parameters (
  id SERIAL PRIMARY KEY,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  parameter_key VARCHAR(50) NOT NULL,           -- e.g., 'campus', 'id'
  description TEXT NOT NULL,                    -- What this parameter does
  example_value VARCHAR(255),                   -- e.g., 'troy', '[FormGUID]'
  is_required BOOLEAN DEFAULT FALSE,            -- Required for widget to work?
  sort_order INTEGER DEFAULT 0,                 -- Display order in UI
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Current URL Parameters

### RSVP Widget

| Parameter | Description | Example | Required |
|-----------|-------------|---------|----------|
| `campus` | Pre-select a campus in dropdown | `?campus=troy` | No |
| `project` | Override project from data-params | `?project=christmas-2024` | No |

**Full Example:**
```
https://widgets.woodsidebible.org/rsvp?campus=troy&project=christmas-2024
```

**Behavior:**
- `?campus=troy` - Pre-selects Troy campus in the dropdown (user can still change it)
- `?project=christmas-2024` - Loads the Christmas 2024 project (overrides data-params if present)

### Custom Forms Widget

| Parameter | Description | Example | Required |
|-----------|-------------|---------|----------|
| `id` | MinistryPlatform Form GUID | `?id=[FormGUID]` | Yes |

**Full Example:**
```
https://widgets.woodsidebible.org/custom-forms?id=A1B2C3D4-E5F6-7890-ABCD-EF1234567890
```

**Behavior:**
- `?id=[FormGUID]` - Loads the specific MP form with the provided GUID

## How to Run Migration

### Option 1: SQL Migration (Recommended)

```bash
# Navigate to Apps project
cd /Users/coltonwirgau/MinistryPlatform/NextJS/Apps

# Run the SQL migration against your database
psql -U your_username -d your_database -f database/migrations/003_add_widget_url_parameters.sql
```

### Option 2: Drizzle Migration Script

```bash
# Navigate to Apps project
cd /Users/coltonwirgau/MinistryPlatform/NextJS/Apps

# Run the TypeScript migration
npx tsx src/db/migrations/add-widget-url-parameters.ts
```

## Usage in Neon Apps UI

When viewing a widget's configuration page in Neon Apps, the URL parameters will be displayed in a new section:

```
┌─────────────────────────────────────────────────┐
│ Widget Configuration                             │
├─────────────────────────────────────────────────┤
│ Project:        [Christmas Services 2024]        │
│ Campus:         [All Campuses]                   │
├─────────────────────────────────────────────────┤
│ URL Parameters (Optional)                        │
│                                                   │
│ • campus=troy                                    │
│   Pre-select a specific campus in the dropdown   │
│   Example: ?campus=troy                          │
│                                                   │
│ • project=christmas-2024                         │
│   Override the project specified in data-params  │
│   Example: ?project=christmas-2024               │
└─────────────────────────────────────────────────┘
```

## Adding New URL Parameters

To add URL parameters for a new widget:

1. **Add to migration SQL:**
   ```sql
   INSERT INTO widget_url_parameters (widget_id, parameter_key, description, example_value, is_required, sort_order)
   SELECT
     w.id,
     'your_param',
     'Description of what this parameter does',
     'example-value',
     FALSE,
     1
   FROM widgets w
   WHERE w.key = 'your-widget-key';
   ```

2. **Update widget code to read the parameter:**
   ```typescript
   // In your widget's page.tsx or component
   const urlParams = new URLSearchParams(window.location.search);
   const yourParam = urlParams.get('your_param');

   if (yourParam) {
     // Use the parameter value
   }
   ```

## Benefits

1. **Shareable Links** - Create custom links that pre-configure widgets for specific use cases
2. **Marketing Campaigns** - Send campus-specific links to different audiences
3. **User Experience** - Pre-fill dropdowns so users don't have to search
4. **Documentation** - Self-documenting in the Neon Apps interface
5. **Flexibility** - Add new parameters without changing core widget configuration

## Future Enhancements

Potential additions:
- **API endpoint** to fetch URL parameters: `GET /api/widgets/:widgetId/url-parameters`
- **Validation rules** - Specify allowed values (e.g., campus must be one of: troy, lake-orion, etc.)
- **Parameter dependencies** - Some parameters only apply when others are set
- **Auto-generated documentation** - Generate shareable links with example parameters
