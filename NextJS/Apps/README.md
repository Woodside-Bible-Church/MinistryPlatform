# Ministry Platform Apps

Internal tools platform for Woodside Bible Church staff and volunteers. Provides modern, mobile-friendly web applications for common ministry tasks.

## Overview

This is a NextJS application that integrates with MinistryPlatform's API and OAuth for authentication. It serves as a centralized hub for internal tools and applications.

**Live URL:** https://apps.woodsidebible.org

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Auth:** NextAuth.js v5 with MinistryPlatform OAuth
- **UI:** Shadcn/ui components with Radix UI primitives
- **Styling:** Tailwind CSS v4
- **PWA:** next-pwa for progressive web app features
- **API:** MinistryPlatform REST API
- **Database:** SQL Server (MinistryPlatform)
- **Deployment:** Vercel
- **DNS:** Cloudflare

## Project Structure

```
src/
├── app/                    # App router pages and API routes
│   ├── (app)/              # Protected routes (requires auth)
│   │   ├── counter/        # Counter app for event metrics
│   │   ├── layout.tsx      # Shared layout with navigation
│   │   └── page.tsx        # Dashboard/home page
│   ├── api/                # API endpoints
│   │   └── auth/           # NextAuth routes
│   └── signin/             # Public sign-in page
├── components/             # React components
│   ├── ui/                 # Shadcn UI components
│   └── ...                 # Feature-specific components
├── services/               # Business logic and MP API calls
├── providers/              # MP OAuth provider and API client
├── lib/                    # Utilities and helpers
└── types/                  # TypeScript type definitions
```

## Applications

### Counter
Event metrics input tool for tracking head counts, attendance, and other event-related metrics. Provides real-time data entry for weekend services and ministry events across all campuses.

**Features:**
- Select date (defaults to today)
- Filter by campus/congregation
- Select event from filtered list
- Choose metric type (head count, guests, etc.)
- Submit numerical value
- Optimistic UI updates
- Real-time validation

**Database Tables:**
- `Event_Metrics` - Stores metric values
- `Metrics` - Lookup table for metric types
- `Events` - MP built-in events table
- `Congregations` - MP built-in campus/congregation table

## Development

### Prerequisites
- Node.js 20+
- npm or pnpm
- Access to MinistryPlatform API

### Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3001

### Commands

```bash
npm run dev      # Start development server (port 3001)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## MinistryPlatform Integration

### Authentication
- Uses MinistryPlatform OAuth 2.0 with OIDC
- Session managed via NextAuth JWT strategy
- Automatic token refresh
- Role-based access control via `User_Groups`

### API Access
- REST API via `/ministryplatformapi/api/`
- Client credentials for app-level access
- User tokens for permission-specific access
- Stored procedures for complex queries with nested JSON

### Database Conventions
- All custom tables require `Domain_ID` field (NOT NULL, FK to `dp_Domains`)
- Use `@ParameterName` syntax for stored procedure parameters
- Stored procedures returning JSON should follow `JsonResult` pattern (see Prayer Widget docs)
- Table names use `dp_` prefix convention
- Field names use PascalCase with underscores (e.g., `Event_ID`)

## Deployment

### Vercel
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables (Production)
- Set all variables from `.env.example` in Vercel
- Use production MP URLs and credentials
- Generate new `NEXTAUTH_SECRET` for production

### Cloudflare DNS
- Point `apps.woodsidebible.org` to Vercel
- Configure SSL/TLS encryption mode: Full (strict)

## Design Principles

### User Experience
- **Mobile-first:** Optimized for mobile devices
- **Optimistic UI:** Immediate feedback on actions
- **Context-aware:** Adapt to user permissions and role
- **PWA:** App-like experience with offline support and push notifications
- **Skeleton loading:** Smooth loading states
- **Snappy interactions:** Fast, responsive UI

### Code Quality
- **TypeScript:** Type-safe code throughout
- **Component composition:** Reusable, modular components
- **Service layer:** Separate business logic from UI
- **Error handling:** Graceful error states and messaging
- **Accessibility:** WCAG 2.1 AA compliant

### Security
- **Permission-based access:** Check user/app permissions for all actions
- **Input validation:** Zod schemas for form and API validation
- **CORS configuration:** Restrict API access to trusted domains
- **Secure cookies:** HttpOnly, Secure, SameSite=Lax

## Adding New Apps

1. Create new route group in `src/app/(app)/your-app/`
2. Create API routes in `src/app/api/your-app/`
3. Create service layer in `src/services/yourAppService.ts`
4. Add to dashboard page with app tile
5. Configure permissions in MinistryPlatform `User_Groups`
6. Update MP tables/stored procedures as needed

## Contributing

- Follow existing code patterns and conventions
- Use TypeScript for all new code
- Test locally before committing
- Follow Git commit conventions

## Support

For questions or issues:
- **Developer:** Colton Wirgau
- **Organization:** Woodside Bible Church

## License

Internal use only - Woodside Bible Church
