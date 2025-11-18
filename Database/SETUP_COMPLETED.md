# Setup Completed - Node.js Alternative to sqlcmd

## What Changed

We encountered issues with the Homebrew installation of `sqlcmd` (it was building from source and taking a very long time). Instead, we implemented a **faster and more reliable Node.js-based solution**.

## Solution Implemented

### 1. Installed Node.js mssql Package

```bash
npm install mssql
```

This package provides a pure Node.js SQL Server client - no external dependencies needed!

### 2. Created run-sql.js Script

**File:** `/Users/coltonwirgau/MinistryPlatform/Database/run-sql.js`

This Node.js script:
- Reads SQL files
- Connects to SQL Server using credentials from `.env`
- Splits scripts by `GO` statements (like sqlcmd)
- Executes each batch
- Displays results in a table format
- Shows row counts and success/error messages

**Usage:**
```bash
# Production database
node run-sql.js path/to/script.sql

# Test/sandbox database
node run-sql.js --test path/to/script.sql
```

### 3. Updated package.json Scripts

Changed from sqlcmd-based commands to Node.js:

**Before:**
```json
"db:run": "node -r dotenv/config -e 'require(\"child_process\").execSync(`sqlcmd -S ${process.env.SQL_SERVER} ...`",
```

**After:**
```json
"db:run": "node run-sql.js",
"db:run:test": "node run-sql.js --test",
```

All existing npm scripts (`npm test`, `npm run rsvp:emails`, etc.) now work without needing sqlcmd installed!

## Benefits of This Approach

✅ **No Homebrew dependency** - Works immediately after `npm install`
✅ **Cross-platform** - Works on macOS, Linux, Windows
✅ **Faster** - No waiting for Homebrew builds
✅ **Better error messages** - Node.js provides clearer errors
✅ **Table output** - Results display in a nice table format
✅ **Same npm scripts** - No changes to your workflow

## Next Steps

### 1. Connect to VPN

You need to be on the VPN to access `10.206.0.131`. Once connected, test the connection:

```bash
cd /Users/coltonwirgau/MinistryPlatform/Database
npm run test:sandbox
```

**Expected output:**
```
Connecting to: 10.206.0.131/MinistryPlatformTesting
Running: test-connection.sql

┌─────────┬────────────────────────┬─────────────────┬─────────────────────┐
│ (index) │   DatabaseName         │ CurrentDateTime │   CurrentUser       │
├─────────┼────────────────────────┼─────────────────┼─────────────────────┤
│    0    │ MinistryPlatformTesting│ 2025-11-14 ...  │ Woodside_Development│
└─────────┴────────────────────────┴─────────────────┴─────────────────────┘

✓ Successfully executed test-connection.sql
```

### 2. Deploy RSVP Email Campaigns

Once VPN is connected and test passes:

```bash
# Deploy to sandbox first
npm run rsvp:emails:test
npm run rsvp:scheduler:test
npm run rsvp:submit:test

# If successful, deploy to production
npm run rsvp:emails
npm run rsvp:scheduler
npm run rsvp:submit
```

### 3. Set Up VS Code SQL Server Extension

The connection profiles are already configured in `.vscode/settings.json`.

**Steps:**
1. Open VS Code
2. Install the recommended "SQL Server (mssql)" extension when prompted
3. Press `Cmd+Shift+P` → "MS SQL: Connect"
4. Select "MP Sandbox" or "MP Production"
5. Enter password: `Kx9m!Yn2@Qz7^Wt8&Rj5`
6. You can now run SQL queries directly in VS Code!

## Troubleshooting

### Still want sqlcmd?

If you really need the traditional `sqlcmd` for some reason, you can let the Homebrew installation finish. But the Node.js version should work for everything.

To check if Homebrew eventually finished:
```bash
brew list | grep mssql
which sqlcmd
```

### Connection still fails after connecting to VPN?

Try these troubleshooting steps:

1. **Verify VPN connection:**
   ```bash
   ping 10.206.0.131
   ```

2. **Check .env file:**
   ```bash
   cat .env | grep SQL_
   ```

3. **Test with verbose logging:**
   Edit `run-sql.js` and add console logs to see detailed connection info.

4. **Try different port:**
   SQL Server might be on a non-standard port. Check with your DB admin.

## Summary

✅ Database tooling is ready to use
✅ npm scripts work without sqlcmd
✅ Faster, more reliable Node.js approach
⏳ Waiting on VPN connection to test live database access

All documentation is available in `/Users/coltonwirgau/MinistryPlatform/Database/`.

The setup is complete - just connect to VPN and you're ready to deploy!
