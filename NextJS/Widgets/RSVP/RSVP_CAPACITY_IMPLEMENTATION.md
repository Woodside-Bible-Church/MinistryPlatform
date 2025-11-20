# RSVP Capacity Implementation

## Overview

The RSVP system now supports per-event capacity limits using the `RSVP_Capacity` field in the Events table. This allows each service time/event to have its own capacity limit instead of using a hardcoded value.

## Database Changes

### New Field: Events.RSVP_Capacity

- **Type:** INT (nullable)
- **Purpose:** Sets the maximum RSVP capacity for each event
- **Default:** NULL (unlimited capacity)
- **Constraint:** Must be positive if set (> 0)

### Migration Script

Location: `/Database/Migrations/2025-11-19-add-rsvp-capacity-to-events.sql`

To apply the migration:
```sql
-- Run the migration script in MinistryPlatform SQL Server
USE [MinistryPlatform]
GO

-- Execute the migration script
-- This adds RSVP_Capacity column and check constraint
```

## How It Works

### Capacity Logic

1. **NULL Capacity = Unlimited**
   - When `RSVP_Capacity` is NULL, the event has unlimited capacity
   - Capacity percentage shows as 0%
   - Status displays as "Plenty of space"
   - Event is always available for RSVP

2. **Set Capacity = Limited**
   - When `RSVP_Capacity` has a value (e.g., 350), that's the max capacity
   - Capacity percentage = (Adjusted_RSVP_Count / RSVP_Capacity) × 100
   - Event becomes unavailable when percentage reaches 100%

3. **Capacity Modifier** (still supported)
   - `RSVP_Capacity_Modifier` field adjusts the displayed count
   - Example: If you have 50 walk-ins expected, set modifier to 50
   - This reduces available spots without creating actual RSVP records

### Stored Procedure Updates

The stored procedure `api_Custom_RSVP_Project_Data_JSON` now:
- Returns `RSVP_Capacity` as `Capacity` and `Max_Capacity`
- Calculates percentage based on actual capacity (or 0% if NULL)
- Sets `Is_Available = 1` for NULL capacity (always available)

Key changes in `/database/sp-get-project-rsvp-data-with-slug.sql`:
```sql
-- Get capacity from RSVP_Capacity field (NULL = unlimited)
e.RSVP_Capacity AS Capacity,

-- Calculate percentage (NULL capacity = 0%)
CASE
    WHEN e.RSVP_Capacity IS NULL THEN 0  -- Unlimited = 0%
    WHEN e.RSVP_Capacity = 0 THEN 0
    ELSE CAST((Adjusted_RSVP_Count * 100.0) / e.RSVP_Capacity AS INT)
END AS Capacity_Percentage,

-- Always available if capacity is NULL
CASE
    WHEN e.RSVP_Capacity IS NULL THEN CAST(1 AS BIT)  -- NULL = unlimited = always available
    WHEN Adjusted_RSVP_Count >= e.RSVP_Capacity THEN CAST(0 AS BIT)
    ELSE CAST(1 AS BIT)
END AS Is_Available
```

## Frontend Changes

### TypeScript Types

Updated `RSVPEvent` interface in `/src/types/rsvp.ts`:
```typescript
export interface RSVPEvent {
  // ... other fields
  Capacity: number | null; // NULL = unlimited capacity
  Max_Capacity: number | null; // NULL = unlimited capacity
  Capacity_Percentage: number; // 0% for unlimited
  Is_Available: boolean; // Always true for unlimited
}
```

### UI Behavior

The ServiceTimeCard component automatically handles unlimited capacity:
- Shows 0% when capacity is unlimited
- Displays "Plenty of space" status
- Green progress bar
- Always allows RSVP selection

## Setting Event Capacity in MinistryPlatform

### Option 1: Direct Database Update (SQL)

```sql
-- Set specific capacity for an event
UPDATE Events
SET RSVP_Capacity = 350
WHERE Event_ID = 12345;

-- Set unlimited capacity (NULL)
UPDATE Events
SET RSVP_Capacity = NULL
WHERE Event_ID = 12345;
```

### Option 2: MinistryPlatform UI

1. Go to **Events** table
2. Find your event
3. Edit the event record
4. Set the **RSVP_Capacity** field:
   - Enter a number (e.g., 350) for limited capacity
   - Leave blank (NULL) for unlimited capacity
5. Save the record

### Option 3: Bulk Update for Multiple Events

```sql
-- Set capacity for all Christmas Eve services
UPDATE Events
SET RSVP_Capacity = 400
WHERE Event_Title LIKE '%Christmas Eve%'
  AND Event_Start_Date BETWEEN '2024-12-24' AND '2024-12-25';

-- Set capacity for all services at a specific campus
UPDATE Events
SET RSVP_Capacity = 350
WHERE Congregation_ID = 5  -- Lake Orion campus
  AND Project_ID = 10
  AND Include_In_RSVP = 1;
```

## Capacity Modifier (Advanced)

Use `RSVP_Capacity_Modifier` to account for walk-ins or pre-reserved seats:

### Example Scenario:
- Event capacity: 400 people
- Expected walk-ins: 50 people
- Reserved seats (VIP, volunteers): 25 people

```sql
UPDATE Events
SET RSVP_Capacity = 400,
    RSVP_Capacity_Modifier = 75  -- (50 walk-ins + 25 reserved)
WHERE Event_ID = 12345;
```

Result:
- System shows 75 RSVPs already "taken"
- Only 325 spots available for online RSVP
- Actual database only has real RSVP records
- Adjusted count = Current_RSVPs + 75

## Capacity Display Logic

| Percentage | Status | Color | Description |
|------------|--------|-------|-------------|
| 0% | Plenty of space | Green | Unlimited or empty |
| 1-50% | Plenty of space | Green | Lots of availability |
| 51-75% | Good availability | Yellow | Moderate availability |
| 76-90% | Filling up | Orange | Limited spots left |
| 91-99% | Near capacity | Red | Very few spots |
| 100%+ | Overflow | Red | Full (unavailable) |

## Testing

### Test Case 1: Unlimited Capacity
```sql
-- Set event to unlimited
UPDATE Events SET RSVP_Capacity = NULL WHERE Event_ID = 123;

-- Expected Result:
-- - Capacity shows as 0%
-- - Status: "Plenty of space"
-- - Always available for RSVP
```

### Test Case 2: Limited Capacity - Available
```sql
-- Set capacity to 300
UPDATE Events SET RSVP_Capacity = 300 WHERE Event_ID = 123;

-- If Current_RSVPs = 150 (50%)
-- Expected Result:
-- - Capacity shows as 50%
-- - Status: "Plenty of space"
-- - Green progress bar
-- - Available for RSVP
```

### Test Case 3: Limited Capacity - Near Full
```sql
-- Set capacity to 300
UPDATE Events SET RSVP_Capacity = 300 WHERE Event_ID = 123;

-- If Current_RSVPs = 285 (95%)
-- Expected Result:
-- - Capacity shows as 95%
-- - Status: "Near capacity"
-- - Red progress bar
-- - Still available for RSVP
```

### Test Case 4: Limited Capacity - Full
```sql
-- Set capacity to 300
UPDATE Events SET RSVP_Capacity = 300 WHERE Event_ID = 123;

-- If Current_RSVPs = 300 (100%)
-- Expected Result:
-- - Capacity shows as 100%
-- - Status: "Overflow"
-- - Red progress bar
-- - NOT available for RSVP (Is_Available = false)
```

### Test Case 5: With Capacity Modifier
```sql
-- Set capacity and modifier
UPDATE Events
SET RSVP_Capacity = 400,
    RSVP_Capacity_Modifier = 50
WHERE Event_ID = 123;

-- If Current_RSVPs = 150
-- Adjusted_RSVP_Count = 150 + 50 = 200
-- Expected Result:
-- - Capacity shows as 50% (200/400)
-- - Status: "Plenty of space"
-- - Available for RSVP
```

## Rollback Plan

If you need to revert to hardcoded capacity (500):

1. Update stored procedure to use `500` instead of `e.RSVP_Capacity`
2. Drop the column (optional - only if needed):
   ```sql
   ALTER TABLE Events DROP CONSTRAINT CK_Events_RSVP_Capacity_Positive;
   ALTER TABLE Events DROP COLUMN RSVP_Capacity;
   ```

## Related Files

- **Database Migration:** `/Database/Migrations/2025-11-19-add-rsvp-capacity-to-events.sql`
- **Stored Procedure:** `/database/sp-get-project-rsvp-data-with-slug.sql`
- **TypeScript Types:** `/src/types/rsvp.ts`
- **UI Component:** `/src/components/rsvp/ServiceTimeCard.tsx`

## Best Practices

1. **Set realistic capacity limits** based on fire code and seating
2. **Use capacity modifier** to account for walk-ins (typically 10-15%)
3. **Test capacity limits** before going live with RSVP
4. **Monitor RSVP counts** as events approach capacity
5. **Communicate clearly** when services are near capacity

## Support

For questions or issues:
- Check stored procedure logs for errors
- Verify `RSVP_Capacity` is positive or NULL (not 0)
- Check `Include_In_RSVP = 1` for events
- Review API response from `/api/rsvp/project` endpoint
