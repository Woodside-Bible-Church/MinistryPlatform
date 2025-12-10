# Migration Plan: MinistryPlatform Folder Structure

December 2, 2025
Woodside Bible Church

---

## Executive Summary

This document outlines Woodside Bible Church's migration from the current `MinistryPlatform/` folder structure to a streamlined Turborepo monorepo architecture. This restructuring enables:

- Shared packages to eliminate code duplication
- Faster development with intelligent build caching
- Clear separation of concerns and better organization
- Standardized patterns across all projects
- Better tracking of database customizations vs baseline

---

## Why Migrate?

### Current Problems

1. **Code duplication across projects**

   - Auth logic reimplemented in each app
   - MP API client code copied and pasted
   - Same utilities repeated in multiple places
   - Bugs need to be fixed in multiple locations

2. **Disorganized structure**

   - Everything in one flat folder
   - No clear boundaries between apps
   - Hard to understand what depends on what
   - Difficult to onboard new developers

3. **Mixed technology patterns**

   - CustomWidgets (Liquid.js, static files)
   - Next.js apps with different structures
   - Inconsistent code styles and approaches
   - No shared component library

4. **No clear database tracking**

   - Hard to see what's been customized in MP database
   - No separation between base MP and custom tables/procs
   - Database changes scattered across projects
   - No version control for schema changes

5. **Slow development velocity**
   - Copy/paste leads to inconsistencies
   - No build caching across projects
   - Hard to share improvements across apps
   - Difficult to maintain consistency

### Goals of Migration

1. **Eliminate code duplication**

   - Shared packages (`@woodside/*`) for common functionality
   - Single source of truth for auth, MP client, utilities
   - Update once, benefit everywhere within Woodside
   - Consistent behavior across all apps

2. **Organize by purpose**

   - Clear folder structure (packages, microsites, apps, widgets)
   - Obvious dependencies and relationships
   - Easy to find and modify code
   - Better developer experience

3. **Standardize technology stack**

   - Everything in Next.js (no CustomWidgets)
   - Turborepo for build orchestration
   - Consistent patterns and conventions
   - Shared TypeScript configuration

4. **Improve development velocity**

   - Turborepo caching (rebuild only what changed)
   - Parallel builds across projects
   - Shared component library for UI consistency
   - Templates for quickly starting new apps

5. **Better database management**
   - Clear tracking of customizations vs baseline
   - Version-controlled migrations
   - Zod schemas for type safety
   - Dependency tracking (which apps use which tables)

---

## New Architecture

### Folder Structure

**Single Turborepo Monorepo:**

```
~/Projects/woodside/              # WOODSIDE TURBOREPO
│
├── packages/                     # Shared packages (abstracted/reusable code)
│   ├── core/                     # Framework-agnostic (work everywhere)
│   │   ├── ministry-platform/    # MP API client
│   │   │   ├── package.json
│   │   │   └── src/
│   │   ├── database/             # Database utilities & Zod schemas
│   │   │   ├── package.json
│   │   │   ├── schemas/          # Zod schemas (baseline + custom)
│   │   │   ├── scripts/          # Migration & validation tools
│   │   │   └── src/
│   │   └── wordpress/            # WordPress API integration
│   │       ├── package.json
│   │       └── src/
│   │
│   ├── nextjs/                   # Next.js-specific packages
│   │   ├── ui/                   # Shared React components
│   │   │   ├── package.json
│   │   │   └── src/
│   │   ├── auth/                 # OAuth provider & utilities (NextAuth)
│   │   │   ├── package.json
│   │   │   └── src/
│   │   ├── package.json          # Shared Next.js dependencies
│   │   └── tsconfig.json         # Shared TypeScript config
│   │
│   └── (future) react-native/    # React Native-specific packages
│       ├── ui/                   # Native components
│       ├── auth/                 # React Native OAuth
│       └── package.json          # Shared RN dependencies
│
├── microsites/                   # Standalone branded portals (public-facing)
│   ├── groups/                   # groups.woodsidebible.org
│   │   ├── package.json
│   │   └── src/
│   ├── events/                   # events.woodsidebible.org
│   │   ├── package.json
│   │   └── src/
│   ├── serve/                    # serve.woodsidebible.org
│   │   ├── package.json
│   │   └── src/
│   ├── easter/                   # easter.woodsidebible.org (seasonal)
│   ├── christmas/                # christmas.woodsidebible.org (seasonal)
│   └── retreats/                 # retreats.woodsidebible.org
│
├── apps/
│   └── platform/                 # apps.woodsidebible.org (management tools)
│       ├── package.json
│       └── src/app/(app)/
│           ├── projects/         # Integration hub
│           ├── counter/          # Metrics input
│           ├── people-search/    # Staff lookup
│           ├── prayer/           # Prayer moderation
│           └── ...
│
├── widgets/                      # Embeddable Next.js components
│   ├── search/                   # Global search modal (WP + MP)
│   │   ├── package.json
│   │   └── src/
│   ├── prayer/                   # Prayer submission form
│   ├── rsvp/                     # RSVP form
│   ├── featured-events/          # Featured events carousel
│   ├── featured-groups/          # Featured groups carousel
│   ├── featured-serve/           # Featured serve opportunities carousel
│   ├── announcements/            # Announcements display
│   ├── banner/                   # Banner/hero component
│   ├── campus-details/           # Campus information
│   ├── new-person/               # New person form
│   └── cafe-menu/                # Cafe menu display
│
├── database/
│   ├── baseline/                 # Blank MP instance (.bak reference)
│   ├── customizations/           # Woodside-specific DB objects
│   │   ├── Tables/               # Custom tables (SQL definitions)
│   │   ├── StoredProcs/          # Custom stored procedures
│   │   ├── Views/                # Custom views
│   │   └── FormFields/           # Custom fields on base tables
│   └── migrations/               # Version-controlled change scripts
│
├── templates/                    # Starter templates for new projects
│   ├── microsite/                # Template for new microsites
│   ├── micro-app/                # Template for apps platform routes
│   └── widget/                   # Template for new widgets
│
├── package.json                  # Workspace root (npm workspaces)
├── turbo.json                    # Turborepo configuration
├── .gitignore
└── README.md
```

**Key Points:**

- **Single Turborepo monorepo**: All Woodside code in one place
- **Shared packages** (`packages/*`): Common code used across apps/widgets/microsites
- **Framework-agnostic core** (`packages/core/*`): Works everywhere - `ministry-platform`, `database`, `wordpress`
- **Framework-organized packages** (`packages/nextjs/*`, `packages/react-native/*`): Grouped by platform
- **Clear organization**: Easy to find any app, widget, or shared code; obvious which packages work together
- **Turborepo manages builds**: Intelligent caching and parallel execution
- **Import from packages**: `@woodside/ministry-platform`, `@woodside/nextjs-ui`, `@woodside/nextjs-auth`, etc.

### Key Architectural Decisions

#### 1. Everything in Next.js (No CustomWidgets)

**Decision:** Eliminate CustomWidgets (Liquid.js + static files) in favor of Next.js widgets.

**Reasoning:**

- ✅ Single technology stack (Next.js everywhere)
- ✅ Better developer experience
- ✅ TypeScript type safety
- ✅ React Server Components
- ✅ Unified deployment (all on Vercel)
- ✅ Easier to maintain
- ❌ Lose ability to deploy on GitHub Pages (acceptable tradeoff)

**Migration:**

```
CustomWidgets/EventFinder/   → microsites/events/ (main finder) + widgets/featured-events/ (carousel)
CustomWidgets/GroupFinder/   → microsites/groups/ (main finder) + widgets/featured-groups/ (carousel)
CustomWidgets/ServeFinder/   → microsites/serve/ (main finder) + widgets/featured-serve/ (carousel)
CustomWidgets/Announcements/ → widgets/announcements/
CustomWidgets/Banner/        → widgets/banner/
CustomWidgets/CampusDetails/ → widgets/campus-details/
CustomWidgets/NewPerson/     → widgets/new-person/
CustomWidgets/WoodsideCafe/  → widgets/cafe-menu/
```

**Note:** The main finder functionality (search, browse, filter) for Events, Groups, and Serve will be built into their respective microsites. The embeddable widgets will be simpler carousel/featured components that can show filtered content on WordPress pages.

#### 2. Monorepo with Turborepo

**Decision:** Use Turborepo for monorepo management.

**Reasoning:**

- ✅ Built by Vercel (seamless integration)
- ✅ Intelligent task caching (faster builds)
- ✅ Parallel execution with dependency awareness
- ✅ Remote caching (share builds across team/CI)
- ✅ Automatic monorepo detection on Vercel
- ✅ Share code via imports (not HTTP calls)
- ✅ Keep Next.js server-side features (Server Components, caching)
- ✅ Type safety across all projects
- ✅ Better performance than separate API service

**Setup:**

```bash
# Create monorepo structure
cd ~/Projects
mkdir -p woodside/{packages,microsites,apps,widgets,database,templates}
cd woodside

# Initialize
npm init -y

# Install Turborepo
npm install turbo --save-dev

# Configure workspaces and turbo.json (see below)
```

**Root Configuration (woodside/package.json):**

```json
{
  "name": "woodside-monorepo",
  "private": true,
  "workspaces": [
    "packages/core/*",
    "packages/nextjs/*",
    "packages/react-native/*",
    "microsites/*",
    "apps/*",
    "widgets/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "turbo run db:migrate",
    "db:validate": "turbo run db:validate",
    "db:generate-zod": "turbo run db:generate-zod"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

**turbo.json:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:validate": {
      "cache": false
    }
  }
}
```

**Development Workflow:**

```bash
# From monorepo root - runs all dev servers in parallel
npm run dev

# Build everything (with caching)
npm run build

# Build only specific app
turbo run build --filter=groups-microsite

# Run dev for specific app
turbo run dev --filter=groups-microsite

# Build with remote caching
turbo run build --token=<vercel-token>
```

**Example Usage:**

```typescript
// microsites/groups/src/app/page.tsx
import { getGroups } from "@woodside/ministry-platform";  // Core package
import { auth } from "@woodside/nextjs-auth";             // Next.js-specific
import { Button } from "@woodside/nextjs-ui";             // Next.js-specific

export default async function GroupsPage() {
  const session = await auth();
  const groups = await getGroups(); // Cached by Next.js
  return <GroupsList groups={groups} />;
}
```

**Vercel Integration:**

When deploying to Vercel, it automatically detects Turborepo:

1. Builds only what changed (using Turborepo cache)
2. Shares build cache across deployments
3. Parallel builds for independent apps
4. No additional configuration needed

**In Vercel Project Settings:**

- Framework Preset: `Next.js`
- Root Directory: `woodside/microsites/groups`
- Build Command: `turbo run build --filter=groups-microsite...` (auto-detected)
- Install Command: `npm install` (runs from root)

**Benefits for Development:**

- Run `npm run dev` once → All apps start simultaneously
- Change a package → Only dependent apps rebuild
- Parallel builds → Much faster CI/CD
- Remote cache → Team shares build artifacts

#### 3. Infrastructure Ownership

**Structure:**

```
GitHub Org: github.com/woodside-church/
Vercel Org: vercel.com/woodside-church
Database: SQL Server (MinistryPlatform)
Domains: *.woodsidebible.org

Internal packages (in monorepo):

Core (framework-agnostic):
@woodside/ministry-platform
@woodside/database
@woodside/wordpress

Next.js-specific:
@woodside/nextjs-auth
@woodside/nextjs-ui

Future (React Native):
@woodside/react-native-auth
@woodside/react-native-ui
```

#### 4. PWA Support for All Apps

**Decision:** All microsites and micro-apps are installable PWAs.

**Reasoning:**

- ✅ App-like experience without app store
- ✅ Offline capability
- ✅ Push notifications (optional)
- ✅ Home screen install
- ✅ Works on all platforms
- ✅ Instant updates (no user downloads)
- ✅ Better mobile UX
- ✅ Each micro-app can be installed independently

**Example Use Cases:**

- Staff installs `apps.woodsidebible.org/counter` as standalone Counter app
- Event coordinators install `apps.woodsidebible.org/projects` for project management
- Group leaders install `groups.woodsidebible.org` to manage their groups
- Event staff install `events.woodsidebible.org` for check-ins
- Volunteer coordinators install `serve.woodsidebible.org`

#### 5. Persistent Seasonal Microsites

**Decision:** Easter/Christmas sites stay live year-round, content switches based on project.

**Reasoning:**

- ✅ Persistent URLs (better for SEO, bookmarks)
- ✅ No dead links
- ✅ Can show recap content after season
- ✅ Historical archive
- ✅ One codebase per seasonal event

**Implementation:**

```typescript
// microsites/easter/src/app/page.tsx
export default async function EasterPage() {
  const project = await getCurrentEasterProject();

  if (project?.isActive) {
    return <CurrentEaster project={project} />; // During season
  } else {
    return <EasterRecap lastYear={project?.year} />; // After season
  }
}
```

---

## Product Types

### 1. Microsite

**Purpose:** Standalone branded portal for major ministry area

**Examples:**

- groups.woodsidebible.org
- events.woodsidebible.org
- serve.woodsidebible.org

**Features:**

- Custom subdomain
- Public-facing
- PWA installable
- Full CRUD operations
- Includes detail pages (replaces MP native widgets)

**Template:** `templates/microsite/`

---

### 2. Micro-app

**Purpose:** Internal management tool, route in apps platform

**Examples:**

- apps.woodsidebible.org/counter
- apps.woodsidebible.org/people-search
- apps.woodsidebible.org/projects

**Features:**

- Route in apps platform
- Staff/volunteer facing
- Shared auth & navigation
- CRUD operations
- Each micro-app is its own installable PWA

**Template:** `templates/micro-app/`

---

### 3. Widget

**Purpose:** Embeddable Next.js component for WordPress pages

**Examples:**

- Search modal (WP + MP global search)
- Featured events carousel (filtered by page context)
- Featured groups carousel (filtered by page context)
- Featured serve opportunities carousel (filtered by page context)
- Prayer submission form
- RSVP form
- Announcements display
- Campus details

**Features:**

- Embeds via `<script>` tag
- Works on WordPress or any site
- Responsive
- Can be read-only (carousels, displays) or interactive (forms)
- Context-aware filtering (e.g., show events for specific campus)

**Template:** `templates/widget/`

**Note:** Full finder/search functionality for Events, Groups, and Serve lives in their respective microsites, not in embeddable widgets.

---

## Multi-Framework Support Strategy

### Overview

While the current architecture is built entirely on Next.js, the monorepo structure is designed to support sharing backend packages with other frameworks and platforms. This enables flexibility for churches that may want to build native mobile apps, desktop applications, or use different frontend frameworks while maintaining a single source of truth for MinistryPlatform integration logic.

### Shareable Backend Packages

The following packages are **framework-agnostic** and can be used across any JavaScript/TypeScript project:

- `@woodside/ministry-platform` - MP API client (pure JS/TS, works everywhere)
- `@woodside/database` - Zod schemas, types, validation (pure JS/TS)
- `@woodside/wordpress` - WordPress API integration (pure JS/TS)

### Framework-Specific Packages

Some packages are inherently tied to specific frameworks and would need separate implementations:

- **Auth:** NextAuth.js is Next.js-specific; React Native would need a different OAuth implementation
- **UI Components:** Web React components won't work in React Native; would need native equivalents

### Potential Use Cases

This architecture could support:

- **React Native mobile apps** - Shared MP integration, separate auth and UI
- **Electron desktop apps** - Full code reuse for business logic
- **Vue.js or other frameworks** - If a developer prefers different frontend while keeping MP integration
- **CLI tools** - Command-line utilities using the same MP client
- **Background job workers** - Scheduled tasks, automation, data sync

### Package Structure for Multi-Framework Support

Packages are organized by framework to make it obvious which packages work together:

```
~/Projects/woodside/
│
├── packages/
│   ├── core/                     # ✅ Framework-agnostic (works everywhere)
│   │   ├── ministry-platform/    # MP API client
│   │   ├── database/             # Zod schemas & DB utilities
│   │   └── wordpress/            # WordPress API integration
│   │
│   ├── nextjs/                   # Next.js-specific packages
│   │   ├── ui/                   # React web components
│   │   ├── auth/                 # NextAuth implementation
│   │   ├── package.json          # Shared Next.js dependencies
│   │   └── tsconfig.json         # Shared TypeScript config
│   │
│   └── (future) react-native/    # React Native-specific packages
│       ├── ui/                   # Native components
│       ├── auth/                 # React Native OAuth
│       └── package.json          # Shared RN dependencies
│
├── microsites/                   # Next.js web apps
├── apps/
│   ├── platform/                 # Next.js web app
│   └── (future) mobile/          # React Native mobile app
│
├── widgets/                      # Next.js embeddable components
```

**Organization Strategy:**
- **`packages/core/*`** = Framework-agnostic (works in any JS/TS environment)
- **`packages/nextjs/*`** = Next.js-specific packages grouped together
- **`packages/react-native/*`** = React Native-specific packages grouped together
- **`packages/electron/*`** = Electron-specific packages (future)

**Why Group by Framework:**
1. Clear boundaries - obvious which packages work together
2. Framework-level configuration (tsconfig.json, package.json)
3. Easy to add new framework - copy folder structure
4. Shared tooling per framework
5. Natural grouping - when working on RN, you touch RN packages together

**Benefits:**
- Clear at a glance which packages are portable
- Easy to add new framework implementations
- Core packages never have breaking changes from framework-specific concerns
- Simple to import: `import { getGroups } from "@woodside/ministry-platform"` works everywhere

### Example: Adding a React Native Mobile App

```typescript
// apps/mobile/src/screens/GroupsScreen.tsx (React Native)
import { getGroups } from "@woodside/ministry-platform";  // Core package - works!
import { GroupSchema } from "@woodside/database";         // Core package - works!
import { useAuth } from "@woodside/react-native-auth";    // RN-specific
import { Button } from "@woodside/react-native-ui";       // RN-specific

export function GroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // Same MP integration, different platform
    getGroups().then(data => {
      setGroups(GroupSchema.array().parse(data));
    });
  }, []);

  return <FlatList data={groups} renderItem={...} />;
}
```

### Migration Impact

**Phase 1 Changes:**
- Organize framework-agnostic packages under `packages/core/`
- Organize Next.js-specific packages under `packages/nextjs/`
- Update package names: `@woodside/auth-nextjs` → `@woodside/nextjs-auth`
- Update package names: `@woodside/ui-nextjs` → `@woodside/nextjs-ui`
- Update all imports in microsites/apps/widgets
- Add framework-level configuration files (`packages/nextjs/tsconfig.json`, etc.)

**Contracting Benefits:**
- Churches can start with web apps, add native mobile later without rebuilding backend
- Developers can choose their preferred frontend framework
- Easier to hire developers (not locked into Next.js expertise)
- Reusable architecture reduces per-project development cost

### Implementation Priority

This multi-framework support is **not a Phase 1 priority** but is an architectural consideration that influences folder structure from the start. The migration will:

1. **Phase 1:** Implement naming convention to indicate framework-agnostic vs. Next.js-specific packages
2. **Future:** Add React Native support when mobile apps become a priority
3. **Future:** Consider other frameworks based on church/developer needs

---

## Contracting Model & Church Ownership

### Philosophy: Full Church Ownership

**Core Principle:** Each church should **own their entire infrastructure** - no multitenancy, no dependencies on contractor-managed services.

### Recommended Stack Per Church

Each church gets their own isolated infrastructure:

```
Church Infrastructure (Fully Owned):
├── GitHub Repository (church's GitHub org)
├── Vercel Project (church's Vercel org)
├── Neon Database (church's Neon account)
└── Domain (church's DNS - *.church.org)
```

**Why This Approach:**

1. **True Ownership:** Church can hire anyone to work on their code
2. **No Vendor Lock-in:** Not dependent on original contractor's services
3. **Affordable:** All platforms have generous free/cheap tiers
4. **Simple:** Each church has standard, well-documented stack
5. **Portable:** Easy to move or replicate if needed
6. **Independent:** Churches don't affect each other

### Cost Per Church (Monthly)

- **GitHub:** Free (public repos) or $4/user (private repos)
- **Neon:** Free tier (0.5GB), then $19/month (10GB)
- **Vercel:** Free (hobby), $20/month (Pro) for production features
- **Total:** $0-50/month depending on needs and scale

### Contracting Workflow

**Initial Setup (One-Time):**

1. Church creates their own accounts:
   - GitHub organization
   - Vercel organization
   - Neon database account

2. Contractor sets up monorepo:
   ```bash
   # Clone template/starter repo
   git clone https://github.com/your-template/woodside-starter church-name
   cd church-name

   # Initialize with church's values
   npm run init-church
   # Prompts for: Church name, domain, MP API credentials

   # Push to church's GitHub
   git remote set-url origin https://github.com/church-org/mp-integration
   git push

   # Connect to church's Vercel
   vercel link
   vercel env pull
   ```

3. Church gets:
   - Full codebase in their GitHub
   - Deployed to their Vercel
   - Database in their Neon
   - Complete documentation

**Ongoing Development:**

- Contractor works in church's GitHub (temporary access)
- Changes deploy to church's Vercel
- Church can revoke access anytime
- Church can hire different contractors without migration

**Best Practices:**

- Use GitHub branch protection (require PR reviews)
- Document everything in church's repository
- Church admins maintain their own env vars in Vercel
- Regular backups of Neon database
- Church owns DNS and can point to any provider

### Why Not Multitenancy?

**Considered and Rejected:**

❌ **Shared Neon Instance:**
- Creates dependency on contractor
- Churches can't switch contractors easily
- Security concerns with shared database
- Billing complexity

❌ **Contractor-Owned Infrastructure:**
- Church doesn't truly own their code/data
- Vendor lock-in
- Trust issues
- Difficult to transition away

✅ **Each Church Owns Everything:**
- Complete autonomy
- No dependencies
- Easy to replicate for new churches
- Contractor is truly interchangeable

### Template Repository

Maintain a **public template repository** with:

```
woodside-starter/
├── README.md                    # Getting started guide
├── CHURCH_SETUP.md             # Church setup checklist
├── packages/                   # All starter packages
├── microsites/                 # Example microsites
├── apps/                       # Example apps platform
├── widgets/                    # Example widgets
├── database/
│   ├── baseline/               # MP baseline reference
│   └── migrations/             # Starter migrations
├── .env.example                # Required environment variables
├── setup.js                    # Interactive setup script
└── docs/                       # Complete documentation
```

**Benefits:**
- Churches can self-start (even without contractor)
- Easy to show potential clients
- Open source builds trust
- Community contributions possible
- Clear starting point for any developer

### MinistryPlatform Partner Validation

This approach has been **validated by MinistryPlatform experts** as a best practice for church implementations:

- ✅ Each church maintains their own MP integration
- ✅ Standardized stack (GitHub, Neon, Vercel) is easy to support
- ✅ Clean separation enables multiple contractors/developers
- ✅ Churches retain full control of their customizations

---

## Domain-Based Planning

Organize projects by **ministry domain**, not technical implementation. Each domain may have multiple components.

### Groups Domain

**Components:**

- Microsite: groups.woodsidebible.org (public portal + management + full group finder)
- Micro-app: apps.../groups (staff management tools)
- Widget: Featured groups carousel (embeds on WordPress, filtered by page context)

**Current State:** Prototype exists, CustomWidgets for finder

**Priority:** High

**Architecture:** Full search/browse/filter functionality built into microsite. Widget is simpler carousel component for featuring groups on WordPress pages.

---

### Events Domain

**Components:**

- Microsite: events.woodsidebible.org (public calendar + registration + full event finder)
- Micro-app: apps.../events (event management)
- Widget: Featured events carousel (embeds on WordPress, filtered by page context)

**Current State:** CustomWidget (EventFinder) only

**Priority:** High

**Replaces:** MP native Event Details widget

**Architecture:** Full search/browse/filter functionality built into microsite. Widget is simpler carousel component for featuring events on WordPress pages.

---

### Serve Domain

**Components:**

- Microsite: serve.woodsidebible.org (volunteer portal + full serve opportunity finder)
- Micro-app: apps.../serve (opportunity management)
- Widget: Featured serve opportunities carousel (embeds on WordPress, filtered by page context)

**Current State:** CustomWidget (ServeFinder) only

**Priority:** High

**Replaces:** MP native Serve Details widget

**Architecture:** Full search/browse/filter functionality built into microsite. Widget is simpler carousel component for featuring serve opportunities on WordPress pages.

---

### Projects Domain (Integration Hub)

**Components:**

- Micro-app: apps.../projects/
  - Dashboard
  - Budgets (existing) - **CRITICAL: Required for Retreats microsite**
  - RSVPs (existing)
  - Serve opportunities (connect to Serve domain)
  - Event registrations (connect to Events domain)
- Widget: RSVP form (existing)

**Current State:** Partially built in Apps platform

**Priority:** Critical (blocking Retreats)

**Notes:** Acts as cross-ministry coordination layer. All major ministry initiatives tracked here. Project Budgets functionality must be completed and migrated before Retreats microsite can launch, as Retreats will integrate with it for registration and budget tracking.

---

### Search Domain

**Components:**

- Widget: Global search modal (WordPress + MinistryPlatform)

**Current State:** Doesn't exist

**Priority:** High

**Features:** Modal overlay, searches both WP content and MP data, keyboard shortcut

---

### Prayer Domain

**Components:**

- Micro-app: Prayer moderation (existing)
- Widget: Prayer submission form (existing)

**Current State:** Exists in Apps + Widgets, needs migration

**Priority:** Low

---

### Seasonal Domains

**Easter / Christmas:**

- Microsite: easter.woodsidebible.org, christmas.woodsidebible.org
- Auto-switches between active content and recap
- Persistent URLs

**Retreats:**

- Microsite: retreats.woodsidebible.org
- Registration and information portal
- Integrates with Project Budgets for sign-up and financial tracking

**Priority:** High

**Dependencies:** Requires Project Budgets micro-app to be completed first

---

## Migration Strategy

### Phase 1: Foundation (Q1 2025)

**Goals:**

- Set up Woodside Turborepo monorepo structure
- Extract shared code into internal packages
- Create templates for new apps/widgets/microsites
- Document baseline database and customizations

**Tasks:**

1. **Create monorepo structure**

   - Manual setup: `mkdir -p woodside/{packages/{core,nextjs,react-native},microsites,apps,widgets,database,templates}`
   - Initialize: `npm init -y`
   - Install Turborepo: `npm install turbo --save-dev`
   - Configure `package.json` with workspaces (core/*, nextjs/*, react-native/*)
   - Configure `turbo.json` pipeline
   - Set up remote caching: `npx turbo login && npx turbo link`

2. **Extract shared packages from current Apps platform:**

   **Core packages (framework-agnostic):**
   - MP API client → `packages/core/ministry-platform/` (`@woodside/ministry-platform`)
     - **CRITICAL:** All CREATE/UPDATE methods must accept and pass `$userID` parameter to MP API
     - This enables proper audit logging without requiring users to have direct MP table permissions
   - Database utilities → `packages/core/database/` (`@woodside/database`)
   - WordPress integration → `packages/core/wordpress/` (`@woodside/wordpress`)

   **Next.js-specific packages:**
   - Auth logic → `packages/nextjs/auth/` (`@woodside/nextjs-auth`)
   - Shared components → `packages/nextjs/ui/` (`@woodside/nextjs-ui`)
   - Add `packages/nextjs/package.json` with shared Next.js dependencies
   - Add `packages/nextjs/tsconfig.json` with shared TypeScript config

3. **Set up database tracking:**

   - Copy `Database/` → `database/baseline/`
   - Document Woodside-specific customizations in `database/customizations/`
   - Create Zod schema structure in `packages/database/schemas/`
   - Set up dependency tracking manifests

4. **Create starter templates:**

   - Microsite template in `templates/microsite/`
   - Micro-app template in `templates/micro-app/`
   - Widget template in `templates/widget/`

5. **Test Turborepo workflow:**
   - Run `npm run dev` to start all packages
   - Verify caching works
   - Test selective builds with `--filter`
   - Test remote caching with Vercel

---

### Phase 2: Core Migration (Q2 2025)

**Goals:**

- Migrate existing Apps platform to monorepo
- **Complete Project Budgets functionality (critical blocker)**
- Build first microsites (Groups, Events, Retreats)
- Convert high-priority CustomWidgets to Next.js

**Tasks:**

1. **Migrate Apps platform** → `apps/platform/`

   - Update to use `@woodside/*` packages (`@woodside/ministry-platform`, `@woodside/auth-nextjs`, `@woodside/database`, etc.)
   - Ensure all routes work with shared auth
   - Configure each micro-app as an independent PWA
   - **PRIORITY: Complete Project Budgets functionality** (blocking Retreats)

2. **Build Groups microsite** (first real implementation of template)

   - Implement using `templates/microsite/`
   - Deploy to groups.woodsidebible.org
   - Use `@woodside/ministry-platform` for data access

3. **Build Events microsite**

   - Deploy to events.woodsidebible.org
   - Replaces MP native Event Details widget

4. **Build Retreats microsite** (depends on Project Budgets completion)

   - Deploy to retreats.woodsidebible.org
   - Registration and information portal
   - Integrates with Project Budgets for registration and budget tracking

5. **Build Search widget**

   - Global search modal (WP + MP)
   - Embeddable via script tag

6. **Create embeddable carousel widgets for WordPress:**
   - Featured Events carousel → `widgets/featured-events/` (filtered by page context)
   - Featured Groups carousel → `widgets/featured-groups/` (filtered by page context)
   - Featured Serve carousel → `widgets/featured-serve/` (filtered by page context)
   - Note: Full finder functionality lives in microsites, not widgets

---

### Phase 3: Expansion (Q3 2025)

**Goals:**

- Complete core microsites
- Convert all remaining CustomWidgets
- Add additional micro-apps

**Tasks:**

1. **Build Serve microsite**

   - Deploy to serve.woodsidebible.org
   - Volunteer portal and opportunity management

2. **Convert remaining CustomWidgets → Next.js embeddable widgets:**

   - Announcements display → `widgets/announcements/`
   - Banner/hero component → `widgets/banner/`
   - Campus details → `widgets/campus-details/`
   - New person form → `widgets/new-person/`
   - Cafe menu display → `widgets/cafe-menu/`
   - Prayer submission form → `widgets/prayer/`
   - RSVP form → `widgets/rsvp/`

3. **Add micro-apps to apps platform:**
   - Announcements management
   - Campus details management
   - Cafe menu management

---

### Phase 4: Polish (Q4 2025)

**Goals:**

- Seasonal microsites
- Documentation and optimization

**Tasks:**

1. Build Easter microsite
2. Build Christmas microsite
3. Complete documentation
4. Performance optimization
5. User feedback and refinements

---

## Environment & Infrastructure

### Organization-Level (Vercel)

Organization-level environment variables:

```env
MINISTRY_PLATFORM_BASE_URL=https://my.ministryplatform.com
MINISTRY_PLATFORM_CLIENT_ID=...
MINISTRY_PLATFORM_CLIENT_SECRET=...
WORDPRESS_API_URL=https://church.org/wp-json
```

### Project-Level (Vercel)

Each app/microsite has project-specific vars:

```env
# groups microsite
NEXTAUTH_URL=https://groups.woodsidebible.org
NEXT_PUBLIC_APP_NAME=Groups

# events microsite
NEXTAUTH_URL=https://events.woodsidebible.org
NEXT_PUBLIC_APP_NAME=Events

# apps platform
NEXTAUTH_URL=https://apps.woodsidebible.org
NEXT_PUBLIC_APP_NAME=Apps
```

**Benefits:**

- Update MP credentials once (org level)
- No `.env` files in repo
- Easy to replicate setup
- `vercel env pull` for local development

---

## Database Strategy

### Baseline Tracking

```
database/baseline/
└── MP_Blank_Instance.bak    # Reference blank MP database
```

### Customizations

```
database/customizations/
├── README.md                 # Documentation of all changes
├── Tables/
│   ├── Event_Metrics.sql     # Custom table for Counter app
│   ├── Projects.sql          # Custom table for Projects
│   └── RSVP_Responses.sql    # Custom table for RSVP
├── StoredProcs/
│   ├── api_Custom_EventMetrics_GetByEvent.sql
│   ├── api_Custom_Projects_GetActive.sql
│   └── ...
├── Views/
│   └── ...
└── FormFields/
    └── Custom_Fields.sql     # Added to base MP tables
```

### Migrations

```
database/migrations/
├── 001_initial_customizations.sql
├── 002_add_projects_table.sql
├── 003_add_rsvp_responses.sql
└── ...
```

**Benefits:**

- Clear diff between base MP and customizations
- Version controlled changes
- Repeatable setup process
- Easy to replicate baseline setup

---

## Database Management with Zod Schemas

### Overview

Rather than storing SQL definitions for all tables, we use **Zod schemas as the source of truth** for type safety and validation. This provides:

- TypeScript types throughout the application
- Runtime validation
- Clear documentation of what fields each app uses
- Automatic sync between database and code

The `.bak` file serves as the complete baseline reference, while Zod schemas document only the fields actually used by applications.

### Database Package Structure

```
packages/database/
├── baseline/
│   └── MP_Blank_Instance.bak          # Complete baseline reference
│
├── schemas/                            # Zod schemas (source of truth)
│   ├── baseline/                       # Base MP tables (only fields we use)
│   │   ├── events.ts
│   │   ├── groups.ts
│   │   ├── contacts.ts
│   │   └── congregations.ts
│   └── custom/                         # Custom tables (all fields)
│       ├── event-metrics.ts
│       ├── projects.ts
│       └── rsvp-responses.ts
│
├── migrations/                         # SQL change scripts (custom only)
│   ├── 001_create_event_metrics.sql
│   ├── 002_create_projects.sql
│   └── 003_create_rsvp_responses.sql
│
├── dependencies/                       # App → Schema mappings
│   ├── apps-platform.json
│   ├── groups-microsite.json
│   ├── events-microsite.json
│   └── serve-microsite.json
│
├── scripts/
│   ├── generate-zod.js                # Generate Zod from database
│   ├── validate-dependencies.js       # Verify all dependencies exist
│   └── run-migrations.js              # Apply SQL migrations
│
└── README.md                           # Database documentation
```

### Zod Schema Examples

**Custom Table (packages/database/schemas/custom/event-metrics.ts):**

```typescript
import { z } from "zod";

export const EventMetricSchema = z.object({
  Event_Metric_ID: z.number(),
  Event_ID: z.number(),
  Metric_ID: z.number(),
  Value: z.number(),
  Created_Date: z.date(),
  Domain_ID: z.number()
});

export type EventMetric = z.infer<typeof EventMetricSchema>;

// Metadata for dependency tracking
export const EventMetricMeta = {
  table: "Event_Metrics",
  type: "custom",
  migration: "001_create_event_metrics.sql",
  dependencies: ["Events", "Metrics"], // FK dependencies
  usedBy: ["apps-platform"]
};
```

**Baseline Table (packages/database/schemas/baseline/events.ts):**

```typescript
import { z } from "zod";

// Only fields actually used in applications
export const EventSchema = z.object({
  Event_ID: z.number(),
  Event_Title: z.string(),
  Event_Start_Date: z.date(),
  Event_End_Date: z.date().nullable(),
  Congregation_ID: z.number().nullable(),
  Event_Type_ID: z.number().nullable()
  // Note: Not all 100+ MP fields, just what we use
});

export type Event = z.infer<typeof EventSchema>;

export const EventMeta = {
  table: "Events",
  type: "baseline", // Comes with MP
  usedBy: ["apps-platform", "events-microsite", "groups-microsite"]
};
```

### Dependency Manifest Files

Track which database objects each application depends on.

**packages/database/dependencies/apps-platform.json:**

```json
{
  "name": "Apps Platform",
  "description": "Management tools at apps.woodsidebible.org",
  "schemas": {
    "baseline": [
      "@woodside/database/schemas/baseline/events",
      "@woodside/database/schemas/baseline/contacts",
      "@woodside/database/schemas/baseline/groups",
      "@woodside/database/schemas/baseline/congregations"
    ],
    "custom": [
      "@woodside/database/schemas/custom/event-metrics",
      "@woodside/database/schemas/custom/projects",
      "@woodside/database/schemas/custom/rsvp-responses"
    ]
  },
  "storedProcedures": {
    "baseline": ["api_Events_GetByDateRange"],
    "custom": [
      "api_Custom_EventMetrics_GetByEvent",
      "api_Custom_Projects_GetActive",
      "api_Custom_RSVP_GetByProject"
    ]
  },
  "migrations": [
    "001_create_event_metrics.sql",
    "002_create_projects.sql",
    "003_create_rsvp_responses.sql"
  ]
}
```

**packages/database/dependencies/groups-microsite.json:**

```json
{
  "name": "Groups Microsite",
  "description": "Public groups portal at groups.woodsidebible.org",
  "schemas": {
    "baseline": [
      "@woodside/database/schemas/baseline/groups",
      "@woodside/database/schemas/baseline/contacts",
      "@woodside/database/schemas/baseline/congregations"
    ],
    "custom": []
  },
  "storedProcedures": {
    "baseline": ["api_Groups_GetActive"],
    "custom": ["api_Custom_Groups_GetWithCategories"]
  },
  "migrations": ["005_add_group_categories.sql"]
}
```

### Validation Script

Verify that all database dependencies exist before deployment.

**packages/database/scripts/validate-dependencies.js:**

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sql = require("mssql");

async function validateDependencies() {
  await sql.connect(process.env.DATABASE_URL);

  const manifests = loadManifests();
  let errors = [];

  for (const manifest of manifests) {
    console.log(`\nValidating ${manifest.data.name}...`);

    // Load all schemas this app depends on
    const allSchemas = [
      ...manifest.data.schemas.baseline,
      ...manifest.data.schemas.custom
    ];

    for (const schemaPath of allSchemas) {
      // Import the schema module
      const schema = await import(schemaPath);
      const tableName = schema.EventMetricMeta.table;

      // Check if table exists in database
      const result = await sql.query`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = ${tableName}
      `;

      if (result.recordset[0].count === 0) {
        errors.push(`❌ ${manifest.data.name}: Table "${tableName}" not found`);
      } else {
        console.log(`✅ Table: ${tableName}`);

        // Validate schema matches actual table structure
        await validateSchemaFields(tableName, schema.default);
      }

      // Check FK dependencies exist
      if (schema.EventMetricMeta.dependencies) {
        for (const dep of schema.EventMetricMeta.dependencies) {
          const depResult = await sql.query`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = ${dep}
          `;

          if (depResult.recordset[0].count === 0) {
            errors.push(`❌ Dependency "${dep}" not found for ${tableName}`);
          }
        }
      }
    }

    // Validate stored procedures
    for (const proc of [
      ...manifest.data.storedProcedures.baseline,
      ...manifest.data.storedProcedures.custom
    ]) {
      const result = await sql.query`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_NAME = ${proc}
      `;

      if (result.recordset[0].count === 0) {
        errors.push(
          `❌ ${manifest.data.name}: Stored Proc "${proc}" not found`
        );
      } else {
        console.log(`✅ Stored Proc: ${proc}`);
      }
    }
  }

  await sql.close();

  if (errors.length > 0) {
    console.error("\n\n⚠️  VALIDATION ERRORS:\n");
    errors.forEach((err) => console.error(err));
    process.exit(1);
  } else {
    console.log("\n\n✅ All dependencies validated successfully!");
  }
}

async function validateSchemaFields(tableName, zodSchema) {
  // Get actual columns from database
  const result = await sql.query`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = ${tableName}
  `;

  const dbColumns = result.recordset.map((r) => r.COLUMN_NAME);
  const schemaKeys = Object.keys(zodSchema.shape);

  // Warn if schema references fields that don't exist in DB
  for (const key of schemaKeys) {
    if (!dbColumns.includes(key)) {
      console.warn(
        `⚠️  Schema field "${key}" not found in table "${tableName}"`
      );
    }
  }
}

function loadManifests() {
  const dependenciesDir = path.join(__dirname, "../dependencies");
  return fs
    .readdirSync(dependenciesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({
      file: f,
      data: JSON.parse(fs.readFileSync(path.join(dependenciesDir, f), "utf8"))
    }));
}

validateDependencies().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
```

### Auto-Generate Zod from Database

Generate TypeScript Zod schemas directly from database structure.

**packages/database/scripts/generate-zod.js:**

```javascript
#!/usr/bin/env node

const sql = require("mssql");
const fs = require("fs");
const path = require("path");

async function generateZodFromTable(tableName, outputPath, type = "custom") {
  await sql.connect(process.env.DATABASE_URL);

  // Get columns from database
  const result = await sql.query`
    SELECT
      COLUMN_NAME,
      DATA_TYPE,
      IS_NULLABLE,
      CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = ${tableName}
    ORDER BY ORDINAL_POSITION
  `;

  const columns = result.recordset;

  // Generate Zod schema
  let zodSchema = `import { z } from 'zod';\n\n`;
  zodSchema += `export const ${toCamelCase(tableName)}Schema = z.object({\n`;

  for (const col of columns) {
    const zodType = mapSqlToZod(col.DATA_TYPE);
    const nullable = col.IS_NULLABLE === "YES" ? ".nullable()" : "";
    zodSchema += `  ${col.COLUMN_NAME}: z.${zodType}()${nullable},\n`;
  }

  zodSchema += `});\n\n`;
  zodSchema += `export type ${toCamelCase(
    tableName
  )} = z.infer<typeof ${toCamelCase(tableName)}Schema>;\n\n`;
  zodSchema += `export const ${toCamelCase(tableName)}Meta = {\n`;
  zodSchema += `  table: '${tableName}',\n`;
  zodSchema += `  type: '${type}',\n`;
  zodSchema += `  lastGenerated: '${new Date().toISOString()}',\n`;
  zodSchema += `};\n`;

  // Write to file
  fs.writeFileSync(outputPath, zodSchema);
  console.log(`✅ Generated ${outputPath}`);

  await sql.close();
}

function mapSqlToZod(sqlType) {
  const map = {
    int: "number",
    bigint: "number",
    smallint: "number",
    tinyint: "number",
    decimal: "number",
    numeric: "number",
    float: "number",
    real: "number",
    bit: "boolean",
    nvarchar: "string",
    varchar: "string",
    text: "string",
    ntext: "string",
    char: "string",
    nchar: "string",
    datetime: "date",
    datetime2: "date",
    date: "date",
    time: "string",
    uniqueidentifier: "string"
  };
  return map[sqlType.toLowerCase()] || "unknown";
}

function toCamelCase(str) {
  return str
    .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^([a-z])/, (g) => g.toUpperCase());
}

// Generate all custom tables
const customTables = ["Event_Metrics", "Projects", "RSVP_Responses"];

(async () => {
  for (const table of customTables) {
    const outputPath = path.join(
      __dirname,
      `../schemas/custom/${table.toLowerCase().replace(/_/g, "-")}.ts`
    );
    await generateZodFromTable(table, outputPath, "custom");
  }

  console.log("\n✅ All Zod schemas generated!");
})();
```

### Database Workflow

#### Adding a New Custom Table

```bash
# 1. Create SQL migration
vim packages/database/migrations/010_add_my_table.sql

# 2. Apply migration to database
npm run db:migrate

# 3. Auto-generate Zod schema
npm run db:generate-zod

# 4. Update dependency manifest
# Edit packages/database/dependencies/my-app.json
# Add table to "custom" array

# 5. Validate everything matches
npm run db:validate

# 6. Commit together
git add migrations/ schemas/ dependencies/
git commit -m "Add My_Table for feature X"
```

#### Using a New Baseline Field

```bash
# 1. Update Zod schema with new field
# Edit schemas/baseline/events.ts
# Add only the field you need

# 2. Validate
npm run db:validate

# 3. Use in your app
import { EventSchema } from '@woodside/database/schemas/baseline/events';
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:migrate": "node database/scripts/run-migrations.js",
    "db:generate-zod": "node database/scripts/generate-zod.js",
    "db:validate": "node database/scripts/validate-dependencies.js",
    "db:sync": "npm run db:migrate && npm run db:generate-zod && npm run db:validate"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/validate-database.yml
name: Validate Database Dependencies

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm install

      - name: Validate database dependencies
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run db:validate
```

### Keeping Schemas in Sync

**Custom Tables:**

- ✅ Always keep in perfect sync
- ✅ Use auto-generation after migrations
- ✅ Validate in CI/CD

**Baseline Tables:**

- ✅ Only add fields you actually use
- ✅ Don't need to track all 100+ MP fields
- ✅ Update when you start using new fields

**Benefits:**

- Type safety throughout application
- Runtime validation with Zod
- Automatic drift detection
- Clear dependency tracking
- Documentation that stays current

---

## Key Technical Decisions

### Next.js Features Used

- **App Router** (not Pages Router)
- **React Server Components** (default for performance)
- **Server Actions** (for mutations)
- **TypeScript** throughout
- **Tailwind CSS v4** (modern styling)
- **Shadcn/UI + Radix** (accessible components)
- **next-pwa** (PWA functionality)

### Authentication

- **NextAuth.js v5**
- Custom MinistryPlatform OAuth provider
- JWT session strategy
- Token refresh logic
- Role-based access via MP User_Groups

### API Client Architecture & Audit Logging

**Best Practice: Single App Client with User ID Pass-Through**

Use a single MP API client with **app credentials** for all requests, but pass the `$userID` parameter on CREATE/UPDATE operations to maintain proper audit logging:

```typescript
// packages/ministry-platform/src/client.ts
export async function updateContact(contactId: number, data: any, userId: number) {
  return fetch(`${MP_API_URL}/tables/Contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${APP_TOKEN}`,  // App credentials
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      $userID: userId  // MP logs this user as performing the action
    })
  });
}
```

**Benefits:**
- ✅ **Proper audit logging:** MP records "John edited Contact_ID 123", not "Apps Platform edited..."
- ✅ **Simplified auth:** Single app token, no per-user token management
- ✅ **No user permissions needed:** Users don't need direct table permissions in MP for API to work
- ✅ **Better performance:** No token refresh logic per user
- ✅ **Easier to debug:** One API client to maintain

**Implementation Pattern:**

```typescript
// microsites/groups/src/app/actions/updateProfile.ts
'use server'

import { auth } from "@woodside/auth-nextjs";
import { updateContact } from "@woodside/ministry-platform";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.contactId) throw new Error('Not authenticated');

  await updateContact(
    session.user.contactId,
    { Display_Name: formData.get('name') },
    session.user.contactId  // Pass user ID for audit logging
  );
}
```

**MP API Audit Log Result:**
```
User: John Doe (Contact_ID: 123)
Action: Updated
Table: Contacts
Record: 123
Timestamp: 2025-12-03 10:30:00
```

Even though the request used app credentials, MP's audit log correctly shows John as the actor because `$userID` was provided.

### Database Access

- **Direct SQL Server** (for MP data)
- **Drizzle ORM** (optional, for custom tables)
- **Stored procedures** for complex queries
- **React Server Components** (no API routes for reads)
- **Server Actions** (for writes/mutations)

### Deployment

- **Vercel** for all Next.js apps
- **Turborepo** for monorepo build orchestration
- **Remote caching** via Vercel (shared build cache)
- **GitHub** for version control
- **Organization-level env vars** (shared secrets)
- **Project-level env vars** (app-specific config)
- **Automatic deployments** on push to main
- **Incremental builds** (only rebuild what changed)

---

## Development Standards

### MinistryPlatform API Standards

#### REQUIRED: Always Pass $userID on Mutations

**Standard Practice:** All CREATE (POST) and UPDATE (PUT) requests to the MinistryPlatform API **must** include the `$userID` parameter.

**Why This Matters:**
1. **Proper Audit Logging:** MP records the actual user who performed the action, not "API User"
2. **No User Permissions Required:** Users don't need direct security rights to MP tables
3. **Simplified Security Model:** App credentials handle API access, `$userID` handles attribution

**Implementation Rule:**

✅ **CORRECT:**
```typescript
// All mutation functions REQUIRE userId parameter
export async function createEvent(data: EventInput, userId: number) {
  return apiClient.post('/tables/Events', {
    ...data,
    $userID: userId  // REQUIRED on all creates
  });
}

export async function updateContact(contactId: number, data: ContactInput, userId: number) {
  return apiClient.put(`/tables/Contacts/${contactId}`, {
    ...data,
    $userID: userId  // REQUIRED on all updates
  });
}
```

❌ **INCORRECT:**
```typescript
// Missing userId parameter - audit log will show "API User"
export async function createEvent(data: EventInput) {
  return apiClient.post('/tables/Events', data);
}

// Missing $userID in request body
export async function updateContact(contactId: number, data: ContactInput, userId: number) {
  return apiClient.put(`/tables/Contacts/${contactId}`, data);
}
```

**TypeScript Enforcement:**

All mutation functions in `@woodside/ministry-platform` should have TypeScript signatures that enforce this:

```typescript
// Type signature requires userId
type MutationFunction<TInput, TOutput> = (
  data: TInput,
  userId: number  // Required parameter
) => Promise<TOutput>;

// Example usage
const createEvent: MutationFunction<EventInput, Event> = async (data, userId) => {
  // Implementation
};
```

**Server Action Pattern:**

```typescript
'use server'

import { auth } from "@woodside/nextjs-auth";
import { updateContact } from "@woodside/ministry-platform";

export async function updateMyProfile(formData: FormData) {
  // Always get user from session
  const session = await auth();
  if (!session?.user?.contactId) throw new Error('Unauthorized');

  // ALWAYS pass userId to mutation
  await updateContact(
    session.user.contactId,
    { Display_Name: formData.get('name') },
    session.user.contactId  // Required for audit logging
  );
}
```

**Code Review Checklist:**

Before merging any PR with MP API mutations:
- [ ] Does every CREATE function have a `userId` parameter?
- [ ] Does every UPDATE function have a `userId` parameter?
- [ ] Is `$userID` included in the request body?
- [ ] Is the userId sourced from the authenticated session?
- [ ] Are TypeScript types enforcing the userId parameter?

**Audit Log Result:**

When done correctly, MP audit logs show:
```
✅ User: John Doe (Contact_ID: 123)
   Action: Created
   Table: Events
   Record: 456
```

Instead of:
```
❌ User: API User
   Action: Created
   Table: Events
   Record: 456
```

---

## Success Metrics

**Technical:**
- ✅ All CustomWidgets converted to Next.js
- ✅ Four major microsites launched (groups, events, serve, retreats)
- ✅ Apps platform fully migrated
- ✅ PWA support implemented for all microsites and micro-apps
- ✅ Database customizations documented
- ✅ Faster feature development (shared packages)

**Architectural:**
- ✅ Framework-agnostic packages enable multi-platform support
- ✅ Single API client with `$userID` pass-through for proper audit logging
- ✅ All CREATE/UPDATE functions require and pass `$userID` parameter (TypeScript enforced)
- ✅ Clear separation of baseline MP vs. custom schema

**Contracting Readiness:**
- ✅ Template repository for quick church onboarding
- ✅ Church-owned infrastructure model validated by MP experts
- ✅ Affordable stack (GitHub + Neon + Vercel) = $0-50/month per church
- ✅ Complete documentation for developer handoff

---

## Risks & Mitigations

### Risk: Migration takes longer than planned

**Mitigation:**

- Keep MinistryPlatform/ as-is (reference)
- Build new architecture fresh (don't refactor in place)
- Migrate incrementally (doesn't have to be all at once)

### Risk: Losing Next.js features if API-ifying backend

**Mitigation:**

- Use monorepo with shared packages (not separate API)
- Keep Server Components and caching
- Import packages directly (not HTTP calls)

### Risk: Shared packages have breaking changes

**Mitigation:**

- Semantic versioning
- Comprehensive testing
- Documentation of breaking changes
- Careful version management

---

## Next Steps

### 1. Set Up Woodside Monorepo

```bash
cd ~/Projects
mkdir -p woodside/{packages/{core,nextjs,react-native},microsites,apps,widgets,database,templates}
cd woodside

# Initialize monorepo
npm init -y
npm install turbo --save-dev

# Create turbo.json (see configuration above)
# Configure package.json with workspaces
```

### 2. Extract Core Packages (Framework-Agnostic)

Extract `@woodside/ministry-platform` from current Apps platform:

```bash
cd packages/core
mkdir ministry-platform
cd ministry-platform
npm init -y
# Set name: "@woodside/ministry-platform"
# Copy over MP API client code from Apps
# Add TypeScript configuration
# Set up package exports
```

**CRITICAL: Implement $userID standard from the start:**

When building the MP API client, ensure all mutation methods follow this pattern:

```typescript
// packages/core/ministry-platform/src/tables.ts

// ✅ CREATE methods require userId
export async function createRecord<T>(
  table: string,
  data: T,
  userId: number  // REQUIRED
): Promise<T> {
  return apiClient.post(`/tables/${table}`, {
    ...data,
    $userID: userId  // Always pass to MP API
  });
}

// ✅ UPDATE methods require userId
export async function updateRecord<T>(
  table: string,
  recordId: number,
  data: Partial<T>,
  userId: number  // REQUIRED
): Promise<T> {
  return apiClient.put(`/tables/${table}/${recordId}`, {
    ...data,
    $userID: userId  // Always pass to MP API
  });
}
```

This pattern must be enforced from the beginning - it's much harder to retrofit later.

### 3. Extract Remaining Packages

```bash
# Database package (framework-agnostic)
cd packages/core
mkdir database
cd database
npm init -y
# Set name: "@woodside/database"
# Set up Zod schemas structure
# Add database utility scripts

# WordPress package (framework-agnostic)
cd ../
mkdir wordpress
cd wordpress
npm init -y
# Set name: "@woodside/wordpress"
# Copy over WordPress API integration code

# Auth package (Next.js-specific)
cd ../../nextjs
mkdir auth
cd auth
npm init -y
# Set name: "@woodside/nextjs-auth"
# Copy over NextAuth logic from Apps

# UI package (Next.js-specific)
cd ../
mkdir ui
cd ui
npm init -y
# Set name: "@woodside/nextjs-ui"
# Extract shared React components from Apps

# Shared Next.js config
cd ../
cat > package.json <<EOF
{
  "name": "@woodside/nextjs-shared",
  "private": true,
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
EOF

cat > tsconfig.json <<EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"]
  }
}
EOF
```

### 4. Configure Remote Caching

```bash
# Link to Vercel for remote caching
npx turbo login
npx turbo link
```

### 5. Test Package Imports

```bash
# From monorepo root
npm run dev

# Verify packages can import each other
# Test that apps can import packages
```

### 6. Remaining Tasks

- Create microsite template (use Groups as reference)
- Create micro-app template
- Create widget template
- Document database customizations in `database/customizations/`
- Set up Zod schema generation scripts
- Begin migration of Apps platform → `apps/platform/`
- Start converting CustomWidgets → Next.js widgets

---

## Conclusion

This migration transforms Woodside's single-folder codebase into a well-organized Turborepo monorepo with abstracted, reusable packages and clear separation of concerns. The new structure enables:

- **Faster feature development** through shared internal packages
- **Intelligent build caching** with Turborepo (rebuild only what changed)
- **Parallel execution** and incremental builds across all apps
- **Seamless Vercel deployment** with automatic Turborepo detection
- **Easier maintenance** with consistent patterns throughout
- **Better code organization** and discoverability for developers
- **Clear tracking** of database customizations vs baseline
- **Modern development practices** (TypeScript, Server Components, PWA)
- **Unified technology stack** (Next.js everywhere, no CustomWidgets)

The investment in this migration pays dividends through:

- Improved developer experience and onboarding
- Significantly faster builds and CI/CD performance
- Reduced code duplication and maintenance burden
- Better performance with React Server Components
- Maintainable foundation for future growth
- Streamlined deployment workflow

The Turborepo + Vercel combination ensures optimal build performance and developer productivity, while the abstracted package architecture makes it easy to share improvements across all apps and microsites within Woodside's ecosystem.

### Contracting Readiness

This architecture has been **validated by MinistryPlatform experts** as production-ready for church contracting:

- **Simple Stack:** GitHub + Neon + Vercel is affordable and well-documented
- **Full Ownership:** Each church owns their entire infrastructure (no multitenancy)
- **Standardized:** Template repository enables quick church onboarding
- **Flexible:** Churches can hire any developer, not locked into specific contractors
- **Portable:** Framework-agnostic core packages support multiple frontend platforms

The combination of proven technology (Turborepo, Next.js, Vercel) with church-first ownership principles creates a sustainable foundation for both Woodside's internal needs and future church contracting opportunities.
