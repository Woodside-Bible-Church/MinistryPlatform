# Ministry Platform Database

Centralized database management for all Woodside Bible Church Ministry Platform customizations and integrations.

> **📋 Migration Project:** We're currently planning a major reorganization to clearly separate base MinistryPlatform schema from custom Woodside additions. See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) and [TODO.md](./TODO.md) for details.

## 📁 Folder Structure

```
Database/
├── Core/                    # Core MP schema (from official documentation)
│   ├── Contacts.sql
│   ├── Events.sql
│   └── Congregations.sql
│
├── Custom/                  # Woodside-specific custom tables
│   ├── create-rsvp-schema.sql
│   ├── Projects.sql
│   └── Budget_*.sql
│
├── Customizations/          # Custom fields added to Core MP tables
│   ├── Contacts/
│   ├── Events/
│   └── Congregations/
│
├── StoredProcs/             # Stored procedures organized by feature
│   ├── RSVP/
│   ├── Budgets/
│   └── Shared/
│
├── Migrations/              # One-time migration scripts (dated)
│   └── 2025-11-14-rsvp-email-campaigns.sql
│
└── Docs/                    # Documentation and guides
    └── RSVP_EMAIL_CAMPAIGNS_GUIDE.md
```

## 🚀 Quick Start

### Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your SQL Server credentials** in `.env`

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Connect to VPN** (required for database access)

### Run Scripts

```bash
# RSVP Scripts - Production
npm run rsvp:schema        # Create RSVP tables
npm run rsvp:submit        # Deploy submit stored procedure
npm run rsvp:scheduler     # Deploy email scheduler
npm run rsvp:emails        # Run email campaigns migration

# RSVP Scripts - Test Database
npm run rsvp:schema:test
npm run rsvp:submit:test
npm run rsvp:scheduler:test
npm run rsvp:emails:test

# Customizations
npm run custom:campus-slug        # Add Campus_Slug to Congregations
npm run custom:campus-slug:test

# Run any SQL file directly
npm run db:run path/to/your-script.sql
npm run db:run:test path/to/your-script.sql
```

## 📝 Adding New Database Changes

### For Custom Tables

1. Create SQL file in `Custom/` folder
2. Add npm script to `package.json`
3. Document the table purpose in this README

### For Core Table Customizations

1. Create folder in `Customizations/[TableName]/`
2. Name file descriptively: `add-field-name.sql`
3. Include ALTER TABLE statement with IF NOT EXISTS check
4. Document why the field was added

### For Stored Procedures

1. Add to `StoredProcs/[Feature]/`
2. Name with `sp-` prefix
3. Use `CREATE OR ALTER PROCEDURE` syntax
4. Add npm script for easy deployment

### For Migrations

1. Add to `Migrations/` with date prefix: `YYYY-MM-DD-description.sql`
2. Migration files should be idempotent (safe to run multiple times)
3. Add to npm scripts

## 🔒 Security

- `.env` file is gitignored (contains passwords)
- Never commit credentials to git
- Use strong passwords for SQL logins
- Avoid special characters in passwords that conflict with shell: `#`, `$`, `` ` ``

## 🧪 Testing

Always test on `MinistryPlatformTesting` database first:

```bash
npm run rsvp:submit:test   # Test on sandbox
npm run rsvp:submit        # Deploy to production
```

## 📚 Documentation

See `Docs/` folder for detailed guides on specific features.

## ⚙️ Used By

- **RSVP Widget** - NextJS/Widgets/RSVP
- **Project Budgets App** - NextJS/Apps/project-budgets
- **Template App** - NextJS/Template

## 🤝 Contributing

When adding new database changes:

1. Test on sandbox database first
2. Document the change
3. Update this README
4. Add npm scripts for easy deployment

## 🔄 Database Reorganization Project

We're undertaking a major effort to improve database organization and documentation:

### Goals
- Clearly separate base MinistryPlatform schema from Woodside customizations
- Document every custom table, column, and procedure
- Create fresh installation scripts for new MP instances
- Sync TypeScript/Zod models with database schema
- Centralize all SQL files in this directory

### Key Documents
- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** - Complete strategy and approach
- **[TODO.md](./TODO.md)** - Detailed task breakdown with checkboxes
- **[Scripts/compare-schemas.sql](./Scripts/compare-schemas.sql)** - Compare blank MP with production

### Quick Start for Migration
1. Restore `blank.bak` to SQL Server
2. Run `Scripts/compare-schemas.sql` to identify customizations
3. Follow TODO.md task list
4. Document as you go

### Benefits
✅ Single source of truth for all database objects
✅ Easy disaster recovery
✅ Faster onboarding for new developers
✅ Better change tracking
✅ Type-safe TypeScript integration
