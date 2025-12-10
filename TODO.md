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

## 📊 Church Metrics & Reporting Platform

### Priority: Medium

**Status:** Planning

### Overview

Three separate projects for different metric needs:

1. **Weekly Numbers Widget** - Public widget for bulletin replacement
2. **Annual Meeting Microsite** - Long-standing site with time-based content
3. **Leadership Dashboards** (Optional) - Replace BI tools with custom apps

---

## Project 1: Weekly Numbers Widget

### Goal

Replace bulletin-printed weekly metrics with embeddable widget for campus homepages.

### Placement

- Embed on each campus homepage
- Lives alongside announcements, events, sermon notes
- Shareable link for social media/email

### Requirements

- **Access:** Public (no authentication required)
- **Format:** Embeddable widget/component
- **Endpoint:** `/weekly-numbers` or similar
- **Design:** Mobile-friendly, lightweight
- **Data:** TBD - need example from current bulletin

### Features

- [ ] Current week's metrics display
  - Attendance by service/campus
  - Weekly giving totals
  - Salvations/baptisms/first-time guests
  - Other ministry-specific metrics (TBD)
- [ ] Shareable links for social media
- [ ] Historical year comparison (optional - TBD)

### Technical Notes

- Public API endpoint for data
- Embeddable via iframe or web component
- Cache strategy for performance
- Real-time or scheduled updates

### Next Steps

- [ ] Get example of current bulletin numbers
- [ ] Define exact metrics to display
- [ ] Design widget UI/UX
- [ ] Confirm data sources available

---

## Project 2: Annual Meeting Microsite

### Goal

Dedicated public microsite for yearly congregational report and annual meeting.

### Context

- Currently has heavily designed printed document
- Needs digital equivalent with time-based content switching
- Where budget vote happens

### Requirements

- **Access:** Public (congregation and visitors)
- **URL:** `/annual-meeting` or `/annual-report`
- **Longevity:** Long-standing (persists year-over-year)
- **Content:** Mix of database-driven and manually curated
- **Time-based:** Automatically switch content phases based on meeting date

### Content Phases

**Pre-Meeting Phase:**

- Meeting registration (RSVP, childcare, questions)
- Preview materials and agenda
- Ministry highlights from the year
- Financial reports and budget proposal
- Leadership updates

**During Meeting:**

- Live updates and resources
- Digital program/agenda
- Real-time voting/polling (if applicable)

**Post-Meeting:**

- Meeting recap and recordings
- Budget vote results
- Follow-up materials
- Next steps

### Features

- [ ] **Database-driven metrics**
  - Year-over-year growth comparisons
  - Attendance trends
  - Giving highlights
  - Ministry statistics
- [ ] **Content management**
  - Ministry testimonials and stories
  - Leadership introductions
  - Photo galleries
  - Video embeds
- [ ] **Meeting registration**
  - RSVP system
  - Childcare requests
  - Question submissions
- [ ] **Admin companion app**
  - Content management in @NextJS/Apps
  - Marcom team can update content
  - Meeting configuration

### Technical Approach

- Standalone microsite (not part of main church website)
- Date-based routing/content display
- Custom database tables for annual content
- Integration with MinistryPlatform Events
- Reusable architecture for future years

### Content Sources

- **Automatic (database):** Metrics calculations, growth stats
- **Manual (Marcom):** Stories, testimonies, media
- **MinistryPlatform:** Event registration, contact data
- **Custom tables:** Annual-specific content storage

### Next Steps

- [ ] Review current printed document
- [ ] Identify required features and content types
- [ ] Define database schema for annual content
- [ ] Scope admin app requirements
- [ ] Determine timeline (target next annual meeting?)

---

## Project 3: Leadership Dashboards (Optional)

### Goal

Replace current BI tools with custom authenticated dashboards in @NextJS/Apps platform.

### Current State

- Leadership uses BI tools for reporting
- Contains detailed/sensitive data
- Separate from public congregation displays

### Proposed Solution

Build authenticated dashboard app in Apps platform with sections for:

- `/dashboards/executive` - High-level KPIs for senior leadership
- `/dashboards/finance` - Detailed financial reports and trends
- `/dashboards/ministry` - Ministry-specific metrics and growth
- `/dashboards/operations` - Facilities, volunteers, staff metrics

### Benefits vs. BI Tools

- ✅ Unified ecosystem with other church apps
- ✅ Live MinistryPlatform data (no ETL delays)
- ✅ Custom for church context
- ✅ Permission-based (MP roles)
- ✅ Mobile-friendly, PWA capabilities
- ✅ Lower cost (no BI licensing)
- ✅ Same tech stack as other apps

### Challenges

- ❌ Ad-hoc queries (BI tools better for exploration)
- ❌ Complex visualizations (need charting libraries)
- ❌ Historical data (may need data warehouse)

### Strategy

- **Approach:** Full BI replacement (migrate all dashboards, retire BI subscriptions)
- **Pilot:** Start with 2-3 high-priority dashboards
- **Rollout:** Get leadership feedback before full migration

### Features to Build

- [ ] **Real-time KPI displays**
  - Attendance trends (service, campus, ministry)
  - Giving trends and forecasts
  - Volunteer engagement
  - First-time guest conversion
- [ ] **Interactive reports**
  - Drill-down capabilities
  - Date range filters
  - Export to PDF/Excel
  - Scheduled email reports
- [ ] **Comparative analysis**
  - Year-over-year comparisons
  - Budget vs. actual
  - Campus/ministry benchmarking
- [ ] **Role-based views**
  - Executive: High-level KPIs
  - Finance: Detailed financials
  - Ministry leaders: Department metrics
  - Operations: Facilities and volunteers

### Data Sources

- MinistryPlatform API (real-time)
- Event_Metrics
- Custom stored procedures
- External imports (giving platforms)
- Read-only replica for complex queries (optional)

### Open Questions

- What specific BI dashboards are currently used?
- Can we identify MP reports to also replace?
- Who maintains long-term? How much automation?

---

## Technical Considerations (All Projects)

### Database Schema

- [ ] Metrics tables (or use existing Event_Metrics)
- [ ] Annual content storage (reports, testimonies, media)
- [ ] Meeting registration structure
- [ ] Weekly numbers cache/aggregation tables

### Stored Procedures

- [ ] Weekly metrics aggregation
- [ ] Annual report data compilation
- [ ] Financial summaries by timeframe
- [ ] Leadership/staff data queries

### Admin Interface

- [ ] Annual meeting content management
- [ ] Metric entry/editing (if manual)
- [ ] Meeting configuration
- [ ] Media upload/organization

### Shared Technical Features

- [ ] Date-based routing and content display
- [ ] Public vs authenticated views
- [ ] Responsive design for all devices
- [ ] Caching strategy for performance

### Integration Points

- MinistryPlatform Events (registration)
- Financial data (custom tables/imports)
- Staff/leadership tables
- Media/file storage
- Existing Event_Metrics from Counter app

---

## Implementation Plan

### Phase 1: Weekly Numbers Widget

**Timeline:** TBD
**Owner:** TBD
**Next Actions:**

- [ ] Get bulletin example
- [ ] Audit data sources
- [ ] Define metrics spec
- [ ] Design widget UI/UX

### Phase 2: Annual Meeting Microsite

**Timeline:** TBD (target next annual meeting?)
**Owner:** TBD
**Next Actions:**

- [ ] Review current document
- [ ] Scope required features
- [ ] Design database schema
- [ ] Plan admin app

### Phase 3: Leadership Dashboards

**Timeline:** TBD (pilot program)
**Owner:** TBD
**Status:** Optional - evaluate after Phases 1-2
**Next Actions:**

- [ ] Identify current BI dashboards
- [ ] Define MVP dashboard set
- [ ] Assess BI replacement feasibility

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
