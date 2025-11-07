# Prayer Widget - Setup Guide

## What We Built

A modern, swipeable prayer request widget built with Next.js that integrates with MinistryPlatform's Feedback table. Features include:

- **Swipe Interface**: Tinder-style swipe right to pray, left to dismiss
- **Two View Modes**: Stack (swipe) mode and traditional list view
- **Approval Workflow**: Staff approval required before prayers are public
- **Category Filtering**: Filter by prayer type (from Feedback_Types)
- **Search**: Full-text search across prayer titles and descriptions
- **MP Widget Auth**: Uses MinistryPlatform's native login widget for authentication
- **Mobile-First**: Responsive design with smooth animations

## Quick Start

### 1. Install Dependencies

```bash
cd /Users/coltonwirgau/MinistryPlatform/NextJS/Widgets/Prayer
npm install
```

### 2. Environment Variables

The `.env` file is already configured for Woodside Bible Church. Key variables:

```env
MINISTRY_PLATFORM_CLIENT_ID=TM.Widgets
MINISTRY_PLATFORM_CLIENT_SECRET=MPQumeng3T5ahzQQ
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org/ministryplatformapi
NEXTAUTH_URL=http://localhost:3002
NEXT_PUBLIC_APP_NAME=Prayer
NEXT_PUBLIC_MP_WIDGETS_AUTH_ENDPOINT=https://my.woodsidebible.org/widgets/Api/Auth/User
```

### 3. MinistryPlatform Setup

#### Feedback Table
The widget uses the standard `Feedback` table. Ensure these fields exist:
- `Feedback_ID` (Primary Key)
- `Contact_ID` (Foreign Key)
- `Feedback_Type_ID` (Foreign Key)
- `Description` (TEXT)
- `Entry_Title` (VARCHAR)
- `Date_Submitted` (DATETIME)
- `Approved` (BIT/BOOLEAN)
- `Ongoing_Need` (BIT/BOOLEAN)

#### Feedback Types
Create prayer categories in `Feedback_Types` table:
- Prayer Request (ID: 1)
- Praise Report (ID: 2)
- Urgent Need (ID: 3)
- etc.

### 4. Run Development Server

```bash
npm run dev
```

Access at: http://localhost:3002

### 5. Testing Authentication

Since this uses MP's login widget token from localStorage, you have two options:

**Option A: Use MP Login Widget**
1. Create a test HTML page with:
```html
<script id="MPWidgets" src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"></script>
<mpp-user-login></mpp-user-login>
<iframe src="http://localhost:3002" width="100%" height="800px"></iframe>
```

**Option B: Manual Token Testing**
1. Go to http://localhost:3002
2. Open browser console
3. Get a valid token from MP
4. Set in localStorage:
```javascript
localStorage.setItem('mpp-widgets_AuthToken', 'YOUR_VALID_TOKEN_HERE');
```
5. Refresh the page

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── prayers/          # Prayer CRUD endpoints
│   │   │   ├── route.ts      # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts  # GET, PATCH, DELETE
│   │   │       └── approve/
│   │   │           └── route.ts  # POST approve (staff only)
│   │   └── categories/       # GET categories
│   └── (app)/
│       └── page.tsx          # Main prayer wall UI
├── components/
│   ├── prayer/
│   │   ├── MPWidgetAuthWrapper.tsx  # Auth check wrapper
│   │   ├── PrayerForm.tsx           # Submit form
│   │   ├── PrayerCard.tsx           # Individual prayer card
│   │   └── PrayerList.tsx           # Prayer list/stack
│   └── ui/                   # Radix UI components
├── lib/
│   ├── mpWidgetAuth.ts       # Server-side auth validation
│   └── mpWidgetAuthClient.ts # Client-side localStorage token
├── providers/MinistryPlatform/
│   ├── entities/
│   │   ├── Feedback.ts       # Feedback entity operations
│   │   ├── FeedbackSchema.ts # Zod validation schemas
│   │   ├── FeedbackTypes.ts  # Category operations
│   │   └── FeedbackTypesSchema.ts
│   └── services/
│       └── tableService.ts   # MP table CRUD operations
└── services/
    └── prayerService.ts      # High-level prayer service
```

## API Endpoints

### GET /api/prayers
Get prayers with optional filtering
- `?approved=true` - Only approved prayers
- `?mine=true` - Only my prayers
- `?categoryId=1` - Filter by category
- `?search=cancer` - Search text

### POST /api/prayers
Create new prayer request
```json
{
  "Entry_Title": "Prayer for healing",
  "Description": "Please pray for my friend...",
  "Feedback_Type_ID": 1,
  "Ongoing_Need": false
}
```

### GET /api/prayers/[id]
Get single prayer by ID

### PATCH /api/prayers/[id]
Update prayer (owner or staff only)

### DELETE /api/prayers/[id]
Delete prayer (owner or staff only)

### POST /api/prayers/[id]/approve
Approve prayer (staff only)

### GET /api/categories
Get all prayer categories

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### CORS Configuration

For WordPress embedding, configure CORS in `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "https://yourdomain.com" },
        { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Authorization,Content-Type" },
      ],
    },
  ];
},
```

## WordPress Integration

### 1. Add MP Widgets Script
In your theme's `header.php` or page template:
```html
<script id="MPWidgets" src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"></script>
```

### 2. Add MP Login Widget
```html
<mpp-user-login customcss="https://your-domain.vercel.app/CSS/userLogin.css">
  <a href="/my-groups/">Groups</a>
  <a href="/manage-giving/">Giving</a>
</mpp-user-login>
```

### 3. Embed Prayer Widget
```html
<div id="prayer-widget"></div>
<script>
  // Load the widget
  fetch('https://your-prayer-widget.vercel.app')
    .then(r => r.text())
    .then(html => {
      document.getElementById('prayer-widget').innerHTML = html;
    });
</script>
```

Or use an iframe (easier but less integrated):
```html
<iframe
  src="https://your-prayer-widget.vercel.app"
  width="100%"
  height="800px"
  frameborder="0"
></iframe>
```

## Features by Role

### Public Users (Authenticated)
- View approved prayers
- Submit prayer requests (pending approval)
- Swipe through prayers
- Filter and search
- Edit/delete own prayers

### Staff Members
- All public features
- Approve pending prayers
- Edit any prayer
- Delete any prayer

Staff detection is automatic via MP roles (checked in `/src/lib/mpWidgetAuth.ts`).

## Testing Checklist

- [ ] User can authenticate via MP login widget
- [ ] Unauthenticated users see auth prompt
- [ ] User can submit prayer request
- [ ] Prayer starts as unapproved (`Approved = false`)
- [ ] Only approved prayers show in public view
- [ ] Staff can approve prayers
- [ ] Swipe right removes prayer from view
- [ ] Swipe left removes prayer from view
- [ ] Category filter works
- [ ] Search works
- [ ] Stack and List modes toggle
- [ ] Mobile responsive
- [ ] Animations are smooth

## Known Issues & Future Enhancements

### Current Limitations
- Swipe dismissal is client-side only (doesn't persist to database)
- No tracking of WHO prayed for a prayer
- No real-time updates (requires refresh)
- No admin dashboard for approvals (must use API directly)

### Future Ideas
- Admin dashboard for staff
- Prayer count tracking
- Email notifications
- Prayer answered/closed workflow
- Anonymous prayer submissions
- Push notifications
- Prayer reminders

## Support

For issues or questions:
1. Check `CLAUDE.md` for detailed architecture
2. Check `README.md` for general info
3. Review API route files for endpoint documentation
4. Check browser console for client-side errors
5. Check server logs for API errors

## Files Modified from Template

New files created:
- `/src/app/api/prayers/**` - All prayer API routes
- `/src/app/api/categories/**` - Categories API
- `/src/components/prayer/**` - All prayer components
- `/src/lib/mpWidgetAuth*.ts` - Auth utilities
- `/src/services/prayerService.ts` - Prayer service
- `/src/providers/MinistryPlatform/entities/Feedback*` - Feedback entities
- `/src/components/ui/badge.tsx` - Badge component

Modified files:
- `/src/app/(app)/page.tsx` - Replaced with prayer wall
- `package.json` - Added dependencies
- `.env` - Updated configuration

## Next Steps

1. **Test locally** with your MP credentials
2. **Add test data** to Feedback table in MP
3. **Create Feedback_Types** for categories
4. **Deploy to Vercel**
5. **Configure CORS** for your WordPress domain
6. **Embed on WordPress** site
7. **Test end-to-end** workflow

Enjoy your new Prayer Widget! 🙏
