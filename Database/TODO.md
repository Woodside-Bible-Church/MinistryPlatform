# Database Migration & Organization TODO

This is a detailed task breakdown for the database reorganization project. Tasks are organized by phase and priority.

## Legend
- [ ] Not started
- [~] In progress
- [x] Completed
- [!] Blocked/needs decision

---

## Phase 1: Schema Extraction & Analysis

### 1.1 Setup Blank MP Instance
- [ ] Restore `blank.bak` to test SQL Server instance
  - [ ] Choose database name: `MinistryPlatform_Blank`
  - [ ] Verify restoration successful
  - [ ] Document connection details
  - [ ] Create npm script for connecting to blank instance

### 1.2 Extract Base MP Schema
- [ ] Script out blank MP schema
  - [ ] Tables (CREATE TABLE scripts)
  - [ ] Views
  - [ ] Stored Procedures (especially api_* procedures)
  - [ ] Functions
  - [ ] Constraints, indexes, foreign keys
- [ ] Save to `Database/Comparison/base-mp-schema/`
  - [ ] Organize by object type
  - [ ] Include version info/date

### 1.3 Extract Current Production Schema
- [ ] Script out production MinistryPlatform schema
  - [ ] Tables
  - [ ] Views
  - [ ] Stored Procedures
  - [ ] Functions
  - [ ] Constraints, indexes, foreign keys
- [ ] Save to `Database/Comparison/woodside-schema/`
  - [ ] Use same structure as base schema
  - [ ] Include date/version info

### 1.4 Create Comparison Scripts
- [ ] Write `Scripts/compare-schemas.sql`
  - [ ] Compare table names
  - [ ] Compare column definitions
  - [ ] Compare stored procedures
  - [ ] Compare views
  - [ ] Output differences to structured format
- [ ] Write `Scripts/export-schema.sql`
  - [ ] Export complete schema to SQL files
  - [ ] Organize by object type
- [ ] Write `Scripts/find-unused-objects.sql`
  - [ ] Check for tables with no FK references
  - [ ] Check for procedures not in API_Procedures
  - [ ] Check for views not used in other objects

### 1.5 Perform Comparison
- [ ] Run comparison scripts
- [ ] Document all differences in `Comparison/differences.md`
  - [ ] Custom tables (tables in prod not in base)
  - [ ] Custom columns (columns added to base tables)
  - [ ] Custom stored procedures
  - [ ] Custom views/functions
  - [ ] Modified base objects (if any - FLAG THESE)
- [ ] Create summary spreadsheet/table

---

## Phase 2: Documentation & Inventory

### 2.1 Inventory Custom Tables
- [ ] List all custom tables (not in base MP)
  - Examples we know:
    - [ ] `RSVP_Submissions`
    - [ ] `RSVP_Campaigns`
    - [ ] `RSVP_Email_Queue`
    - [ ] `Projects` (verify if custom)
    - [ ] Budget-related tables (if any)
    - [ ] Others discovered in comparison
- [ ] Document each custom table:
  - [ ] Purpose/business requirement
  - [ ] Which applications use it
  - [ ] Related tables (dependencies)
  - [ ] Created when/by whom (if known)
  - [ ] Priority: Critical/High/Medium/Low

### 2.2 Inventory Custom Columns
- [ ] List all custom columns added to base MP tables
  - Known examples:
    - [ ] `Events.Include_In_RSVP`
    - [ ] `Events.RSVP_Slug`
    - [ ] `Events.Project_ID` (verify if custom)
    - [ ] `Congregations.Campus_Slug`
    - [ ] Others from comparison
- [ ] Document each custom column:
  - [ ] Purpose
  - [ ] Which applications use it
  - [ ] Data type, nullable, default
  - [ ] When added
  - [ ] Priority

### 2.3 Inventory Custom Stored Procedures
- [ ] List all custom stored procedures
  - Known examples:
    - [ ] `sp-submit-rsvp-with-audit.sql`
    - [ ] `sp-schedule-rsvp-emails.sql`
    - [ ] `api_Custom_RSVP_*` procedures
    - [ ] Others from comparison
- [ ] Document each procedure:
  - [ ] Purpose
  - [ ] Parameters
  - [ ] Used by which applications
  - [ ] Registered in API_Procedures?
  - [ ] Dependencies

### 2.4 Map to Applications
- [ ] Create mapping: Database Object → Application(s)
  - [ ] RSVP Widget → RSVP tables, procedures
  - [ ] Groups App → Group-related customizations
  - [ ] Prayer Widget → Prayer-related (if any)
  - [ ] Other apps/widgets
- [ ] Identify orphaned objects (not used by anything)

### 2.5 Compare with Zod Models
- [ ] Audit `NextJS/Widgets/RSVP/` types
  - [ ] Compare Zod schemas with actual RSVP tables
  - [ ] Document discrepancies
- [ ] Audit `NextJS/Groups/` types
  - [ ] Compare with Events, Groups tables
- [ ] Audit other projects
- [ ] Create list of type mismatches to fix

### 2.6 Create Master Documentation
- [ ] Write `Docs/SCHEMA_REFERENCE.md`
  - [ ] Complete list of all customizations
  - [ ] Organized by feature
  - [ ] Include ERD diagrams (optional but nice)
- [ ] Write `Docs/CUSTOMIZATION_GUIDE.md`
  - [ ] How to add new custom tables
  - [ ] How to add custom columns
  - [ ] How to create stored procedures
  - [ ] How to register API procedures
  - [ ] Testing checklist

---

## Phase 3: Reorganize Database Folder

### 3.1 Create New Folder Structure
- [ ] Create `Database/Core/` directories
  - [ ] `Tables/`
  - [ ] `Views/`
  - [ ] `StoredProcs/`
  - [ ] `Functions/`
  - [ ] `README.md` (explain this is reference only)
- [ ] Create `Database/Custom/` directories
  - [ ] `Tables/`
  - [ ] `README.md`
- [ ] Create `Database/Customizations/` directories
  - [ ] Create subfolder for each base table with custom columns
  - [ ] `README.md`
- [ ] Create `Database/Setup/`
  - [ ] `README.md`
- [ ] Create `Database/Comparison/`
  - [ ] `base-mp-schema/`
  - [ ] `woodside-schema/`
  - [ ] `README.md`
- [ ] Create `Database/Scripts/`
  - [ ] `README.md`

### 3.2 Populate Core/ (Base MP Reference)
- [ ] Copy base MP schema files to `Core/`
  - [ ] From blank.bak extraction
  - [ ] Organized by type
  - [ ] Add note: "For reference only, do not modify"

### 3.3 Populate Custom/Tables/
- [ ] Move/create SQL files for each custom table
  - [ ] `RSVP_Submissions.sql`
  - [ ] `RSVP_Campaigns.sql`
  - [ ] `RSVP_Email_Queue.sql`
  - [ ] Others identified
- [ ] Each file should use `CREATE TABLE IF NOT EXISTS` pattern
- [ ] Include comments explaining purpose
- [ ] Include sample/seed data if needed

### 3.4 Populate Customizations/
- [ ] Create SQL files for custom columns on base tables
  - [ ] `Events/add-include-in-rsvp.sql`
  - [ ] `Events/add-rsvp-slug.sql`
  - [ ] `Events/add-project-id.sql`
  - [ ] `Congregations/add-campus-slug.sql`
  - [ ] Others identified
- [ ] Each file uses `IF NOT EXISTS` pattern for adding columns
- [ ] Include comments

### 3.5 Reorganize StoredProcs/
- [ ] Current structure is already decent
- [ ] Ensure all custom procedures are here
- [ ] Add any missing from projects
- [ ] Verify organization by feature makes sense

### 3.6 Update Documentation
- [ ] Update main `Database/README.md`
  - [ ] Explain new structure
  - [ ] Link to MIGRATION_PLAN.md
  - [ ] Quick start guide
- [ ] Create README in each major folder
- [ ] Update existing docs to reference new structure

---

## Phase 4: Move SQL Files from Projects

### 4.1 Audit NextJS/Widgets/RSVP/
- [ ] Find all SQL files in RSVP widget
- [ ] Identify what needs to move to `@Database/`
- [ ] Move/copy to appropriate `@Database/` location
- [ ] Update RSVP widget README
  - [ ] Point to `@Database/StoredProcs/RSVP/`
  - [ ] Remove old SQL files or add deprecation notice
- [ ] Update deployment scripts/instructions

### 4.2 Audit NextJS/Apps/
- [ ] Search for `.sql` files
- [ ] Identify purpose of each
- [ ] Move to `@Database/` appropriate location
- [ ] Update app READMEs

### 4.3 Audit NextJS/Groups/
- [ ] Search for `.sql` files
- [ ] Move to `@Database/`
- [ ] Update Groups app README

### 4.4 Audit NextJS/Widgets/Prayer/
- [ ] Check for SQL files
- [ ] Move if any exist

### 4.5 Audit CustomWidgets/
- [ ] Check each custom widget's `StoredProc/` folder
- [ ] These folders have documentation, not actual SQL
- [ ] Update documentation to reference `@Database/`
- [ ] Consider moving actual stored proc files here if they exist

### 4.6 Update package.json Scripts
- [ ] Review `Database/package.json` scripts
- [ ] Add any missing deployment scripts
- [ ] Update paths if needed
- [ ] Add new convenience scripts:
  ```json
  "deploy:all:test": "Run all customizations on test DB"
  "deploy:all:prod": "Run all customizations on prod DB"
  "sync:zod": "Generate Zod schemas from database"
  ```

---

## Phase 5: Create Fresh Install Process

### 5.1 Create Installation Scripts
- [ ] `Setup/00-prerequisites.md`
  - [ ] List requirements (base MP version, etc.)
  - [ ] Access requirements
  - [ ] Tools needed
- [ ] `Setup/01-custom-tables.sql`
  - [ ] Combines all custom table creations
  - [ ] Idempotent (can run multiple times safely)
  - [ ] Includes all necessary constraints
- [ ] `Setup/02-custom-columns.sql`
  - [ ] Adds all custom columns to base tables
  - [ ] Idempotent with IF NOT EXISTS checks
- [ ] `Setup/03-stored-procedures.sql`
  - [ ] Creates all custom stored procedures
  - [ ] Uses CREATE OR ALTER
- [ ] `Setup/04-views-functions.sql`
  - [ ] Custom views and functions if any
- [ ] `Setup/05-seed-data.sql`
  - [ ] Required seed/lookup data
  - [ ] IF NOT EXISTS checks
- [ ] `Setup/06-api-registrations.sql`
  - [ ] Register custom procedures in API_Procedures table
  - [ ] Set permissions

### 5.2 Create Master Installation Script
- [ ] `Setup/install-all.sql`
  - [ ] Runs all setup scripts in order
  - [ ] Includes error handling
  - [ ] Logs progress
  - [ ] Can resume from failure
- [ ] `Setup/verify-installation.sql`
  - [ ] Checks all customizations were applied
  - [ ] Returns report of what's installed

### 5.3 Create Installation Guide
- [ ] `Setup/README.md`
  - [ ] Step-by-step instructions
  - [ ] When to use (new instance, disaster recovery)
  - [ ] Testing checklist
  - [ ] Troubleshooting common issues
- [ ] `Docs/INSTALLATION_GUIDE.md`
  - [ ] More detailed version
  - [ ] Screenshots if helpful
  - [ ] Manual steps if any

### 5.4 Test Fresh Installation
- [ ] Restore blank.bak to new test database
  - [ ] Name: `MinistryPlatform_FreshTest`
- [ ] Run installation scripts
- [ ] Verify all customizations applied
- [ ] Document any issues
- [ ] Fix and retest
- [ ] Test each application against fresh database
  - [ ] RSVP Widget
  - [ ] Groups App
  - [ ] Prayer Widget
  - [ ] Others
- [ ] Document results

### 5.5 Create Rollback Plan
- [ ] Document how to rollback each customization
- [ ] Create rollback scripts if needed
- [ ] Test rollback process

---

## Phase 6: Sync Zod Models with Database

### 6.1 Build Schema-to-Zod Generator
- [ ] Create `Scripts/generate-zod-schemas.js`
  - [ ] Connect to database
  - [ ] Read table schema from INFORMATION_SCHEMA
  - [ ] Map SQL types to TypeScript types
  - [ ] Generate Zod schemas
  - [ ] Handle nullable fields
  - [ ] Handle foreign keys
  - [ ] Output to files
- [ ] Test generator on known tables

### 6.2 Generate Zod Schemas for Custom Tables
- [ ] Run generator on all custom tables
  - [ ] RSVP tables
  - [ ] Projects table
  - [ ] Others
- [ ] Save to `Database/Generated/zod/`
- [ ] Review generated schemas

### 6.3 Compare with Existing Application Types
- [ ] Load existing Zod schemas from projects
- [ ] Compare with generated schemas
- [ ] Document differences
- [ ] Determine which is correct (DB or code)

### 6.4 Fix Discrepancies
- [ ] Update database if code is correct
  - [ ] Add missing columns
  - [ ] Fix data types
- [ ] Update code if database is correct
  - [ ] Update Zod schemas in applications
  - [ ] Fix application code that uses wrong types
- [ ] Test applications after updates

### 6.5 Create Type Sync Process
- [ ] Add npm script: `npm run sync:zod`
- [ ] Add to CI/CD pipeline (optional)
- [ ] Add pre-commit hook to warn of type drift
- [ ] Document process in `Docs/TYPE_SYNC_GUIDE.md`

### 6.6 Generate Types for Base MP Tables (Optional)
- [ ] If applications use base MP tables
- [ ] Generate Zod/TS types for those too
- [ ] Helps with type safety across the board

---

## Phase 7: Testing & Validation

### 7.1 Test on Sandbox Database
- [ ] Deploy all customizations to sandbox
- [ ] Test each application
  - [ ] RSVP Widget - full flow
  - [ ] Groups App - full flow
  - [ ] Prayer Widget - full flow
  - [ ] Other apps
- [ ] Verify all stored procedures work
- [ ] Check for performance issues
- [ ] Document any issues

### 7.2 Update Test Data
- [ ] Ensure sandbox has good test data
- [ ] Create test data scripts if needed
- [ ] Document test scenarios

### 7.3 Code Review
- [ ] Review all new SQL files
- [ ] Check for SQL injection vulnerabilities
- [ ] Check for performance issues
- [ ] Verify error handling
- [ ] Verify all IF NOT EXISTS logic

### 7.4 Documentation Review
- [ ] Proofread all documentation
- [ ] Check for dead links
- [ ] Ensure examples are correct
- [ ] Get feedback from team

---

## Phase 8: Cleanup & Finalization

### 8.1 Remove Old Files
- [ ] Delete SQL files from project directories (after verification)
- [ ] Or add deprecation notices and keep temporarily
- [ ] Update .gitignore if needed

### 8.2 Update Project READMEs
- [ ] Each project should reference `@Database/`
- [ ] Remove outdated SQL documentation
- [ ] Add links to relevant database docs

### 8.3 Update Main Repository README
- [ ] Add section about database organization
- [ ] Link to `Database/README.md`
- [ ] Update quick start guides

### 8.4 Create Training Materials (Optional)
- [ ] Video walkthrough of new structure
- [ ] Presentation for team
- [ ] Quick reference guide

### 8.5 Final Testing
- [ ] Full regression testing
- [ ] Performance testing
- [ ] Security review
- [ ] Get sign-off

---

## Ongoing Maintenance

### Establish Processes
- [ ] Define when to run `npm run sync:zod`
- [ ] Define code review process for database changes
- [ ] Define testing requirements for DB changes
- [ ] Define documentation requirements

### Documentation Updates
- [ ] Keep SCHEMA_REFERENCE.md updated
- [ ] Update MIGRATION_PLAN.md as needed
- [ ] Document lessons learned

---

## Quick Wins (Can Do Immediately)

These tasks can be started right away without waiting for schema comparison:

- [ ] Move known RSVP SQL files to `@Database/StoredProcs/RSVP/`
- [ ] Document known custom tables
- [ ] Create `Database/Comparison/` folder structure
- [ ] Write `Scripts/compare-schemas.sql` script
- [ ] Update `Database/README.md` with project overview
- [ ] Create `Database/Setup/` folder with placeholder README
- [ ] Write `Scripts/generate-zod-schemas.js` (can test on known tables)

---

## Questions to Answer

- [!] Do we modify base MP tables or only add custom columns?
- [!] Are there any base MP stored procedures we've modified?
- [!] What version of MinistryPlatform is production running?
- [!] What version is blank.bak?
- [!] Are there environment-specific customizations (prod vs sandbox)?
- [!] Who else on the team needs to know about this reorganization?
- [!] What's the deployment process for production database changes?
- [!] Are there any database backup/restore procedures to follow?

---

## Priority Order Recommendation

1. **Phase 1 (Schema Analysis)** - Need this first to know what you're working with
2. **Quick Wins** - Can do in parallel with Phase 1
3. **Phase 2 (Documentation)** - Document as you discover
4. **Phase 3 (Reorganize)** - Once you know what's custom
5. **Phase 4 (Move Files)** - Centralize SQL
6. **Phase 5 (Fresh Install)** - Create setup scripts
7. **Phase 6 (Zod Sync)** - Ensure type safety
8. **Phase 7 (Testing)** - Validate everything
9. **Phase 8 (Cleanup)** - Polish and finalize

---

## Success Metrics

- [ ] Can restore blank.bak and install all customizations in < 1 hour
- [ ] All TypeScript types match database exactly (0 discrepancies)
- [ ] All SQL files are in `@Database/`
- [ ] Every customization is documented
- [ ] New developer can understand structure in < 1 hour
- [ ] All applications pass tests against fresh installation

---

## Notes

Add notes here as you work:

-

---

*Last Updated: 2025-11-24*
*Created by: Claude Code*
*Project Owner: Colton Wirgau*
