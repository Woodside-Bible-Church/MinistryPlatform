# Architecture Guide

This document provides context for AI assistants and developers working on this Next.js application.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js v5
- **Backend API**: MinistryPlatform REST API
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Protected routes (requires authentication)
│   ├── api/               # API route handlers
│   └── signin/            # Public sign-in page
├── components/            # React components
├── services/              # Business logic and API service layers
├── providers/             # MinistryPlatform API client and auth provider
├── lib/                   # Utility functions
└── types/                 # TypeScript type definitions
```

## Authentication Architecture

### NextAuth.js v5 Configuration
- **Config file**: `src/auth.ts`
- **Provider**: Custom MinistryPlatform OAuth provider (`src/providers/MinistryPlatform/ministryPlatformAuthProvider.ts`)
- **Session strategy**: JWT (not database sessions)
- **Middleware**: `src/middleware.ts` protects routes in `/(app)/*`

### Session Object Structure
```typescript
{
  user: {
    id: string,           // OAuth sub
    name: string,
    email: string
  },
  accessToken: string,    // NOT access_token
  contactId: string,      // User's Contact_ID from MinistryPlatform (stored as string)
  roles: string[],        // e.g., ["Administrators"]
  firstName: string,
  lastName: string
}
```

### Common Authentication Patterns
```typescript
// In API routes
const session = await auth();
if (!session?.accessToken) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Check admin role
const isAdmin = (session as any)?.roles?.includes("Administrators") ?? false;

// Get user's contact ID (parse to number for database operations)
const userContactId = parseInt(session.contactId);
```

## API Route Patterns

### File Structure
- Location: `src/app/api/[resource]/route.ts`
- Dynamic routes: `src/app/api/[resource]/[id]/route.ts`

### Next.js 15 Requirements
```typescript
// Dynamic route params must be awaited and typed as Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resourceId = parseInt(id);
  // ...
}
```

### Standard API Route Pattern
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SomeService } from "@/services/someService";

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Use service layer for business logic
    const service = new SomeService();
    const data = await service.getSomeData();

    // 3. Return JSON response
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
```

## Service Layer Architecture

### Location
`src/services/[resourceName]Service.ts`

### Pattern
```typescript
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";

export class ResourceService {
  private tableService: TableService;
  private client: MinistryPlatformClient;

  constructor() {
    this.client = new MinistryPlatformClient();
    this.tableService = new TableService(this.client);
  }

  // Read operations
  async getResources(filter?: string) {
    return this.tableService.getTableRecords<Resource>("TableName", {
      $filter: filter,
      $orderby: "Created_Date DESC",
    });
  }

  // Create operations - IMPORTANT: Returns ID (number), not full record
  async createResource(data: CreateResourceInput): Promise<number> {
    const result = await this.tableService.createTableRecords("TableName", [data]);
    return result[0] as unknown as number; // Type assertion needed
  }
}
```

## MinistryPlatform Integration

### Key Concepts
- **Tables**: Accessed via `tableService.getTableRecords<T>(tableName, params)`
- **Stored Procedures**: Preferred for complex queries via `procedureService.executeProcedureWithBody(procName, params)`
- **Create operations**: Return array of IDs, not full records
- **Field naming**: MinistryPlatform uses `PascalCase_With_Underscores` (e.g., `Event_ID`, `Contact_ID`)

### Common Query Parameters
```typescript
{
  $filter: "Field_Name='value' AND Other_Field>10",
  $select: "Field1,Field2,Field3",
  $orderby: "Created_Date DESC",
  $top: 50  // NUMBER, not string
}
```

### Type Assertion Pattern
MinistryPlatform's `createTableRecords` is typed incorrectly. Use this pattern:
```typescript
async createProject(data: CreateProjectInput): Promise<number> {
  const result = await this.tableService.createTableRecords("Projects", [data]);
  return result[0] as unknown as number; // Double cast required for strict TypeScript
}
```

## TypeScript Conventions

### Important Type Rules
1. **Optional fields**: Use `field?: type` (undefined), NOT `field: type | null`
2. **Contact IDs**: Stored as `string` in session, convert to `number` for database operations
3. **Create inputs**: Use `Omit<Type, "ID_Field">` to exclude auto-generated IDs
4. **Promise return types**: Always specify explicitly for create methods

### Example Type Definitions
```typescript
// Read type (includes ID)
export interface Project {
  Project_ID: number;
  Project_Title: string;
  Project_Coordinator_ID: number;
  Project_Start_Date: string;
  Project_End_Date?: string;  // Optional field
}

// Create input (excludes ID)
export interface CreateProjectInput {
  Project_Title: string;
  Project_Coordinator_ID: number;
  Project_Start_Date: string;
  Project_End_Date: string;
  Project_Group_ID?: number;  // Optional, use undefined not null
}
```

## UI Component Patterns

### Page Components
- Location: `src/app/(app)/[feature]/page.tsx`
- Must use `"use client"` directive
- Use `useSession()` from `@/components/SessionProvider` for auth state

### Common Patterns
```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";

export default function ResourcePage() {
  const session = useSession();
  const [data, setData] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/resources");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Content */}
    </div>
  );
}
```

### Form Handling
```typescript
const [formData, setFormData] = useState({
  field1: "",
  field2: "",
});
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const response = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error("Failed to create");

    const result = await response.json();
    router.push(`/resources/${result.Resource_ID}`);
  } catch (error) {
    console.error("Error:", error);
    setSubmitting(false);
  }
};
```

## Styling with Tailwind CSS

### Brand Colors
- Primary green: `#61BC47` or `bg-[#61BC47]`
- Use semantic color classes: `bg-primary`, `text-primary`, `border-primary`

### Dark Mode
- Uses CSS variables defined in `globals.css`
- Colors automatically adapt via `dark:` prefix
- Example: `bg-card dark:bg-card` (uses CSS variable that changes in dark mode)

### Common Utility Classes
```css
/* Layout */
container mx-auto px-4 py-8 max-w-6xl

/* Cards */
bg-card border border-border rounded-lg p-6 shadow-sm

/* Buttons */
bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors

/* Forms */
w-full px-4 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#61BC47]
```

## Common Gotchas

### 1. Session Property Names
❌ `session.access_token` → ✅ `session.accessToken`
❌ `session.user?.security_role` → ✅ `(session as any)?.roles?.includes("Administrators")`
❌ `session.user?.contact_id` → ✅ `session.contactId`

### 2. Contact ID Type Conversion
```typescript
// Contact ID is stored as string in session
const userContactId = session.contactId; // string

// Must parse to number for database operations
Project_Coordinator_ID: parseInt(userContactId)
```

### 3. Optional vs Null
```typescript
// ❌ Wrong
Project_Group_ID: body.Project_Group_ID || null

// ✅ Correct
Project_Group_ID: body.Project_Group_ID || undefined
```

### 4. Query Parameter Types
```typescript
// ❌ Wrong
$top: "50"  // String

// ✅ Correct
$top: 50    // Number
```

### 5. Type Narrowing
```typescript
// When TypeScript has trouble with type narrowing, use explicit typing
let firstItem: any = result[0];  // Allows reassignment in conditionals
```

## Git Workflow

### Commit Message Format
```
Brief description of change

- Detail 1
- Detail 2
- Why the change was made

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Pre-push Checklist
- Run TypeScript check: `npx tsc --noEmit`
- Test locally: `npm run dev`
- Verify build: `npm run build` (if adding new features)

## Testing in Development

### Local Development
```bash
npm run dev  # Starts dev server on http://localhost:3000
```

### Environment Variables Required
```
MINISTRY_PLATFORM_BASE_URL=https://my.ministryplatform.com
MINISTRY_PLATFORM_CLIENT_ID=<client-id>
MINISTRY_PLATFORM_CLIENT_SECRET=<client-secret>
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3000
```

## When Adding New Features

### Checklist
1. **Types**: Add to `src/types/[resource].ts`
2. **Service**: Create `src/services/[resource]Service.ts`
3. **API Routes**: Add to `src/app/api/[resource]/route.ts`
4. **UI Pages**: Add to `src/app/(app)/[resource]/page.tsx`
5. **Navigation**: Update if needed

### Example: Adding "Volunteers" Feature
```
1. src/types/volunteers.ts          - Volunteer, CreateVolunteerInput
2. src/services/volunteersService.ts - VolunteersService class
3. src/app/api/volunteers/route.ts   - GET, POST handlers
4. src/app/(app)/volunteers/page.tsx - List page
5. src/app/(app)/volunteers/new/page.tsx - Create form
```

## MinistryPlatform Type Generator

### Overview
A CLI utility that generates TypeScript interfaces from your MinistryPlatform database schema. This helps keep your types in sync with the database and reduces type errors.

### Location
- **CLI Tool**: `CLI/generate-types.ts`
- **Documentation**: `CLI/README.md`
- **Output**: `generated-types/` (git-ignored, auto-generated)

### Basic Usage

```bash
# Generate types for all tables (basic mode - fast)
npm run generate-types

# Generate detailed types for specific tables (includes field metadata)
npx tsx CLI/generate-types.ts --detailed --search "Project"

# Generate types with Zod schemas for runtime validation
npx tsx CLI/generate-types.ts --detailed --zod --search "Project"
```

### Common Commands

```bash
# After adding new MinistryPlatform tables/fields
npm run generate-types

# Generate types for Projects-related tables only
npx tsx CLI/generate-types.ts --detailed --search "Project"

# Generate with validation schemas
npx tsx CLI/generate-types.ts --detailed --zod --search "Project,Event"

# Custom output location
npx tsx CLI/generate-types.ts --output ./src/types/mp
```

### When to Run

1. **After database schema changes** - When new tables or fields are added to MinistryPlatform
2. **Before starting a new feature** - Generate types for tables you'll be working with
3. **When encountering type errors** - Regenerate to ensure types match current schema
4. **In CI/CD** - Consider adding to build process for production deployments

### Using Generated Types

```typescript
// Import from generated-types directory
import { Projects, ProjectBudgets, ProjectExpenses } from '@/generated-types';

// Use in service methods
async getProjects(): Promise<Projects[]> {
  return this.tableService.getTableRecords<Projects>("Projects", {
    $filter: "Project_Approved=1"
  });
}

// With Zod validation (if schemas generated)
import { ProjectsSchema } from '@/generated-types';

const validatedData = ProjectsSchema.parse(incomingData);
```

### Benefits

- **Type Safety**: Catch field name typos at compile time
- **IntelliSense**: Auto-complete field names in your IDE
- **Documentation**: See field types, lengths, and foreign key relationships
- **Validation**: Optional Zod schemas for runtime type checking
- **Schema Sync**: Keep types in sync with database changes

### Notes

- Generated types are in `generated-types/` and excluded from git
- Detailed mode provides rich metadata (field lengths, foreign keys, etc.)
- Basic mode is faster for large databases
- Use `--search` to limit scope for faster generation

## Resources

- **Next.js 15 Docs**: https://nextjs.org/docs
- **NextAuth.js v5**: https://authjs.dev/
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **MinistryPlatform API**: Check internal documentation
- **Type Generator**: See `CLI/README.md` for full documentation
