# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains MinistryPlatform customizations and integrations for Woodside Bible Church, organized into three main categories:

- **NextJS/**: Full-stack Next.js applications with MinistryPlatform OAuth integration
- **CustomWidgets/**: Client-side JavaScript widgets using Liquid templates and stored procedures
- **MPWidgets/**: CSS and JavaScript overrides for MinistryPlatform's built-in widgets

## NextJS Applications

### Architecture

NextJS apps use a shared authentication pattern with:
- **NextAuth.js v5** with custom MinistryPlatform OAuth provider
- **App Router** with route groups: `(app)/` for authenticated routes
- **TypeScript** with React 19 and Next.js 15
- **Tailwind CSS v4** with Radix UI components
- **JWT session strategy** with token refresh logic

### Key Files

- `src/auth.ts`: NextAuth configuration with MinistryPlatform provider
- `src/providers/MinistryPlatform/ministryPlatformAuthProvider.ts`: Custom OAuth provider
- `src/middleware.ts`: Route protection and authentication middleware
- `src/services/`: API service layers for MinistryPlatform data access

### Environment Variables Required

```
MINISTRY_PLATFORM_BASE_URL=https://my.ministryplatform.com
MINISTRY_PLATFORM_CLIENT_ID=<client-id>
MINISTRY_PLATFORM_CLIENT_SECRET=<client-secret>
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3000
```

### Development Commands

```bash
# Navigate to specific app
cd NextJS/Template  # or NextJS/Groups

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm build

# Run linting
npm run lint

# Start production server
npm start
```

### NextJS Project Structure

Each Next.js app follows:
```
src/
├── app/              # App router pages and API routes
│   ├── (app)/        # Protected routes (requires auth)
│   ├── api/          # API endpoints
│   └── signin/       # Public sign-in page
├── components/       # React components
├── services/         # API service layers
├── providers/        # Auth providers
├── lib/              # Utilities
└── types/            # TypeScript definitions
```

## CustomWidgets

### Architecture

CustomWidgets are standalone, framework-agnostic widgets that:
- Use **data attributes** on HTML elements for configuration
- Fetch data via **MinistryPlatform stored procedures** (API calls)
- Render using **Liquid.js templates**
- Share a common `CustomWidgets.js` framework for data fetching and rendering

### Widget Structure

```
CustomWidgets/WidgetName/
├── index.html           # Main entry point with data attributes
├── Template/
│   └── widget.html      # Liquid template
├── Assets/
│   ├── widget.css       # Widget-specific styles
│   └── embed.js         # Optional custom JavaScript
└── StoredProc/
    └── StoredProc.md    # Documentation for required stored procedures
```

### Data Attribute API

Widgets are configured via data attributes on container elements:

```html
<div
  data-component="CustomWidget"
  data-sp="api_Custom_WidgetName_JSON"
  data-params="@ParamName=value"
  data-template="/CustomWidgets/WidgetName/Template/widget.html"
  data-host="woodsidebible"
  data-debug="true">
</div>
```

- `data-sp`: Stored procedure name (must return JSON)
- `data-params`: Stored procedure parameters in `@Name=value` format
- `data-template`: Path to Liquid template
- `data-host`: MinistryPlatform subdomain
- `data-debug`: Enable console logging

### Shared Framework

All widgets depend on `/CustomWidgets/Assets/CustomWidgets.js`, which:
- Handles API calls to MinistryPlatform stored procedures
- Renders Liquid templates with fetched data
- Provides error handling and data caching
- Contains bundled Liquid.js engine

### Stored Procedure Requirements

Stored procedures for CustomWidgets must:
- Return JSON format compatible with Liquid templates
- Include `@UserName nvarchar(75) = null` as a standard parameter
- Be registered in MinistryPlatform's `API_Procedures` table
- Follow naming pattern: `api_Custom_<WidgetName>_JSON`

See `CustomWidgets/*/StoredProc/StoredProc.md` for installation guidelines and examples.

### Testing CustomWidgets

- Open `index.html` directly in browser for local testing
- Widgets require MinistryPlatform API access for full functionality
- Use `data-debug="true"` for console logging
- No build process required - runs directly in browser

## MPWidgets

Custom CSS and JavaScript for styling **MinistryPlatform's built-in widgets**. These are referenced in MP Admin Console → Widget Customization or via template headers/footers.

### Structure

```
MPWidgets/
├── CSS/              # Widget-specific CSS overrides
│   └── DCofMI/       # Client-specific themes
└── JS/               # Widget enhancements and scripts
```

Files follow naming conventions like `groupFinder.css` or `eventDetails.css` matching MP widget names.

## MinistryPlatform Integration

### Common Patterns

- **API Endpoints**: `https://<subdomain>.ministryplatform.com/ministryplatformapi/api/`
- **OAuth**: `https://<subdomain>.ministryplatform.com/ministryplatform/oauth/`
- **Stored Procedures**: Custom JSON endpoints via `api_*` procedures
- **Naming**: MinistryPlatform uses `dp_` prefixes for database objects and fields like `Event_ID`

### Branding

Woodside Bible Church brand color: `#61BC47` (green)

## Repository Maintenance

- Repository maintained by: Colton Wirgau
- Organization: Woodside Bible Church
- Each widget/app should include its own `README.md`
- Code may reference MinistryPlatform-specific terms and private APIs
- Access is limited to internal development
