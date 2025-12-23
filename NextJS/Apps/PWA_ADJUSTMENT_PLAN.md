# PWA Adjustment Plan for Budgets App

## Executive Summary

This document outlines what needs to be changed to successfully implement PWA (Progressive Web App) support for the Budgets micro-app within the NextJS Apps project. An initial implementation was attempted on 2025-12-20 but encountered service worker conflicts. This plan documents what was tried, what went wrong, and what needs to change for a successful implementation.

---

## Goals

1. **App-specific PWA** - Budgets app should have its own PWA manifest, separate from other micro-apps (Counter, Prayer, etc.)
2. **Professional appearance** - Custom icons matching the CircleDollarSign from Lucide React, Woodside green branding (#61BC47)
3. **Useful standalone features** - Offline support, install prompts, network indicators
4. **Full PWA benefits** - Service worker caching, app shortcuts, standalone window mode
5. **Local testing capability** - Ability to test PWA without deploying to Vercel

---

## What We Changed (2025-12-20 Attempt)

### 1. Package Dependencies

**File: `package.json`**

Added/Updated:
```json
{
  "dependencies": {
    "@ducanh2912/next-pwa": "^10.2.9"  // Modern PWA package (replaces old next-pwa@5.6.0)
  },
  "devDependencies": {
    "sharp": "^0.34.5"  // For PNG icon generation
  },
  "scripts": {
    "setup:https": "bash scripts/setup-https.sh",
    "dev:https": "node scripts/dev-https.js"
  }
}
```

**Why**: The old `next-pwa@5.6.0` is incompatible with Next.js 15. We need the modern fork `@ducanh2912/next-pwa`.

---

### 2. Next.js Configuration

**File: `next.config.ts`**

```typescript
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",  // PWA only in production
  register: true,
  workboxOptions: {
    skipWaiting: true,      // Activate new SW immediately
    clientsClaim: true,     // Take control of clients immediately
    runtimeCaching: [
      {
        // Ministry Platform API calls - NetworkFirst (online first, fallback to cache)
        urlPattern: /^https:\/\/my\.woodsidebible\.org\/ministryplatformapi\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "mp-api-cache",
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // MP Files - CacheFirst (cache first, update in background)
        urlPattern: /^https:\/\/my\.woodsidebible\.org\/ministryplatformapi\/files\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "mp-files-cache",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Images - CacheFirst
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // JS/CSS - StaleWhileRevalidate (use cache, update in background)
        urlPattern: /\.(?:js|css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: "/budgets/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }]
      }
    ];
  }
};

export default withPWA(nextConfig);
```

---

### 3. App-Specific Manifest

**File: `public/budgets/manifest.json`**

```json
{
  "name": "Budgets",
  "short_name": "Budgets",
  "description": "Manage budgets for large group events and projects",
  "theme_color": "#61BC47",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/budgets?source=pwa",
  "scope": "/budgets",
  "icons": [
    {
      "src": "/icons/budgets-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/budgets-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/budgets-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/budgets-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Quick Approvals",
      "short_name": "Approvals",
      "description": "View items awaiting your approval",
      "url": "/budgets?view=approvals&source=pwa",
      "icons": [{ "src": "/icons/budgets-192.png", "sizes": "192x192" }]
    }
  ],
  "screenshots": [],
  "categories": ["productivity", "finance"],
  "orientation": "portrait-primary"
}
```

**Why**: App-specific manifest allows Budgets to be installed as a separate PWA with its own branding, separate from Counter, Prayer, etc.

---

### 4. Custom Icons

**Generated Icons:**
- `public/icons/budgets-192.png`
- `public/icons/budgets-512.png`
- `public/icons/budgets-maskable-192.png`
- `public/icons/budgets-maskable-512.png`

**Icon Generation Script: `scripts/generate-budgets-icons.js`**

```javascript
const fs = require('fs');
const path = require('path');

const createSVG = (size, maskable = false) => {
  const iconSize = maskable ? size * 0.6 : size * 0.85;
  const offset = (size - iconSize) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${maskable ? `<rect width="${size}" height="${size}" fill="#61BC47" rx="${size * 0.2}"/>` : ''}
  <g transform="translate(${offset}, ${offset})">
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24"
         fill="none" stroke="${maskable ? '#ffffff' : '#61BC47'}"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H6"/>
      <path d="M12 18V6"/>
    </svg>
  </g>
</svg>`;
};

// Generate SVG files
const sizes = [192, 512];
sizes.forEach(size => {
  fs.writeFileSync(
    path.join(__dirname, `../public/icons/budgets-${size}.svg`),
    createSVG(size, false)
  );
  fs.writeFileSync(
    path.join(__dirname, `../public/icons/budgets-maskable-${size}.svg`),
    createSVG(size, true)
  );
});
```

**Conversion Script: `scripts/convert-icons-to-png.js`**

Uses `sharp` package to convert SVG → PNG with proper sizing.

**Why**: Icons must match the existing Lucide CircleDollarSign used in the app, with maskable versions for Android adaptive icons.

---

### 5. Budgets Layout with PWA Metadata

**File: `src/app/(app)/budgets/layout.tsx`**

```typescript
import { Metadata } from 'next';
import { NetworkStatusIndicator } from '@/components/NetworkStatusIndicator';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ClientOnly } from '@/components/ClientOnly';

export const metadata: Metadata = {
  title: {
    template: '%s | Budgets',
    default: 'Budgets',
  },
  description: 'Manage budgets for large group events and projects',
  manifest: '/budgets/manifest.json',  // App-specific manifest
  themeColor: '#61BC47',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Budgets',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Budgets',
    description: 'Manage budgets for large group events and projects',
    siteName: 'Budgets',
  },
  icons: {
    icon: [
      { url: '/icons/budgets-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/budgets-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/budgets-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function BudgetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ClientOnly>
        <NetworkStatusIndicator />
        <InstallPrompt />
      </ClientOnly>
    </>
  );
}
```

**Why**: Links the app-specific manifest and adds PWA UI components (wrapped in ClientOnly to prevent SSR issues).

---

### 6. PWA UI Components

#### a. Network Status Indicator

**File: `src/components/NetworkStatusIndicator.tsx`**

Shows banner when offline or when coming back online.

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const [show, setShow] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setHasBeenOffline(true);
    } else if (hasBeenOffline) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (!show) return null;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                     px-4 py-2 rounded-full shadow-lg flex items-center gap-2
                     ${isOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline - using cached data</span>
        </>
      )}
    </div>
  );
}
```

#### b. Install Prompt

**File: `src/components/InstallPrompt.tsx`**

Custom branded install prompt (green banner, bottom-right).

```typescript
'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useStandaloneMode } from '@/hooks/useStandaloneMode';

export function InstallPrompt() {
  const { isStandalone, isInstallable, promptInstall } = useStandaloneMode();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isStandalone || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      setIsDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50 bg-[#61BC47] text-white rounded-lg shadow-lg p-4">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Install Budgets App</h3>
          <p className="text-xs opacity-90 mb-3">
            Install for quick access and offline support.
          </p>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-white text-[#61BC47] rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### c. ClientOnly Wrapper

**File: `src/components/ClientOnly.tsx`**

Prevents SSR rendering of browser-only components.

```typescript
'use client';

import { useEffect, useState } from 'react';

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
```

**Why Critical**: Without this, PWA components cause React SSR errors:
```
TypeError: can't access property "removeChild", deletedFiber.parentNode is null
```

---

### 7. React Hooks

#### a. Network Status Hook

**File: `src/hooks/useNetworkStatus.ts`**

```typescript
'use client';

import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed
    const connection = (navigator as any).connection;
    if (connection) {
      const checkSpeed = () => {
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      };
      checkSpeed();
      connection.addEventListener('change', checkSpeed);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', checkSpeed);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSlowConnection };
}
```

#### b. Standalone Mode Hook (UPDATED)

**File: `src/hooks/useStandaloneMode.ts`**

**BEFORE** (simple boolean):
```typescript
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);
  // ...
  return isStandalone;  // ❌ Just boolean
}
```

**AFTER** (full install support):
```typescript
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }
    return false;
  };

  return { isStandalone, isInstallable, promptInstall };  // ✅ Full object
}
```

---

### 8. HTTPS Testing Setup (Optional)

**File: `scripts/setup-https.sh`**

```bash
#!/bin/bash

# Install mkcert if not installed
if ! command -v mkcert &> /dev/null; then
  echo "Installing mkcert..."
  brew install mkcert
  mkcert -install
fi

# Generate certificates
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost
```

**File: `scripts/dev-https.js`**

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

**Why**: Some PWA features (like notifications) require HTTPS. This allows local testing with valid SSL certificates.

---

## Issues Encountered

### 1. Service Worker Conflicts (CRITICAL)

**Problem**: When running production build, pages showed blank/white screens with no content.

**Symptoms**:
- Development mode works fine (PWA disabled)
- Production mode shows blank page
- No console errors visible in user screenshot
- Server logs show successful startup but no incoming requests

**Root Cause**: Service worker from previous builds was caching old/corrupted content.

**Attempted Fixes**:
- ✅ Cleared browser cache (Application → Storage → Clear site data)
- ✅ Unregistered service workers (Application → Service Workers → Unregister)
- ✅ Tried different port (3001) to avoid conflicts
- ❌ Still blank pages in production

**What Needs to Change**:
- Need better service worker lifecycle management
- Consider adding skip waiting logic or cache busting
- May need versioning strategy for service worker updates

---

### 2. Authentication Flow in Production

**Problem**: `/budgets` requires authentication (middleware checks session token).

**Current Flow**:
1. User visits `/budgets` without session
2. Middleware redirects to `/` (home page)
3. Home page is client component that fetches from API
4. If no response, page appears blank

**What Should Happen**:
1. User visits `/budgets` without session
2. Middleware redirects to `/signin?callbackUrl=/budgets`
3. After OAuth, user returns to `/budgets`

**What Needs to Change**:
- Update middleware redirect logic (line 259 in `src/middleware.ts`):
  ```typescript
  // CURRENT:
  return NextResponse.redirect(new URL('/', request.url));

  // SHOULD BE:
  const signInUrl = new URL('/signin', request.url);
  signInUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(signInUrl);
  ```

---

### 3. SSR Issues with Browser APIs

**Problem**: React error when using browser-only APIs during SSR:
```
TypeError: can't access property "removeChild", deletedFiber.parentNode is null
```

**Solution**: Wrapped PWA components in `ClientOnly` wrapper that only renders after mount.

**What Works**:
```typescript
<ClientOnly>
  <NetworkStatusIndicator />
  <InstallPrompt />
</ClientOnly>
```

---

### 4. TypeScript Type Mismatches

**Problem**: Hook return type didn't match component expectations.

**Fixed**: Updated `useStandaloneMode` to return object instead of boolean.

---

## Recommended Implementation Approach (Fresh Start)

### Phase 1: Package Setup
1. Install `@ducanh2912/next-pwa@^10.2.9` and `sharp@^0.34.5`
2. Remove old `next-pwa` if present
3. Verify Next.js is on 15.x

### Phase 2: Icons First
1. Run icon generation script
2. Convert SVG → PNG
3. Verify icons look correct in browser
4. Test icons on different backgrounds (light/dark)

### Phase 3: Manifest Only (No Service Worker)
1. Create `/public/budgets/manifest.json`
2. Update `src/app/(app)/budgets/layout.tsx` with metadata
3. **DO NOT enable service worker yet**
4. Test manifest shows correctly in Chrome DevTools
5. Test theme color shows correctly

### Phase 4: Basic PWA (No Offline)
1. Enable PWA in `next.config.ts` but with minimal caching
2. Set `skipWaiting: false` initially
3. Build and test installation flow
4. Verify app installs correctly
5. Test uninstall/reinstall flow

### Phase 5: Service Worker & Caching
1. Add runtime caching rules one at a time
2. Test each caching strategy independently
3. Add versioning to service worker
4. Implement update notification UI
5. Test offline functionality

### Phase 6: Enhanced Features
1. Add network status indicator
2. Add install prompt
3. Add app shortcuts
4. Test on multiple devices/browsers

---

## Testing Checklist

### Installation Testing
- [ ] Install prompt appears in Chrome
- [ ] Install prompt appears in Edge
- [ ] Install prompt appears on Android
- [ ] Install prompt appears on iOS (Add to Home Screen)
- [ ] App installs successfully
- [ ] App opens in standalone mode (no browser UI)
- [ ] App icon appears in Applications/taskbar
- [ ] App can be uninstalled
- [ ] App can be reinstalled

### Functionality Testing
- [ ] All pages load correctly in standalone mode
- [ ] Authentication works in standalone mode
- [ ] API calls work in standalone mode
- [ ] File uploads work
- [ ] Images load correctly
- [ ] Charts render properly
- [ ] Forms submit successfully

### Offline Testing
- [ ] Service worker registers correctly
- [ ] Cached pages load when offline
- [ ] Offline indicator appears when disconnected
- [ ] "Back online" message appears when reconnected
- [ ] Data syncs when coming back online

### Performance Testing
- [ ] Lighthouse PWA score > 90
- [ ] Install size < 10MB
- [ ] App starts < 3 seconds on 3G
- [ ] Cached resources load instantly

### Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Chrome (Android)
- [ ] Edge (desktop)
- [ ] Safari (iOS)
- [ ] Firefox (desktop)

---

## Key Learnings

1. **Service workers are persistent** - Clearing browser cache isn't enough. Must explicitly unregister.

2. **PWA disabled in dev is good** - Prevents development headaches, but makes testing harder.

3. **Authentication middleware needs PWA awareness** - Should redirect to signin with callbackUrl.

4. **ClientOnly wrapper is essential** - Any component using browser APIs must be wrapped.

5. **Manifest scope matters** - `"scope": "/budgets"` ensures only budget pages are PWA-ified.

6. **Testing on different port helps** - Avoids service worker conflicts from previous builds.

7. **Maskable icons are important** - Android adaptive icons require safe zone.

---

## Files to Review Before Next Attempt

1. `src/middleware.ts` - Fix redirect to include callbackUrl
2. `next.config.ts` - Review service worker lifecycle options
3. `src/app/(app)/budgets/layout.tsx` - Verify metadata is correct
4. `public/budgets/manifest.json` - Review manifest structure

---

## Questions to Answer

1. Should we version the service worker to force updates?
2. Should we add update notification when new SW is available?
3. Should we cache authenticated API responses?
4. Should we add background sync for offline actions?
5. Should we add push notification support?
6. Should other apps (Counter, Prayer, Projects) get their own PWAs?

---

## Estimated Time for Clean Implementation

- Phase 1 (Packages): 10 minutes
- Phase 2 (Icons): 30 minutes
- Phase 3 (Manifest): 20 minutes
- Phase 4 (Basic PWA): 1 hour
- Phase 5 (Service Worker): 2 hours
- Phase 6 (Enhanced): 1 hour

**Total: ~5 hours** (with testing)

---

## Success Criteria

✅ Budgets app installs as standalone PWA
✅ Green theme color visible in title bar
✅ Custom CircleDollarSign icon matches UI
✅ Works offline with cached data
✅ Shows network status indicators
✅ Install prompt appears for new users
✅ Lighthouse PWA score > 90
✅ No blank pages or service worker conflicts
✅ Authentication flow works correctly
✅ Can test locally without deploying

---

**End of Documentation**

_Generated: 2025-12-20_
_Status: Implementation paused, needs fresh approach_
