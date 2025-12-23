# RSVP App - Quick Reference Guide

## Critical Finding: NO Granular Permissions

**Status:** All authenticated users with app access can edit ANY project and view ALL RSVPs.

---

## API Routes That Need Permission Checks

### Data Modification Routes (PATCH/POST/DELETE)

| Route | Method | Purpose | Permission Needed | File |
|-------|--------|---------|-------------------|------|
| `/api/rsvp/projects/[projectId]` | PATCH | Update project config | edit_project | `projects/[projectId]/route.ts` |
| `/api/rsvp/events/[eventId]` | PATCH | Update event fields | edit_events | `events/[eventId]/route.ts` |
| `/api/rsvp/projects/[projectId]/files` | POST | Upload image | manage_files | `projects/[projectId]/files/route.ts` |
| `/api/rsvp/projects/[projectId]/files` | DELETE | Delete image | manage_files | `projects/[projectId]/files/route.ts` |
| `/api/rsvp/confirmation-cards/[cardId]` | PATCH | Update card config | edit_confirmation | `confirmation-cards/[cardId]/route.ts` |
| `/api/rsvp/events/[eventId]/carousels` | PUT | Create/update carousel | manage_carousels | `events/[eventId]/carousels/route.ts` |

---

## UI Components That Need Permission Checks

### Located in: `/src/app/(app)/rsvp/[slug]/page.tsx`

**Tab: Details**
- Project Info edit button → `handleSaveProjectInfo()`
- General Settings edit button → `handleSaveGeneralSettings()`
- Email Templates edit button → `handleTemplateUpdate()`
- Colors edit button → `handleSaveColors()`
- Image upload/delete → `handleImageUpload()`, `handleImageDelete()`

**Tab: Campuses**
- Event instructions edit → `handleSaveMeetingInstructions()`
- Event capacity edit → `handleSaveEventCapacity()`
- Amenities edit → `handleSaveAmenities()`
- Confirmation card edit → `handleSaveConfirmationCard()`
- Carousel create/edit/delete → `handleOpenCarouselDialog()`, `handleEditCarouselName()`, `handleDeleteCarousel()`

**Tab: RSVPs**
- Display only (no edit/delete currently exposed)

---

## How to Add Permission Checks

### Step 1: API Route (Backend Protection)

```typescript
import { getUserIdFromSession } from '@/utils/auth';
import { checkUserPermission } from '@/utils/rsvpPermissions';

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const userId = await getUserIdFromSession();
    
    // Permission check
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const hasPermission = await checkUserPermission(userId, 'edit_project', parseInt(projectId));
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Proceed with operation
    const body = await request.json();
    // ...rest of implementation
  } catch (error) {
    // error handling
  }
}
```

### Step 2: Component (Frontend Display)

```typescript
// In /src/app/(app)/rsvp/[slug]/page.tsx

const [userPermissions, setUserPermissions] = useState<string[]>([]);

useEffect(() => {
  async function loadPermissions() {
    const response = await fetch(`/api/rsvp/permissions`);
    if (response.ok) {
      const data = await response.json();
      setUserPermissions(data.permissions);
    }
  }
  loadPermissions();
}, []);

// In render:
{userPermissions.includes('edit_project') && (
  <button onClick={() => setIsEditingProjectInfo(true)}>
    Edit Project Info
  </button>
)}

{!userPermissions.includes('edit_project') && (
  <button disabled title="You don't have permission to edit projects">
    Edit Project Info
  </button>
)}
```

### Step 3: Permission Utility

Create `/src/utils/rsvpPermissions.ts`:

```typescript
import { db } from '@/db';
import { appPermissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function checkUserPermission(
  userId: number,
  action: string,
  projectId: number
): Promise<boolean> {
  // For now, simple role-based checks
  // Can expand to project-level permissions later
  
  // Check if user has 'RSVP Admin' role → all permissions
  const adminPerms = await db.query.appPermissions.findFirst({
    where: and(
      eq(appPermissions.roleName, 'RSVP Admin'),
      eq(appPermissions.canView, true)
    ),
  });
  
  if (adminPerms) return true;
  
  // Check specific permission based on action
  const actionMap: Record<string, string> = {
    'edit_project': 'RSVP Editor',
    'edit_events': 'RSVP Editor',
    'manage_files': 'RSVP Editor',
    'edit_confirmation': 'RSVP Editor',
    'manage_carousels': 'RSVP Editor',
    'view_rsvps': 'RSVP Viewer',
  };
  
  const requiredRole = actionMap[action];
  if (!requiredRole) return false;
  
  const hasPermission = await db.query.appPermissions.findFirst({
    where: and(
      eq(appPermissions.roleName, requiredRole),
      eq(appPermissions.canView, true)
    ),
  });
  
  return !!hasPermission;
}
```

---

## Database Schema Changes Needed

### Option 1: Simple Role-Based

No schema changes needed. Just create roles:
- `RSVP Admin` → Full access
- `RSVP Editor` → Can edit projects/events
- `RSVP Viewer` → View only

Assign roles to users via existing `appPermissions` table.

### Option 2: Project-Level Permissions (More Granular)

Create new table:
```sql
CREATE TABLE RSVP_Project_Permissions (
  Permission_ID INT PRIMARY KEY IDENTITY,
  Project_ID INT NOT NULL,
  User_ID INT NOT NULL,
  Can_View BIT,
  Can_Edit BIT,
  Can_Delete BIT,
  Can_Manage_Files BIT,
  Can_View_RSVPs BIT,
  Created_By INT,
  Created_Date DATETIME DEFAULT GETDATE(),
  Domain_ID INT
);
```

---

## Testing Checklist

- [ ] Test API with unauthorized user (should return 403)
- [ ] Test API with authorized user (should succeed)
- [ ] Test that edit button hidden for unauthorized user
- [ ] Test that edit button shown for authorized user
- [ ] Test that disabled button shows helpful tooltip
- [ ] Test permission cache (if implemented)
- [ ] Test admin override still works
- [ ] Check audit logs for all operations

---

## Service Layer Methods (No Changes Needed)

All methods in `ProjectRSVPService` already have proper auditing via `getUserIdFromSession()`:
- `updateProject()`
- `updateProjectEvent()`
- etc.

Just ensure permission is checked BEFORE calling these methods.

---

## Related Files

**Middleware (App-level access):**
- `/src/middleware.ts` - Only checks app access, not granular

**Session/Auth:**
- `/src/utils/auth.ts` - Get User_ID from session
- `/src/auth.ts` - NextAuth configuration

**Database:**
- `/src/db/schema.ts` - Current appPermissions schema

**RSVP Service:**
- `/src/services/projectRsvpService.ts` - Business logic (no permission checks)

---

## Current Audit Logging

**GOOD:** Event updates pass `$userID` to MinistryPlatform:
```typescript
// From /api/rsvp/events/[eventId]/route.ts
const queryParams = userId ? { $userID: userId } : {};
await mp.put(`/tables/Events`, [updatePayload], queryParams);
```

**MISSING:** No local audit log for:
- Project updates
- File uploads/deletes
- Carousel operations
- Confirmation card updates

Consider adding RSVP_Audit_Log table to track all operations.

---

## Implementation Priority

1. **CRITICAL:** Add permission check to file upload/delete routes (DELETE operations)
2. **HIGH:** Add permission check to project/event update routes (PATCH operations)
3. **MEDIUM:** Add permission check to confirmation card updates
4. **MEDIUM:** Add permission check to carousel operations
5. **LOW:** Add local audit logging (MinistryPlatform audit may be sufficient)

---

## Questions Before Implementation

1. Should permissions be role-based or project-based?
   - Role-based (simpler): All RSVP Editors can edit all projects
   - Project-based (complex): Only assigned editors can edit specific projects

2. Should different roles exist for different operations?
   - Current: Just "RSVP Editor" for all edits
   - Alternative: Separate roles for project/event/file/carousel management

3. What should happen when unauthorized user tries to access?
   - Return 403 Forbidden (recommended)
   - Show generic error message
   - Log security event

4. Should RSVPs be viewable by all RSVP users or restricted?
   - Current: Visible to anyone with app access
   - Recommended: Should check permission for sensitive data

