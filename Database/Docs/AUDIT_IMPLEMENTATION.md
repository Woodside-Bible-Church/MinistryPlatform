# RSVP Widget - Audit Logging Implementation

## Overview

This document describes the audit logging implementation for the RSVP submission stored procedure (`api_Custom_RSVP_Submit_JSON`). The implementation uses MinistryPlatform's native auditing infrastructure to track all RSVP-related database changes.

## Problem Statement

When using stored procedures to modify data in MinistryPlatform (instead of the API directly), automatic audit logging is bypassed. This means RSVP submissions, answers, and participant registrations were not being tracked in the audit log, losing valuable traceability for:
- Who submitted RSVPs
- When submissions occurred
- What data was entered
- Troubleshooting failed submissions

## Solution

Integrated audit logging using MP's existing `mp_ServiceAuditLog` table type and `util_createauditlogentries` stored procedure utility. This approach:
- ✅ Uses MP's standard audit infrastructure (`dp_Audit_Log`, `dp_Audit_Detail`)
- ✅ Captures all INSERT operations automatically via OUTPUT clauses
- ✅ Maintains transaction integrity (audit logs roll back if submission fails)
- ✅ Tracks submitter context (email address, User_ID if authenticated)
- ✅ No custom tables needed - leverages existing MP audit tables

## Implementation Details

### 1. Audit Variables Setup

```sql
-- Audit Logging Setup
DECLARE @AuditUserName NVARCHAR(254) = 'RSVPWidget'
      , @AuditUserID INT = 0
DECLARE @ToBeAudited mp_ServiceAuditLog

-- Set audit username to include submitter email for traceability
SET @AuditUserName = 'RSVPWidget (' + @Email_Address + ')'

-- If Contact_ID exists and is linked to a User, use that User_ID for auditing
IF @Contact_ID IS NOT NULL
BEGIN
    SELECT TOP 1 @AuditUserID = User_ID
    FROM dp_Users
    WHERE Contact_ID = @Contact_ID
END
```

**What this does:**
- Creates a table variable to hold audit records
- Sets username to "RSVPWidget (user@email.com)" for easy identification
- Looks up the User_ID if the contact is a registered user (for authenticated submissions)

### 2. Event_RSVP Insert with Audit Logging

```sql
INSERT INTO Event_RSVPs (
    Event_ID,
    Project_RSVP_ID,
    Contact_ID,
    First_Name,
    Last_Name,
    Email_Address,
    Phone_Number,
    Submission_Date,
    Confirmation_Code,
    Is_Guest,
    Domain_ID
)
OUTPUT 'Event_RSVPs',
       INSERTED.Event_RSVP_ID,
       'Created',
       @AuditUserID,
       @AuditUserName,
       NULL,NULL,NULL,NULL,NULL,NULL
INTO @ToBeAudited
VALUES (...)
```

**What this does:**
- Inserts the main RSVP record
- OUTPUT clause captures the insert into the audit staging table
- Records: Table name, Record ID, Action ('Created'), User ID, Username

### 3. Event_RSVP_Answers Insert with Audit Logging

```sql
INSERT INTO Event_RSVP_Answers (...)
OUTPUT 'Event_RSVP_Answers',
       INSERTED.Event_RSVP_Answer_ID,
       'Created',
       @AuditUserID,
       @AuditUserName,
       NULL,NULL,NULL,NULL,NULL,NULL
INTO @ToBeAudited
SELECT ... FROM OPENJSON(@Answers);
```

**What this does:**
- Inserts all question answers from the JSON payload
- Each answer insert is captured individually in the audit log
- Allows tracking of which specific questions were answered

### 4. Event_Participant Insert with Audit Logging

```sql
INSERT INTO Event_Participants (...)
OUTPUT 'Event_Participants',
       INSERTED.Event_Participant_ID,
       'Created',
       @AuditUserID,
       @AuditUserName,
       NULL,NULL,NULL,NULL,NULL,NULL
INTO @ToBeAudited
VALUES (...)
```

**What this does:**
- Inserts the event participant registration record (if Contact_ID exists)
- Captures participant registration in audit log

### 5. Write Audit Logs to Database

```sql
-- Write Audit Logs to dp_Audit_Log
IF EXISTS (SELECT 1 FROM @ToBeAudited)
BEGIN
    EXEC dbo.util_createauditlogentries @ToBeAudited
END

COMMIT TRANSACTION;
```

**What this does:**
- Calls MP's utility procedure to write all staged audit records
- Writes to `dp_Audit_Log` (main audit table) and `dp_Audit_Detail` (field-level changes)
- Happens before COMMIT, so audit logs roll back if an error occurs

## What Gets Logged

For each RSVP submission, the following records are created in `dp_Audit_Log`:

1. **Event_RSVPs record** - Main RSVP entry
   - Table: `Event_RSVPs`
   - Record ID: Event_RSVP_ID
   - Action: `Created`
   - User: `RSVPWidget (user@email.com)` or User_ID if authenticated

2. **Event_RSVP_Answers records** - One per question answered
   - Table: `Event_RSVP_Answers`
   - Record ID: Event_RSVP_Answer_ID (for each answer)
   - Action: `Created`

3. **Event_Participants record** - Registration record (if Contact_ID exists)
   - Table: `Event_Participants`
   - Record ID: Event_Participant_ID
   - Action: `Created`

## Querying Audit Logs

### View all RSVP-related audit activity

```sql
SELECT TOP 100
    al.Audit_Item_ID,
    al.Table_Name,
    al.Record_ID,
    al.Audit_Description,
    al.User_Name,
    al.Date_Time,
    ad.Field_Name,
    ad.Field_Label,
    ad.Previous_Value,
    ad.New_Value
FROM dp_Audit_Log al
LEFT JOIN dp_Audit_Detail ad ON al.Audit_Item_ID = ad.Audit_Item_ID
WHERE al.Table_Name IN ('Event_RSVPs', 'Event_RSVP_Answers', 'Event_Participants')
ORDER BY al.Date_Time DESC;
```

### View audit trail for a specific RSVP

```sql
DECLARE @EventRSVPID INT = 123;

-- Get Event_RSVP audit
SELECT * FROM dp_Audit_Log
WHERE Table_Name = 'Event_RSVPs'
  AND Record_ID = @EventRSVPID
ORDER BY Date_Time;

-- Get related answers audit
SELECT al.*, ad.*
FROM Event_RSVP_Answers era
INNER JOIN dp_Audit_Log al ON al.Table_Name = 'Event_RSVP_Answers'
                            AND al.Record_ID = era.Event_RSVP_Answer_ID
LEFT JOIN dp_Audit_Detail ad ON al.Audit_Item_ID = ad.Audit_Item_ID
WHERE era.Event_RSVP_ID = @EventRSVPID
ORDER BY al.Date_Time;
```

### View all RSVPs submitted via widget in last 24 hours

```sql
SELECT
    al.Date_Time AS Submission_Time,
    al.User_Name,
    al.Record_ID AS Event_RSVP_ID,
    er.Confirmation_Code,
    er.First_Name,
    er.Last_Name,
    er.Email_Address,
    e.Event_Title
FROM dp_Audit_Log al
INNER JOIN Event_RSVPs er ON al.Record_ID = er.Event_RSVP_ID
INNER JOIN Events e ON er.Event_ID = e.Event_ID
WHERE al.Table_Name = 'Event_RSVPs'
  AND al.Audit_Description = 'Created'
  AND al.User_Name LIKE 'RSVPWidget%'
  AND al.Date_Time >= DATEADD(HOUR, -24, GETDATE())
ORDER BY al.Date_Time DESC;
```

### Count RSVPs by day

```sql
SELECT
    CAST(al.Date_Time AS DATE) AS Submission_Date,
    COUNT(*) AS Total_RSVPs,
    COUNT(CASE WHEN er.Is_Guest = 1 THEN 1 END) AS Guest_RSVPs,
    COUNT(CASE WHEN er.Is_Guest = 0 THEN 1 END) AS Member_RSVPs
FROM dp_Audit_Log al
INNER JOIN Event_RSVPs er ON al.Record_ID = er.Event_RSVP_ID
WHERE al.Table_Name = 'Event_RSVPs'
  AND al.Audit_Description = 'Created'
  AND al.User_Name LIKE 'RSVPWidget%'
GROUP BY CAST(al.Date_Time AS DATE)
ORDER BY Submission_Date DESC;
```

## Benefits

### 1. Compliance & Traceability
- Full audit trail of all RSVP submissions
- Track who submitted what, when
- Meets compliance requirements for data tracking

### 2. Troubleshooting
- Diagnose submission failures
- Identify duplicate submissions
- Track changes over time (if UPDATE functionality is added later)

### 3. Analytics & Reporting
- Analyze RSVP patterns (peak submission times, guest vs member breakdown)
- Track form abandonment (if we add partial submission tracking)
- Measure widget usage and performance

### 4. Data Integrity
- Audit logs are transaction-safe (roll back with failed submissions)
- No data loss if submission fails mid-process
- Consistent with MP's standard audit infrastructure

## Future Enhancements

### 1. IP Address & User Agent Tracking

Add parameters to stored procedure:
```sql
@IP_Address NVARCHAR(50) = NULL,
@User_Agent NVARCHAR(500) = NULL
```

Extract in API route:
```typescript
const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
const userAgent = req.headers['user-agent'];
```

### 2. Audit RSVP Updates/Cancellations

When adding update/cancel functionality, use OUTPUT clause with 'Updated' or 'Deleted':
```sql
UPDATE Event_RSVPs
SET Status = 'Cancelled'
OUTPUT 'Event_RSVPs',
       INSERTED.Event_RSVP_ID,
       'Updated',
       @AuditUserID,
       @AuditUserName,
       NULL,NULL,NULL,NULL,NULL,NULL
INTO @ToBeAudited
WHERE Event_RSVP_ID = @EventRSVPID
```

### 3. Error Logging

Add error tracking to CATCH block:
```sql
BEGIN CATCH
    -- Log error attempt
    INSERT INTO @ToBeAudited
    SELECT 'Event_RSVPs', NULL, 'Error', @AuditUserID,
           @AuditUserName + ' - ' + ERROR_MESSAGE(),
           NULL,NULL,NULL,NULL,NULL,NULL

    IF EXISTS (SELECT 1 FROM @ToBeAudited)
        EXEC dbo.util_createauditlogentries @ToBeAudited

    ROLLBACK TRANSACTION;
END CATCH
```

## Deployment Steps

1. **Review the updated stored procedure**
   - File: `database/sp-submit-rsvp-with-audit.sql`

2. **Verify prerequisites exist**
   ```sql
   -- Check for mp_ServiceAuditLog table type
   SELECT * FROM sys.table_types WHERE name = 'mp_ServiceAuditLog'

   -- Check for util_createauditlogentries proc
   SELECT * FROM sys.procedures WHERE name = 'util_createauditlogentries'
   ```

3. **Deploy to test environment**
   - Run `sp-submit-rsvp-with-audit.sql` in test database
   - Grant EXECUTE permission to API user

4. **Test RSVP submission**
   - Submit test RSVP via widget
   - Query `dp_Audit_Log` to verify records were created

5. **Deploy to production**
   - Schedule deployment during maintenance window
   - Run script in production database
   - Monitor audit logs for first few submissions

## Files Changed

- **New:** `database/sp-submit-rsvp-with-audit.sql` - Updated stored procedure with auditing
- **Documentation:** `database/AUDIT_IMPLEMENTATION.md` - This file

## Testing Checklist

- [ ] Verify audit records created for Event_RSVPs
- [ ] Verify audit records created for Event_RSVP_Answers (multiple records)
- [ ] Verify audit records created for Event_Participants (when Contact_ID exists)
- [ ] Verify audit username includes submitter email
- [ ] Verify User_ID is populated when Contact has MP User account
- [ ] Verify audit logs roll back on submission error
- [ ] Query audit logs to confirm traceability
- [ ] Test guest RSVP (no Contact_ID) - should still create audit logs
- [ ] Test member RSVP (with Contact_ID) - should include User_ID

## Support

For questions or issues with audit logging:
1. Check `dp_Audit_Log` for recent entries
2. Verify `util_createauditlogentries` exists and is accessible
3. Review stored procedure execution logs
4. Contact: Colton Wirgau
