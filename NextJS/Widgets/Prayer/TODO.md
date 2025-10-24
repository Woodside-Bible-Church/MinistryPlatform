# Prayer Widget - Outstanding TODOs

Last Updated: October 24, 2025

## ✅ Recently Completed
- Profile images displayed in all card headers (My Requests, Prayer Partners, Community Needs)
- User_Info section added to stored procedure with image URLs
- Unified widget data API endpoint (`/api/prayers/widget-data`)
- Image retrieval using app-level permissions via stored procedure
- Contact images from `dp_files` table with proper privacy rules

---

## 🔴 High Priority - Database/Stored Procedure

### 1. Staff Role Detection
**Location:** `/database/unified-prayer-widget-proc.sql:184-191`

**Issue:** Currently defaults to non-staff for all users, which prevents staff-only visibility filtering.

**Solution Needed:**
```sql
-- Need to implement staff check, e.g.:
SELECT @Is_Staff = CASE WHEN EXISTS (
    SELECT 1 FROM dp_Users u
    INNER JOIN dp_User_Security_Roles usr ON u.User_ID = usr.User_ID
    WHERE u.Contact_ID = @ContactID
    AND usr.Security_Role_ID IN (1, 2, 3) -- Replace with actual staff role IDs
) THEN 1 ELSE 0 END;
```

**Impact:** Staff users cannot see prayers marked as "Staff Only" until this is implemented.

---

### 2. Visibility Level Mapping
**Location:** `/database/unified-prayer-widget-proc.sql:275-281`

**Issue:** Visibility levels are hardcoded assumptions:
- 4 = Public
- 3 = Members Only
- 2 = Staff Only
- 1 = Private

**Solution Needed:**
- Verify these IDs match your MinistryPlatform `Visibility_Levels` table
- Optionally join to the actual table for dynamic labels
- Update hardcoded values if they differ

**Impact:** Prayers may have incorrect visibility if IDs don't match.

---

### 3. Care Outcome ID for Answered Prayers
**Location:** `/database/unified-prayer-widget-proc.sql:286-287`

**Issue:** Currently marks any prayer with a non-NULL `Care_Outcome_ID` as answered.

**Solution Needed:**
```sql
-- Need to verify which Care_Outcome_ID values mean "answered", e.g.:
CASE WHEN f.Care_Outcome_ID IN (3, 4, 5) THEN 1 ELSE 0 END AS Is_Answered
```

**Impact:** "Is Answered" flag may be inaccurate.

---

### 4. Campus Filter Implementation
**Location:** `/database/unified-prayer-widget-proc.sql:401-404`

**Issue:** Campus filtering is disabled because `Congregation_ID` doesn't exist in `Contacts` table.

**Solution Needed:**
- Determine correct field for campus: `Household_ID`, `Congregation_Name`, or join to another table
- Implement the filter once field is identified

**Impact:** Cannot filter prayers by campus/location.

---

## 🟡 Medium Priority - User-Facing Features

### 5. "Pray Again" Button Functionality
**Location:** `/src/components/prayer/PeoplePrayedFor.tsx:74-77`

**Status:** Button exists but only logs to console.

**What's Needed:**
- Open dialog to add another prayer response
- Call API: `POST /api/prayers/{id}/pray` with optional new message
- Update prayer count in UI

**User Story:** "As a user, I want to pray for the same request multiple times and leave different encouraging messages."

---

### 6. "Add Update" Feature (My Prayers)
**Location:** `/src/components/prayer/MyPrayers.tsx:382-393`

**Status:** Dialog shows "Update functionality coming soon!"

**What's Needed:**
- Create form component for prayer updates
- API endpoint: `POST /api/prayers/{id}/updates`
- Save to `Feedback_Entry_Updates` table
- Display updates on prayer cards

**Database Table:** `Feedback_Entry_Updates`
- `Feedback_Entry_Update_ID` (PK)
- `Feedback_Entry_ID` (FK)
- `Update_Text`
- `Update_Date`
- `Is_Answered` (boolean)

**User Story:** "As a user, I want to share updates on my prayer requests (e.g., 'God answered this!', 'Still praying for...')."

---

### 7. "Mark Answered" Feature (My Prayers)
**Location:** `/src/components/prayer/MyPrayers.tsx:335`

**Status:** Button triggers same "coming soon" dialog as "Add Update"

**What's Needed:**
- Allow user to mark their prayer as answered
- Optionally require a testimony/update when marking answered
- Update `Care_Outcome_ID` in `Feedback_Entries`
- Update `Is_Answered` flag in stored procedure response

**User Story:** "As a user, I want to mark my prayer as answered and share how God worked."

---

## 🟢 Low Priority - Security & Code Cleanup

### 8. PostMessage Origin Verification
**Location:** `/src/app/(app)/page.tsx:89`

**Issue:** Widget listens for auth tokens from parent window without verifying origin.

**Solution:**
```typescript
if (event.origin !== 'https://woodsidebible.org') return;
```

**Impact:** Minor security risk if embedded on untrusted sites.

---

### 9. Re-enable Visibility Filtering
**Location:** `/src/services/prayerService.ts:76`

**Issue:** Visibility filtering is disabled pending data population.

**Solution:** Once `Visibility_Level_ID` is consistently populated in `Feedback_Entries`, remove the comment and enable the filter.

---

### 10. Remove/Update Legacy API Routes
**Location:** `/src/app/api/prayers/prayed-for/route.ts`

**Issue:** This route may be obsolete now that we use `/api/prayers/widget-data` unified endpoint.

**Solution:**
- Audit which routes are still being used
- Remove unused routes or update TODO comments
- The `contactImageUrl: null // TODO` is now handled by unified endpoint

---

## 📋 Future Enhancements (Not Urgent)

- **Prayer Streaks:** Improve streak calculation algorithm (currently simplified)
- **Prayer Categories:** Add category filtering in UI
- **Search:** Add search functionality for prayer text
- **Notifications:** Email notifications for prayer updates
- **Analytics:** Track which prayers get the most engagement
- **Anonymous Prayers:** Allow users to submit prayers without revealing identity
- **Prayer Teams:** Assign prayers to specific groups or teams

---

## 🧪 Testing Checklist

Before deploying to production:

- [ ] Verify staff role detection works correctly
- [ ] Test all visibility levels (Public, Members, Staff, Private)
- [ ] Confirm image URLs work for all users with profile photos
- [ ] Test "Add Update" feature end-to-end
- [ ] Test "Mark Answered" feature end-to-end
- [ ] Test "Pray Again" functionality
- [ ] Verify prayer counts are accurate
- [ ] Test mobile swipe gestures
- [ ] Test widget embedded in WordPress
- [ ] Verify postMessage auth token sync works
- [ ] Load test with 100+ prayers

---

## 📝 Notes for Next Session

**Current State:**
- Widget successfully displays prayers with images
- Stored procedure returns all data in one call
- Auth works both standalone and embedded
- UI is mobile-responsive with swipe functionality

**Blockers:**
- None currently

**Quick Wins:**
- Implement "Add Update" dialog (highest user value)
- Add origin verification (easy security fix)
- Fix staff role detection (enables proper privacy)
