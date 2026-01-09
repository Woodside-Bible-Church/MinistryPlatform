# Announcements Management App

## Overview

A full-featured Next.js app for managing church announcements with MinistryPlatform integration. This app allows staff to create, edit, and manage announcements that are displayed via the Announcements Widget on the WordPress site.

## Features

### ✅ Announcement Management
- **List View**: Displays all announcements with status indicators, filters, and search
- **Create/Edit**: Full form for creating and editing announcements
- **Delete**: Ability to remove announcements
- **Status Filtering**: Filter by Active, Scheduled, Inactive, or Expired
- **Search**: Full-text search across title, body, campus, and related entities

### ✅ Mutually Exclusive Relationships
- Announcements can be related to **either** an Event **or** a Serve Opportunity (not both)
- Enforced at both UI and API levels
- Radio button selection for relationship type: None, Event, or Opportunity
- Searchable dropdowns for selecting events or opportunities

### ✅ Required Fields (per your screenshot)
- ✓ Title
- ✓ Campus (Congregation)
- ✓ Start Date
- ✓ End Date
- ✓ Sort Order (defaults to 10)
- ✓ Active status

### ✅ Preview Functionality
- Live preview modal showing how announcement will appear
- Preview includes all computed fields (heading, link, etc.)
- Shows active/inactive status and priority indicators

### ✅ Status Management
- **Active/Inactive**: Toggle to publish or unpublish
- **Top Priority**: Pin announcement to top with star indicator
- **Scheduled**: Automatically shown when start date is in the future
- **Expired**: Automatically marked when end date has passed

## File Structure

```
NextJS/Apps/
├── database/
│   └── stored-procedures/
│       └── api_custom_Announcements_Management_JSON.sql  # Fetch announcements with rich data
│
├── src/
│   ├── types/
│   │   └── announcements.ts                              # TypeScript types
│   │
│   ├── services/
│   │   └── announcementsService.ts                       # Service layer for MP API calls
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── announcements/
│   │   │       ├── route.ts                              # GET (list), POST (create)
│   │   │       ├── [id]/route.ts                         # GET, PUT, DELETE (single)
│   │   │       ├── congregations/route.ts                # Get campus dropdown data
│   │   │       ├── events/route.ts                       # Search events
│   │   │       └── opportunities/route.ts                # Search opportunities
│   │   │
│   │   └── (app)/
│   │       └── announcements/
│   │           ├── page.tsx                              # List page
│   │           └── [id]/page.tsx                         # Create/Edit page with preview
│   │
│   └── ...
```

## Installation Steps

### 1. Deploy the Stored Procedure

Run the stored procedure in MinistryPlatform:
```sql
-- File: NextJS/Apps/database/stored-procedures/api_custom_Announcements_Management_JSON.sql
```

Register it in MinistryPlatform's `API_Procedures` table if not already done.

### 2. Install Dependencies

All dependencies should already be installed, but if needed:
```bash
cd NextJS/Apps
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000/announcements`

## Usage

### Creating an Announcement

1. Navigate to `/announcements`
2. Click "New Announcement"
3. Fill in required fields:
   - **Title**: e.g., "Baptism anytime"
   - **Campus**: Select from dropdown
   - **Start Date**: When announcement goes live
   - **End Date**: When announcement expires (required!)
4. Optionally:
   - Add body text for description
   - Link to an Event OR Serve Opportunity (mutually exclusive)
   - Add custom Call to Action URL and Label
   - Set Top Priority to pin to top
   - Adjust Sort Order (lower = first)
5. Click "Preview" to see how it will look
6. Toggle "Active" to publish
7. Click "Save"

### Editing an Announcement

1. Click the pencil icon on any announcement in the list
2. Modify fields as needed
3. Click "Preview" to review changes
4. Click "Save"

### Deleting an Announcement

1. Click the trash icon on any announcement
2. Confirm deletion

## Key Features Explained

### Mutually Exclusive Event/Opportunity Selection

The form enforces that you can only select ONE of:
- **None**: Standalone announcement
- **Event**: Links to a specific event (pulls event image)
- **Opportunity**: Links to a serve opportunity (pulls serve image)

This is validated at:
- **UI level**: Radio buttons clear the opposite field
- **API level**: Returns 400 error if both are selected

### Automatic Status Detection

The stored procedure and UI automatically determine status:
- **Active**: `Active = true` AND current time is between Start/End dates
- **Scheduled**: `Active = true` AND Start Date is in the future
- **Inactive**: `Active = false`
- **Expired**: End Date is in the past

### Image Resolution

Images are automatically resolved in this priority:
1. Announcement's own image (if we add that field later)
2. Related Event's featured image
3. Related Serve Opportunity's image

### Call to Action Behavior

- If CTA URL/Label are provided, they override the automatic link
- Otherwise, link defaults to:
  - Event page (if event is selected)
  - Opportunity page (if opportunity is selected)
  - Custom URL (if provided)

## API Endpoints

### `GET /api/announcements`
Fetch all announcements with optional filters:
- `?active=true` - Only active announcements
- `?congregationID=5` - Filter by campus
- `?search=baptism` - Search announcements

### `POST /api/announcements`
Create new announcement. Requires:
```json
{
  "title": "string",
  "startDate": "ISO 8601 datetime",
  "endDate": "ISO 8601 datetime",
  "congregationID": number,
  "active": boolean,
  "topPriority": boolean,
  "sort": number,
  ...
}
```

### `GET /api/announcements/{id}`
Get single announcement by ID

### `PUT /api/announcements/{id}`
Update announcement

### `DELETE /api/announcements/{id}`
Delete announcement

### `GET /api/announcements/congregations`
Get list of campuses for dropdown

### `GET /api/announcements/events?q=search`
Search events by title (for dropdown)

### `GET /api/announcements/opportunities?q=search`
Search opportunities by title (for dropdown)

## Data Validation

Both client and server validate:
- ✓ Required fields present
- ✓ End date after start date
- ✓ Cannot select both Event and Opportunity
- ✓ Valid congregation ID
- ✓ Valid dates

## Future Enhancements

Potential additions:
- [ ] Add `Announcement_Image` field to Announcements table for custom images
- [ ] Bulk actions (activate/deactivate multiple)
- [ ] Duplicate announcement feature
- [ ] Schedule publish/unpublish with automation
- [ ] Email notification when announcements expire
- [ ] Analytics tracking (views, clicks)
- [ ] Rich text editor for body content
- [ ] Image upload directly in the form
- [ ] Announcement templates

## Troubleshooting

### Announcements not loading
- Check that stored procedure `api_custom_Announcements_Management_JSON` is deployed
- Verify it's registered in `API_Procedures` table
- Check browser console for API errors

### Events/Opportunities not searchable
- Ensure you're typing at least 2 characters
- Check that `Events` and `Opportunities` tables have data
- Verify user has read permissions on those tables

### "Cannot select both Event and Opportunity" error
- This is expected! Only one can be selected at a time
- Use the radio buttons to switch between None/Event/Opportunity

### Dates showing incorrectly
- Dates are stored in ISO 8601 format
- UI uses `datetime-local` input which handles timezone conversion
- Preview shows dates in user's local timezone

## Architecture Notes

- **Service Layer**: `AnnouncementsService` handles all MP API calls
- **Type Safety**: Full TypeScript types for all data structures
- **Stored Procedure**: Rich queries with joins to Events, Opportunities, Congregations, Files
- **Table Service**: CRUD operations use standard MP table API
- **Separation of Concerns**:
  - Widget App: Generates embed codes
  - Announcements App: Manages announcement data
  - Widget (frontend): Displays announcements on website

## Support

For issues or questions:
- Check `CLAUDE.md` for repository guidelines
- Review MinistryPlatform API docs
- Examine browser console for client errors
- Check server logs for API errors

---

**Created**: 2026-01-08
**Author**: Claude Code
**MinistryPlatform Integration**: ✓
**NextAuth Authentication**: ✓
**Production Ready**: ✓
