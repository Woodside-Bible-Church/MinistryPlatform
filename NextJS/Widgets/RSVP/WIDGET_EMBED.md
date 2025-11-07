# Prayer Widget - Embeddable Version

This document explains how to embed the Prayer Widget directly on any webpage **without an iframe**.

## 🎯 Key Features

- ✅ **No iframe** - Renders directly on your page
- ✅ **Full Next.js/React** - All features and state management
- ✅ **Single JavaScript file** - 591KB (~175KB gzipped)
- ✅ **Auto-syncs with MP Login Widget** - Reads token from localStorage
- ✅ **Style isolation** - Won't conflict with your page styles
- ✅ **Template for future widgets** - Same architecture for all MP widgets

## 📦 What Gets Built

When you run `npm run build`, two things are created:

1. **Next.js App** → Deployed to Vercel (API backend + standalone page)
2. **Widget Bundle** → `public/widget/prayer-widget.js` (embeddable script)

## 🚀 Quick Start - WordPress Embedding

Add these two lines to any WordPress page or post:

```html
<div id="prayer-widget-root"></div>
<script src="https://prayer-gamma.vercel.app/widget/prayer-widget.js"></script>
```

That's it! The widget will automatically initialize and render.

## 🔧 Configuration Options

If you need to customize the widget, add configuration before loading the script:

```html
<div id="prayer-widget-root"></div>
<script>
  window.PRAYER_WIDGET_CONFIG = {
    apiBaseUrl: 'https://prayer-gamma.vercel.app',  // Your Vercel deployment URL
    containerId: 'prayer-widget-root'                // Custom container ID (optional)
  };
</script>
<script src="https://prayer-gamma.vercel.app/widget/prayer-widget.js"></script>
```

## 🔐 Authentication

The widget automatically integrates with MinistryPlatform's Login Widget:

### How It Works:
1. User logs in via `<mpp-user-login>` (MP's Login Widget)
2. MP Login Widget stores token in `localStorage` as `mpp-widgets_AuthToken`
3. Prayer Widget automatically reads this token
4. No additional configuration needed!

### Example: Full WordPress Setup

```html
<!-- 1. MP Widgets Script (if not already loaded) -->
<script id="MPWidgets" src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"></script>

<!-- 2. MP Login Widget (place in header/sidebar) -->
<mpp-user-login></mpp-user-login>

<!-- 3. Prayer Widget (place where you want it to appear) -->
<div id="prayer-widget-root"></div>
<script src="https://prayer-gamma.vercel.app/widget/prayer-widget.js"></script>
```

## 🛠️ Development Workflow

### Local Development

```bash
# Run Next.js dev server (full app with hot reload)
npm run dev

# Open http://localhost:3002
# Develop with all Next.js features
```

### Build for Production

```bash
# Build both Next.js app AND widget bundle
npm run build

# This runs:
# 1. next build (API + standalone app)
# 2. vite build (embeddable widget bundle)

# Output:
# - .next/ → Next.js build (deployed to Vercel)
# - public/widget/prayer-widget.js → Embeddable bundle
```

### Build Only Widget

```bash
# Build just the widget bundle (faster for testing)
npm run build:widget

# Output: public/widget/prayer-widget.js
```

### Deploy to Vercel

```bash
git add -A
git commit -m "Update prayer widget"
git push origin main

# Vercel automatically:
# 1. Runs npm run build
# 2. Deploys Next.js app
# 3. Serves widget bundle at /widget/prayer-widget.js
```

## 📁 Project Structure

```
Prayer/
├── src/                       # Next.js app (develop here)
│   ├── app/                   # Next.js routes + API
│   ├── components/            # Reusable React components
│   └── lib/                   # Utilities
├── widget/                    # Widget entry point
│   └── index.tsx              # Initializes React app for embedding
├── vite.config.ts             # Vite bundler configuration
├── tailwind.widget.config.js  # Tailwind config for widget
├── public/
│   ├── widget/                # Generated bundle (don't edit)
│   │   └── prayer-widget.js   # Embeddable script
│   └── widget-embed-example.html  # Test page
```

## 🧪 Testing Locally

### Test the Widget Bundle

1. Build the widget:
```bash
npm run build:widget
```

2. Start a local server:
```bash
npm run start
# or
npx serve public -p 3002
```

3. Open test page:
```
http://localhost:3002/widget-embed-example.html
```

### Test with WordPress Locally

1. Add to your local WordPress:
```html
<div id="prayer-widget-root"></div>
<script>
  window.PRAYER_WIDGET_CONFIG = {
    apiBaseUrl: 'http://localhost:3002'
  };
</script>
<script src="http://localhost:3002/widget/prayer-widget.js"></script>
```

2. Make sure your Next.js dev server is running:
```bash
npm run dev
```

## 🔄 Creating More Widgets

This architecture works for any MP widget! Here's the template:

### 1. Develop in Next.js

Create your widget in `src/app/(app)/` using full Next.js features:
- React components
- State management
- API routes
- TypeScript
- Tailwind CSS

### 2. Create Widget Entry Point

Copy and modify `widget/index.tsx` for your new widget:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import YourWidgetPage from '../src/app/(app)/your-page';
import '../src/app/globals.css';

class YourWidget {
  init() {
    const container = document.getElementById('your-widget-root');
    const root = createRoot(container);
    root.render(<YourWidgetPage />);
  }
}

// Auto-initialize
const widget = new YourWidget();
widget.init();
window.YourWidget = widget;
```

### 3. Update Vite Config

Change the entry point in `vite.config.ts`:

```typescript
lib: {
  entry: path.resolve(__dirname, 'widget/your-widget-index.tsx'),
  name: 'YourWidget',
  fileName: () => 'your-widget.js',
}
```

### 4. Build and Deploy

```bash
npm run build
git push
```

Done! Your new widget is embeddable at:
```
https://your-app.vercel.app/widget/your-widget.js
```

## 📊 Bundle Size

- **Uncompressed:** 591 KB
- **Gzipped:** 175 KB
- **Includes:** React, all components, Tailwind CSS, Framer Motion

### Optimization Tips

To reduce bundle size:
- Use code splitting for large features
- Lazy load heavy components
- Tree-shake unused utilities
- Consider external React (if parent page already has it)

## 🐛 Troubleshooting

### Widget doesn't appear

1. Check browser console for errors
2. Verify container div exists: `<div id="prayer-widget-root"></div>`
3. Check script loaded: Look in Network tab
4. Verify Vercel deployment succeeded

### Styles look wrong

- The widget uses Tailwind CSS v4
- Styles are scoped and shouldn't conflict
- If issues persist, check for global CSS overrides

### Authentication not working

1. Verify MP Login Widget is on the page
2. Check localStorage for `mpp-widgets_AuthToken`
3. Open console and check for auth errors
4. Verify CORS is enabled in Vercel (already configured)

### API calls failing

1. Check Vercel environment variables are set
2. Verify MP credentials are correct
3. Check CORS configuration in `next.config.js`
4. Look at Network tab for failed requests

## 📝 Notes

- The widget automatically reads from `localStorage.getItem('mpp-widgets_AuthToken')`
- No iframe means the widget can interact directly with the parent page
- All API calls go to your Vercel deployment
- Widget works on any page, not just WordPress

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [Ministry Platform API](https://www.ministryplatform.com/api-docs)
