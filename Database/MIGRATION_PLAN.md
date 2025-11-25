# Database Migration & Organization Plan

## Overview
Reorganize the entire database structure to clearly separate base MinistryPlatform schema from custom Woodside additions. This will create a single source of truth in the `@Database/` directory that all projects reference.

## Goals
1. **Identify Base vs. Custom**: Compare blank MP instance with current production to identify all customizations
2. **Centralize SQL**: Move all SQL files from individual projects to `@Database/`
3. **Document Everything**: Create comprehensive documentation of custom tables, fields, and stored procedures
4. **Enable Fresh Installs**: Make it possible to set up a new MP instance with all Woodside customizations
5. **Maintain Zod Models**: Update TypeScript Zod models to match actual database schema

## Current State

### SQL Files Scattered Across Projects
- `NextJS/Widgets/RSVP/` - Contains RSVP-related SQL
- `NextJS/Apps/` - Contains various SQL files
- `NextJS/Groups/` - Contains group-related SQL
- Other projects may contain embedded SQL

### Database Structure (Current)
```
Database/
├── Core/                    # Base MP schema (incomplete)
├── Custom/                  # Custom tables (partial)
├── Customizations/          # Custom fields on base tables
├── StoredProcs/            # Stored procedures
├── Migrations/             # One-time migrations
└── Docs/                   # Documentation
```

## Migration Strategy

### Phase 1: Schema Extraction & Analysis
**Goal**: Understand what's base MP vs. custom

1. **Restore Blank MP Instance**
   - Restore `blank.bak` to MinistryPlatform test server or local SQL Server
   - Database name: `MinistryPlatform_Blank` or similar

2. **Extract Base Schema**
   ```sql
   -- Script out all objects from blank instance
   -- Tables, Views, Stored Procedures, Functions
   ```

3. **Extract Current Schema**
   ```sql
   -- Script out all objects from production MinistryPlatform
   -- Use same format for easy comparison
   ```

4. **Compare & Categorize**
   - Use schema comparison tool (SQL Server Data Tools, Redgate, or scripts)
   - Identify:
     - Custom tables (not in base MP)
     - Custom columns added to base tables
     - Custom stored procedures
     - Custom views
     - Custom functions
     - Modified base objects (if any)

### Phase 2: Documentation & Inventory
**Goal**: Document every customization and its purpose

1. **Create Inventory Spreadsheet/Database**
   - Table/Column name
   - Type (Custom Table, Custom Column, etc.)
   - Purpose/Business need
   - Used by which applications
   - Dependencies
   - Migration priority (Critical, High, Medium, Low)

2. **Map TypeScript/Zod Models**
   - Compare Zod schemas in projects with actual database
   - Identify discrepancies
   - Document which fields are missing or incorrect

3. **Identify Dead Code**
   - Find tables/columns/procedures not used by any application
   - Mark for potential removal (after verification)

### Phase 3: Reorganize Database Folder
**Goal**: Create definitive structure

```
Database/
├── Core/                           # Base MP schema (reference only)
│   ├── Tables/
│   │   ├── Contacts.sql
│   │   ├── Events.sql
│   │   └── ...
│   ├── Views/
│   ├── StoredProcs/
│   └── Functions/
│
├── Custom/                         # Woodside-specific custom tables
│   ├── Tables/
│   │   ├── RSVP_Submissions.sql
│   │   ├── RSVP_Campaigns.sql
│   │   ├── Projects.sql           # (if not base MP)
│   │   └── ...
│   └── README.md                  # Documents each custom table
│
├── Customizations/                 # Custom fields on base tables
│   ├── Contacts/
│   │   └── add-custom-fields.sql
│   ├── Events/
│   │   ├── add-include-in-rsvp.sql
│   │   ├── add-rsvp-slug.sql
│   │   └── add-project-id.sql
│   ├── Congregations/
│   │   └── add-campus-slug.sql
│   └── README.md                  # Documents each customization
│
├── StoredProcs/                    # Custom stored procedures
│   ├── RSVP/
│   │   ├── sp-submit-rsvp-with-audit.sql
│   │   ├── sp-schedule-rsvp-emails.sql
│   │   └── api_Custom_RSVP_JSON.sql
│   ├── Events/
│   ├── Shared/
│   └── README.md
│
├── Views/                          # Custom views
│   └── README.md
│
├── Functions/                      # Custom functions
│   └── README.md
│
├── Migrations/                     # One-time migrations
│   ├── YYYY-MM-DD-description.sql
│   └── README.md
│
├── Setup/                          # Fresh install scripts
│   ├── 00-prerequisites.md
│   ├── 01-custom-tables.sql       # Creates all custom tables
│   ├── 02-custom-columns.sql      # Adds custom columns to base tables
│   ├── 03-stored-procedures.sql   # Creates all custom SPs
│   ├── 04-seed-data.sql           # Required seed data (if any)
│   └── README.md
│
├── Comparison/                     # Schema comparison artifacts
│   ├── base-mp-schema.sql         # From blank.bak
│   ├── woodside-schema.sql        # From production
│   ├── differences.txt            # Comparison results
│   └── README.md
│
├── Docs/                           # Documentation
│   ├── SCHEMA_REFERENCE.md        # Complete schema documentation
│   ├── CUSTOMIZATION_GUIDE.md     # How to add new customizations
│   ├── RSVP_FEATURE.md           # Feature-specific docs
│   ├── API_PROCEDURES.md          # API procedure documentation
│   └── ...
│
└── Scripts/                        # Utility scripts
    ├── compare-schemas.sql        # Schema comparison helper
    ├── export-schema.sql          # Export current schema
    ├── find-unused-objects.sql    # Find dead code
    └── sync-zod-models.js         # Generate/update Zod schemas
```

### Phase 4: Move SQL Files from Projects
**Goal**: Centralize all SQL in @Database/

1. **Audit Each Project**
   - `NextJS/Widgets/RSVP/` - Move RSVP SQL files
   - `NextJS/Apps/` - Move any SQL files
   - `NextJS/Groups/` - Move group SQL files
   - `CustomWidgets/*/StoredProc/` - Keep documentation, reference central files

2. **Update Project References**
   - Update README files to point to `@Database/`
   - Update deployment scripts to reference central location
   - Add npm scripts if needed: `npm run deploy:rsvp-schema` etc.

3. **Create Symlinks (Optional)**
   - Could create symlinks in project folders pointing to @Database/
   - Keeps discoverability while maintaining single source of truth

### Phase 5: Create Fresh Install Process
**Goal**: Ability to setup new MP instance with all customizations

1. **Installation Guide**
   - Step-by-step instructions
   - Prerequisites
   - Order of operations
   - Verification steps

2. **Automated Scripts**
   - Single script to run all customizations in order
   - Idempotent (safe to run multiple times)
   - Rollback capability

3. **Testing**
   - Test on sandbox database
   - Verify all applications still work
   - Document any manual steps

### Phase 6: Sync Zod Models
**Goal**: TypeScript types match database exactly

1. **Generate Types from Schema**
   - Create script to read database schema
   - Generate TypeScript interfaces
   - Generate Zod schemas

2. **Compare with Existing Models**
   - Identify mismatches
   - Update application code as needed

3. **Automate Going Forward**
   - Add to CI/CD or pre-commit hooks
   - Warn if database changes without type updates

## Tools & Resources

### Schema Comparison Tools
1. **SQL Server Management Studio** (Free)
   - Schema Compare feature in SSDT

2. **Redgate SQL Compare** (Paid, but excellent)
   - Industry standard for schema comparison

3. **Custom SQL Scripts** (Free)
   - Query sys tables to compare schemas
   - Output to CSV/JSON for analysis

4. **VS Code Extensions**
   - SQL Server (mssql)
   - Database Client

### Scripts to Create
1. `compare-schemas.sql` - Compare two databases
2. `export-schema.sql` - Export schema to SQL files
3. `find-unused-objects.sql` - Find unused tables/columns/procs
4. `generate-zod-schemas.js` - Auto-generate Zod from database
5. `deploy-all-customizations.sql` - Install all customizations

## Benefits

### Immediate Benefits
- ✅ Single source of truth for all database objects
- ✅ Clear understanding of what's custom vs. base MP
- ✅ Easier to deploy changes from local machine
- ✅ Better documentation
- ✅ Reduced duplication

### Long-term Benefits
- ✅ Onboard new developers faster
- ✅ Disaster recovery - can rebuild from scratch
- ✅ Easier MP version upgrades (know what's custom)
- ✅ Type safety between DB and TypeScript
- ✅ Can spin up new environments easily
- ✅ Better change tracking in git

## Risks & Mitigation

### Risk: Breaking Existing Applications
**Mitigation**:
- Test thoroughly on sandbox first
- Keep old files until verification complete
- Document all changes
- Rollback plan ready

### Risk: Time Investment
**Mitigation**:
- Do in phases
- Prioritize critical systems first
- Document as you go
- Can use partially migrated state

### Risk: Discovering Undocumented Dependencies
**Mitigation**:
- Comprehensive testing
- Involve other team members
- Review application code thoroughly
- Use database query logs to find usage patterns

## Timeline Estimate

### Phase 1: Schema Analysis (4-8 hours)
- Restore blank.bak
- Extract schemas
- Initial comparison

### Phase 2: Documentation (8-16 hours)
- Inventory all customizations
- Document purpose and dependencies
- Map to applications

### Phase 3: Reorganize (4-8 hours)
- Create new folder structure
- Move/copy files
- Update documentation

### Phase 4: Move Project SQL (4-8 hours)
- Audit each project
- Move files
- Update references

### Phase 5: Fresh Install (8-16 hours)
- Create installation scripts
- Write documentation
- Test on clean instance

### Phase 6: Zod Sync (8-16 hours)
- Build generation script
- Update all models
- Test applications

**Total: 36-72 hours** (Can be done incrementally)

## Success Criteria

- [ ] All custom database objects documented
- [ ] Clear distinction between base MP and custom
- [ ] Single @Database/ folder contains all SQL
- [ ] Can install all customizations on blank MP instance
- [ ] TypeScript/Zod models match database exactly
- [ ] All applications tested and working
- [ ] Team members can understand and use new structure
- [ ] Documentation complete and accurate

## Next Steps

See TODO.md for detailed task breakdown.
