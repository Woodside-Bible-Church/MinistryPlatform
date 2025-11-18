# Getting Started with Centralized Database

## ✅ What We've Set Up

You now have a centralized database management system for all Ministry Platform customizations across your projects!

### 📁 Structure Created

```
/MinistryPlatform/Database/
├── Core/                    # Core MP tables (official schema)
├── Custom/                  # Woodside custom tables
│   └── create-rsvp-schema.sql
├── Customizations/          # Custom fields on core tables
│   ├── add-campus-slug-to-congregations.sql
│   ├── add-rsvp-slug-column.sql
│   └── README.md
├── StoredProcs/             # All stored procedures
│   └── RSVP/
│       ├── sp-submit-rsvp-with-audit.sql
│       ├── sp-schedule-rsvp-emails.sql
│       ├── sp-get-project-rsvp-data.sql
│       └── sp-get-project-rsvp-data-with-slug.sql
├── Migrations/              # One-time migrations
│   └── 2025-11-14-rsvp-email-campaigns.sql
├── Docs/                    # Documentation
│   ├── INSTALLATION_GUIDE.md
│   ├── RSVP_DATABASE_SCHEMA.md
│   └── RSVP_EMAIL_CAMPAIGNS_GUIDE.md
├── .env                     # Your credentials (gitignored)
├── .env.example             # Template
├── .gitignore
├── package.json             # Database CLI
└── README.md                # Main documentation
```

## 🚀 Quick Start

### 1. First Time Setup (Already Done!)

- ✅ Folders created
- ✅ Files organized
- ✅ package.json configured
- ✅ .env copied from RSVP project
- ✅ Dependencies installed

### 2. Test the Connection (Once sqlcmd is installed)

```bash
cd /Users/coltonwirgau/MinistryPlatform/Database

# Test connection on sandbox first (recommended)
npm run test:sandbox

# Or test production connection
npm test
```

**What it does:** Runs a simple query to verify credentials, VPN access, and database connectivity.

See `TESTING.md` for comprehensive testing guide and troubleshooting.

## 📝 Common Commands

### RSVP Email Campaigns

```bash
# Deploy email campaign system to test
npm run rsvp:emails:test

# Deploy to production
npm run rsvp:emails

# Deploy email scheduler stored procedure
npm run rsvp:scheduler

# Deploy RSVP submission procedure
npm run rsvp:submit
```

### Run Any SQL File

```bash
# Production
npm run db:run path/to/file.sql

# Test database
npm run db:run:test path/to/file.sql
```

## 🎯 Benefits

### Before (Per-Project Database Files)
```
NextJS/Widgets/RSVP/database/
NextJS/Apps/project-budgets/database/
CustomWidgets/SomeWidget/database/
```
❌ Duplicate scripts across projects
❌ Hard to find which project modified what
❌ Inconsistent naming and organization
❌ Can't easily share stored procedures

### After (Centralized)
```
MinistryPlatform/Database/
```
✅ Single source of truth
✅ Easy to find and update shared code
✅ Consistent organization
✅ Shared scripts accessible to all projects
✅ Clear separation: Core vs Custom vs Customizations
✅ Built-in test/production workflows

## 🔄 Migration Path

### Phase 1: RSVP (✅ Complete)
- ✅ Copied all RSVP database files
- ✅ Organized into proper folders
- ✅ Created npm scripts
- ✅ Set up .env

### Phase 2: Project Budgets (Next)
- Move budget-related stored procedures
- Document Projects table (custom, not core)
- Add budget npm scripts

### Phase 3: Other Widgets
- Migrate any other custom stored procedures
- Consolidate shared utilities

## 📚 Documentation

- **README.md** - Main overview and folder structure
- **Customizations/README.md** - How to add custom fields to core tables
- **GETTING_STARTED.md** (this file) - Quick start guide
- **Docs/** - Feature-specific guides

## 🎓 Learning Resources

### Understanding the Structure

**Core/** - Never edit these
- Tables that come with Ministry Platform
- Events, Contacts, Congregations, etc.
- Reference only

**Custom/** - Your tables
- Tables you created: Event_RSVPs, Projects, etc.
- 100% Woodside-specific

**Customizations/** - Your fields on Core tables
- Adding Web_Congregation_ID to Contacts
- Adding Campus_Slug to Congregations
- Always use ALTER TABLE

**StoredProcs/** - Your business logic
- Organized by feature (RSVP, Budgets, etc.)
- Shared procedures go in Shared/

**Migrations/** - One-time changes
- Date-prefixed
- Idempotent (safe to run multiple times)

## 🔐 Security Notes

- Your `.env` file contains database passwords
- It's gitignored and won't be committed
- Never hardcode credentials in SQL files
- Always test on MinistryPlatformTesting first

## 🆘 Troubleshooting

### "sqlcmd: command not found"
You need to install SQL Server tools:
```bash
brew tap microsoft/mssql-release
brew install msodbcsql18 mssql-tools18
```

### "Login failed" error
- Check your .env credentials
- Ensure you're connected to VPN
- Verify the SQL login exists (Woodside_Development)

### Scripts not finding files
- Always run from `/MinistryPlatform/Database/` folder
- Paths in package.json are relative to this folder

## ✨ Next Steps

1. **Wait for sqlcmd to install** (brew is installing now)
2. **Test the connection** with `npm run rsvp:submit:test`
3. **Deploy email campaigns** with `npm run rsvp:emails`
4. **Migrate other projects** when ready

---

**Questions?** Check the README files in each folder for detailed documentation!
