# RSVP Email Confirmation - Integration Guide

## Overview

This guide explains how to integrate automatic email confirmations and reminders into the RSVP system.

## Architecture

```
User Submits RSVP
       ↓
api_Custom_RSVP_Submit_JSON (existing stored procedure)
       ↓
Creates Event_RSVP record + answers
       ↓
Calls api_Custom_Send_RSVP_Confirmation_Email (new stored procedure)
       ↓
Creates dp_Communications + dp_Communication_Messages records
       ↓
Returns confirmation to frontend
```

## Integration Steps

### 1. Run Database Migrations

Execute in this order:

```bash
# Step 1: Add template fields to tables
sqlcmd -S your-server -d MinistryPlatform -i database/rsvp-email-confirmation-migration.sql

# Step 2: Create email sending stored procedure
sqlcmd -S your-server -d MinistryPlatform -i database/sp-send-rsvp-confirmation-email.sql
```

### 2. Update api_Custom_RSVP_Submit_JSON

Add this code **after** the Event_RSVP record is created:

```sql
-- In api_Custom_RSVP_Submit_JSON, after Event_RSVPs INSERT:

-- Build answers JSON for email template
DECLARE @Answers_JSON NVARCHAR(MAX);

-- Generate JSON array of question/answer pairs
SELECT @Answers_JSON = (
    SELECT
        q.Question_Text,
        COALESCE(
            CAST(a.Numeric_Value AS NVARCHAR(100)),
            CASE WHEN a.Boolean_Value = 1 THEN 'Yes' ELSE 'No' END,
            CONVERT(NVARCHAR(50), a.Date_Value, 101), -- MM/DD/YYYY format
            a.Text_Value,
            'No answer'
        ) AS Answer
    FROM Event_RSVP_Answers a
    INNER JOIN RSVP_Questions q ON a.Question_ID = q.Question_ID
    WHERE a.Event_RSVP_ID = @Event_RSVP_ID
    FOR JSON PATH
);

-- Send confirmation and reminder emails
EXEC api_Custom_Send_RSVP_Confirmation_Email
    @Event_RSVP_ID = @Event_RSVP_ID,
    @Event_ID = @Event_ID,
    @Congregation_ID = @Congregation_ID,
    @Project_RSVP_ID = @Project_RSVP_ID,
    @First_Name = @First_Name,
    @Last_Name = @Last_Name,
    @Email_Address = @Email_Address,
    @Phone_Number = @Phone_Number,
    @Confirmation_Code = @Confirmation_Code,
    @Party_Size = @Party_Size,
    @Answers_JSON = @Answers_JSON,
    @Author_User_ID = 1; -- Or use authenticated user ID if available
```

### 3. Update api_Custom_RSVP_Project_Data_JSON

Add template ID fields to the Events SELECT:

```sql
-- In api_Custom_RSVP_Project_Data_JSON, update Events query:

SELECT
    e.Event_ID,
    e.Event_Title,
    -- ... existing columns ...

    -- ADD THESE:
    c.Confirmation_Email_Template_ID AS Campus_Confirmation_Template_ID,
    c.Reminder_Email_Template_ID AS Campus_Reminder_Template_ID,
    pr.Default_Confirmation_Template_ID,
    pr.Default_Reminder_Template_ID,
    pr.Reminder_Days_Before
FROM Events e
INNER JOIN Project_RSVPs pr ON e.Project_ID = pr.Project_ID
LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
-- ... rest of query ...
```

## Email Template Configuration

### Template Hierarchy

When sending emails, the system uses this priority:

1. **Campus-Specific** (`Congregations.Confirmation_Email_Template_ID` or `Reminder_Email_Template_ID`)
2. **Project Default** (`Project_RSVPs.Default_Confirmation_Template_ID` or `Default_Reminder_Template_ID`)
3. **No Email** (if neither is configured)

### Creating Email Templates

1. Go to **Communications > Communication Templates** in Ministry Platform
2. Create a new template with these settings:
   - **Template Name**: "RSVP Confirmation - Christmas 2024"
   - **Subject**: "You're confirmed for [Event_Title]!"
   - **Body**: Use HTML with shortcodes (see list below)
   - **From Contact**: Select system email contact
   - **Reply To Contact**: Select appropriate staff contact

### Available Shortcodes

#### Contact Info
- `[First_Name]` - Recipient's first name
- `[Last_Name]` - Recipient's last name
- `[Email_Address]` - Recipient's email
- `[Phone_Number]` - Recipient's phone number

#### Event Info
- `[Event_Title]` - Event name
- `[Event_Date]` - "Tuesday, December 24"
- `[Event_Time]` - "5:00 PM"
- `[Event_Day]` - "Tuesday"
- `[Event_Month_Day]` - "December 24"
- `[Event_Start_Date_ISO]` - ISO format for calendar links
- `[Event_End_Date_ISO]` - ISO format for calendar links

#### Campus Info
- `[Campus_Name]` - Campus name
- `[Campus_Location]` - Short location descriptor
- `[Campus_Address]` - Street address
- `[Campus_City]` - City
- `[Campus_State]` - State
- `[Campus_Zip]` - Zip code
- `[Campus_Full_Address]` - Complete formatted address
- `[Google_Maps_URL]` - Link to Google Maps

#### RSVP Info
- `[Confirmation_Code]` - Unique confirmation code
- `[Party_Size]` - Number of attendees
- `[Event_RSVP_ID]` - Database record ID
- `[RSVP_Title]` - Project title (e.g., "Christmas Services 2024")
- `[RSVP_Description]` - Project description

#### Dynamic Content
- `[Answers_List]` - Auto-generated HTML list of all question/answer pairs

### Linking Templates to Projects/Campuses

#### Option 1: Campus-Specific Templates

```sql
-- Set confirmation template for Troy Campus
UPDATE Congregations
SET Confirmation_Email_Template_ID = 123,  -- Template ID
    Reminder_Email_Template_ID = 124       -- Template ID
WHERE Congregation_ID = 5; -- Troy
```

#### Option 2: Project-Wide Default Templates

```sql
-- Set default templates for entire Christmas 2024 project
UPDATE Project_RSVPs
SET Default_Confirmation_Template_ID = 125,
    Default_Reminder_Template_ID = 126,
    Reminder_Days_Before = 2  -- Send reminder 2 days before event
WHERE Project_RSVP_ID = 1;
```

## Email Sending Behavior

### Confirmation Email (Immediate)
- **When**: Sent immediately after RSVP submission
- **How**: Creates `dp_Communications` and `dp_Communication_Messages` records
- **Status**: `Action_Status_ID = NULL` (sends immediately via MP's email processor)

### Reminder Email (Scheduled)
- **When**: Sent X days before event (configured via `Reminder_Days_Before`)
- **How**: Creates `dp_Communications` with future `Start_Date` and `dp_Communication_Messages` with `Action_Status = 'Ready to Send'`
- **Example**:
  - Event: December 24, 5:00 PM
  - Reminder_Days_Before: 2
  - Send Date: December 22, 5:00 PM

## Testing

### Test Confirmation Email

1. Set up a test template:
```sql
INSERT INTO dp_Communication_Templates (
    Template_Name, Subject_Text, Body_Html, From_Contact, Reply_to_Contact
) VALUES (
    'RSVP Test Confirmation',
    'Test: [Event_Title] Confirmation for [First_Name]',
    '<p>Hi [First_Name],</p><p>Your RSVP for <strong>[Event_Title]</strong> is confirmed!</p>',
    1, -- Replace with actual contact ID
    1  -- Replace with actual contact ID
);
```

2. Link template to project:
```sql
UPDATE Project_RSVPs
SET Default_Confirmation_Template_ID = <template_id>
WHERE Project_RSVP_ID = 1;
```

3. Submit a test RSVP through the widget

4. Check `dp_Communications` and `dp_Communication_Messages` tables:
```sql
SELECT TOP 5 *
FROM dp_Communications
ORDER BY Communication_ID DESC;

SELECT TOP 5 *
FROM dp_Communication_Messages
ORDER BY Communication_Message_ID DESC;
```

### Test Reminder Email

1. Create a reminder template (similar to above)
2. Set reminder configuration:
```sql
UPDATE Project_RSVPs
SET Default_Reminder_Template_ID = <template_id>,
    Reminder_Days_Before = 1  -- Send 1 day before (for testing)
WHERE Project_RSVP_ID = 1;
```

3. Submit RSVP for an event happening tomorrow
4. Verify scheduled message in `dp_Communication_Messages` with `Action_Status = 'Ready to Send'`

## Troubleshooting

### Emails Not Sending

**Check 1: Are templates configured?**
```sql
SELECT
    pr.Project_RSVP_ID,
    pr.RSVP_Title,
    pr.Default_Confirmation_Template_ID,
    pr.Default_Reminder_Template_ID,
    c.Congregation_Name,
    c.Confirmation_Email_Template_ID,
    c.Reminder_Email_Template_ID
FROM Project_RSVPs pr
LEFT JOIN Congregations c ON 1=1 -- Show all campuses for this project
WHERE pr.Project_RSVP_ID = 1;
```

**Check 2: Are Communication records being created?**
```sql
SELECT TOP 10
    c.Communication_ID,
    c.Subject,
    c.Start_Date,
    cm.[To],
    ast.Action_Status
FROM dp_Communications c
LEFT JOIN dp_Communication_Messages cm ON c.Communication_ID = cm.Communication_ID
LEFT JOIN dp_Action_Statuses ast ON cm.Action_Status_ID = ast.Action_Status_ID
ORDER BY c.Communication_ID DESC;
```

**Check 3: Is stored procedure being called?**
- Add `PRINT` statements to `api_Custom_RSVP_Submit_JSON`
- Monitor SQL Server Profiler during RSVP submission

### Shortcodes Not Replaced

- Verify shortcode spelling matches exactly (case-sensitive)
- Check if value is NULL (will show as empty string)
- Review `sp-send-rsvp-confirmation-email.sql` REPLACE statements

### Reminder Not Scheduled

- Verify `Reminder_Days_Before` is set on project
- Confirm event date is in the future
- Check that reminder send date (`Event_Start_Date - Reminder_Days_Before`) is in the future

## Next Steps

1. ✅ Run database migrations
2. ✅ Update stored procedures
3. 🎨 Create beautiful email templates
4. 🔗 Link templates to campuses/projects
5. ✅ Test end-to-end flow
6. 🚀 Deploy to production
