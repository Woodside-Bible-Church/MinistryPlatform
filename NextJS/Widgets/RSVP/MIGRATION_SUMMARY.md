# RSVP System Migration Summary

## Overview

This document summarizes the migration from custom RSVP tables to native MinistryPlatform tables completed on 2025-11-19.

## What Changed

### Database Schema

**New Fields Added to Existing MP Tables:**
1. ✅ `Event_Participants.RSVP_Party_Size` (INT, nullable) - stores party size
2. ✅ `Form_Fields.Custom_Field_Configuration` (NVARCHAR(MAX), nullable) - stores JSON config
3. ✅ `Project_Confirmation_Cards.Project_ID` (INT, NOT NULL) - links to Projects table

**New Neon Database Table:**
- ✅ `rsvp_field_types` - Metadata for 20 custom field types with MP fallback mappings

### Stored Procedures

**Updated - Get Project Data:**
- File: `database/sp-get-project-rsvp-data-with-slug-v2.sql`
- Changes:
  - Queries `Projects` table directly (not `Project_RSVPs`)
  - Always includes implicit "How many people?" counter question (Question_ID = 0)
  - Queries `Forms`/`Form_Fields` for additional questions (if Form_ID is linked)
  - Uses `Event_Participants` for RSVP counts (filters by Participation_Status_ID = 2)
  - Queries `Project_Confirmation_Cards` by `Project_ID`

**Updated - Submit RSVP:**
- File: `database/sp-submit-rsvp-with-audit-v2.sql`
- Changes:
  - Creates `Event_Participant` record with `RSVP_Party_Size` and formatted `Notes`
  - Calls `api_Common_FindMatchingContact` for guest RSVPs
    - 1 match: uses that Contact_ID
    - 0 or >1 matches: uses default Contact_ID = 2
  - Creates `Form_Response` and `Form_Response_Answers` (not Event_RSVPs/Answers)
  - Stores all contact info in `Notes` field with answer summary
  - Question_ID = 0 (party size) stored in `RSVP_Party_Size`, not in Form_Response_Answers

### Key Architecture Changes

**1. Implicit "How many people?" Question:**
- Every RSVP always asks this question (Question_ID = 0, Field_Order = 0)
- Stored in `Event_Participants.RSVP_Party_Size` field
- NOT stored in `Form_Response_Answers`
- Form questions (if any) start at Field_Order = 1

**2. Forms are Optional:**
- `Projects.Form_ID` can be NULL (no additional questions)
- If Form_ID is NULL, only the implicit party size question is asked
- If Form_ID is set, additional questions come from `Form_Fields` table

**3. Contact Matching for Guests:**
- Calls `[dbo].[api_Common_FindMatchingContact]` with name, email, phone
- Uses Contact_ID = 2 (default) for unmatched guests
- Uses Participant_ID = 1 (default) in some contexts

**4. Event_Participants.Notes Format:**
```
First Name: Amy
Last Name: Johnson
Phone: 586-287-0916
Email: amyjohnson51381@gmail.com
Address1: 49121 pine glen dr
Address2:
City, State Zip: Chesterfield, Mi 48051
Country:

Answer Summary:
How many people?: 4
I am new to Woodside: False
```

## Migration Scripts Created

### MinistryPlatform SQL Server

1. `Database/Migrations/2025-11-19-add-rsvp-party-size-to-event-participants.sql`
   - Adds `RSVP_Party_Size` field to `Event_Participants`

2. `Database/Migrations/2025-11-19-add-custom-config-to-form-fields.sql`
   - Adds `Custom_Field_Configuration` JSON field to `Form_Fields`
   - Adds check constraint for valid JSON

3. `Database/Migrations/2025-11-19-update-confirmation-cards-project-id.sql`
   - Adds `Project_ID` to `Project_Confirmation_Cards`
   - Migrates data from `Project_RSVP_ID` to `Project_ID`
   - Adds foreign key and index

### Neon PostgreSQL

1. `database/neon-migrations/001-create-rsvp-field-types.sql`
   - Creates `rsvp_field_types` table
   - Inserts all 20 custom field types with metadata
   - ✅ Successfully ran on 2025-11-19

## Tables to be Deprecated

**Will be dropped AFTER data migration is complete:**

1. `Event_RSVPs` → Replaced by `Event_Participants`
2. `Event_RSVP_Answers` → Replaced by `Form_Response_Answers`
3. `Project_RSVP_Questions` → Replaced by `Form_Fields`
4. `Question_Options` → Replaced by JSON in `Custom_Field_Configuration`
5. `Project_RSVPs` → Replaced by `Projects` (with RSVP fields)
6. `RSVP_Email_Campaign_Conditions` → Not yet replaced
7. `RSVP_Email_Campaign_Log` → Not yet replaced
8. `RSVP_Email_Campaigns` → Not yet replaced
9. `RSVP_Statuses` → Not yet replaced
10. `Question_Types` → Replaced by `rsvp_field_types` in Neon

## 20 Custom Field Types

All stored in Neon `rsvp_field_types` table:

| Component Name | MP Fallback | Requires Options | Requires Min/Max |
|---------------|-------------|-----------------|------------------|
| Counter | Text Field | No | Yes |
| Checkbox | Checkbox | No | No |
| Text | Text Field | No | No |
| Textarea | Text Area | No | No |
| Dropdown | Dropdown | Yes | No |
| Radio | Radio Button | Yes | No |
| Multi-Checkbox | Checkbox | Yes | No |
| Searchable Dropdown | Dropdown | Yes | No |
| Multi-Select Dropdown | Dropdown | Yes | No |
| Tag Input | Text Field | No | No |
| Button Group | Radio Button | Yes | No |
| Multi-Button Group | Checkbox | Yes | No |
| Slider | Text Field | No | Yes |
| Rating | Text Field | No | Yes |
| Date | Date Picker | No | No |
| Time | Text Field | No | No |
| Email | Email Address | No | No |
| Phone | Phone Number | No | No |
| File Upload | Text Field | No | No |
| Color Picker | Text Field | No | No |

## Next Steps

### Pending Tasks (in order):

1. **Migrate existing RSVP data to new tables**
   - Script to copy Event_RSVPs → Event_Participants
   - Script to copy Event_RSVP_Answers → Form_Response_Answers
   - Verify data integrity after migration

2. **Drop old RSVP tables** (in correct dependency order):
   ```sql
   -- Drop in this order (children first, parents last):
   DROP TABLE IF EXISTS Event_RSVP_Answers;
   DROP TABLE IF EXISTS Event_RSVPs;
   DROP TABLE IF EXISTS Question_Options;
   DROP TABLE IF EXISTS Project_RSVP_Questions;
   DROP TABLE IF EXISTS RSVP_Email_Campaign_Conditions;
   DROP TABLE IF EXISTS RSVP_Email_Campaign_Log;
   DROP TABLE IF EXISTS RSVP_Email_Campaigns;
   DROP TABLE IF EXISTS RSVP_Statuses;
   DROP TABLE IF EXISTS Project_RSVPs;
   DROP TABLE IF EXISTS Question_Types;
   ```

3. **Update TypeScript types** to match new schema
   - Update `src/types/rsvp.ts`
   - Change `Project_RSVP_ID` → `Project_ID`
   - Add `Form_ID` to Project type
   - Add `Custom_Field_Configuration` to question types

4. **Test end-to-end RSVP flow**
   - Submit RSVP as authenticated user
   - Submit RSVP as guest (test contact matching)
   - Verify Event_Participant creation
   - Verify Form_Response creation (if form linked)
   - Test confirmation page rendering
   - Verify Notes field formatting
   - Test capacity checking with new Event_Participants count

## Benefits of This Migration

1. **Better MP Integration** - Works with native MP workflows and reporting
2. **Simplified Schema** - Fewer custom tables to maintain
3. **Reusable Forms** - Forms can be used across multiple projects
4. **Contact Management** - Better tracking via Event_Participants
5. **Audit Trail** - MP's native audit logging works automatically
6. **Extensibility** - Custom_Field_Configuration allows unlimited field types
7. **Fallback Support** - If RSVP widget breaks, forms still work in MP

## Documentation References

- **Field Type Mapping:** `RSVP_FIELD_TYPE_MAPPING.md`
- **Original Migration Plan:** `RSVP_NATIVE_MP_MIGRATION_PLAN.md`
- **Neon Connection:** Apps project in Woodside Bible Church org

## Migration Completion Status

- [x] Add RSVP_Party_Size to Event_Participants
- [x] Add Custom_Field_Configuration to Form_Fields
- [x] Add Project_ID to Project_Confirmation_Cards
- [x] Create Neon rsvp_field_types table and insert data
- [x] Update get project data stored procedure (v2)
- [x] Update submit RSVP stored procedure (v2)
- [ ] Migrate existing RSVP data to new tables
- [ ] Drop old RSVP tables
- [ ] Update TypeScript types
- [ ] Test end-to-end flow
- [ ] Deploy to production

**Last Updated:** 2025-11-19
