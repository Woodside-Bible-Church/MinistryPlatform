# RSVP App Structure & Role-Based Permissions Analysis

**Document Date:** December 23, 2025
**App Location:** `/Users/coltonwirgau/MinistryPlatform/NextJS/Apps/`
**Analysis Level:** Very Thorough

---

## 1. RSVP APP ARCHITECTURE OVERVIEW

### Data Model (Entities)

The RSVP app uses a hybrid schema combining **native MinistryPlatform tables** with **custom tables**:

#### Native MinistryPlatform Tables
1. **Projects** - RSVP Project configurations (parent container)
2. **Events** - Individual events within projects
3. **Event_Participants** - People who registered for events
4. **Contacts** - Contact information (via Participant_ID links)
5. **Congregations** - Campus/Campus information

#### Custom Tables (Widget-created)
1. **Event_RSVPs** - Individual RSVP submissions with full submission details
2. **Event_RSVP_Answers** - Answers to form questions and party size tracking

#### Related Tables
- **dp_Communication_Templates** - Email templates for confirmations/reminders
- **Form_Fields** - Additional form questions
- **Project_Confirmation_Cards** - Confirmation page content
- **dp_User_Groups** - Used for role-based access control

---

## 2. ALL RSVP API ROUTES (CRUD Operations)

### Project-Level Routes

#### GET `/api/rsvp/projects`
- **Purpose:** List all active RSVP projects
- **Method:** GET
- **Authenticated:** Yes
- **Returns:** Array of RSVPProjectList objects
- **Implementation:** `/src/app/api/rsvp/projects/route.ts`
- **Service Layer:** `ProjectRSVPService.getActiveRSVPProjects()`
- **Data Source:** Stored procedure `api_Custom_RSVP_Management_Projects_JSON`
- **Permission Check:** Currently NONE

#### GET `/api/rsvp/projects/[projectId]`
- **Purpose:** Get a specific project by ID
- **Method:** GET
- **Authenticated:** Yes
- **Returns:** Single Project object
- **Implementation:** `/src/app/api/rsvp/projects/[projectId]/route.ts`
- **Service Layer:** `ProjectRSVPService.getProjectById()`
- **Permission Check:** Currently NONE

#### PATCH `/api/rsvp/projects/[projectId]`
- **Purpose:** Update project RSVP configuration
- **Method:** PATCH
- **Authenticated:** Yes
- **Editable Fields:**
  - RSVP_Title
  - RSVP_Description
  - RSVP_Start_Date / RSVP_End_Date
  - RSVP_Is_Active
  - RSVP_Require_Contact_Lookup
  - RSVP_Allow_Guest_Submission
  - RSVP_Primary_Color, RSVP_Secondary_Color, RSVP_Accent_Color, RSVP_Background_Color
  - RSVP_Confirmation_Email_Template_ID
  - RSVP_Reminder_Email_Template_ID
  - RSVP_Days_To_Remind
  - RSVP_URL
- **Implementation:** `/src/app/api/rsvp/projects/[projectId]/route.ts` (lines 41-83)
- **Service Layer:** `ProjectRSVPService.updateProject()`
- **Data Validation:** UpdateProjectSchema (Zod)
- **Permission Check:** Currently NONE - **NEEDS PERMISSION CHECK**

#### GET `/api/rsvp/projects/by-slug/[slug]`
- **Purpose:** Get project by URL slug
- **Method:** GET
- **Authenticated:** Yes
- **Implementation:** `/src/app/api/rsvp/projects/by-slug/[slug]/route.ts`
- **Permission Check:** Currently NONE

#### GET `/api/rsvp/projects/details/[slug]`
- **Purpose:** Get complete project details (project + campuses + RSVPs + cards)
- **Method:** GET
- **Authenticated:** Yes
- **Implementation:** `/src/app/api/rsvp/projects/details/[slug]/route.ts`
- **Data Source:** Stored procedure `api_Custom_RSVP_Project_Details_JSON`
- **Permission Check:** Currently NONE

### Event-Level Routes

#### GET `/api/rsvp/projects/[projectId]/events`
- **Purpose:** Get all events for a project (with optional campus filter)
- **Method:** GET
- **Authenticated:** Yes
- **Query Params:** `?campusId=<id>` (optional)
- **Returns:** Array of Event objects
- **Implementation:** `/src/app/api/rsvp/projects/[projectId]/events/route.ts`
- **Permission Check:** Currently NONE

#### PATCH `/api/rsvp/events/[eventId]`
- **Purpose:** Update event fields
- **Method:** PATCH
- **Authenticated:** Yes
- **Editable Fields:**
  - Meeting_Instructions
  - RSVP_Capacity
  - RSVP_Capacity_Modifier
  - RSVP_Carousel_Name
- **Implementation:** `/src/app/api/rsvp/events/[eventId]/route.ts` (lines 1-86)
- **Auditing:** Passes User_ID via $userID query parameter for MP auditing
- **Permission Check:** Currently NONE - **NEEDS PERMISSION CHECK**

#### GET `/api/rsvp/events/[eventId]/amenities`
- **Purpose:** Get amenities for an event
- **Method:** GET
- **Authenticated:** Yes
- **Implementation:** `/src/app/api/rsvp/events/[eventId]/amenities/route.ts`
- **Permission Check:** Currently NONE

### RSVP Submission Routes

#### GET `/api/rsvp/events/[eventId]/rsvps`
- **Purpose:** Get all RSVP submissions for a specific event
- **Method:** GET
- **Authenticated:** Yes
- **Returns:** Array of ProjectRSVP objects with full contact details
- **Implementation:** `/src/app/api/rsvp/events/[eventId]/rsvps/route.ts`
- **Service Layer:** `ProjectRSVPService.getEventRSVPs()`
- **Permission Check:** Currently NONE

#### GET `/api/rsvp/projects/[projectId]/rsvps`
- **Purpose:** Get all RSVP submissions for a project (across all events)
- **Method:** GET
- **Authenticated:** Yes
- **Returns:** Array of ProjectRSVP objects
- **Implementation:** `/src/app/api/rsvp/projects/[projectId]/rsvps/route.ts`
- **Service Layer:** `ProjectRSVPService.getProjectRSVPs()`
- **Permission Check:** Currently NONE

### File Management Routes

#### GET `/api/rsvp/projects/[projectId]/files`
- **Purpose:** Get all files attached to a project
- **Method:** GET
- **Authenticated:** Yes
- **Implementation:** `/src/app/api/rsvp/projects/[projectId]/files/route.ts` (lines 7-37)
- **Data Source:** MinistryPlatform `/files/Projects/{projectId}` endpoint
- **Permission Check:** Currently NONE

#### POST `/api/rsvp/projects/[projectId]/files`
- **Purpose:** Upload a new image file for the project
- **Method:** POST
- **Authenticated:** Yes
- **Expected Form Data:**
  - `file` - The image file to upload
  - `fileName` - Either "RSVP_Image.jpg" or "RSVP_BG_Image.jpg"
- **Implementation:** `/src/app/api/rsvp/projects/[projectId]/files/route.ts` (lines 46-118)
- **Behavior:** Deletes existing file with same name before uploading new one
- **Permission Check:** Currently NONE - **NEEDS PERMISSION CHECK**

#### DELETE `/api/rsvp/projects/[projectId]/files`
- **Purpose:** Delete a specific file by File_ID
- **Method:** DELETE
- **Authenticated:** Yes
- **Query Params:** `?fileId={fileId}`
- **Implementation:** `/src/app/api/rsvp/projects/[projectId]/files/route.ts` (lines 124-165)
- **Permission Check:** Currently NONE - **NEEDS PERMISSION CHECK**

### Form & Template Routes

#### GET `/api/rsvp/forms/[formId]`
- **Purpose:** Fetch form fields for a given form ID
- **Method:** GET
- **Authenticated:** Yes
- **Returns:** Array of Form_Field objects
- **Implementation:** `/src/app/api/rsvp/forms/[formId]/route.ts`
- **Query Filter:** Only returns non-hidden fields (Is_Hidden=0)
- **Permission Check:** Currently NONE

#### GET `/api/rsvp/templates`
- **Purpose:** Fetch email/communication templates with pagination
- **Method:** GET
- **Authenticated:** Yes
- **Query Params:**
  - `?page=1` (default)
  - `?pageSize=20` (default)
  - `?search=<query>` (optional text search)
  - `?type=both` (optional: 'email', 'communication', or 'both')
- **Returns:** Paginated list of communication templates
- **Implementation:** `/src/app/api/rsvp/templates/route.ts`
- **Data Source:** `dp_Communication_Templates` table
- **Permission Check:** Currently NONE

### Confirmation Card Routes

#### PATCH `/api/rsvp/confirmation-cards/[cardId]`
- **Purpose:** Update confirmation card configuration
- **Method:** PATCH
- **Authenticated:** Yes
- **Request Body:**
  ```typescript
  {
    title: string,
    bullets: Array<{ icon: string, text: string }>
  }
  ```
- **Implementation:** `/src/app/api/rsvp/confirmation-cards/[cardId]/route.ts`
- **Data Stored:** Card_Configuration JSON field
- **Permission Check:** Currently NONE - **NEEDS PERMISSION CHECK**

---

## 3. RSVP PAGE COMPONENTS WITH ACTION BUTTONS

### Main Pages

#### `/src/app/(app)/rsvp/page.tsx` (Projects List Page)
- **Purpose:** Display all active RSVP projects
- **Actions:** None (read-only view)
- **Type:** Display/Browse only
- **Components:**
  - ProjectCard - Display individual project
  - Search/Filter functionality
- **No Edit/Delete:** This is a read-only listing page

#### `/src/app/(app)/rsvp/[slug]/page.tsx` (Project Detail Page - 3,544 lines)
**This is the main management interface with extensive edit/delete functionality**

**Tab 1: Details Tab**
Edit/Update Actions:
1. **Project Info Section**
   - Edit button opens form
   - Fields: RSVP_Title, RSVP_Description, RSVP_Start_Date, RSVP_End_Date, RSVP_URL
   - Handler: `handleSaveProjectInfo()` (line 606)
   - API: PATCH `/api/rsvp/projects/[projectId]`

2. **General Settings Section**
   - Edit button opens form
   - Fields: RSVP_Is_Active, RSVP_Require_Contact_Lookup, RSVP_Allow_Guest_Submission
   - Handler: `handleSaveGeneralSettings()` (line 643)
   - API: PATCH `/api/rsvp/projects/[projectId]`

3. **Email Templates Section**
   - Edit button opens form
   - Fields: RSVP_Confirmation_Email_Template_ID, RSVP_Reminder_Email_Template_ID, RSVP_Days_To_Remind
   - Handler: `handleTemplateUpdate()` (line 569)
   - API: PATCH `/api/rsvp/projects/[projectId]` (auto-saves with debounce)

4. **Colors Section**
   - Edit button opens form
   - Fields: RSVP_Primary_Color, RSVP_Secondary_Color, RSVP_Accent_Color, RSVP_Background_Color
   - Handler: `handleSaveColors()` (line 671)
   - API: PATCH `/api/rsvp/projects/[projectId]`

5. **Images Section**
   - Edit button to manage images
   - Upload new image: `handleImageUpload()` (line 707)
   - Delete image: `handleImageDelete()` (line 745)
   - API: POST/DELETE `/api/rsvp/projects/[projectId]/files`
   - Files: RSVP_Image.jpg, RSVP_BG_Image.jpg

**Tab 2: Campuses Tab**
Edit/Delete/Create Actions:

1. **Event Meeting Instructions**
   - Pencil icon to edit (per event)
   - Handler: `handleSaveMeetingInstructions()` (line 794)
   - API: PATCH `/api/rsvp/events/[eventId]`
   - Field: Meeting_Instructions

2. **Event Capacity**
   - Pencil icon to edit (per event)
   - Handler: `handleSaveEventCapacity()` (line 833)
   - API: PATCH `/api/rsvp/events/[eventId]`
   - Fields: RSVP_Capacity, RSVP_Capacity_Modifier

3. **Amenities per Event**
   - Pencil icon to edit amenities
   - Handler: `handleSaveAmenities()` (line 913)
   - API: PUT `/api/rsvp/events/[eventId]/amenities` (via AmenitiesEditor component)

4. **Confirmation Cards**
   - Pencil icon to edit card configuration
   - Handler: `handleSaveConfirmationCard()` (line 873)
   - API: PATCH `/api/rsvp/confirmation-cards/[cardId]`
   - Fields: title, bullets (array of {icon, text})

5. **Carousels (NEW)**
   - Create new carousel: `handleOpenCarouselDialog()` (line 1060)
   - Add events to carousel: Dialog mode
   - Edit carousel name: `handleEditCarouselName()` (line 976)
   - Delete carousel: `handleDeleteCarousel()` (line 1020)
   - Remove event from carousel: `handleRemoveEventFromCarousel()` (line 945)
   - Handler: `handleSaveCarousel()` (line 1086)
   - API: PUT `/api/rsvp/events/[eventId]/carousels`

**Tab 3: RSVPs Tab**
Read-Only Actions:
- Display all RSVP submissions
- Search/filter RSVPs
- No edit/delete of RSVP entries visible in code

### Child Components

#### `/src/components/rsvp/TemplateSelector.tsx`
- Purpose: Dropdown to select communication templates
- Actions: None (display only)

#### `/src/components/rsvp/AmenitiesEditor.tsx`
- Purpose: Edit amenities for an event
- Actions: Yes - adds/removes amenities
- Handler: Uses its own internal handlers

---

## 4. CURRENT PERMISSION CHECKS (IF ANY)

### Page-Level Access Control

**Location:** `/src/middleware.ts`

#### Current Implementation:
- **App-level access checking:** YES (middleware lines 74-146)
  - Checks if user has role-based access to the `/rsvp` app
  - Requires user to have permission in `appPermissions` table
  - Admin bypass available (users with "Administrators" role)
  
#### Permission Flow:
1. User requests `/rsvp` or `/rsvp/[slug]`
2. Middleware intercepts request
3. Validates JWT token
4. Fetches user roles from:
   - OAuth security roles (token.roles)
   - User groups (dp_User_Groups table)
5. Checks `appPermissions` table for user's role/email
6. Allows access if:
   - User is Admin, OR
   - User has specific role permission with canView=true
7. Denies access → redirects to `/403` if no permission

#### Limitations:
```
- NO granular permissions on individual RSVP projects
- NO granular permissions on individual API routes
- NO role-based edit/delete restrictions within the app
- ALL authenticated users who have app access can:
  ✓ Edit ANY project
  ✓ Upload/delete ANY project image
  ✓ Edit ANY event
  ✓ Edit ANY confirmation card
  ✓ Manage ANY carousel
  ✓ View ALL RSVPs
```

### API Route Permission Checks

**Current Status:** NONE

All API routes:
```
- NO User_ID validation
- NO role validation (except implicit app-level check)
- NO project ownership validation
- NO event ownership validation
```

Example from `/api/rsvp/projects/[projectId]/route.ts`:
```typescript
export async function PATCH(...) {
  // ✗ NO PERMISSION CHECK
  const id = parseInt(projectId);
  const body = await request.json();
  const validated = UpdateProjectSchema.parse(body);
  const service = await getProjectRSVPService();
  const updated = await service.updateProject(validated);
  // Just does it - no validation of who user is
  return NextResponse.json(updated);
}
```

---

## 5. ENTITIES THAT CAN BE CREATED/EDITED/DELETED

### Creatable Entities
- **Carousels** - Created per campus (dynamic)
- **Files** - Image uploads to project

### Editable Entities
| Entity | Where | Fields | Button |
|--------|-------|--------|--------|
| **Project** | Details tab | Title, Description, Dates, URL, Colors, Templates | Pencil icon |
| **Project Image** | Details tab → Images | RSVP_Image.jpg, RSVP_BG_Image.jpg | Upload/Delete |
| **Event** | Campuses tab | Meeting_Instructions, RSVP_Capacity, RSVP_Capacity_Modifier | Pencil icons |
| **Event Amenities** | Campuses tab | List of amenities | Pencil icon |
| **Confirmation Card** | Campuses tab | Title, Bullets (title + icon) | Pencil icon |
| **Carousel** | Campuses tab | Name, included events | Create/Edit/Delete |
| **Carousel Event** | Campuses tab | Event membership | Add/Remove |

### Deletable Entities
- **Project Images** - Via image delete handler
- **Files** - Via file delete route
- **Carousels** - Via delete carousel handler

### Read-Only Entities
- **RSVP Submissions** - Displayed in RSVPs tab but no delete/edit shown
- **Events** - Listed but not deletable
- **Contacts/Participants** - Listed in RSVP table, read-only

---

## 6. EDIT/DELETE BUTTON LOCATIONS (CODE REFERENCES)

All in `/src/app/(app)/rsvp/[slug]/page.tsx`:

| Feature | Button Type | Line Range | Handler | Icon |
|---------|------------|-----------|---------|------|
| Project Info | Pencil/X toggle | ~1200-1400 | handleSaveProjectInfo | Pencil |
| General Settings | Pencil/X toggle | ~1400-1600 | handleSaveGeneralSettings | Pencil |
| Email Templates | Pencil/X toggle | ~1600-1800 | handleTemplateUpdate | Pencil |
| Colors | Pencil/X toggle | ~1800-2000 | handleSaveColors | Pencil |
| Images | Upload/Delete | ~2000-2200 | handleImageUpload, handleImageDelete | Upload/Trash |
| Meeting Inst. | Pencil/X toggle | ~2400-2600 | handleSaveMeetingInstructions | Pencil |
| Event Capacity | Pencil/X toggle | ~2600-2800 | handleSaveEventCapacity | Pencil |
| Amenities | Pencil/X toggle | ~2800-3000 | handleSaveAmenities (via AmenitiesEditor) | Pencil |
| Confirmation Card | Pencil/X toggle | ~3000-3200 | handleSaveConfirmationCard | Pencil |
| Carousel Create | Plus button | ~3200-3300 | handleOpenCarouselDialog | Plus |
| Carousel Edit Name | Pencil | ~3200-3350 | handleEditCarouselName | Pencil |
| Carousel Delete | Trash | ~3300-3350 | handleDeleteCarousel | Trash2 |
| Carousel Remove Event | Trash | ~3300-3400 | handleRemoveEventFromCarousel | Trash2 |

---

## 7. SERVICE LAYER & DATA ACCESS

### ProjectRSVPService (`/src/services/projectRsvpService.ts`)

**Key Methods:**

1. **getActiveRSVPProjects()**
   - Calls stored procedure: `api_Custom_RSVP_Management_Projects_JSON`
   - No permission checks
   - Returns all active projects

2. **getProjectById(projectId)**
   - Direct table query: `Projects` where Project_ID = id
   - No permission checks
   - Returns single project or throws error

3. **getProjectBySlug(slug)**
   - Direct table query: `Projects` where RSVP_Slug = slug
   - No permission checks

4. **updateProject(data)**
   - Updates `Projects` table
   - No validation of who initiated update
   - No audit trail (except via getUserIdFromSession)

5. **getProjectDetails(projectIdOrSlug)**
   - Calls stored procedure: `api_Custom_RSVP_Project_Details_JSON`
   - Accepts either ID or slug
   - No permission checks
   - Returns complete project with campuses, events, RSVPs, confirmation cards

6. **updateProjectEvent(data)**
   - Updates `Events` table (Include_In_RSVP, RSVP_Capacity_Modifier)
   - No permission checks

7. **getProjectRSVPs(projectId)**
   - Joins Event_Participants with Contacts
   - Returns all RSVPs for all events in project
   - No permission checks

8. **getEventRSVPs(eventId)**
   - Same as above but for single event
   - No permission checks

---

## 8. AUTHENTICATION & SESSION

### Current Session Data

**Session Object** (from `/src/utils/auth.ts`):
```typescript
{
  userId: number,        // User_ID (stored as string, parsed to int)
  email: string,         // User email
  sub: string,           // User_GUID
  roles: string[],       // OAuth security roles
  // Additional fields available via middleware
}
```

### How to Get Current User Info

```typescript
import { auth } from "@/auth";
import { getUserIdFromSession } from "@/utils/auth";

// Get full session
const session = await auth();
const userId = session?.userId;
const email = session?.user?.email;
const roles = session?.roles;

// Get just User_ID for auditing
const userId = await getUserIdFromSession();
```

---

## 9. RECOMMENDATIONS FOR ROLE-BASED PERMISSIONS

### 1. Define Permission Levels

Suggested roles:
```typescript
enum RSVPPermission {
  VIEW = 'rsvp:view',           // Can view project/RSVPs
  EDIT_PROJECT = 'rsvp:edit_project',
  EDIT_EVENTS = 'rsvp:edit_events',
  EDIT_CONFIRMATION = 'rsvp:edit_confirmation',
  MANAGE_CAROUSELS = 'rsvp:manage_carousels',
  MANAGE_FILES = 'rsvp:manage_files',
  VIEW_RSVPS = 'rsvp:view_rsvps',
  EXPORT_RSVPS = 'rsvp:export_rsvps',
}
```

### 2. Add Permission Checks to API Routes

All routes that modify data should:
```typescript
// 1. Get current user
const userId = await getUserIdFromSession();
if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// 2. Check permission in database
const hasPermission = await checkUserPermission(userId, 'rsvp:edit_project', projectId);
if (!hasPermission) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

// 3. Proceed with operation
```

### 3. Add Permission Checks to Client Components

```typescript
// Before showing edit button
const canEdit = userPermissions.includes('rsvp:edit_project');
{canEdit && <button onClick={() => setIsEditing(true)}>Edit</button>}
```

### 4. Add Audit Trail

Currently using `$userID` parameter for MP auditing. Could expand to:
- Local audit table: RSVP_Audit_Log
- Track: User_ID, Action, Project_ID, Event_ID, Timestamp, Changes

### 5. Project-Level Permissions

Option A: Role-based (simpler)
```
"RSVP Admin" role → Can manage all projects
"RSVP Editor" role → Can manage assigned projects
"RSVP Viewer" role → View only
```

Option B: Project assignment-based (more granular)
```
Create RSVP_Project_Managers junction table:
- Project_ID (FK)
- User_ID (FK)
- Can_Edit (bool)
- Can_Delete (bool)
```

---

## 10. DATA FLOW DIAGRAM

```
User → Middleware (app-level access) 
     → Page (/rsvp/[slug]) 
     → Component State 
     → API Route (/api/rsvp/...)
     → Service (ProjectRSVPService)
     → MinistryPlatform Tables/API
```

### Current State:
- ✓ Middleware checks app access
- ✗ Page doesn't check operation permissions
- ✗ Component doesn't check edit permissions
- ✗ API doesn't validate user authorization
- ✗ Service doesn't audit changes

### Recommended State:
- ✓ Middleware checks app access
- ✓ Page receives user permissions from API
- ✓ Component hides buttons if user lacks permission
- ✓ API validates permission before operation
- ✓ Service logs changes to audit table
- ✓ Frontend shows toast/dialog if operation denied

---

## 11. NEXT STEPS FOR IMPLEMENTATION

1. **Define Permission Schema**
   - Create database table for RSVP permissions
   - Map user roles to permissions
   - Add permission fields to appPermissions table

2. **Create Permission Check Utility**
   - `/src/utils/rsvpPermissions.ts`
   - Function to check if user has specific RSVP permission
   - Cache results to avoid repeated DB queries

3. **Update API Routes**
   - Add permission check at start of each PATCH/POST/DELETE route
   - Return 403 Forbidden if no permission
   - Log permission denials

4. **Update UI Components**
   - Fetch user permissions from new endpoint
   - Conditionally render edit/delete buttons
   - Show disabled state if user lacks permission
   - Add helpful tooltips explaining why button is disabled

5. **Add Audit Logging**
   - Create RSVP_Audit_Log table
   - Log all create/update/delete operations
   - Include User_ID, timestamp, what changed

6. **Testing Checklist**
   - Test each API route with unauthorized user
   - Test page with read-only user
   - Test page with full-access user
   - Verify buttons hidden/disabled appropriately
   - Verify audit logs record all changes

---

## FILE REFERENCE MAP

| Type | Path | Purpose |
|------|------|---------|
| **Page** | `/src/app/(app)/rsvp/page.tsx` | Project list |
| **Page** | `/src/app/(app)/rsvp/[slug]/page.tsx` | Project detail (3,544 lines) |
| **Component** | `/src/components/rsvp/TemplateSelector.tsx` | Template dropdown |
| **Component** | `/src/components/rsvp/AmenitiesEditor.tsx` | Amenity editor |
| **Service** | `/src/services/projectRsvpService.ts` | Business logic |
| **API** | `/src/app/api/rsvp/projects/route.ts` | Project list endpoint |
| **API** | `/src/app/api/rsvp/projects/[projectId]/route.ts` | Project CRUD |
| **API** | `/src/app/api/rsvp/events/[eventId]/route.ts` | Event update |
| **API** | `/src/app/api/rsvp/projects/[projectId]/files/route.ts` | File management |
| **API** | `/src/app/api/rsvp/confirmation-cards/[cardId]/route.ts` | Card update |
| **API** | `/src/app/api/rsvp/templates/route.ts` | Template list |
| **Auth** | `/src/middleware.ts` | App access control |
| **Auth** | `/src/utils/auth.ts` | Session utilities |
| **Schema** | `/src/db/schema.ts` | Database schema |

---

## SUMMARY

The RSVP app currently has **app-level access control** (users need permission to view `/rsvp`) but **NO granular role-based permissions** for:
- Specific projects
- Specific operations (edit, delete, view)
- Sensitive data (RSVPs, contact info)

All authenticated users with app access can **edit any project** or **view all RSVPs**, regardless of their role or department.

To implement role-based permissions, you need to:
1. Add permission definitions for each operation
2. Create permission mappings in database
3. Add checks to API routes (before data modification)
4. Update UI to show/hide buttons based on permissions
5. Add audit logging for compliance

