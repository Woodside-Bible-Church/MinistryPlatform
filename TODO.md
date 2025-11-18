# Ministry Platform - TODO

## 🔐 Environment Variables Migration

### Priority: Medium
**Goal:** Consolidate shared environment variables at the Vercel Team level to reduce duplication and simplify management.

### Team-Level Variables to Set

In Vercel Dashboard → Woodside Bible → Settings → Environment Variables, add:

```bash
# Ministry Platform API Credentials (shared across all apps)
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org
MINISTRY_PLATFORM_CLIENT_ID=<from current projects>
MINISTRY_PLATFORM_CLIENT_SECRET=<from current projects>

# Public Ministry Platform URLs
NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL=https://my.woodsidebible.org/ministryplatformapi/files

# Shared API Keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from current projects>
```

**Environments:** Production, Preview, Development

### Projects to Link

Once team variables are set, link them to these projects:

- [ ] **RSVP Widget** (`NextJS/Widgets/RSVP`)
  - Remove duplicate MP variables from project settings
  - Keep project-specific: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_NAME`

- [ ] **Project Budgets** (`NextJS/Apps/project-budgets`)
  - Remove duplicate MP variables from project settings
  - Keep project-specific: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_NAME`

- [ ] **Template App** (`NextJS/Template`)
  - Remove duplicate MP variables from project settings
  - Keep project-specific: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_NAME`

- [ ] **Prayer Widget** (`NextJS/Widgets/Prayer`)
  - Remove duplicate MP variables from project settings
  - Keep project-specific: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_NAME`

### Benefits

✅ **Single source of truth** - Update MP credentials once, applies everywhere
✅ **Less error-prone** - No copy/paste mistakes across projects
✅ **Easier onboarding** - New projects inherit team variables automatically
✅ **Simplified rotation** - Change credentials once when needed

### Migration Checklist

For each project:

1. [ ] Document current environment variables
2. [ ] Verify which are shared (move to team) vs project-specific (keep)
3. [ ] Link project to team variables in Vercel
4. [ ] Remove duplicate variables from project settings
5. [ ] Test deployment to ensure variables still work
6. [ ] Update `.env.example` in project to reflect new structure

---

## 📁 Database Folder Migration

### Priority: Low
**Status:** RSVP files migrated ✅

### Remaining Projects

- [ ] **Project Budgets**
  - Move budget-related stored procedures to `Database/StoredProcs/Budgets/`
  - Document Projects table schema
  - Add npm scripts to `Database/package.json`

- [ ] **Prayer Widget**
  - Move prayer-related stored procedures to `Database/StoredProcs/Prayer/`
  - Document custom tables
  - Add npm scripts

- [ ] **Custom Widgets**
  - Audit for any shared stored procedures
  - Move to `Database/StoredProcs/Shared/`

---

## 📧 RSVP Email Campaigns

### Priority: High
**Status:** Code complete, needs testing

### Next Steps

1. [ ] Test database connection with new `sqlcmd` setup
2. [ ] Deploy email campaign tables to production
   ```bash
   cd ~/MinistryPlatform/Database
   npm run rsvp:emails
   ```
3. [ ] Create first email template in Ministry Platform
4. [ ] Configure confirmation template on RSVP project
5. [ ] Test RSVP submission with email
6. [ ] Create sample campaigns (2-day reminder, new visitor welcome)
7. [ ] Document for staff/content editors

---

## 🔧 Developer Experience Improvements

### Completed ✅
- [x] Centralized database folder created
- [x] SQL Server credentials configured (Woodside_Development)
- [x] npm scripts for database deployment
- [x] Test/production database workflows
- [x] Comprehensive documentation

### Future Enhancements
- [ ] Create helper script to sync team env vars to local `.env.example` files
- [ ] Document deployment process for new developers
- [ ] Set up pre-commit hooks for SQL linting (optional)
- [ ] Create database migration tracking system (optional)

---

## 📝 Notes

- This file tracks long-term improvements and migrations
- Not urgent - tackle when time permits between feature work
- Each section has priority level: High, Medium, Low
- Mark items complete with `[x]` when done
