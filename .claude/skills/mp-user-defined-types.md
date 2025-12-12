# MinistryPlatform User-Defined Types (UDTs)

MinistryPlatform uses custom SQL Server User-Defined Types (UDTs) to provide enhanced functionality in the MinistryPlatform UI. These UDTs automatically trigger specialized input controls when creating or editing records.

## Common User-Defined Types

### `dp_Color`

**Base Type**: `nvarchar(32)`
**UI Control**: Color Picker with visual preview
**Format**: Hex color codes (e.g., `#3B82F6`, `#61BC47`)

**Usage**:
```sql
CREATE TABLE Example_Table (
    Color_Field dp_Color NULL
);
```

**MinistryPlatform UI**:
- Renders a color picker control with live preview
- Shows color swatch next to hex value
- Validates hex color format

**Examples in MP**:
- `Chart_Colors.Chart_Color`
- `Event_Types.Color`
- `Links_Hub.Brand_Color`, `Accent_Color`, `Background_Color`
- `Projects.RSVP_Primary_Color`, `RSVP_Secondary_Color`, `RSVP_Accent_Color`

---

### Other Standard UDTs

*(To be documented as discovered)*

**Common Patterns**:
- UDTs typically start with `dp_` prefix
- Most wrap standard SQL types (`nvarchar`, `int`, `bit`)
- They trigger specialized UI controls in MinistryPlatform

---

## How to Find UDTs

### Query All User-Defined Types:
```sql
SELECT
    t.name AS UDT_Name,
    st.name AS Base_Type,
    t.max_length AS Max_Length,
    t.precision,
    t.scale
FROM sys.types t
INNER JOIN sys.types st ON t.system_type_id = st.system_type_id
WHERE t.is_user_defined = 1
  AND t.name LIKE 'dp_%'
ORDER BY t.name;
```

### Find Tables Using a Specific UDT:
```sql
-- Example: Find all columns using dp_Color
SELECT
    OBJECT_NAME(c.object_id) AS Table_Name,
    c.name AS Column_Name,
    t.name AS Data_Type
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE t.name = 'dp_Color'
ORDER BY Table_Name, Column_Name;
```

---

## Best Practices

1. **Use UDTs for UI Enhancement**: When creating custom tables that need special input controls, use existing MP UDTs rather than base types.

2. **Naming Convention**: Follow MinistryPlatform's naming patterns:
   - Color fields: `[Something]_Color`, `Color`, `[Something]_Background_Color`
   - The UDT itself handles the UI rendering

3. **Null Handling**: Most UDTs allow NULL values. Explicitly set to NULL if no default.

4. **Don't Create Custom UDTs**: Stick to MinistryPlatform's built-in UDTs to ensure UI controls render correctly.

---

## Example: Creating a Table with dp_Color

```sql
CREATE TABLE Amenities (
    Amenity_ID INT IDENTITY(1,1) PRIMARY KEY,
    Amenity_Name NVARCHAR(100) NOT NULL,
    Icon_Name NVARCHAR(50) NOT NULL,
    Icon_Color dp_Color NULL,  -- ← Color picker in MP UI
    Display_Order INT NOT NULL DEFAULT 0,
    Domain_ID INT NOT NULL DEFAULT 1
);
```

When you edit this table in MinistryPlatform:
- `Icon_Color` will show a color picker
- Clicking the field opens a color selection dialog
- Selected color shows as a visual swatch

---

## Notes

- UDTs are **database-level objects**, not just MP conventions
- They provide **type safety** and **UI consistency**
- The MP UI reads the column's UDT and renders the appropriate control
- No additional configuration needed in `dp_Page_Fields`

---

## See Also

- MinistryPlatform Developer Documentation
- `INFORMATION_SCHEMA.COLUMNS` for column metadata
- `sys.types` for SQL Server type information
