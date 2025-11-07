# RSVP Widget

A Next.js-based RSVP widget for Christmas services that can be embedded on WordPress sites via iframe. This widget provides a modern, mobile-friendly interface for selecting service times and submitting RSVPs.

## Features

- **Campus Selection**: Filter by all 14 Woodside campuses (defaults to Troy)
- **Service Times**: View available Christmas services with capacity indicators
- **Multi-Step RSVP Form**: Two-step form flow (Personal Info → RSVP Details)
- **Confirmation View**: Shows RSVP summary with Google Maps directions
- **Progress Tracking**: Visual progress bar during form submission
- **Responsive Design**: Mobile-first design with smooth animations
- **WordPress Embed**: Iframe-based embedding prevents style conflicts

## Stack

- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS v4 + Radix UI + Framer Motion
- **Validation**: Zod schemas with React Hook Form
- **Deployment**: Vercel
- **Embedding**: iframe with postMessage for height communication

## Development

```bash
# Install dependencies
npm install

# Run development server (on port 3003)
npm run dev

# Build for production
npm build

# Start production server
npm start
```

## Environment Variables

See `.env.example` for required environment variables:

```env
MINISTRY_PLATFORM_CLIENT_ID=<your-client-id>
MINISTRY_PLATFORM_CLIENT_SECRET=<your-secret>
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3003
NEXT_PUBLIC_APP_NAME=RSVP
```

## Deployment

See `DEPLOYMENT.md` for complete deployment instructions including:
- GitHub setup
- Vercel deployment configuration
- WordPress embedding options (iframe or embed.js)
- CORS configuration

## WordPress Integration

### Option A: Direct Iframe Embed

```html
<!-- RSVP Widget Container -->
<div style="width: 100%; max-width: 100%; margin: 0 auto;">
  <iframe
    src="https://your-vercel-app.vercel.app"
    style="width: 100%; min-height: 1200px; border: none; display: block;"
    title="Christmas Service RSVP"
    scrolling="no">
  </iframe>
</div>
```

### Option B: Using embed.js (Recommended)

```html
<!-- RSVP Widget Container -->
<div id="rsvp-widget-container"></div>

<!-- Widget Embed Script -->
<script>
  window.RSVP_WIDGET_URL = 'https://your-vercel-app.vercel.app';
</script>
<script src="https://your-vercel-app.vercel.app/embed.js"></script>
```

The embed script automatically:
- Creates an iframe
- Handles responsive sizing
- Adjusts height based on content changes

## Current Status

**Development Status**: Complete with mock data, ready for design approval

**Mock Data**:
- Uses local mock data from `/src/data/mockData.ts`
- Shows all 14 Woodside campuses
- Contains realistic service times for Christmas 2024
- RSVP submissions are simulated (not saved to database)

**Next Steps**:
1. Get design approval from stakeholders
2. Create API routes to connect to MinistryPlatform
3. Replace mock data with real API calls
4. Deploy to production

## Features Implemented

### Service Selection
- Campus dropdown with all 14 Woodside locations
- Service time cards showing:
  - Day and time
  - Capacity indicators (Available, Limited, Full)
  - Visual progress bars
  - Click to select

### RSVP Form (Two Steps)

**Step 1: Personal Information**
- First Name, Last Name (required)
- Email Address (required, validated)
- Phone Number (optional)
- Back button to return to services

**Step 2: RSVP Details**
- Party size selector (1-20 people)
- Special needs/accommodations (optional)
- Service and personal info cards (clickable to go back)
- Progress indicator showing Step 2 of 2

### Confirmation View
- **RSVP Summary Card**:
  - Selected service time and campus
  - Email confirmation sent
  - Party size
  - Get Directions button (opens Google Maps)
  - RSVP for Another Service button

- **What to Expect Card**:
  - Arrive early
  - Kids programming available
  - Service duration (~60 minutes)
  - Casual dress code

### UI/UX Features
- Full-width layout (max-w-[1600px]) matching header
- Dynamic top section:
  - Title/subtitle aligned with top of Christmas image
  - Instructions and campus filter aligned with bottom
- Glass morphism form inputs (bg-white/10 for legibility)
- Framer Motion animations and transitions
- Button hover states with color changes
- Responsive padding (px-4 md:px-6 lg:px-8)

### Embed Features
- iframe-based embedding prevents WordPress style conflicts
- Auto-adjusting height via postMessage API
- ResizeObserver detects content size changes
- Sends height updates to parent window
- `/public/embed.js` script for easy WordPress integration

## MinistryPlatform Integration (Future)

When connecting to MinistryPlatform API, you'll need:

### Database Tables
- **Events** - Christmas service times
- **Event_RSVPs** - RSVP records
- **Congregations** - Campus data
- **Contacts** - Contact information

### API Endpoints (To Be Created)
- `GET /api/events` - Fetch Christmas service times with capacity
- `POST /api/rsvps` - Submit new RSVP
- `GET /api/campuses` - Fetch campus list

### Environment Variables for Production
```env
MINISTRY_PLATFORM_CLIENT_ID=<your-client-id>
MINISTRY_PLATFORM_CLIENT_SECRET=<your-secret>
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org
```

## Theme Colors

- **Primary**: `#4F624C` (Dark green)
- **Secondary**: `#C5AB94` (Light tan)
- **Tertiary**: `#B09578` (Darker tan - hover state)
- **Accent**: `#E8DDD0` (Cream)

## License

MIT
