# Prayer Widget - Architecture & Data Flow

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (localhost:3002)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         Blue Dev Header (DevLoginWidget.tsx)            │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  <mpp-user-login> (MP Native Widget)              │  │     │
│  │  │  [Sign In] → Opens MP OAuth Modal                 │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                              ↓                                    │
│                   Sets localStorage Token                         │
│                   "mpp-widgets_AuthToken"                         │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │       MPWidgetAuthWrapper.tsx (Client Component)        │     │
│  │  - Checks localStorage every 1 second                   │     │
│  │  - If token exists → Show prayer wall                   │     │
│  │  - If no token → Show "Please sign in"                  │     │
│  └────────────────────────────────────────────────────────┘     │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │           Prayer Wall (page.tsx)                        │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  PrayerList.tsx                                   │  │     │
│  │  │  - Fetches: GET /api/prayers?approved=true        │  │     │
│  │  │  - Renders: PrayerCard.tsx (with swipe)           │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  PrayerForm.tsx (in Dialog)                       │  │     │
│  │  │  - Submits: POST /api/prayers                     │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              ↓
                    All API calls include:
            Authorization: Bearer <localStorage-token>
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Server-Side)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /api/prayers                                                     │
│  ├─ GET  → List prayers (filtered)                               │
│  │   └─ authenticateRequest() → Validates token with MP          │
│  └─ POST → Create prayer                                         │
│      └─ authenticateRequest() → Validates token with MP          │
│                                                                   │
│  /api/prayers/[id]                                                │
│  ├─ GET    → Get single prayer                                   │
│  ├─ PATCH  → Update (owner or staff only)                        │
│  └─ DELETE → Delete (owner or staff only)                        │
│                                                                   │
│  /api/prayers/[id]/approve                                        │
│  └─ POST → Approve prayer (staff only)                           │
│                                                                   │
│  /api/categories                                                  │
│  └─ GET → Get prayer categories                                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              ↓
              Each API route uses PrayerService
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Service Layer (Business Logic)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PrayerService (prayerService.ts)                                │
│  ├─ getPrayers(filters)                                          │
│  ├─ getApprovedPrayers()                                         │
│  ├─ submitPrayer(data)                                           │
│  ├─ approvePrayer(id)                                            │
│  └─ getCategories()                                              │
│                   ↓                                               │
│  Uses: FeedbackEntity, FeedbackTypesEntity                       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Entity Layer (MP Table Operations)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FeedbackEntity (Feedback.ts)                                    │
│  ├─ getFeedback(params)                                          │
│  ├─ getApprovedPrayers()                                         │
│  ├─ createFeedback(data)                                         │
│  ├─ updateFeedback(data)                                         │
│  └─ deleteFeedback(id)                                           │
│                   ↓                                               │
│  Uses: TableService                                              │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│             MP Core Layer (HTTP Client & API Calls)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  TableService (tableService.ts)                                  │
│  ├─ getTableRecords(table, params)                               │
│  ├─ createTableRecords(table, records)                           │
│  ├─ updateTableRecords(table, records)                           │
│  └─ deleteTableRecords(table, ids)                               │
│                   ↓                                               │
│  MinistryPlatformClient (ministryPlatformClient.ts)              │
│  └─ getHttpClient() → Makes REST calls to MP                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         MinistryPlatform REST API (External Service)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  https://my.woodsidebible.org/ministryplatformapi/               │
│  ├─ /tables/Feedback                                             │
│  │   ├─ GET    ?$select=...&$filter=...                          │
│  │   ├─ POST   { records: [...] }                                │
│  │   ├─ PUT    { records: [...] }                                │
│  │   └─ DELETE ?id=1,2,3                                         │
│  │                                                                │
│  ├─ /tables/Feedback_Types                                       │
│  │   └─ GET    ?$select=...                                      │
│  │                                                                │
│  └─ /widgets/Api/Auth/User (Token Validation)                    │
│      └─ GET with Bearer token → Returns user info                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SQL Server Database                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Feedback Table                                                   │
│  ├─ Feedback_ID (PK)                                             │
│  ├─ Contact_ID (FK → Contacts)                                   │
│  ├─ Feedback_Type_ID (FK → Feedback_Types)                       │
│  ├─ Entry_Title                                                  │
│  ├─ Description                                                  │
│  ├─ Date_Submitted                                               │
│  ├─ Approved (BIT)                                               │
│  └─ Ongoing_Need (BIT)                                           │
│                                                                   │
│  Feedback_Types Table                                             │
│  ├─ Feedback_Type_ID (PK)                                        │
│  ├─ Feedback_Type (Name)                                         │
│  └─ Description                                                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Authentication Flow (Development)

```
User Opens http://localhost:3002
         ↓
Next.js loads MPWidgets.js script
         ↓
DevLoginWidget renders <mpp-user-login>
         ↓
User clicks "Sign In"
         ↓
MP OAuth modal opens (my.woodsidebible.org)
         ↓
User enters credentials
         ↓
MP validates → Returns token
         ↓
MP Widget stores token in localStorage
  Key: "mpp-widgets_AuthToken"
  Value: JWT token string
         ↓
MPWidgetAuthWrapper detects token (polls every 1s)
         ↓
Shows PrayerList component
         ↓
PrayerList fetches GET /api/prayers
  Headers: { Authorization: "Bearer <token>" }
         ↓
API validates token with MP /widgets/Api/Auth/User
         ↓
Returns user info + validates permissions
         ↓
Prayers displayed to user ✅
```

## Data Flow: Submitting a Prayer

```
User clicks "Submit Prayer" button
         ↓
Dialog opens with PrayerForm
         ↓
User fills out:
  - Entry_Title: "Prayer for healing"
  - Feedback_Type_ID: 1 (Prayer Request)
  - Description: "Please pray for..."
  - Ongoing_Need: true
         ↓
User clicks "Submit"
         ↓
Form validates with Zod schema
         ↓
POST /api/prayers
  Body: {
    Entry_Title: "Prayer for healing",
    Feedback_Type_ID: 1,
    Description: "Please pray for...",
    Ongoing_Need: true
  }
  Headers: {
    Authorization: "Bearer <localStorage-token>"
  }
         ↓
API Route: authenticateRequest()
  → Validates token with MP
  → Gets user's Contact_ID from response
         ↓
PrayerService.submitPrayer({
  ...formData,
  Contact_ID: user.contactId,
  Approved: false  // Always starts unapproved
})
         ↓
FeedbackEntity.createFeedback()
         ↓
TableService.createTableRecords('Feedback', [...])
         ↓
HTTP POST to MP API:
  /tables/Feedback
  Body: { records: [{ ...prayer data }] }
         ↓
MP inserts into SQL Server
         ↓
Returns created record
         ↓
Prayer form closes
PrayerList refreshes
Success message shown ✅
```

## Data Flow: Approving a Prayer (Staff Only)

```
Staff user views pending prayers
  GET /api/prayers?approved=false
         ↓
Clicks "Approve" on prayer #123
         ↓
POST /api/prayers/123/approve
  Headers: { Authorization: "Bearer <token>" }
         ↓
API validates token
         ↓
Checks if user is staff:
  - user.isStaff === true, OR
  - user.roles includes "Staff", "Administrators", etc.
         ↓
If NOT staff → 403 Forbidden ❌
If staff → Continue ✅
         ↓
PrayerService.approvePrayer(123)
         ↓
FeedbackEntity.updateFeedback({
  Feedback_ID: 123,
  Approved: true
})
         ↓
TableService.updateTableRecords('Feedback', [...])
         ↓
HTTP PUT to MP API:
  /tables/Feedback
  Body: { records: [{ Feedback_ID: 123, Approved: 1 }] }
         ↓
MP updates SQL Server
  SET Approved = 1 WHERE Feedback_ID = 123
         ↓
Prayer now appears in public view ✅
```

## Swipe Interaction Flow

```
User in Stack View mode
         ↓
PrayerCard rendered with Framer Motion
         ↓
User drags card horizontally
         ↓
useMotionValue(x) tracks drag distance
         ↓
Visual feedback:
  - Card rotates (useTransform)
  - Opacity changes
  - Green heart icon (swipe right)
  - Red X icon (swipe left)
         ↓
User releases (onDragEnd)
         ↓
Check offset:
  offset.x > 100  → Swiped Right (Prayed)
  offset.x < -100 → Swiped Left (Dismissed)
  else            → Snap back
         ↓
If swiped:
  - Card animates off screen (exitX = ±1000)
  - onPrayedFor(id) or onDismiss(id) called
  - Prayer removed from filteredPrayers array
  - Next prayer card moves up
         ↓
Note: Currently client-side only
  (doesn't persist to database)
         ↓
Optional: Could add API call to track:
  POST /api/prayers/123/pray
  { prayedBy: contactId, prayedAt: timestamp }
```

## Security Model

### Client-Side (Browser)
- Token stored in localStorage (accessible to JavaScript)
- Token automatically sent with every API request
- No session cookies used

### Server-Side (API Routes)
- Every request validates token with MP
- Token validation happens on each API call
- No server-side session storage
- Stateless authentication

### Permission Checks
```javascript
// In API routes:
const { user, token } = await authenticateRequest();

// Owner check
if (prayer.Contact_ID !== user.contactId && !isStaff(user)) {
  return 403 Forbidden;
}

// Staff check
if (!isStaff(user)) {
  return 403 Forbidden;
}

// isStaff() checks:
// - user.isStaff === true
// - user.roles includes "Staff", "Administrators", etc.
```

## Development vs Production

### Development Mode (npm run dev)
- Shows blue DevLoginWidget header
- MP login widget embedded in page
- Enhanced error messages
- Console logging enabled
- No CORS restrictions (same origin)

### Production Mode (npm build + deploy)
- DevLoginWidget hidden (NODE_ENV !== 'development')
- User must embed MP login widget separately
- Cleaner error messages
- Minimal logging
- CORS configured for specific domains

## Technology Stack

```
┌─────────────────────────────────────────┐
│         Frontend (Client-Side)          │
├─────────────────────────────────────────┤
│  React 19                                │
│  Next.js 15 (App Router)                 │
│  TypeScript 5                            │
│  Tailwind CSS v4                         │
│  Radix UI (shadcn/ui components)         │
│  Framer Motion (animations)              │
│  React Hook Form (forms)                 │
│  Zod (validation)                        │
│  Lucide React (icons)                    │
└─────────────────────────────────────────┘
         ↓ API Calls (fetch)
┌─────────────────────────────────────────┐
│         Backend (Server-Side)           │
├─────────────────────────────────────────┤
│  Next.js API Routes                      │
│  TypeScript                              │
│  Zod (validation)                        │
└─────────────────────────────────────────┘
         ↓ REST API Calls
┌─────────────────────────────────────────┐
│      MinistryPlatform REST API          │
├─────────────────────────────────────────┤
│  OAuth 2.0 / OpenID Connect              │
│  REST endpoints (/tables, /widgets)      │
│  SQL Server backend                      │
└─────────────────────────────────────────┘
```

## File Organization by Concern

```
Authentication:
├─ src/lib/mpWidgetAuth.ts (server)
├─ src/lib/mpWidgetAuthClient.ts (client)
└─ src/components/DevLoginWidget.tsx (dev only)

Data Layer:
├─ src/providers/MinistryPlatform/entities/Feedback.ts
├─ src/providers/MinistryPlatform/entities/FeedbackTypes.ts
└─ src/providers/MinistryPlatform/services/tableService.ts

Business Logic:
└─ src/services/prayerService.ts

API Endpoints:
├─ src/app/api/prayers/route.ts
├─ src/app/api/prayers/[id]/route.ts
├─ src/app/api/prayers/[id]/approve/route.ts
└─ src/app/api/categories/route.ts

UI Components:
├─ src/components/prayer/MPWidgetAuthWrapper.tsx
├─ src/components/prayer/PrayerForm.tsx
├─ src/components/prayer/PrayerCard.tsx
├─ src/components/prayer/PrayerList.tsx
└─ src/components/ui/* (Radix UI primitives)

Validation:
├─ src/providers/MinistryPlatform/entities/FeedbackSchema.ts
└─ src/providers/MinistryPlatform/entities/FeedbackTypesSchema.ts
```

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Type safety with TypeScript + Zod
- ✅ Reusable service/entity layers
- ✅ Secure token validation
- ✅ Easy testing in development
- ✅ Production-ready deployment
