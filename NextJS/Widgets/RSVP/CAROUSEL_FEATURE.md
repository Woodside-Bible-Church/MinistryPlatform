# Event Carousels Feature

## Overview

The RSVP widget now supports displaying multiple themed carousels of related events below the RSVP section. This allows you to promote events that are related to your RSVP project but don't require RSVPs themselves.

**Example Use Case:** For a Christmas RSVP project, you can display carousels like:
- "Other Christmas Events" (Women's Christmas Party, Men's Breakfast, etc.)
- "Family Activities" (Nativity Experience, Cookie Decorating, etc.)
- "Service Opportunities" (Volunteer shifts, community outreach, etc.)

## How It Works

### Database Structure

**New Column: `RSVP_Carousel_Name`**
- **Table:** `Events`
- **Type:** `NVARCHAR(100)` (nullable)
- **Purpose:** Groups events into themed carousels

**Event Configuration:**
1. **RSVP Events** (shown in main RSVP section):
   - `Project_ID` = Your RSVP project
   - `Include_In_RSVP` = `1`
   - `RSVP_Capacity` = Set capacity
   - `RSVP_Carousel_Name` = `NULL`

2. **Carousel Events** (shown below RSVP section):
   - `Project_ID` = Your RSVP project
   - `Include_In_RSVP` = `0` or `NULL`
   - `RSVP_Carousel_Name` = Carousel group name (e.g., "Other Christmas Events")

### Visual Layout

```
┌─────────────────────────────────────────────┐
│   RSVP Widget Header                        │
│   (Title, Description, Campus Selector)     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│   Service Times & RSVP Section              │
│   - 11:00 AM  [80% full]  RSVP →            │
│   - 1:00 PM   [45% full]  RSVP →            │
│   - 4:00 PM   [60% full]  RSVP →            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│   Other Christmas Events (black text)       │
│                                              │
│   ┌────────┐ ┌────────┐ ┌────────┐         │
│   │ Image  │ │ Image  │ │ Image  │         │
│   │  Only  │ │  Only  │ │  Only  │         │
│   └────────┘ └────────┘ └────────┘         │
│                                              │
│   (hover to see details with dark overlay)  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│   Family Activities (black text)            │
│                                              │
│   ┌────────┐ ┌────────┐                     │
│   │ Image  │ │ Image  │                     │
│   │  Only  │ │  Only  │                     │
│   └────────┘ └────────┘                     │
└─────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Run Database Migration

Execute the SQL migration to add the new column:

```bash
# Connect to your MinistryPlatform database and run:
sqlcmd -S your-server -d MinistryPlatform -i database/add-rsvp-carousel-name-column.sql
```

Or manually in SSMS:
```sql
ALTER TABLE [dbo].[Events]
ADD [RSVP_Carousel_Name] NVARCHAR(100) NULL;
```

### 2. Update Stored Procedure

Deploy the updated stored procedure to MinistryPlatform:

```bash
# Run the updated stored procedure script:
sqlcmd -S your-server -d MinistryPlatform -i database/sp-get-project-rsvp-data-with-slug-v2.sql
```

This will update `api_Custom_RSVP_Project_Data_JSON` to include carousel events in the response.

### 3. Configure Events in MinistryPlatform

For each event you want to appear in a carousel:

1. Navigate to **Events** in MinistryPlatform
2. Open the event you want to add to a carousel
3. Set the following fields:
   - **Project_ID:** Select your RSVP project (e.g., "Christmas Services 2025")
   - **Include_In_RSVP:** Set to `No` or leave blank
   - **RSVP_Carousel_Name:** Enter the carousel group name (e.g., "Other Christmas Events")
   - **Default Image:** Upload an event image (16:9 aspect ratio recommended)
4. Save the event

### 4. Deploy Frontend Changes

The frontend changes have been implemented and will automatically pick up carousel events from the API.

```bash
# Build and deploy the Next.js app
npm run build
npm start  # or deploy to Vercel
```

## Configuration Examples

### Example 1: Women's Christmas Party

```sql
UPDATE Events
SET
    Project_ID = 1,  -- Christmas Services 2025 project
    Include_In_RSVP = 0,
    RSVP_Carousel_Name = 'Other Christmas Events'
WHERE Event_ID = 12345;
```

### Example 2: Multiple Carousel Groups

```sql
-- Women's Party in "Other Christmas Events"
UPDATE Events SET
    Project_ID = 1,
    Include_In_RSVP = 0,
    RSVP_Carousel_Name = 'Other Christmas Events'
WHERE Event_ID = 12345;

-- Nativity Walk in "Family Activities"
UPDATE Events SET
    Project_ID = 1,
    Include_In_RSVP = 0,
    RSVP_Carousel_Name = 'Family Activities'
WHERE Event_ID = 12346;

-- Volunteer Shift in "Service Opportunities"
UPDATE Events SET
    Project_ID = 1,
    Include_In_RSVP = 0,
    RSVP_Carousel_Name = 'Service Opportunities'
WHERE Event_ID = 12347;
```

## Features

### Campus Filtering
Carousels automatically respect the campus filter:
- When a user selects a campus, only events for that campus appear
- If no events match the selected campus for a carousel, that carousel is hidden

### Carousel Ordering
- Carousels are displayed in **alphabetical order** by carousel name
- Events within each carousel are ordered by **Event_Start_Date**

### Event Cards
Each event card displays:
- **Event image only** by default (from Events.Default_Image in dp_files)
- **On hover/focus:** Dark overlay with event details
  - Event title
  - Date and time (formatted as "Monday, December 25 at 5:00 PM")
  - Campus name (if available)
- **Clickable** - opens event details page
  - Uses `Events.External_Registration_URL` if provided
  - Otherwise falls back to `https://woodsidebible.org/events/details/?id={Event_ID}`

### Responsive Design
- **Desktop:** Cards display side-by-side with flexbox wrapping
- **Mobile:** Cards stack vertically and maintain 16:9 aspect ratio
- **Hover effects:** Cards scale up slightly and lift with shadow

## API Response Structure

The updated stored procedure returns carousel data in this format:

```json
{
  "Project": { ... },
  "Events": [ ... ],  // RSVP events (Include_In_RSVP = 1)
  "Questions": [ ... ],
  "Confirmation_Cards": [ ... ],
  "Campus_Meeting_Instructions": [ ... ],
  "Carousels": [
    {
      "Carousel_Name": "Other Christmas Events",
      "Events": [
        {
          "Event_ID": 12345,
          "Event_Title": "Christmas Party & Bake-Off | Women | Lake Orion",
          "Event_Start_Date": "2025-12-01T18:30:00",
          "Event_End_Date": "2025-12-01T20:30:00",
          "Congregation_ID": 9,
          "Campus_Name": "Lake Orion",
          "Campus_Slug": "lake-orion",
          "Campus_Location": "Lake Orion Campus",
          "Description": "Invite a friend and join us...",
          "Event_Image_URL": "https://...",
          "Event_URL": "https://woodsidebible.org/events/womens-christmas-party"
        }
      ]
    },
    {
      "Carousel_Name": "Family Activities",
      "Events": [ ... ]
    }
  ]
}
```

## TypeScript Types

New types added to `/src/types/rsvp.ts`:

```typescript
/**
 * Event carousel grouping (for non-RSVP related events)
 */
export interface EventCarousel {
  Carousel_Name: string;
  Events: CarouselEvent[];
}

/**
 * Individual event in a carousel (non-RSVP event)
 */
export interface CarouselEvent {
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string;
  Event_End_Date: string;
  Event_Type_ID: number;
  Congregation_ID: number | null;
  Campus_Name: string | null;
  Campus_Slug: string | null;
  Campus_Location: string | null;
  Description: string | null;
  Event_Image_URL: string | null;
  Event_URL: string | null;
}
```

## Troubleshooting

### Carousels not appearing?

1. **Check database:**
   ```sql
   SELECT Event_ID, Event_Title, Project_ID, Include_In_RSVP, RSVP_Carousel_Name, Congregation_ID
   FROM Events
   WHERE Project_ID = 1  -- Your RSVP project ID
     AND RSVP_Carousel_Name IS NOT NULL;
   ```

2. **Verify stored procedure was updated:**
   ```sql
   SELECT OBJECT_DEFINITION(OBJECT_ID('api_Custom_RSVP_Project_Data_JSON'));
   ```
   Should include the `Carousels` section.

3. **Check API response:**
   Open browser DevTools → Network → Find the API call to `/api/rsvp/project?project=...`
   Look for `"Carousels"` array in the JSON response.

### Events appearing in wrong carousel?

Check the `RSVP_Carousel_Name` field - it's case-sensitive and must match exactly.

```sql
-- See all carousel groups
SELECT DISTINCT RSVP_Carousel_Name
FROM Events
WHERE Project_ID = 1 AND RSVP_Carousel_Name IS NOT NULL
ORDER BY RSVP_Carousel_Name;
```

### Image not displaying?

1. Ensure the event has a default image uploaded in MinistryPlatform:
   - Events → Select event → Files tab → Upload image → Check "Default Image"
2. Image should be 16:9 aspect ratio (e.g., 1920x1080px)
3. Supported formats: JPG, PNG, WebP

## Best Practices

1. **Carousel Naming:**
   - Use clear, descriptive names (e.g., "Other Christmas Events", "Family Activities")
   - Keep names concise (under 50 characters)
   - Use consistent capitalization

2. **Image Guidelines:**
   - **Aspect Ratio:** 16:9 (e.g., 1920x1080px)
   - **File Size:** Keep under 500KB for fast loading
   - **Content:** Show event branding, people, or activities

3. **Event Titles:**
   - Include event type, audience, and location (e.g., "Christmas Party & Bake-Off | Women | Lake Orion")
   - Keep under 60 characters for best display

4. **Campus Assignment:**
   - Always assign events to a specific campus (`Congregation_ID`)
   - Avoid creating "All Campuses" events - create separate events per campus instead

5. **Testing:**
   - Test with multiple campuses selected
   - Verify events appear only for their assigned campus
   - Check responsive layout on mobile devices

## Files Modified

### Database
- ✅ `/database/add-rsvp-carousel-name-column.sql` - New column migration
- ✅ `/database/sp-get-project-rsvp-data-with-slug-v2.sql` - Updated stored procedure

### TypeScript
- ✅ `/src/types/rsvp.ts` - Added `EventCarousel` and `CarouselEvent` types

### Components
- ✅ `/src/components/rsvp/InformationalEventCard.tsx` - Enhanced to support both mock and real data

### Pages
- ✅ `/src/app/(app)/page.tsx` - Added carousel rendering logic

## Future Enhancements

Potential improvements for future iterations:

- [ ] Add carousel sorting options (by date, by name, manual order)
- [ ] Support for event registration links (if not using RSVP)
- [ ] Event descriptions shown on hover or in modal
- [ ] Horizontal scroll carousel for large event lists
- [ ] Analytics tracking for carousel event clicks
- [ ] Admin UI for managing carousel groups

---

**Questions?** Check the CLAUDE.md file or reach out to the development team.
