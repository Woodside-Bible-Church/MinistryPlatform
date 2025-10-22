# Prayer Widget - Claude Instructions

## Project Overview

This is a Next.js-based prayer request widget that integrates with MinistryPlatform's Feedback table. It can be embedded on WordPress sites without iframes and provides a modern, mobile-friendly interface for submitting and viewing prayer requests.

## Architecture

### Authentication
- Uses **MinistryPlatform's native Login Widget** (`<mpp-user-login>`) for authentication
- The login widget stores the auth token in `localStorage` as `mpp-widgets_AuthToken`
- Token is validated against MP's `/widgets/Api/Auth/User` endpoint
- No NextAuth session management - purely client-side token validation

### Data Flow
1. User authenticates via MP Login Widget (stored in WordPress page)
2. Token is stored in localStorage automatically
3. React app reads token from localStorage (`mpWidgetAuthClient.ts`)
4. API routes validate token with MP (`mpWidgetAuth.ts`)
5. Prayer data is fetched/created via MP REST API (`prayerService.ts`)

### Key Files

**Authentication:**
- `/src/lib/mpWidgetAuthClient.ts` - Client-side token management (reads from localStorage)
- `/src/lib/mpWidgetAuth.ts` - Server-side token validation (validates with MP)

**Data Layer:**
- `/src/providers/MinistryPlatform/entities/Feedback.ts` - Feedback entity operations
- `/src/providers/MinistryPlatform/entities/FeedbackSchema.ts` - Zod schemas for validation
- `/src/services/prayerService.ts` - High-level prayer service layer

**API Routes:**
- `/src/app/api/prayers/route.ts` - GET (list) and POST (create) prayers
- `/src/app/api/prayers/[id]/route.ts` - GET, PATCH, DELETE individual prayers
- `/src/app/api/prayers/[id]/approve/route.ts` - POST to approve (staff only)
- `/src/app/api/categories/route.ts` - GET prayer categories (Feedback Types)

**UI Components:**
- `/src/components/prayer/MPWidgetAuthWrapper.tsx` - Checks for localStorage token
- `/src/components/prayer/PrayerForm.tsx` - Submit new prayer requests
- `/src/components/prayer/PrayerCard.tsx` - Individual prayer with swipe functionality
- `/src/components/prayer/PrayerList.tsx` - List or stack of prayers with filtering

**Main Page:**
- `/src/app/(app)/page.tsx` - Main prayer wall interface

## MinistryPlatform Integration

### Database Tables
- **Feedback** - Stores prayer requests
  - `Feedback_ID` (Primary Key)
  - `Contact_ID` (Foreign Key to Contacts)
  - `Feedback_Type_ID` (Foreign Key to Feedback_Types/Categories)
  - `Description` (Prayer text)
  - `Entry_Title` (Prayer title)
  - `Date_Submitted`
  - `Approved` (Boolean - requires staff approval before public display)
  - `Ongoing_Need` (Boolean)

- **Feedback_Types** - Prayer categories
  - `Feedback_Type_ID` (Primary Key)
  - `Feedback_Type` (Category name, e.g., "Prayer Request", "Praise Report")

### API Patterns

**Table Lookup Convention:**
To fetch related data, MP uses the pattern `TableName_ID_Table.FieldName`:
```typescript
// Example: Get prayer with contact name and category
$select: 'Feedback_ID,Contact_ID_Table.Display_Name,Feedback_Type_ID_Table.Feedback_Type,Description'
```

**Filtering:**
```typescript
$filter: 'Approved = 1 AND Feedback_Type_ID = 2'
$orderby: 'Date_Submitted DESC'
$top: 10
```

## Features Implemented

1. **Prayer Submission Form**
   - Title, description, category selection
   - Ongoing need toggle
   - Zod validation with React Hook Form
   - Auto-submits with logged-in user's Contact ID

2. **Prayer Wall**
   - Two view modes: Stack (swipe) and List
   - Swipe right to mark as "prayed for"
   - Swipe left to dismiss/skip
   - Filter by category and search
   - Only shows approved prayers

3. **Approval Workflow**
   - New prayers start with `Approved = false`
   - Staff can approve via API: `POST /api/prayers/[id]/approve`
   - Only staff members (checked via `isStaff()` function) can approve

4. **Responsive Design**
   - Mobile-first with Tailwind CSS v4
   - Smooth animations with Framer Motion
   - Touch-friendly swipe gestures

## Development Commands

```bash
# Run development server (port 3002)
npm run dev

# Build for production
npm build

# Run production server
npm start

# Lint code
npm run lint
```

## Environment Variables

See `.env` file for configuration. Key variables:
- `MINISTRY_PLATFORM_CLIENT_ID` - OAuth client ID (TM.Widgets)
- `MINISTRY_PLATFORM_CLIENT_SECRET` - OAuth client secret
- `MINISTRY_PLATFORM_BASE_URL` - MP API base URL
- `NEXT_PUBLIC_MP_WIDGETS_AUTH_ENDPOINT` - MP widget auth validation endpoint
- `NEXTAUTH_URL` - App URL (http://localhost:3002 for dev)
- `NEXT_PUBLIC_APP_NAME` - Prayer

## Embedding on WordPress

1. Add MP widgets script to page/template:
```html
<script id="MPWidgets" src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"></script>
```

2. Add MP login widget:
```html
<mpp-user-login></mpp-user-login>
```

3. Embed Next.js app (configure CORS on Vercel for your domain)

## Important Notes

- This widget does NOT use NextAuth for session management
- Authentication is entirely handled by MP's login widget
- Token is read from localStorage on the client side
- The middleware from the Template should be disabled or modified since we're not using NextAuth sessions
- All API routes expect an `Authorization: Bearer <token>` header

## Testing

To test locally:
1. Ensure MP is accessible and credentials are correct in `.env`
2. Run `npm run dev`
3. Open browser and set localStorage:
   ```javascript
   localStorage.setItem('mpp-widgets_AuthToken', 'YOUR_VALID_MP_TOKEN');
   ```
4. Refresh the page - you should see prayers if your token is valid

## Known Limitations

- Currently no way to track WHO prayed for a prayer (could add custom table)
- Swipe dismissal is only client-side (doesn't persist)
- No real-time updates (would require webhooks or polling)
- Approval must be done via API or custom admin interface

## Future Enhancements

- Admin dashboard for approving prayers
- Prayer count tracking (custom field or table)
- Email notifications for new prayer submissions
- Prayer answered/closed workflow
- Anonymous prayer submission option
- Prayer categories with icons/colors
