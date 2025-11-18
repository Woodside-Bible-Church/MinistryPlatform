## 📧 RSVP Email Campaigns - Complete Guide

## Overview

The RSVP Email Campaigns system provides two types of emails:

1. **Confirmation Email** - Simple, always sent immediately after RSVP
2. **Email Campaigns** - Flexible, conditional, unlimited reminders and follow-ups

## Architecture

```
User Submits RSVP
       ↓
api_Custom_RSVP_Submit_JSON creates Event_RSVP record
       ↓
Calls api_Custom_Schedule_RSVP_Emails
       ↓
├── Send Confirmation Email (immediate, always)
└── Evaluate & Schedule Campaigns (conditional, future)
       ↓
Creates dp_Communications + dp_Communication_Messages
       ↓
Ministry Platform automatically sends based on Start_Date + Action_Status_ID
```

---

## Database Schema

### Tables Created

**1. Project_RSVPs (modified)**
- `Confirmation_Template_ID` - Template sent immediately after RSVP

**2. RSVP_Email_Campaigns**
- Campaign configuration (template, timing, conditions)
- Scoped to Project_RSVP_ID and optional Congregation_ID

**3. RSVP_Email_Campaign_Conditions**
- Defines when a campaign should be sent
- Based on user's answers to RSVP questions
- All conditions must be true (AND logic)

**4. RSVP_Email_Campaign_Log**
- Audit trail of all scheduled emails
- Useful for debugging and analytics

---

## Installation

### Step 1: Run Database Migrations

```bash
sqlcmd -S your-server -d MinistryPlatform -i database/rsvp-email-campaigns-migration.sql
sqlcmd -S your-server -d MinistryPlatform -i database/sp-schedule-rsvp-emails.sql
```

### Step 2: Update api_Custom_RSVP_Submit_JSON

Add this code **after** creating the Event_RSVP record:

```sql
-- Build answers JSON for email templates
DECLARE @Answers_JSON NVARCHAR(MAX);

SELECT @Answers_JSON = (
    SELECT
        a.Project_RSVP_Question_ID AS Question_ID,
        q.Question_Text,
        COALESCE(
            CAST(a.Numeric_Value AS NVARCHAR(100)),
            CASE WHEN a.Boolean_Value = 1 THEN 'Yes' ELSE 'No' END,
            CONVERT(NVARCHAR(50), a.Date_Value, 101),
            a.Text_Value,
            'No answer'
        ) AS Answer
    FROM Event_RSVP_Answers a
    INNER JOIN Project_RSVP_Questions q ON a.Project_RSVP_Question_ID = q.Project_RSVP_Question_ID
    WHERE a.Event_RSVP_ID = @Event_RSVP_ID
    FOR JSON PATH
);

-- Schedule confirmation email + campaigns
EXEC api_Custom_Schedule_RSVP_Emails
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
    @Author_User_ID = 1;
```

---

## Configuration

### 1. Confirmation Email (Required)

Set confirmation template on your project:

```sql
UPDATE Project_RSVPs
SET Confirmation_Template_ID = 100  -- Your template ID
WHERE Project_RSVP_ID = 1;
```

**This is the only required setup.** Without it, no emails will be sent.

### 2. Email Campaigns (Optional)

Create campaigns for reminders, follow-ups, and conditional emails.

---

## Campaign Examples

### Example 1: 2-Day Reminder (Everyone)

```sql
INSERT INTO RSVP_Email_Campaigns (
    Campaign_Name,
    Campaign_Description,
    Project_RSVP_ID,
    Congregation_ID,
    Communication_Template_ID,
    Send_Timing_Type,
    Send_Days_Offset,
    Is_Active,
    Display_Order
) VALUES (
    '2-Day Reminder',
    'Reminder sent 2 days before event',
    1,  -- Christmas Services project
    NULL,  -- All campuses
    101,  -- Template ID
    'Days_Before_Event',
    2,  -- 2 days before
    1,  -- Active
    1   -- Order
);

-- No conditions = sent to everyone
```

### Example 2: New Visitor Welcome (Conditional)

```sql
-- Create campaign
INSERT INTO RSVP_Email_Campaigns (
    Campaign_Name,
    Project_RSVP_ID,
    Communication_Template_ID,
    Send_Timing_Type,
    Send_Days_Offset,
    Is_Active,
    Display_Order
) VALUES (
    'New Visitor Welcome',
    1,
    102,
    'Days_After_Event',
    1,  -- 1 day after event
    1,
    2
);

DECLARE @CampaignID INT = SCOPE_IDENTITY();

-- Add condition: Only send if "Are you new?" = Yes
INSERT INTO RSVP_Email_Campaign_Conditions (
    Campaign_ID,
    Question_ID,  -- Your question ID for "Are you new to Woodside?"
    Condition_Type,
    Condition_Value
) VALUES (
    @CampaignID,
    5,
    'Equals',
    'Yes'
);
```

### Example 3: Large Group Info (Multiple Conditions)

```sql
-- Create campaign
INSERT INTO RSVP_Email_Campaigns (
    Campaign_Name,
    Project_RSVP_ID,
    Communication_Template_ID,
    Send_Timing_Type,
    Send_Days_Offset,
    Is_Active,
    Display_Order
) VALUES (
    'Large Group Information',
    1,
    103,
    'Days_Before_Event',
    3,
    1,
    3
);

DECLARE @LargeGroupCampaignID INT = SCOPE_IDENTITY();

-- Condition 1: Party size >= 6
INSERT INTO RSVP_Email_Campaign_Conditions VALUES (
    @LargeGroupCampaignID,
    2,  -- Counter question "How many people?"
    'Greater_Or_Equal',
    '6'
);

-- Condition 2: Need childcare = Yes
INSERT INTO RSVP_Email_Campaign_Conditions VALUES (
    @LargeGroupCampaignID,
    8,  -- Checkbox question "Need childcare?"
    'Is_True',
    NULL
);

-- Both conditions must be true for campaign to send
```

---

## Campaign Timing Types

### `Days_Before_Event`
Send X days before the event starts.

```sql
Send_Timing_Type = 'Days_Before_Event'
Send_Days_Offset = 2  -- Send 2 days before event

Event Date: Dec 24, 2024 at 5:00 PM
Send Date:  Dec 22, 2024 at 5:00 PM
```

### `Days_After_Event`
Send X days after the event starts.

```sql
Send_Timing_Type = 'Days_After_Event'
Send_Days_Offset = 1  -- Send 1 day after event

Event Date: Dec 24, 2024 at 5:00 PM
Send Date:  Dec 25, 2024 at 5:00 PM
```

### `Specific_DateTime`
Send at a specific date/time (ignores event date).

```sql
Send_Timing_Type = 'Specific_DateTime'
Send_Specific_DateTime = '2024-12-20 10:00:00'  -- Exact send time
```

---

## Condition Types

### Text Comparisons

**`Equals`** - Exact match
```sql
Condition_Type = 'Equals'
Condition_Value = 'Yes'
```

**`Not_Equals`** - Not a match
```sql
Condition_Type = 'Not_Equals'
Condition_Value = 'No'
```

**`Contains`** - Text contains substring
```sql
Condition_Type = 'Contains'
Condition_Value = 'Kids'
```

**`Not_Contains`** - Text doesn't contain substring
```sql
Condition_Type = 'Not_Contains'
Condition_Value = 'None'
```

### Numeric Comparisons

**`Greater_Than`** / **`Less_Than`**
```sql
Condition_Type = 'Greater_Than'
Condition_Value = '5'
```

**`Greater_Or_Equal`** / **`Less_Or_Equal`**
```sql
Condition_Type = 'Greater_Or_Equal'
Condition_Value = '6'
```

### Boolean Checks

**`Is_True`** - Checkbox is checked or answer = "Yes", "True", "1"
```sql
Condition_Type = 'Is_True'
Condition_Value = NULL
```

**`Is_False`** - Checkbox is unchecked or answer = "No", "False", "0"
```sql
Condition_Type = 'Is_False'
Condition_Value = NULL
```

### Null Checks

**`Is_Null`** - Question was not answered
```sql
Condition_Type = 'Is_Null'
Condition_Value = NULL
```

**`Is_Not_Null`** - Question was answered
```sql
Condition_Type = 'Is_Not_Null'
Condition_Value = NULL
```

---

## Email Template Shortcodes

All templates (confirmation + campaigns) support these shortcodes:

### Contact Info
- `[First_Name]` - Recipient's first name
- `[Last_Name]` - Recipient's last name
- `[Email_Address]` - Recipient's email
- `[Phone_Number]` - Recipient's phone

### Event Info
- `[Event_Title]` - Event name
- `[Event_Date]` - "Tuesday, December 24"
- `[Event_Time]` - "5:00 PM"
- `[Event_Day]` - "Tuesday"
- `[Event_Month_Day]` - "December 24"
- `[Event_Start_Date_ISO]` - ISO format for calendar
- `[Event_End_Date_ISO]` - ISO format for calendar

### Campus Info
- `[Campus_Name]` - Campus name
- `[Campus_Location]` - Short location
- `[Campus_Address]` - Street address
- `[Campus_City]` - City
- `[Campus_State]` - State
- `[Campus_Zip]` - Zip code
- `[Campus_Full_Address]` - Complete address
- `[Google_Maps_URL]` - Google Maps link

### RSVP Info
- `[Confirmation_Code]` - Unique code
- `[Party_Size]` - Number of people
- `[Event_RSVP_ID]` - Database ID
- `[RSVP_Title]` - Project title
- `[RSVP_Description]` - Project description

### Dynamic Content
- `[Answers_List]` - Auto-generated HTML list of all question/answer pairs

---

## Testing

### Test Confirmation Email

1. Configure confirmation template:
```sql
UPDATE Project_RSVPs
SET Confirmation_Template_ID = 100
WHERE Project_RSVP_ID = 1;
```

2. Submit test RSVP through widget

3. Check `dp_Communications`:
```sql
SELECT TOP 5
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

### Test Campaign

1. Create test campaign (e.g., 1 day after event)
2. Submit RSVP for event happening tomorrow
3. Check campaign log:
```sql
SELECT
    log.Log_ID,
    log.Campaign_Type,
    camp.Campaign_Name,
    log.Scheduled_Send_Date,
    c.Subject
FROM RSVP_Email_Campaign_Log log
LEFT JOIN RSVP_Email_Campaigns camp ON log.Campaign_ID = camp.Campaign_ID
LEFT JOIN dp_Communications c ON log.Communication_ID = c.Communication_ID
WHERE log.Event_RSVP_ID = @YourRSVPID;
```

### Test Conditions

```sql
-- See which campaigns would fire for an RSVP
SELECT
    c.Campaign_Name,
    c.Send_Timing_Type,
    c.Send_Days_Offset,
    COUNT(cond.Condition_ID) as Conditions_Count
FROM RSVP_Email_Campaigns c
LEFT JOIN RSVP_Email_Campaign_Conditions cond ON c.Campaign_ID = cond.Campaign_ID
WHERE c.Project_RSVP_ID = 1
  AND c.Is_Active = 1
GROUP BY c.Campaign_ID, c.Campaign_Name, c.Send_Timing_Type, c.Send_Days_Offset
ORDER BY c.Display_Order;
```

---

## Troubleshooting

### No Emails Being Sent

**Check 1: Is confirmation template configured?**
```sql
SELECT
    pr.Project_RSVP_ID,
    pr.RSVP_Title,
    pr.Confirmation_Template_ID,
    ct.Template_Name
FROM Project_RSVPs pr
LEFT JOIN dp_Communication_Templates ct ON pr.Confirmation_Template_ID = ct.Communication_Template_ID
WHERE pr.Project_RSVP_ID = 1;
```

**Check 2: Are Communication records being created?**
```sql
SELECT TOP 10 * FROM dp_Communications ORDER BY Communication_ID DESC;
SELECT TOP 10 * FROM dp_Communication_Messages ORDER BY Communication_Message_ID DESC;
```

**Check 3: Is stored procedure being called?**
```sql
-- Add this to api_Custom_RSVP_Submit_JSON for debugging
PRINT 'Calling api_Custom_Schedule_RSVP_Emails...';
EXEC api_Custom_Schedule_RSVP_Emails ...
PRINT 'Email scheduling complete';
```

### Campaign Not Triggering

**Check 1: Are conditions configured correctly?**
```sql
SELECT
    camp.Campaign_Name,
    cond.Question_ID,
    q.Question_Text,
    cond.Condition_Type,
    cond.Condition_Value
FROM RSVP_Email_Campaigns camp
INNER JOIN RSVP_Email_Campaign_Conditions cond ON camp.Campaign_ID = cond.Campaign_ID
LEFT JOIN Project_RSVP_Questions q ON cond.Question_ID = q.Project_RSVP_Question_ID
WHERE camp.Campaign_ID = @YourCampaignID;
```

**Check 2: Did user's answer match condition?**
```sql
-- Check user's actual answers
SELECT
    q.Project_RSVP_Question_ID AS Question_ID,
    q.Question_Text,
    COALESCE(
        CAST(a.Numeric_Value AS NVARCHAR(100)),
        CASE WHEN a.Boolean_Value = 1 THEN 'Yes' ELSE 'No' END,
        a.Text_Value,
        'No answer'
    ) AS User_Answer
FROM Event_RSVP_Answers a
INNER JOIN Project_RSVP_Questions q ON a.Project_RSVP_Question_ID = q.Project_RSVP_Question_ID
WHERE a.Event_RSVP_ID = @YourRSVPID;
```

**Check 3: Is send date in the future?**
```sql
-- Campaign send dates must be in the future
SELECT
    Campaign_Name,
    Send_Timing_Type,
    Send_Days_Offset,
    CASE
        WHEN Send_Timing_Type = 'Days_Before_Event' THEN DATEADD(DAY, -Send_Days_Offset, @Event_Start_Date)
        WHEN Send_Timing_Type = 'Days_After_Event' THEN DATEADD(DAY, Send_Days_Offset, @Event_Start_Date)
        ELSE Send_Specific_DateTime
    END AS Calculated_Send_Date,
    CASE WHEN Calculated_Send_Date > GETDATE() THEN 'Will Send' ELSE 'In Past - Skipped' END AS Status
FROM RSVP_Email_Campaigns
WHERE Project_RSVP_ID = 1 AND Is_Active = 1;
```

---

## Admin UI Preview (for Projects App)

```
📧 Email Campaigns - Christmas Services 2024

[+ New Campaign]

┌─────────────────────────────────────────────────┐
│ ✉️ 2-Day Reminder                               │
│ Sends: 2 days before event                     │
│ To: Everyone (no conditions)                    │
│ Template: Christmas Reminder 2024               │
│ Status: ✅ Active                               │
│ [Edit] [Duplicate] [Deactivate]                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✉️ New Visitor Welcome                          │
│ Sends: 1 day after event                       │
│ To: New visitors only                           │
│ Conditions:                                     │
│   • "Are you new to Woodside?" = Yes            │
│ Template: New Visitor Welcome                   │
│ Status: ✅ Active                               │
│ [Edit] [Duplicate] [Deactivate]                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✉️ Large Group Info                             │
│ Sends: 3 days before event                     │
│ To: Groups of 6+ people                         │
│ Conditions:                                     │
│   • "How many people?" >= 6                     │
│ Template: Group Arrival Info                    │
│ Status: ✅ Active                               │
│ [Edit] [Duplicate] [Deactivate]                │
└─────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Run database migrations
2. ✅ Update api_Custom_RSVP_Submit_JSON
3. ✅ Create confirmation template
4. ✅ Link confirmation template to project
5. ✅ Test RSVP submission
6. 📧 Create campaign templates (optional)
7. 🎯 Create campaigns with conditions (optional)
8. 🚀 Build Projects Admin App for easier management

---

## Benefits

✅ **Simple Confirmation** - Always works, can't accidentally break
✅ **Unlimited Campaigns** - Add as many as you need
✅ **Smart Targeting** - Send relevant emails based on answers
✅ **Reusable** - Copy campaigns across projects
✅ **Scalable** - No code changes needed for new campaigns
✅ **Audit Trail** - Track all scheduled emails
✅ **MP Native** - Uses MP's built-in email system
