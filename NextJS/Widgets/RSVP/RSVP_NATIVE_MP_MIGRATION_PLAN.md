# RSVP Migration to Native MinistryPlatform Tables

## Overview

Migrating the RSVP system from custom tables to native MinistryPlatform tables for better integration and data consistency.

## Current State (Custom Tables)

### Tables Being Deprecated:
1. **Project_RSVPs** - Project RSVP configuration
2. **Event_RSVPs** - Individual RSVP submissions
3. **Event_RSVP_Answers** - Answers to RSVP questions
4. **Project_RSVP_Questions** - Form questions
5. **Question_Options** - Question options/choices
6. **RSVP_Email_Campaigns** - Email campaign configuration
7. **RSVP_Email_Campaign_Conditions** - Campaign conditions
8. **RSVP_Email_Campaign_Log** - Campaign send history
9. **RSVP_Statuses** - RSVP status lookup

## Target State (Native MP Tables)

### Tables We're Using:
1. **Projects** (already has RSVP fields added)
   - RSVP_Title, RSVP_Description
   - RSVP_Slug (for URL routing)
   - RSVP_Is_Active
   - RSVP_Start_Date, RSVP_End_Date
   - RSVP_Require_Contact_Lookup
   - RSVP_Allow_Guest_Submission
   - RSVP_Primary_Color, RSVP_Secondary_Color, RSVP_Accent_Color
   - RSVP_BG_Image_URL, RSVP_Image_URL (from dp_Files)

2. **Events** (already has RSVP fields added)
   - Project_ID (links to Projects)
   - Include_In_RSVP (boolean flag)
   - RSVP_Capacity (per-event capacity limit - NEW)
   - RSVP_Capacity_Modifier (adjust displayed count)

3. **Forms** (native MP table)
   - Form_ID
   - Form_Title
   - Form_Description
   - Project_ID (link form to project)

4. **Form_Fields** (native MP table + custom config)
   - Form_Field_ID
   - Form_ID
   - Field_Order
   - Field_Label
   - Field_Type_ID (MP native types)
   - Required
   - **Custom_Field_Configuration** (JSON - NEW FIELD)
     ```json
     {
       "component": "Counter",
       "min_value": 1,
       "max_value": 99,
       "icon": "Users",
       "helper_text": "How many people?"
     }
     ```

5. **Form_Responses** (native MP table)
   - Form_Response_ID
   - Form_ID
   - Contact_ID (submitter)
   - Response_Date

6. **Form_Response_Answers** (native MP table)
   - Form_Response_Answer_ID
   - Form_Response_ID
   - Form_Field_ID
   - Response (text answer)

7. **Event_Participants** (native MP table + RSVP field)
   - Event_Participant_ID
   - Event_ID
   - Participant_ID (Contact_ID)
   - Participation_Status_ID (2 = Registered)
   - **RSVP_Party_Size** (NEW FIELD)
   - Notes (JSON with contact info + answers)
     ```
     First Name: Amy
     Last Name: Johnson
     Phone: 586-287-0916
     Email: amyjohnson51381@gmail.com
     Address1: 49121 pine glen dr
     City, State Zip: Chesterfield, Mi 48051

     Answer Summary:
     How many people?: 4
     I am new to Woodside: False
     ```
   - Setup_Date (GETDATE())
   - Attending_Online (0)
   - Registrant_Message_Sent (0)

8. **Project_Confirmation_Cards** (keep - custom table for confirmation page)
   - Card_ID
   - Project_ID
   - Card_Type_ID
   - Configuration (JSON)

## Migration Steps

### Phase 1: Add New Fields (COMPLETE)
- [x] Add RSVP fields to Projects table
- [x] Add RSVP fields to Events table (Project_ID, Include_In_RSVP, RSVP_Capacity)
- [x] Add RSVP_Party_Size to Event_Participants
- [x] Add Custom_Field_Configuration to Form_Fields

### Phase 2: Data Migration
1. **Migrate Questions to Forms**
   ```sql
   -- Create Form for each Project
   INSERT INTO Forms (Form_Title, Form_Description, Project_ID, ...)
   SELECT RSVP_Title, RSVP_Description, Project_ID
   FROM Projects WHERE RSVP_Is_Active = 1;

   -- Migrate Questions to Form_Fields
   INSERT INTO Form_Fields (Form_ID, Field_Order, Field_Label, Required, Custom_Field_Configuration)
   SELECT
       f.Form_ID,
       q.Field_Order,
       q.Question_Text,
       q.Is_Required,
       JSON_OBJECT(
           'component', qt.Component_Name,
           'min_value', q.Min_Value,
           'max_value', q.Max_Value,
           'icon', q.Icon_Name,
           'helper_text', q.Helper_Text
       )
   FROM Project_RSVP_Questions q
   INNER JOIN Forms f ON f.Project_ID = (SELECT Project_ID FROM Projects WHERE ...)
   INNER JOIN Question_Types qt ON q.Question_Type_ID = qt.Question_Type_ID;
   ```

2. **Migrate RSVPs to Event_Participants**
   ```sql
   -- Create Event_Participant for each RSVP
   INSERT INTO Event_Participants (
       Event_ID,
       Participant_ID,
       Participation_Status_ID,
       RSVP_Party_Size,
       Notes,
       Setup_Date,
       Attending_Online,
       Registrant_Message_Sent
   )
   SELECT
       er.Event_ID,
       ISNULL(er.Contact_ID, 2), -- Default contact if guest
       2, -- Registered status
       (SELECT TOP 1 Answer_Numeric FROM Event_RSVP_Answers WHERE Event_RSVP_ID = er.Event_RSVP_ID AND Answer_Numeric IS NOT NULL),
       -- Build Notes field
       CONCAT(
           'First Name: ', er.First_Name, CHAR(13), CHAR(10),
           'Last Name: ', er.Last_Name, CHAR(13), CHAR(10),
           'Phone: ', ISNULL(er.Phone_Number, ''), CHAR(13), CHAR(10),
           'Email: ', er.Email_Address, CHAR(13), CHAR(10),
           CHAR(13), CHAR(10),
           'Answer Summary:', CHAR(13), CHAR(10),
           (SELECT STRING_AGG(CONCAT(q.Question_Text, ': ', a.Answer_Text), CHAR(13) + CHAR(10))
            FROM Event_RSVP_Answers a
            INNER JOIN Project_RSVP_Questions q ON a.Project_RSVP_Question_ID = q.Project_RSVP_Question_ID
            WHERE a.Event_RSVP_ID = er.Event_RSVP_ID)
       ),
       er.Submission_Date,
       0, -- Not online
       0  -- Message not sent
   FROM Event_RSVPs er;
   ```

3. **Migrate Answers to Form_Response_Answers**
   ```sql
   -- Create Form_Response for each RSVP
   INSERT INTO Form_Responses (Form_ID, Contact_ID, Response_Date)
   SELECT
       f.Form_ID,
       er.Contact_ID,
       er.Submission_Date
   FROM Event_RSVPs er
   INNER JOIN Events e ON er.Event_ID = e.Event_ID
   INNER JOIN Forms f ON f.Project_ID = e.Project_ID;

   -- Migrate answers
   INSERT INTO Form_Response_Answers (Form_Response_ID, Form_Field_ID, Response)
   SELECT
       fr.Form_Response_ID,
       ff.Form_Field_ID,
       CASE
           WHEN era.Answer_Text IS NOT NULL THEN era.Answer_Text
           WHEN era.Answer_Numeric IS NOT NULL THEN CAST(era.Answer_Numeric AS NVARCHAR)
           WHEN era.Answer_Boolean IS NOT NULL THEN CASE WHEN era.Answer_Boolean = 1 THEN 'Yes' ELSE 'No' END
           WHEN era.Answer_Date IS NOT NULL THEN CONVERT(NVARCHAR, era.Answer_Date, 101)
       END
   FROM Event_RSVP_Answers era
   INNER JOIN Event_RSVPs er ON era.Event_RSVP_ID = er.Event_RSVP_ID
   INNER JOIN Events e ON er.Event_ID = e.Event_ID
   INNER JOIN Forms f ON f.Project_ID = e.Project_ID
   INNER JOIN Form_Responses fr ON fr.Form_ID = f.Form_ID AND fr.Contact_ID = er.Contact_ID
   INNER JOIN Project_RSVP_Questions prq ON era.Project_RSVP_Question_ID = prq.Project_RSVP_Question_ID
   INNER JOIN Form_Fields ff ON ff.Form_ID = f.Form_ID AND ff.Field_Order = prq.Field_Order;
   ```

### Phase 3: Update Stored Procedures
1. **Update Get Project Data Procedure**
   - Query Projects table directly (not Project_RSVPs)
   - Query Forms/Form_Fields (not Project_RSVP_Questions)
   - Return Events with RSVP_Capacity
   - Keep Project_Confirmation_Cards as-is

2. **Update Submit RSVP Procedure**
   - Create Event_Participant record (not Event_RSVPs)
   - Create Form_Response + Form_Response_Answers (not Event_RSVP_Answers)
   - Set RSVP_Party_Size field
   - Build Notes field with contact info + answers
   - Set Participant_ID = 2 (default contact) if guest RSVP

### Phase 4: Update Frontend
1. Update TypeScript types
2. Update API routes
3. Test submission flow
4. Test question rendering
5. Test confirmation page

### Phase 5: Drop Old Tables (IN ORDER)
```sql
-- Drop in dependency order (children first, parents last)
DROP TABLE IF EXISTS Event_RSVP_Answers;
DROP TABLE IF EXISTS Event_RSVPs;
DROP TABLE IF EXISTS Question_Options;
DROP TABLE IF EXISTS Project_RSVP_Questions;
DROP TABLE IF EXISTS RSVP_Email_Campaign_Conditions;
DROP TABLE IF EXISTS RSVP_Email_Campaign_Log;
DROP TABLE IF EXISTS RSVP_Email_Campaigns;
DROP TABLE IF EXISTS RSVP_Statuses;
DROP TABLE IF EXISTS Project_RSVPs;
DROP TABLE IF EXISTS Question_Types;  -- If not used elsewhere
DROP TABLE IF EXISTS Card_Types;  -- If not used elsewhere
```

## Benefits of Native MP Tables

1. **Better Integration** - Works with existing MP workflows
2. **Reporting** - Use MP's built-in reporting for RSVPs
3. **Event Participants** - See RSVPs in Event Management
4. **Forms** - Reuse forms across multiple projects
5. **Contact Management** - Better tracking of who RSVP'd
6. **Less Maintenance** - Fewer custom tables to manage
7. **Audit Trail** - MP's native audit logging works

## Risks & Mitigation

### Risk: Data Loss During Migration
**Mitigation:**
- Create full backup before migration
- Test migration on copy of database first
- Keep old tables until verified working

### Risk: MP Updates Breaking Custom Fields
**Mitigation:**
- Document all custom fields added to MP tables
- Test after each MP update
- Use naming convention: RSVP_* or Custom_*

### Risk: Performance Issues with Notes Field
**Mitigation:**
- Index Event_Participants.Notes if needed
- Consider separate lookup table if performance degrades
- Monitor query performance

## Testing Checklist

- [ ] Run database migrations
- [ ] Migrate sample data
- [ ] Test form submission
- [ ] Verify Event_Participant creation
- [ ] Verify Form_Response creation
- [ ] Test capacity checking
- [ ] Test confirmation page
- [ ] Test with guest (no Contact_ID)
- [ ] Test with authenticated user
- [ ] Verify email sending still works
- [ ] Check MP Event Management shows participants
- [ ] Verify reporting works

## Rollback Plan

If migration fails:
1. Restore database backup
2. Keep using old stored procedures
3. Investigate issues before retrying

## Timeline

- **Phase 1:** Complete ✓
- **Phase 2:** 2-3 hours (data migration scripts)
- **Phase 3:** 2-3 hours (stored procedure updates)
- **Phase 4:** 2-3 hours (frontend updates)
- **Phase 5:** 30 minutes (drop tables)

**Total Estimated Time:** 7-10 hours

## Next Steps

1. Review and approve this migration plan
2. Create full database backup
3. Run Phase 1 migrations (add new fields)
4. Create and test Phase 2 migration scripts
5. Update and test stored procedures
6. Update frontend code
7. Test end-to-end
8. Drop old tables
