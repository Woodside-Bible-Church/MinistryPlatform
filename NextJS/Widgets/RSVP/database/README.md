# Prayer Widget Database Documentation

## Overview

The Prayer Widget uses a unified stored procedure approach that returns all widget data in a single API call. This reduces latency, prevents duplicate data, and makes the widget highly configurable through MinistryPlatform's native configuration system.

## Key Files

### 1. `schema.sql`
Creates the core database tables:
- `Feedback_Entry_User_Responses` - Tracks who prayed for what
- `Feedback_Response_Types` - Lookup table for response types (Prayed, Celebrate, Amen, etc.)
- `Feedback_Entry_Updates` - Prayer updates/testimonies from requesters

### 2. `unified-prayer-widget-proc.sql`
**Main stored procedure**: `api_Custom_Prayer_Widget_Data_JSON`

Returns a single nested JSON structure containing:
- **Widget Configuration** - Title, description, and behavior settings
- **User Stats** - Prayer count, streak, prayers today
- **My Requests** - User's own submitted prayers
- **Prayer Partners** - Prayers the user has prayed for
- **Community Needs** - Other prayers (filtered to prevent duplicates)

### 3. `prayer-widget-configuration.sql`
Inserts configuration settings into `dp_Configuration_Settings` table.

## Configuration Settings

All settings use `Application_Code = 'PRAYER_WIDGET'`:

| Key Name | Type | Default | Description |
|----------|------|---------|-------------|
| `WIDGET_TITLE` | string | "Prayer & Praise" | Widget title text |
| `WIDGET_DESCRIPTION` | string | "Share burdens..." | Widget subtitle |
| `ALLOW_ANONYMOUS` | bit | 0 | Allow submissions without login |
| `SHOW_CONTACT_NAMES` | bit | 1 | Show real names vs. "Anonymous" |
| `REQUIRE_APPROVAL` | bit | 1 | Require staff approval before public display |
| `ENABLED_TYPES` | csv | "1,2" | Feedback types to show (1=Prayer, 2=Praise) |
| `DAYS_TO_SHOW` | int | 60 | Days to show non-ongoing prayers |
| `FILTER_BY_CAMPUS` | bit | 0 | Enable campus/congregation filtering |
| `CAMPUS_IDS` | csv | NULL | Congregation IDs to include |

## Installation Steps

### 1. Create Tables & Stored Procedures

Run in this order:

```sql
-- 1. Create base tables
\i schema.sql

-- 2. Create unified stored procedure
\i unified-prayer-widget-proc.sql

-- 3. Insert configuration settings
\i prayer-widget-configuration.sql
```

### 2. Register Stored Procedure in MinistryPlatform

1. Go to **Admin Console → API Procedures**
2. Add new record:
   - **Procedure Name**: `api_Custom_Prayer_Widget_Data_JSON`
   - **API Enabled**: ✓ Yes
   - **Role**: Public (or restrict as needed)

### 3. Test the Stored Procedure

```sql
-- Test without user (public view)
EXEC api_Custom_Prayer_Widget_Data_JSON @ContactID = NULL, @DomainID = 1;

-- Test with logged-in user
EXEC api_Custom_Prayer_Widget_Data_JSON @ContactID = 123, @DomainID = 1;
```

## JSON Response Structure

```json
{
  "Widget_Title": "Prayer & Praise",
  "Widget_Description": "Share burdens, celebrate victories",
  "Configuration": {
    "Allow_Anonymous": false,
    "Filter_By_Campus": false,
    "Campus_IDs": null,
    "Enabled_Types": "1,2",
    "Days_To_Show": 60,
    "Require_Approval": true,
    "Show_Contact_Names": true
  },
  "User_Stats": {
    "Total_Prayers": 42,
    "Prayer_Streak": 7,
    "Prayers_Today": 3
  },
  "My_Requests": [
    {
      "Feedback_Entry_ID": 123,
      "Title": "Healing for my mom",
      "Description": "...",
      "Type": "Prayer Request",
      "Type_ID": 1,
      "Date_Submitted": "2025-10-20T10:30:00",
      "Approved": true,
      "Ongoing_Need": false,
      "Target_Date": null,
      "Prayer_Count": 15,
      "Celebration_Count": 0,
      "Latest_Update": "She's doing better!",
      "Latest_Update_Date": "2025-10-23T14:00:00"
    }
  ],
  "Prayer_Partners": [
    {
      "Feedback_Entry_ID": 456,
      "Title": "Job interview success",
      "Description": "...",
      "Requester_Name": "John Doe",
      "Requester_First_Name": "John",
      "Type": "Praise Report",
      "Type_ID": 2,
      "Date_Submitted": "2025-10-22T09:00:00",
      "My_Prayer_Date": "2025-10-23T08:30:00",
      "My_Message": "So happy for you! God is faithful!",
      "Prayer_Count": 8,
      "Celebration_Count": 12,
      "Latest_Update": null,
      "Latest_Update_Date": null
    }
  ],
  "Community_Needs": [
    {
      "Feedback_Entry_ID": 789,
      "Title": "Strength for difficult season",
      "Description": "...",
      "Requester_Name": "Jane Smith",
      "Requester_First_Name": "Jane",
      "Type": "Prayer Request",
      "Type_ID": 1,
      "Date_Submitted": "2025-10-24T12:00:00",
      "Ongoing_Need": true,
      "Target_Date": null,
      "Prayer_Count": 5,
      "Celebration_Count": 0,
      "Latest_Update": null,
      "Latest_Update_Date": null
    }
  ]
}
```

## Benefits of This Approach

### ✅ Single API Call
- Reduces network latency
- Eliminates race conditions
- Simplifies frontend code

### ✅ No Duplicates
- Smart filtering ensures prayers appear in only one section
- Logic: My Requests > Prayer Partners > Community Needs

### ✅ Highly Configurable
- Uses MinistryPlatform's native configuration system
- No custom admin UI needed
- Easy for non-developers to customize

### ✅ Multi-Tenant Ready
- Domain-aware configuration
- Campus/congregation filtering
- Perfect for multi-site churches

### ✅ Portable
- Can be deployed to any MinistryPlatform instance
- Configuration is self-documenting in dp_Configuration_Settings
- No hard-coded values

## Use Cases

### Single Church
```sql
-- Default settings work great - no changes needed!
```

### Multi-Site Church (Campus-Specific Widgets)
```sql
-- North Campus Widget (Congregation_ID = 1)
UPDATE dp_Configuration_Settings
SET Value = '1'
WHERE Application_Code = 'PRAYER_WIDGET' AND Key_Name = 'FILTER_BY_CAMPUS';

UPDATE dp_Configuration_Settings
SET Value = '1'
WHERE Application_Code = 'PRAYER_WIDGET' AND Key_Name = 'CAMPUS_IDS';

UPDATE dp_Configuration_Settings
SET Value = 'North Campus Prayer Wall'
WHERE Application_Code = 'PRAYER_WIDGET' AND Key_Name = 'WIDGET_TITLE';
```

### Praise-Only Widget
```sql
UPDATE dp_Configuration_Settings
SET Value = 'Praise Reports'
WHERE Application_Code = 'PRAYER_WIDGET' AND Key_Name = 'WIDGET_TITLE';

UPDATE dp_Configuration_Settings
SET Value = '2'  -- Only Praise Reports (Feedback_Type_ID = 2)
WHERE Application_Code = 'PRAYER_WIDGET' AND Key_Name = 'ENABLED_TYPES';
```

### High-Privacy Church
```sql
-- Anonymous names, no approval required
UPDATE dp_Configuration_Settings
SET Value = '0'
WHERE Application_Code = 'PRAYER_WIDGET' AND Key_Name = 'SHOW_CONTACT_NAMES';

UPDATE dp_Configuration_Settings
SET Value = '0'
WHERE Application_Code = 'PRAYER_WIDGET' AND Key_Name = 'REQUIRE_APPROVAL';
```

## Future Enhancements

Potential additions to the stored procedure:
- **Category icons/colors** - Store in Feedback_Types table
- **Prayer goals/targets** - Track progress toward prayer count goals
- **Staff-only section** - Sensitive prayers visible only to staff
- **Email digest** - Generate prayer digest emails from this data
- **Analytics** - Prayer trends, most-prayed-for categories, etc.

## Support

For questions or issues:
1. Check the SQL comments in the stored procedure
2. Review the configuration settings table
3. Test with different @ContactID values
4. Verify MinistryPlatform API access is enabled
