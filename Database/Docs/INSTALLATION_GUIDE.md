# RSVP Widget Database Installation Guide

## Quick Start

Run these 5 SQL files in order on your MinistryPlatform SQL Server database:

1. `create-rsvp-schema.sql` - Creates tables
2. `seed-lookup-tables.sql` - Populates question/card types
3. `seed-christmas-example.sql` - Creates sample Christmas RSVP
4. `sp-get-project-rsvp-data.sql` - Fetch widget data
5. `sp-submit-rsvp.sql` - Submit RSVPs

Total time: ~5 minutes

---

## What Gets Created

### Tables (8 total)
- ✅ `Question_Types` (20 types: counter, checkbox, dropdown, etc.)
- ✅ `Card_Types` (12 types: map, QR code, share, etc.)
- ✅ `Project_RSVPs` (RSVP configuration per project)
- ✅ `Project_RSVP_Questions` (Custom questions)
- ✅ `Question_Options` (Dropdown/radio options)
- ✅ `Project_Confirmation_Cards` (Confirmation page cards)
- ✅ `Event_RSVPs` (Submitted RSVPs)
- ✅ `Event_RSVP_Answers` (User answers)

### Columns Added to Existing Tables
- ✅ `Project_Events.Include_In_RSVP` (BIT, default 1)
- ✅ `Project_Events.RSVP_Capacity_Modifier` (INT, default 0)

### Stored Procedures (2)
- ✅ `api_Custom_RSVP_Project_Data_JSON` (fetch widget data)
- ✅ `api_Custom_RSVP_Submit_JSON` (submit RSVPs)

---

## Installation Steps

### Step 1: Create Schema

```sql
USE [MinistryPlatform]
GO

-- Run create-rsvp-schema.sql
-- This creates all tables and indexes
```

**What it does:**
- Creates 8 new tables
- Adds 2 columns to `Project_Events`
- Creates performance indexes
- Sets up foreign key relationships

**Expected output:**
```
Created Question_Types table
Created Card_Types table
Created Project_RSVPs table
...
Schema creation complete!
```

---

### Step 2: Seed Lookup Tables

```sql
USE [MinistryPlatform]
GO

-- Run seed-lookup-tables.sql
-- This populates Question_Types and Card_Types
```

**What it does:**
- Inserts 20 question types
- Inserts 12 card types
- Uses MERGE to safely update existing records

**Expected output:**
```
Seeded Question_Types with 20 question types
Seeded Card_Types with 12 card types
```

---

### Step 3: Create Sample Christmas RSVP

```sql
USE [MinistryPlatform]
GO

-- Run seed-christmas-example.sql
-- This creates a working example
```

**What it creates:**
- Project: "Christmas Services 2024"
- Project_RSVP configuration
- 2 questions: "How many people?", "First time visitor?"
- 4 confirmation cards: Instructions, QR Code, Share, Calendar

**Expected output:**
```
Created new Project: Christmas Services 2024 (ID: 1)
Created Project_RSVP (ID: 1)
Added question: How many people?
Added question: This is my first visit to Woodside
...
Christmas 2024 RSVP Configuration Complete!
```

---

### Step 4: Link Events to Project

**Manual step:** You need to link your Events to the Project.

```sql
-- Get your Project_ID from Step 3 output
DECLARE @ProjectID INT = 1;  -- Replace with actual ID

-- Link events (replace with your Event_IDs)
INSERT INTO Project_Events (Project_ID, Event_ID, Include_In_RSVP, RSVP_Capacity_Modifier, Domain_ID)
VALUES
    (@ProjectID, 101, 1, 0, 1),   -- Christmas Eve 2pm
    (@ProjectID, 102, 1, 0, 1),   -- Christmas Eve 4pm
    (@ProjectID, 103, 1, 50, 1);  -- Christmas Eve 5pm (add 50 to RSVP count)
```

**Capacity Modifier Examples:**
- `0` = Show actual RSVP count
- `50` = Add 50 to count (make it look fuller)
- `-20` = Subtract 20 from count (make it look emptier)

---

### Step 5: Create Stored Procedures

```sql
USE [MinistryPlatform]
GO

-- Run sp-get-project-rsvp-data.sql
-- Creates: api_Custom_RSVP_Project_Data_JSON
```

**Expected output:**
```
Created stored procedure: api_Custom_RSVP_Project_Data_JSON
Granted EXECUTE permission to ThinkMinistry
```

```sql
USE [MinistryPlatform]
GO

-- Run sp-submit-rsvp.sql
-- Creates: api_Custom_RSVP_Submit_JSON
```

**Expected output:**
```
Created stored procedure: api_Custom_RSVP_Submit_JSON
Granted EXECUTE permission to ThinkMinistry
```

---

## Testing

### Test 1: Fetch Widget Data

```sql
-- Test fetching RSVP data
EXEC api_Custom_RSVP_Project_Data_JSON @Project_RSVP_ID = 1;
```

**Expected:** JSON object with:
- `Project_RSVP` object
- `Events` array (your linked events)
- `Questions` array (2 questions)
- `Confirmation_Cards` array (4 cards)

---

### Test 2: Submit Sample RSVP

```sql
-- Create sample answers
DECLARE @AnswersJson NVARCHAR(MAX) = N'[
    {"Question_ID": 1, "Numeric_Value": 4},
    {"Question_ID": 2, "Boolean_Value": true}
]';

-- Submit RSVP (replace Event_ID and Contact_ID)
EXEC api_Custom_RSVP_Submit_JSON
    @Event_ID = 101,
    @Project_RSVP_ID = 1,
    @Contact_ID = 228155,
    @First_Name = 'Test',
    @Last_Name = 'User',
    @Email_Address = 'test@example.com',
    @Phone_Number = '(555) 123-4567',
    @Answers = @AnswersJson;
```

**Expected:** Success response with:
- `Event_RSVP_ID`
- `Confirmation_Code` (e.g., "00101-1234")
- `Event_Participant_ID`
- Event and campus details

---

### Test 3: Verify Data Was Created

```sql
-- Check Event_RSVPs table
SELECT * FROM Event_RSVPs ORDER BY Event_RSVP_ID DESC;

-- Check Event_RSVP_Answers table
SELECT * FROM Event_RSVP_Answers ORDER BY Event_RSVP_Answer_ID DESC;

-- Check Event_Participants table
SELECT * FROM Event_Participants ORDER BY Event_Participant_ID DESC;
```

---

## Troubleshooting

### ❌ "Foreign key constraint failed"
**Problem:** Projects table doesn't exist
**Solution:** Make sure Project Budgets app database is set up

### ❌ "Cannot find stored procedure"
**Problem:** Procedure not created or wrong database
**Solution:** Re-run stored procedure scripts, ensure `USE [MinistryPlatform]`

### ❌ "Permission denied"
**Problem:** API user doesn't have EXECUTE permission
**Solution:** Run these grants:
```sql
GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Data_JSON] TO [ThinkMinistry];
GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Submit_JSON] TO [ThinkMinistry];
```

### ❌ No events showing in widget
**Problem:** Events not linked to Project
**Solution:** Insert records into `Project_Events` table (see Step 4)

### ❌ "Participation_Status_ID not found"
**Problem:** Status ID doesn't exist in your MP
**Solution:** Check your `Participation_Statuses` table, update `@ParticipationStatusID` in `sp-submit-rsvp.sql`

---

## Next Steps

After database setup is complete:

1. ✅ Database installed
2. 🔲 Create Next.js API routes
3. 🔲 Update TypeScript types
4. 🔲 Build dynamic question renderer
5. 🔲 Build dynamic card renderer
6. 🔲 Replace mock data in widget
7. 🔲 Test end-to-end flow

---

## Rollback (if needed)

To remove everything:

```sql
-- Drop stored procedures
DROP PROCEDURE IF EXISTS [dbo].[api_Custom_RSVP_Project_Data_JSON];
DROP PROCEDURE IF EXISTS [dbo].[api_Custom_RSVP_Submit_JSON];

-- Drop tables (in reverse order to avoid FK constraints)
DROP TABLE IF EXISTS [dbo].[Event_RSVP_Answers];
DROP TABLE IF EXISTS [dbo].[Event_RSVPs];
DROP TABLE IF EXISTS [dbo].[Project_Confirmation_Cards];
DROP TABLE IF EXISTS [dbo].[Question_Options];
DROP TABLE IF EXISTS [dbo].[Project_RSVP_Questions];
DROP TABLE IF EXISTS [dbo].[Project_RSVPs];
DROP TABLE IF EXISTS [dbo].[Card_Types];
DROP TABLE IF EXISTS [dbo].[Question_Types];

-- Remove columns from Project_Events
ALTER TABLE [dbo].[Project_Events] DROP COLUMN IF EXISTS [Include_In_RSVP];
ALTER TABLE [dbo].[Project_Events] DROP COLUMN IF EXISTS [RSVP_Capacity_Modifier];
```

---

## Support

For detailed schema information, see `RSVP_DATABASE_SCHEMA.md`.
