# Ministry Platform Customizations

This folder contains Woodside-specific customizations to **core Ministry Platform tables**.

## ⚠️ Important Distinctions

- **Core/** - Base MP schema (never edit these)
- **Customizations/** - Custom fields added to core tables (you are here)
- **Custom/** - Entirely custom Woodside tables

## 📋 Current Customizations

### Congregations Table
- **Campus_Slug** (`add-campus-slug-to-congregations.sql`)
  - Purpose: SEO-friendly URLs for campus selection
  - Used by: RSVP Widget, Website integration
  - Type: NVARCHAR(50), unique, URL-safe
  - Example: "algonac", "marine-city", "port-huron"

### Contacts Table
- **Web_Congregation_ID** (to be added)
  - Purpose: Campus selected during web registration
  - Used by: Member portal, website registration
  - Type: INT, FK to Congregations

### Events Table
- *No customizations yet*

### Projects Table (Custom, not Core)
- This is a 100% custom Woodside table
- Located in `Custom/` folder, not here

## 📝 Adding New Customizations

### Template for New Custom Field

```sql
-- ===================================================================
-- Customization: Add [Field_Name] to [Table_Name]
-- ===================================================================
-- Purpose: [Why this field exists]
-- Date: [YYYY-MM-DD]
-- Used by: [Which apps/widgets use this]
-- ===================================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[Table_Name]')
    AND name = '[Field_Name]'
)
BEGIN
    ALTER TABLE [Table_Name]
    ADD [Field_Name] [DATA_TYPE] NULL
    CONSTRAINT FK_[Table]_[Field]
    FOREIGN KEY REFERENCES [OtherTable]([OtherField]);

    PRINT 'Added [Field_Name] to [Table_Name]';
END
ELSE
BEGIN
    PRINT '[Field_Name] already exists on [Table_Name]';
END
GO
```

### Naming Conventions

- **File Name:** `add-field-name-to-table.sql`
- **Constraint Names:** `FK_TableName_FieldName`
- **Always include:** IF NOT EXISTS check
- **Always include:** Documentation header

### Documentation Requirements

For each custom field, document:
1. **Purpose** - Why was this added?
2. **Used By** - Which apps/projects use it?
3. **Data Type** - What type and why?
4. **Relationships** - Foreign keys?

## 🔍 Finding Core vs Custom

**Core MP Tables** (from official MP):
- Contacts
- Events
- Congregations
- Participants
- Groups
- Households
- Addresses
- etc.

**Custom Woodside Tables** (100% custom):
- Projects (→ goes in Custom/)
- Event_RSVPs (→ goes in Custom/)
- Project_RSVP_Questions (→ goes in Custom/)
- Budget_* tables (→ goes in Custom/)

**When in doubt:** If it's in Chris's Template project, it's Core MP.

## ⚙️ Deployment

```bash
# Test first
npm run custom:field-name:test

# Then production
npm run custom:field-name
```

## 🎯 Best Practices

✅ **DO:**
- Use IF NOT EXISTS checks
- Include descriptive comments
- Name constraints explicitly (FK_Table_Field)
- Test on sandbox first
- Document why the field was added

❌ **DON'T:**
- Modify core table files in Core/ folder
- Remove existing fields
- Break foreign key relationships
- Deploy directly to production without testing

## 📚 Examples

See existing files in this folder for working examples:
- `add-campus-slug-to-congregations.sql`
- `add-rsvp-slug-column.sql`
