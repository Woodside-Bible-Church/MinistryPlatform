# Announcements Widget

An embeddable Next.js widget for displaying church announcements from MinistryPlatform. Features Shadow DOM isolation for style protection and supports both grid and carousel display modes.

## Features

- **Shadow DOM Isolation** - Widget styles won't conflict with host page
- **Two Display Modes** - Grid or horizontal carousel
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Single File Deployment** - Bundles to one JavaScript file
- **Zero Dependencies** (for embedding) - Just add a script tag
- **MinistryPlatform Integration** - Fetches data from custom stored procedure

## Quick Start - Embedding

Add these two lines to any webpage:

```html
<!-- Option 1: Simple embed (uses grid mode by default) -->
<div id="announcements-widget-container"></div>
<script src="https://your-vercel-app.vercel.app/embed.js"></script>

<!-- Option 2: Carousel mode -->
<div id="announcements-widget-container" data-mode="carousel"></div>
<script src="https://your-vercel-app.vercel.app/embed.js"></script>

<!-- Option 3: Direct widget load with custom config -->
<div id="announcements-widget-root"></div>
<script>
  window.ANNOUNCEMENTS_WIDGET_CONFIG = {
    apiBaseUrl: 'https://your-vercel-app.vercel.app',
    containerId: 'announcements-widget-root',
    mode: 'grid' // or 'carousel'
  };
</script>
<script src="https://your-vercel-app.vercel.app/widget/announcements-widget.js"></script>
```

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- MinistryPlatform credentials (for production data)

### Installation

```bash
cd NextJS/Widgets/Announcements
npm install
```

### Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your MinistryPlatform credentials:

```env
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org
MINISTRY_PLATFORM_CLIENT_ID=your-client-id
MINISTRY_PLATFORM_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3004
NEXTAUTH_SECRET=your-secret-key
```

### Development Commands

```bash
# Run Next.js dev server (http://localhost:3004)
npm run dev

# Build both Next.js app and widget bundle
npm run build

# Build only the widget bundle
npm run build:widget

# Run production server
npm start

# Lint code
npm run lint
```

### Project Structure

```
Announcements/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── announcements/
│   │   │       └── route.ts         # API endpoint
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Main page component
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── AnnouncementCard.tsx     # Single announcement card
│   │   └── AnnouncementsGrid.tsx    # Grid/carousel container
│   └── lib/
│       ├── types.ts                 # TypeScript types
│       └── utils.ts                 # Utilities
├── widget/
│   ├── index.tsx                    # Widget entry point (Shadow DOM)
│   └── vite-env.d.ts                # Vite type definitions
├── public/
│   ├── embed.js                     # Easy embed script
│   └── widget/                      # Built widget (generated)
│       └── announcements-widget.js
├── vite.config.ts                   # Vite bundler config
├── next.config.ts                   # Next.js config
├── tailwind.config.js               # Tailwind config
└── package.json
```

## API Integration

### MinistryPlatform Stored Procedure

The widget calls: `api_custom_AnnouncementsWidget_JSON`

Supported parameters:
- `@CongregationID` - Filter by congregation
- `@GroupID` - Filter by group
- `@EventID` - Filter by event
- `@Search` - Search term
- `@AnnouncementIDs` - Comma-separated IDs
- `@Page` - Page number
- `@NumPerPage` - Items per page
- `@UserName` - Username (optional)
- `@DomainID` - Domain ID (optional)

### Expected Response Format

```json
{
  "Announcements": {
    "ChurchWide": [
      {
        "ID": 1,
        "Title": "Announcement Title",
        "Body": "Announcement description",
        "Image": "https://example.com/image.jpg",
        "CallToAction": {
          "Link": "https://example.com",
          "Heading": "Optional heading",
          "SubHeading": "Optional subheading"
        }
      }
    ],
    "Campus": {
      "Name": "Campus Name",
      "Announcements": [...]
    }
  }
}
```

## Display Modes

### Grid Mode (Default)

- Responsive grid layout
- 2 columns on desktop, 1 on mobile
- Featured announcements at top
- Campus announcements below

### Carousel Mode

- Horizontal scrolling
- Vertical section labels
- Progress bar at bottom
- Optimized for homepage embedding

## Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

The widget will be available at:
- Widget bundle: `https://your-app.vercel.app/widget/announcements-widget.js`
- Embed script: `https://your-app.vercel.app/embed.js`
- Standalone page: `https://your-app.vercel.app/`

## Styling

The widget uses **Tailwind CSS v4** and is fully isolated via Shadow DOM.

### Brand Colors

```css
--primary-color: #1c2b39 (dark blue)
--secondary-color: #62bb46 (Woodside green)
```

To customize, edit `src/app/globals.css` or `tailwind.config.js`.

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Troubleshooting

### Widget not appearing

1. Check browser console for errors
2. Verify container element exists
3. Check network tab for failed script loads

### Styles look wrong

- Shadow DOM should isolate styles
- If issues persist, check for `!important` rules in host page
- Verify Tailwind is building correctly

### API errors

1. Check MinistryPlatform credentials in environment variables
2. Verify stored procedure exists and returns correct format
3. Check CORS configuration in `vercel.json`

## License

Private - Woodside Bible Church

## Maintainer

Colton Wirgau
