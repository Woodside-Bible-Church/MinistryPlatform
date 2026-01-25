# MinistryPlatform → WordPress Sync

Backend-only Next.js application for syncing MinistryPlatform data to WordPress via webhooks and cron jobs.

## Architecture

This app provides two sync methods:

1. **Real-time webhooks**: MinistryPlatform sends updates to `/api/webhooks/mp`
2. **Scheduled cron**: Vercel Cron triggers `/api/cron/sync` every 6 hours

```
MinistryPlatform → [Webhooks/Cron] → Next.js API → WordPress REST API
```

## Features

- **Campus Sync**: Syncs congregation data from MP to WordPress custom post type
- **OAuth Authentication**: Secure MP API access via OAuth client credentials
- **WordPress REST API**: Uses Application Password authentication
- **Extensible**: Easy to add more data types (events, groups, etc.)
- **Type-safe**: Full TypeScript with typed MP and WP data structures

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# MinistryPlatform
MINISTRY_PLATFORM_BASE_URL=https://my.ministryplatform.com
MINISTRY_PLATFORM_CLIENT_ID=your-mp-client-id
MINISTRY_PLATFORM_CLIENT_SECRET=your-mp-client-secret

# WordPress
WORDPRESS_URL=https://yoursite.com
WORDPRESS_USERNAME=your-wp-admin-username
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# Security
CRON_SECRET=generate-random-string-here
MP_WEBHOOK_SECRET=optional-webhook-secret
```

### 2. MinistryPlatform Setup

Create an OAuth client in MinistryPlatform:
1. Go to **Administration → API Clients**
2. Create new client with scope: `http://www.thinkministry.com/dataplatform/scopes/all`
3. Copy Client ID and Client Secret to `.env.local`

### 3. WordPress Setup

#### A. Create Application Password
1. Go to **Users → Profile**
2. Scroll to **Application Passwords**
3. Name: "MP Sync" → **Add New Application Password**
4. Copy the generated password (format: `xxxx xxxx xxxx xxxx`)

#### B. Register Custom Post Type
Add this to your theme's `functions.php` or a custom plugin:

```php
function register_campus_post_type() {
    register_post_type('campus', [
        'labels' => [
            'name' => 'Campuses',
            'singular_name' => 'Campus',
        ],
        'public' => true,
        'show_in_rest' => true, // Required for REST API
        'supports' => ['title', 'editor', 'custom-fields'],
        'has_archive' => true,
    ]);
}
add_action('init', 'register_campus_post_type');
```

#### C. Install ACF (Advanced Custom Fields) - Optional
If using ACF fields, install the ACF plugin and create field group "Campus Details":
- `mp_congregation_id` (Number)
- `address` (Text)
- `city` (Text)
- `state` (Text)
- `zip` (Text)
- `pastor_name` (Text)
- `pastor_bio` (Textarea)
- `service_times` (Textarea)
- `phone` (Text)
- `email` (Email)

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd NextJS/mp-wordpress-sync
vercel

# Add environment variables in Vercel Dashboard
# Settings → Environment Variables → Add all from .env.local
```

### 5. Configure MinistryPlatform Webhooks

1. Go to **MinistryPlatform → Administration → Webhooks**
2. Create webhook for `Congregations` table
3. URL: `https://your-vercel-app.vercel.app/api/webhooks/mp`
4. Events: Insert, Update
5. Secret: Copy from your `MP_WEBHOOK_SECRET` env var

### 6. Set Cron Secret in Vercel

Generate a random string for `CRON_SECRET`:

```bash
openssl rand -base64 32
```

Add to Vercel environment variables and your MinistryPlatform webhook config.

## API Endpoints

### `GET /api/health`
Health check - tests connections to MP and WordPress

```bash
curl https://your-app.vercel.app/api/health
```

### `POST /api/webhooks/mp`
Receives webhooks from MinistryPlatform

```bash
curl -X POST https://your-app.vercel.app/api/webhooks/mp \
  -H "Content-Type: application/json" \
  -H "x-mp-webhook-secret: your-secret" \
  -d '{"eventType":"update","tableName":"Congregations","recordId":123}'
```

### `GET /api/cron/sync`
Manually trigger full sync (protected by `CRON_SECRET`)

```bash
curl https://your-app.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"
```

## Development

```bash
cd NextJS/mp-wordpress-sync

# Install dependencies
npm install

# Run dev server
npm run dev

# Test health check
open http://localhost:3000/api/health
```

## Project Structure

```
mp-wordpress-sync/
├── app/
│   └── api/
│       ├── health/route.ts       # Health check endpoint
│       ├── webhooks/
│       │   └── mp/route.ts       # MP webhook receiver
│       └── cron/
│           └── sync/route.ts     # Cron job handler
├── lib/
│   ├── services/
│   │   ├── ministryplatform.ts  # MP API client
│   │   ├── wordpress.ts          # WP REST API client
│   │   └── campus-sync.ts        # Sync logic & transforms
│   └── types/
│       └── campus.ts             # TypeScript types
├── vercel.json                   # Cron schedule config
└── .env.local                    # Environment variables
```

## Extending to Other Data Types

To sync events, groups, or other MP data:

1. **Create types** in `lib/types/`
2. **Add service methods** to `lib/services/ministryplatform.ts`
3. **Create sync service** like `lib/services/event-sync.ts`
4. **Add webhook handler** in `/api/webhooks/mp/route.ts`
5. **Update cron job** in `/api/cron/sync/route.ts`

Example for events:

```typescript
// lib/types/event.ts
export interface MPEvent {
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string;
  // ...
}

export interface WPEvent {
  title: string;
  content: string;
  acf: {
    mp_event_id: number;
    start_date: string;
    // ...
  };
}
```

## Customization

### Change WordPress Post Type

Edit `lib/services/campus-sync.ts`:

```typescript
const wpData: WPCampus = {
  // ...
  type: 'your-custom-post-type', // Change here
};
```

### Change Cron Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"  // Every 6 hours (cron syntax)
    }
  ]
}
```

Common schedules:
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday

### Add More MP Fields

Edit the `$select` query in `lib/services/ministryplatform.ts`:

```typescript
const select = [
  'Congregation_ID',
  'Congregation_Name',
  'Your_Custom_Field',  // Add here
  // ...
].join(',');
```

Then update the transform logic in `lib/services/campus-sync.ts`.

## Troubleshooting

### "Invalid webhook secret"
- Check `MP_WEBHOOK_SECRET` matches in both MP and Vercel
- Ensure MP is sending `x-mp-webhook-secret` header

### "WordPress API error: 401"
- Verify Application Password is correct (no spaces in env var)
- Check username matches WordPress admin username
- Ensure `show_in_rest => true` for custom post type

### "MP OAuth error"
- Verify Client ID/Secret are correct
- Check MP base URL doesn't have trailing slash
- Ensure OAuth client has correct scopes

### Cron not running
- Check `CRON_SECRET` is set in Vercel environment variables
- Verify `vercel.json` is deployed
- View cron logs in Vercel Dashboard → Deployments → Functions

### ACF fields not saving
- Install ACF plugin
- Check field group is assigned to your post type
- Use `acf_format=standard` in WP API requests

## Monitoring

View logs in Vercel Dashboard:
1. Go to your project
2. **Deployments** → Select deployment
3. **Functions** → View logs for API routes

## Security Notes

- **Never commit** `.env.local` to git
- Use strong random strings for `CRON_SECRET` and `MP_WEBHOOK_SECRET`
- WordPress Application Passwords are safer than regular passwords
- Webhook secrets validate requests are from MinistryPlatform
- Cron secret prevents unauthorized sync triggers

## Support

For MinistryPlatform-specific questions, contact your MP support team.
For WordPress REST API docs: https://developer.wordpress.org/rest-api/
