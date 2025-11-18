# Database Connection Testing Guide

## Quick Test (Once sqlcmd is installed)

### 1. Test Sandbox Connection First

Always test on the sandbox database first to avoid any issues with production:

```bash
cd /Users/coltonwirgau/MinistryPlatform/Database
npm run test:sandbox
```

**Expected Output:**
```
DatabaseName    CurrentDateTime             CurrentUser           SQLServerVersion
------------    -----------------------     ------------------    ----------------
MinistryPlatformTesting  2025-11-14 14:30:00.000  Woodside_Development  Microsoft SQL Server...

Event_ID  Event_Title                 Event_Start_Date         Event_End_Date
--------  --------------------------  -----------------------  -----------------------
12345     Christmas Eve Service       2024-12-24 18:00:00.000  2024-12-24 19:30:00.000
12344     Sunday Worship              2024-12-17 09:00:00.000  2024-12-17 10:30:00.000
...

Connection test successful!
```

### 2. Test Production Connection

Once sandbox works, test production:

```bash
npm test
# or
npm run test:prod
```

## Troubleshooting

### "sqlcmd: command not found"

The Homebrew installation is still in progress. Check status:

```bash
brew list | grep mssql
```

Should show:
```
msodbcsql18
mssql-tools18
```

If not installed yet, wait for the background process to complete or run:

```bash
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew install msodbcsql18 mssql-tools18
```

### "Login failed for user"

Check your `.env` file has correct credentials:

```bash
cat .env | grep SQL_USER
cat .env | grep SQL_PASSWORD
```

Expected:
```
SQL_USER=Woodside_Development
SQL_PASSWORD=Kx9m!Yn2@Qz7^Wt8&Rj5
```

### "Cannot open server"

Make sure you're connected to the VPN. The SQL Server is at `10.206.0.131`, which requires internal network access.

### "SSL connection error"

This can happen with self-signed certificates. Try adding `-C` flag to trust the server certificate. Edit the npm script in `package.json` if needed:

```javascript
"db:run": "... sqlcmd -C -S ${process.env.SQL_SERVER} ..."
```

## Next Steps After Connection Works

### 1. Deploy RSVP Email Campaign System (Sandbox First)

```bash
# Deploy the email campaign tables and stored procedures to sandbox
npm run rsvp:emails:test

# Deploy the email scheduler procedure
npm run rsvp:scheduler:test

# Deploy the updated RSVP submission procedure
npm run rsvp:submit:test
```

### 2. Verify Deployment

Check that the new tables exist:

```bash
echo "SELECT name FROM sys.tables WHERE name LIKE 'RSVP%' ORDER BY name;" | \
  node -r dotenv/config -e 'require("child_process").execSync(\`sqlcmd -S \${process.env.SQL_SERVER_TEST} -d \${process.env.SQL_DATABASE_TEST} -U \${process.env.SQL_USER_TEST} -P "\${process.env.SQL_PASSWORD_TEST}" -Q "\${process.argv[1]}"\`, {stdio: "inherit"})'
```

Expected tables:
- `RSVP_Email_Campaigns`
- `RSVP_Campaign_Conditions`
- `RSVP_Email_Campaign_Log`

### 3. Create Email Template in Ministry Platform

1. Log into Ministry Platform Admin
2. Navigate to `Communications > Templates`
3. Create new template with name like "RSVP Confirmation - Generic"
4. Add HTML content with shortcodes:

```html
<html>
<body>
  <h1>Thanks for your RSVP, [First_Name]!</h1>

  <p>You're all set for <strong>[Event_Title]</strong></p>

  <p><strong>When:</strong> [Event_Date_Long] at [Event_Time]<br>
  <strong>Where:</strong> [Campus_Name] - [Campus_Location]<br>
  [Campus_Address]<br>
  [Campus_City], [Campus_State] [Campus_Zip]</p>

  <p><strong>Party Size:</strong> [Party_Size]</p>

  <p><strong>Confirmation Code:</strong> [Confirmation_Code]</p>

  <p>If you need to make changes, please contact us.</p>

  <p>See you soon!</p>
</body>
</html>
```

5. Note the `Communication_Template_ID` (shown in URL or table)

### 4. Link Template to RSVP Project

Update the `Project_RSVPs` table:

```sql
UPDATE Project_RSVPs
SET Confirmation_Template_ID = 123  -- Replace with your template ID
WHERE Project_RSVP_ID = 1;  -- Replace with your project ID
```

### 5. Test RSVP Submission

1. Visit your RSVP widget (dev mode)
2. Submit a test RSVP
3. Check the `dp_Communications` table for the confirmation email:

```sql
SELECT TOP 5
    c.Communication_ID,
    c.Subject,
    c.Start_Date,
    c.Status_ID,
    cm.Recipient_Email_Address,
    cm.Action_Status_ID
FROM dp_Communications c
INNER JOIN dp_Communication_Messages cm ON c.Communication_ID = cm.Communication_ID
ORDER BY c.Start_Date DESC;
```

4. Check the `RSVP_Email_Campaign_Log` table for any errors:

```sql
SELECT TOP 10 *
FROM RSVP_Email_Campaign_Log
ORDER BY Log_Date DESC;
```

### 6. Create Campaign (Optional)

Create a 2-day reminder campaign:

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
    'Send reminder 2 days before event',
    1,  -- Your Project_RSVP_ID
    NULL,  -- NULL = all campuses
    124,  -- Your reminder template ID
    'Days_Before_Event',
    2,
    1,
    1
);
```

### 7. Deploy to Production

Once everything works in sandbox:

```bash
cd /Users/coltonwirgau/MinistryPlatform/Database

# Deploy email campaign system
npm run rsvp:emails

# Deploy scheduler
npm run rsvp:scheduler

# Deploy submit procedure
npm run rsvp:submit
```

## Available Scripts

```bash
# Connection Testing
npm test              # Test production connection
npm run test:prod     # Test production connection (explicit)
npm run test:sandbox  # Test sandbox connection

# RSVP Deployment (Sandbox)
npm run rsvp:emails:test     # Deploy email campaign tables
npm run rsvp:scheduler:test  # Deploy email scheduler procedure
npm run rsvp:submit:test     # Deploy RSVP submission procedure
npm run rsvp:schema:test     # Deploy RSVP base schema

# RSVP Deployment (Production)
npm run rsvp:emails          # Deploy email campaign tables
npm run rsvp:scheduler       # Deploy email scheduler procedure
npm run rsvp:submit          # Deploy RSVP submission procedure
npm run rsvp:schema          # Deploy RSVP base schema

# Custom Field Deployment
npm run custom:campus-slug   # Add Campus_Slug to Congregations (prod)
npm run custom:campus-slug:test  # Add Campus_Slug to Congregations (sandbox)

# Run Any SQL File
npm run db:run path/to/file.sql       # Production
npm run db:run:test path/to/file.sql  # Sandbox
```

## Security Reminders

- Always test on sandbox (`MinistryPlatformTesting`) first
- Production credentials are in `.env` (gitignored)
- Never commit database passwords to Git
- Keep VPN connected when working with database
- SQL Server login: `Woodside_Development`

## Success Indicators

### Connection Test Passes
- ✅ Database name displayed
- ✅ Current date/time shown
- ✅ User is "Woodside_Development"
- ✅ Recent events listed
- ✅ "Connection test successful!" message

### Email Deployment Success
- ✅ New tables created (`RSVP_Email_Campaigns`, etc.)
- ✅ Stored procedures updated
- ✅ No errors in deployment output

### RSVP Submission Works
- ✅ New record in `Event_RSVPs`
- ✅ New record in `dp_Communications`
- ✅ New record in `dp_Communication_Messages`
- ✅ No errors in `RSVP_Email_Campaign_Log`

## Getting Help

- Check the main `README.md` for folder structure
- Check `GETTING_STARTED.md` for setup overview
- Check `Docs/RSVP_EMAIL_CAMPAIGNS_GUIDE.md` for email system details
- Check stored procedure files for inline documentation
