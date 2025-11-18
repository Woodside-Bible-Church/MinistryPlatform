# Setup Summary - Database Tooling

## What Was Done While You Were Out

### 1. SQL Server Command-Line Tools Installation

**Status:** In progress (Homebrew is still installing)

**Command running:**
```bash
brew tap microsoft/mssql-release
brew install msodbcsql18 mssql-tools18
```

**Progress:**
- ✅ All dependencies installed (m4, libtool, unixodbc, ca-certificates, openssl@3)
- 🔄 Currently installing msodbcsql18 (ODBC driver)
- ⏳ Waiting to install mssql-tools18 (includes sqlcmd)

**Check installation status:**
```bash
brew list | grep -E "msodbcsql|mssql-tools"
```

Once complete, you should see both:
- `msodbcsql18`
- `mssql-tools18`

---

### 2. Test Connection Script Created

**File:** `/Users/coltonwirgau/MinistryPlatform/Database/test-connection.sql`

Simple SQL query that tests database connectivity and displays:
- Database name
- Current date/time
- SQL Server version
- Recent events

**Usage:**
```bash
cd /Users/coltonwirgau/MinistryPlatform/Database

# Test sandbox
npm run test:sandbox

# Test production
npm test
```

---

### 3. npm Scripts Added

Updated `/Users/coltonwirgau/MinistryPlatform/Database/package.json` with convenient test scripts:

```json
"scripts": {
  "test": "npm run db:run test-connection.sql",
  "test:prod": "npm run db:run test-connection.sql",
  "test:sandbox": "npm run db:run:test test-connection.sql",
  // ... all existing scripts preserved
}
```

Now you can quickly test connections without remembering long sqlcmd commands.

---

### 4. Comprehensive Testing Guide

**File:** `/Users/coltonwirgau/MinistryPlatform/Database/TESTING.md`

**Contents:**
- Quick test instructions
- Troubleshooting common errors
- Step-by-step email campaign deployment
- Email template creation guide
- Production deployment checklist
- All available npm scripts reference

---

### 5. VS Code Integration Setup

**Created:**
- `/Users/coltonwirgau/MinistryPlatform/.vscode/extensions.json`
  - Recommends SQL Server extension (`ms-mssql.mssql`)
  - VS Code will prompt to install when you open the workspace

- `/Users/coltonwirgau/MinistryPlatform/Database/.vscode/settings.json`
  - Pre-configured SQL Server connection profiles
  - "MP Production" (MinistryPlatform database)
  - "MP Sandbox" (MinistryPlatformTesting database)
  - SQL file formatting settings

**How to use:**
1. Open VS Code in `/Users/coltonwirgau/MinistryPlatform`
2. Install recommended SQL Server extension when prompted
3. Press `Cmd+Shift+P` → "MS SQL: Connect"
4. Select "MP Sandbox" or "MP Production"
5. Enter password: `Kx9m!Yn2@Qz7^Wt8&Rj5`
6. You can now run SQL queries directly in VS Code!

**Benefits:**
- Syntax highlighting for SQL files
- IntelliSense (autocomplete) for table/column names
- Run queries with `Cmd+Shift+E`
- View results in VS Code
- No need to use Remote Desktop!

---

### 6. Documentation Updates

**Updated:** `/Users/coltonwirgau/MinistryPlatform/Database/GETTING_STARTED.md`
- Added test connection instructions
- Reference to new TESTING.md guide
- Clearer quick start steps

**Created:** This summary document

---

## What to Do When You Return

### Immediate Next Steps (Once sqlcmd installs)

1. **Verify Installation:**
   ```bash
   sqlcmd -?
   ```
   Should show help text, not "command not found"

2. **Test Connection:**
   ```bash
   cd /Users/coltonwirgau/MinistryPlatform/Database
   npm run test:sandbox
   ```

   **Expected output:**
   ```
   DatabaseName    CurrentDateTime             CurrentUser
   ---------------  --------------------------  -------------------
   MinistryPlatformTesting  2025-11-14...      Woodside_Development

   Connection test successful!
   ```

3. **If connection works, deploy email campaigns:**
   ```bash
   npm run rsvp:emails:test
   npm run rsvp:scheduler:test
   npm run rsvp:submit:test
   ```

4. **Set up VS Code SQL extension:**
   - Open VS Code
   - Install recommended extension when prompted
   - Connect to "MP Sandbox" profile
   - Try running a query on any .sql file

---

## Troubleshooting

### Installation still running?

Check background process:
```bash
ps aux | grep brew
```

If it's stuck, you can safely kill and restart:
```bash
# Kill the process
pkill -f "brew install"

# Start fresh
brew install msodbcsql18 mssql-tools18
```

### "sqlcmd: command not found" after installation

The tools install to `/opt/homebrew/bin/`, which should be in your PATH. Try:
```bash
# Check if sqlcmd exists
ls /opt/homebrew/bin/sqlcmd

# If yes, add to path
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Connection fails

1. **Check VPN:** You must be connected to access `10.206.0.131`
2. **Verify credentials:** Check `.env` file has correct password
3. **Test with -C flag:** Some SSL cert issues can be bypassed:
   ```bash
   sqlcmd -C -S 10.206.0.131 -d MinistryPlatformTesting -U Woodside_Development -P "Kx9m!Yn2@Qz7^Wt8&Rj5"
   ```

---

## File Structure Created

```
/Users/coltonwirgau/MinistryPlatform/
├── .vscode/
│   └── extensions.json          # NEW - SQL extension recommendation
├── Database/
│   ├── .vscode/
│   │   └── settings.json        # NEW - SQL connection profiles
│   ├── test-connection.sql      # NEW - Connection test script
│   ├── TESTING.md               # NEW - Comprehensive testing guide
│   ├── SETUP_SUMMARY.md         # NEW - This document
│   ├── package.json             # UPDATED - Added test scripts
│   ├── GETTING_STARTED.md       # UPDATED - Added test instructions
│   └── ... (all existing files)
└── TODO.md                      # Created earlier - Long-term tasks
```

---

## Summary

### ✅ Ready to Use (Once sqlcmd installs)
- Centralized database structure
- Test connection scripts
- npm commands for all operations
- Comprehensive documentation

### 🎯 Next Major Milestone
- Deploy RSVP email campaign system
- Create email templates in MP
- Test RSVP submission with emails

### 📚 Documentation Available
- `README.md` - Main overview
- `GETTING_STARTED.md` - Quick start
- `TESTING.md` - Testing & deployment
- `TODO.md` - Long-term tasks
- `SETUP_SUMMARY.md` - This document

### 🎉 Benefits Achieved
- No more Remote Desktop for database work
- Run SQL from VS Code
- Test before production deployment
- Consistent, documented workflows
- Single source of truth for database code

---

## Questions?

All documentation is in `/Users/coltonwirgau/MinistryPlatform/Database/`.

Check installation status:
```bash
brew list | grep mssql
```

When ready to test:
```bash
cd /Users/coltonwirgau/MinistryPlatform/Database
npm test
```

Good luck! Everything should be ready to go once Homebrew finishes the installation.
