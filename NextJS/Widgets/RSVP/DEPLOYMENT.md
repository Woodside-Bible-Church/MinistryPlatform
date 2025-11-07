# RSVP Widget - Deployment Guide

## Overview
This RSVP widget is built with Next.js and designed to be embedded on WordPress via an iframe. The iframe approach prevents WordPress styles from breaking the widget's styling.

## Prerequisites
- GitHub repository
- Vercel account
- WordPress website with ability to add custom HTML

## Step 1: Push to GitHub

```bash
cd /Users/coltonwirgau/MinistryPlatform/NextJS/Widgets/RSVP

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial RSVP widget with Shadow DOM support"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/Woodside-Bible-Church/rsvp-widget.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables (if needed for production):
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.com
   ```

6. Click "Deploy"
7. Wait for deployment to complete
8. Note your deployment URL (e.g., `https://rsvp-widget.vercel.app`)

## Step 3: Update embed.js

After deploying, update the `WIDGET_URL` in `public/embed.js`:

```javascript
const WIDGET_URL = 'https://your-vercel-app.vercel.app';
```

Then redeploy or manually update the file on Vercel.

## Step 4: Embed on WordPress

### Option A: Direct Iframe (Simpler)

Add this HTML to your WordPress page:

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

1. Add this HTML to your WordPress page:

```html
<!-- RSVP Widget Container -->
<div id="rsvp-widget-container"></div>

<!-- Widget Embed Script -->
<script>
  window.RSVP_WIDGET_URL = 'https://your-vercel-app.vercel.app';
</script>
<script src="https://your-vercel-app.vercel.app/embed.js"></script>
```

The embed script will:
- Create an iframe automatically
- Handle responsive sizing
- Adjust iframe height based on content

## Step 5: Configure CORS (if needed)

If you encounter CORS issues, add this to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://woodsidebible.org' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
      ],
    },
  ];
},
```

## Step 6: Test on WordPress

1. Visit your WordPress page
2. The widget should load inside an iframe
3. Test all functionality:
   - Select campus
   - Choose service time
   - Fill out form (both steps)
   - Submit RSVP
   - Verify confirmation screen
   - Test "RSVP for Another Service" button

## Troubleshooting

### Widget Not Loading
- Check browser console for errors
- Verify Vercel deployment is live
- Check that the URL in embed script matches Vercel URL

### Styling Issues
- The iframe approach should prevent WordPress styles from affecting the widget
- If styles still clash, ensure the widget is loading in an iframe (check browser inspector)

### Height Issues
- The widget sends height updates to the parent window
- If height is incorrect, check browser console for postMessage errors

## Current State

**Status**: Widget is complete with mock data and ready for design approval

**Mock Data**:
- Uses local mock data from `/src/data/mockData.ts`
- Shows all 14 Woodside campuses
- Contains realistic service times for Christmas Eve/Day 2024
- RSVP submissions are simulated (not saved)

**Next Steps**:
1. Get design approval from stakeholders
2. Create API routes to connect to MinistryPlatform
3. Replace mock data with real API calls
4. Test with real data

## Environment Variables for Production

When connecting to real APIs, you'll need:

```
MINISTRY_PLATFORM_CLIENT_ID=<your-client-id>
MINISTRY_PLATFORM_CLIENT_SECRET=<your-secret>
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org
```

Add these in Vercel Dashboard → Project Settings → Environment Variables

## Monitoring

- **Vercel Analytics**: Enabled by default
- **Error Tracking**: Check Vercel deployment logs
- **Performance**: Monitor via Vercel Speed Insights

## Support

For issues or questions:
- Check `/database/CHRISTMAS_RSVP_SCHEMA.md` for database structure
- Review `/CLAUDE.md` for technical architecture
- Contact: [Your contact info]
