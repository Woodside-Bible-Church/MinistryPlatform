# Event Amenities System - Deployment Guide

**Created**: 2025-12-12
**Status**: Ready for deployment when approved
**Author**: Colton Wirgau (with Claude Code)

---

## Overview

This feature adds visual amenity badges (childcare, ASL interpretation, etc.) to RSVP service time cards to replace text-heavy meeting instructions. Icons are configurable per-event through a new `Amenities` lookup table.

**Key Benefits**:
- **User-Friendly**: Icons are easier to scan than paragraphs of text
- **Maintainable**: Comms team manages amenities via MinistryPlatform UI
- **Extensible**: Easy to add new amenity types as needed
- **Non-Invasive**: Uses junction table pattern, doesn't modify existing tables

---

## Files Created

### Database Scripts
1. **`/Database/create-amenities-tables.sql`**
   - Creates `Amenities` lookup table
   - Creates `Event_Amenities` junction table
   - Adds indexes for performance
   - Seeds 4 initial amenity types

2. **`/Database/create-amenities-pages.sql`**
   - Creates MinistryPlatform pages for both tables
   - Configures page fields
   - Adds "Amenities" subpage to Events page
   - Grants Administrator role access

3. **`/Database/StoredProcs/RSVP/add-amenities-to-sp-get-rsvp-project-details.sql`**
   - Updates `api_Custom_RSVP_Project_Details_JSON` stored procedure
   - Adds `Amenities` array to Events output
   - **DO NOT RUN YET** - Run after frontend is deployed and tested

### Frontend Components
4. **`/NextJS/Widgets/RSVP/src/types/rsvp.ts`** (updated)
   - Added `EventAmenity` interface
   - Added `Amenities?` field to `RSVPEvent`

5. **`/NextJS/Widgets/RSVP/src/components/rsvp/AmenityBadge.tsx`** (new)
   - Displays individual amenity with Lucide icon
   - Tooltip on hover
   - Responsive sizing

6. **`/NextJS/Widgets/RSVP/src/components/rsvp/AmenitiesLegend.tsx`** (new)
   - Sticky legend at top of service times list
   - Shows all unique amenities with descriptions

7. **`/NextJS/Widgets/RSVP/src/components/rsvp/ServiceTimeCard.tsx`** (updated)
   - Displays amenity badges below capacity bar
   - Only shows if event has amenities

### Documentation
8. **`/.claude/skills/mp-user-defined-types.md`** (new)
   - Documents MinistryPlatform's `dp_Color` UDT
   - Explains how UDTs trigger special UI controls

---

## Deployment Steps

### Phase 1: Database Schema (Safe - No Breaking Changes)

**Run these scripts in MinistryPlatform**:

1. **Create Tables**:
   ```sql
   -- Run: /Database/create-amenities-tables.sql
   -- Creates: Amenities, Event_Amenities tables
   -- Seeds: 4 amenity types (Childcare, Special Needs, ASL, High Capacity)
   ```

2. **Create Pages**:
   ```sql
   -- Run: /Database/create-amenities-pages.sql
   -- Creates: Amenities and Event_Amenities pages
   -- Adds: "Amenities" tab to Events page
   -- Grants: Administrator access to both pages
   ```

3. **Verify in MinistryPlatform**:
   - Go to **Setup > Pages > Amenities**
   - You should see 4 seed amenities with color pickers
   - Go to **Events** > select any event > **Amenities** tab
   - You can now assign amenities to events (but won't display yet)

---

### Phase 2: Populate Amenities (Optional Manual Step)

**Manually assign amenities to Christmas 2025 events**:

1. Navigate to **Events** in MinistryPlatform
2. Filter to Christmas 2025 events
3. For each event, click the **Amenities** tab
4. Add amenities based on Meeting_Instructions text:
   - Services with childcare → Add "Childcare (0-4)"
   - Services with special needs → Add "Special Needs Care"
   - Services with ASL → Add "ASL Interpretation"
   - 4pm services (historically full) → Add "High Capacity"

**Or use SQL** (faster for bulk):
```sql
-- Example: Add childcare to all 1pm, 4pm, 7pm services
INSERT INTO Event_Amenities (Event_ID, Amenity_ID, Domain_ID)
SELECT e.Event_ID, 1, 1  -- 1 = Childcare (0-4)
FROM Events e
WHERE e.Project_ID = 5  -- Christmas 2025
  AND DATEPART(HOUR, e.Event_Start_Date) IN (13, 16, 19)  -- 1pm, 4pm, 7pm
  AND NOT EXISTS (
    SELECT 1 FROM Event_Amenities ea
    WHERE ea.Event_ID = e.Event_ID AND ea.Amenity_ID = 1
  );
```

---

### Phase 3: Frontend Deployment

**Deploy Next.js changes**:

```bash
cd /Users/coltonwirgau/MinistryPlatform/NextJS/Widgets/RSVP

# Build for production
npm run build

# Deploy to Vercel or your hosting
git add .
git commit -m "Add event amenities badges to service time cards"
git push
```

**What this includes**:
- TypeScript types for amenities
- `AmenityBadge` component (icon badges with tooltips)
- `AmenitiesLegend` component (sticky legend at top)
- Updated `ServiceTimeCard` to show badges

**Frontend is safe to deploy NOW** because:
- `Amenities?` field is optional in TypeScript
- Components check `if (Amenities && Amenities.length > 0)` before rendering
- Will gracefully handle missing data from API

---

### Phase 4: Update Stored Procedure (Final Step)

**⚠️ ONLY RUN AFTER FRONTEND IS DEPLOYED AND TESTED ⚠️**

```sql
-- Run: /Database/StoredProcs/RSVP/add-amenities-to-sp-get-rsvp-project-details.sql
-- Updates: api_Custom_RSVP_Project_Details_JSON
-- Adds: Amenities array to Events output
```

**Why wait?**:
- The stored procedure update changes the API response
- Old frontend versions expect the old response format
- Deploy frontend first, then update API

**After running**:
- API will include `Amenities` array in Events
- Frontend will display amenity badges on service cards
- Legend will appear at top of service times list

---

## Testing Checklist

### Before Stored Procedure Update
- [ ] Amenities table created successfully
- [ ] Event_Amenities table created successfully
- [ ] Can see Amenities page in MinistryPlatform
- [ ] Can see Amenities tab on Events page
- [ ] Can add/edit amenities via MP UI
- [ ] Color picker works on Icon_Color field
- [ ] Can assign amenities to events
- [ ] Frontend deployed without errors
- [ ] No console errors on RSVP widget page

### After Stored Procedure Update
- [ ] API returns `Amenities` array in Events
- [ ] Service time cards show amenity badges
- [ ] Legend appears at top of services list
- [ ] Tooltips show on hover (desktop)
- [ ] Icons match Lucide library
- [ ] Colors display correctly
- [ ] No duplicate badges on same service
- [ ] Legend only shows unique amenities

---

## Rollback Plan

**If issues occur after stored procedure update**:

1. **Restore old stored procedure**:
   ```sql
   -- Re-run the original version from git history:
   -- /Database/StoredProcs/RSVP/sp-get-rsvp-project-details.sql
   ```

2. **Frontend is backwards compatible**:
   - Will simply not show amenity badges
   - No errors or broken functionality

**To remove tables** (nuclear option):
```sql
DROP TABLE Event_Amenities;
DROP TABLE Amenities;
-- Also delete pages from dp_Pages if desired
```

---

## Future Enhancements

**Nice-to-haves (not in this release)**:
- [ ] Filter services by amenity (e.g., "Show only services with childcare")
- [ ] Admin UI to manage amenities without SQL
- [ ] Analytics: Which amenities drive most RSVPs?
- [ ] Amenity tooltips with detailed info (age ranges, locations, etc.)
- [ ] Apply amenities to other widget types (Groups, Events, etc.)

---

## Communication for Comms Team

**What changes for communications team**:

**Before**:
- Had to type amenity details in `Meeting_Instructions` field
- Text was hard to scan, broke formatting

**After**:
- Add amenities via checkboxes in Events > Amenities tab
- Icons display automatically on service cards
- Can update amenities without touching descriptions

**Training needed**:
1. How to navigate to Amenities page
2. How to add new amenity types (if needed)
3. How to assign amenities to events
4. How to choose appropriate Lucide icon names

---

## Support

**Contact**: Colton Wirgau
**Documentation**: This file + `/MinistryPlatform/.claude/skills/mp-user-defined-types.md`
**Icon Library**: [Lucide Icons](https://lucide.dev/icons/)

---

## Summary

✅ **Database tables created** - Non-breaking, safe to deploy
✅ **MP pages configured** - Comms team can start adding amenities
✅ **Frontend components ready** - Safe to deploy before stored proc
⏸️ **Stored procedure update** - Deploy LAST after testing

**Deployment Order**:
1. Database tables & pages → **Deploy now**
2. Populate amenities manually → **Optional**
3. Deploy frontend → **Deploy now**
4. Update stored procedure → **Deploy after frontend is live**
