# PWA Standalone Mode Implementation

This document explains how the Progressive Web App (PWA) functionality works across different apps in the platform.

## Overview

Each app in the platform (`/projects`, `/counter`, `/prayer`, `/people-search`) can be installed as a standalone PWA with its own:
- App-specific manifest
- Custom theme colors
- Dedicated icons
- Isolated scope

When installed, each PWA behaves as its own app with tailored navigation and branding.

## How It Works

### 1. Dynamic Manifests (`/api/manifest/route.ts`)

The manifest API route dynamically serves app-specific configurations based on the `app` query parameter:

```typescript
GET /api/manifest?app=projects
GET /api/manifest?app=counter
GET /api/manifest?app=prayer
GET /api/manifest?app=people-search
GET /api/manifest?app=default  // fallback
```

Each manifest includes:
- **App name and description**
- **Start URL** (e.g., `/projects`)
- **Scope** (e.g., `/projects`)
- **Theme color** (e.g., `#61BC47` for projects, `#3b82f6` for counter)
- **Icons** (192x192 and 512x512, both regular and maskable)

### 2. Standalone Mode Detection (`/hooks/useStandaloneMode.ts`)

The `useStandaloneMode()` hook detects if the app is running as an installed PWA:

```typescript
const isStandalone = useStandaloneMode(); // true if PWA, false if browser
```

It checks for:
- iOS standalone mode (`window.navigator.standalone`)
- Display mode (`display-mode: standalone`, `fullscreen`, `minimal-ui`)

### 3. Header Navigation Changes (`/components/Header.tsx`)

When in standalone mode, the Header component:

**Hides:**
- APPS dropdown menu (desktop)
- Global search bar
- Mobile hamburger menu
- Mobile search icon

**Changes:**
- Woodside logo now links to the app's root (e.g., `/projects` instead of `/`)

This gives each installed PWA a cleaner, app-specific interface.

### 4. Dynamic Manifest Loading (`/components/DynamicManifest.tsx`)

This client component automatically:
1. Detects the current route
2. Determines which app context (projects, counter, etc.)
3. Injects the appropriate manifest link into the document head
4. Updates the manifest when navigating between apps

## App Configurations

### Projects App
- **Theme Color:** `#61BC47` (green)
- **Start URL:** `/projects`
- **Scope:** `/projects`
- **Categories:** finance, productivity, business

### Counter App
- **Theme Color:** `#3b82f6` (blue)
- **Start URL:** `/counter`
- **Scope:** `/counter`
- **Categories:** utilities, productivity
- **Orientation:** portrait

### Prayer App
- **Theme Color:** `#8b5cf6` (purple)
- **Start URL:** `/prayer`
- **Scope:** `/prayer`
- **Categories:** lifestyle, social

### People Search App
- **Theme Color:** `#10b981` (emerald)
- **Start URL:** `/people-search`
- **Scope:** `/people-search`
- **Categories:** social, productivity

## PWA Icons

Icons are located in `/public/icons/` with the following naming convention:

```
{app}-192.png              # Standard 192x192 icon
{app}-512.png              # Standard 512x512 icon
{app}-maskable-192.png     # Maskable 192x192 (safe zone)
{app}-maskable-512.png     # Maskable 512x512 (safe zone)
```

**Current Status:** All apps use placeholder Woodside logo icons. These should be replaced with app-specific designs.

## Installing Apps

### Desktop (Chrome/Edge)
1. Navigate to the app (e.g., `/projects`)
2. Click the install icon in the address bar
3. Or: Menu → Install [App Name]

### Mobile (iOS)
1. Open in Safari
2. Tap Share button
3. Scroll down and tap "Add to Home Screen"
4. The app will install with the app-specific icon and name

### Mobile (Android)
1. Open in Chrome
2. Tap the three-dot menu
3. Tap "Install app" or "Add to Home Screen"

## Testing Standalone Mode

### In Browser DevTools:
1. Open Chrome DevTools
2. Go to Application → Manifest
3. View the dynamic manifest based on current route
4. Under Service Workers, check display override

### Simulate Standalone Mode:
```javascript
// In browser console
window.matchMedia('(display-mode: standalone)').matches
```

## Future Enhancements

### Per-App Features:
Each PWA can have unique features when in standalone mode:

**Projects:**
- Quick expense entry shortcut
- Budget alerts/notifications
- Offline budget viewing

**Counter:**
- Quick count buttons on home screen
- Real-time sync indicator
- Haptic feedback

**Prayer:**
- Daily prayer reminder notifications
- Offline prayer list

**People Search:**
- Quick contact shortcuts
- Recently viewed contacts

### Implementation Example:
```typescript
// In any component
const isStandalone = useStandaloneMode();
const appContext = useAppContext(pathname);

if (isStandalone && appContext === 'counter') {
  // Show PWA-specific features for Counter app
  return <QuickCountButtons />;
}
```

## Troubleshooting

### Manifest not updating:
- Clear browser cache
- Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
- Uninstall and reinstall the PWA

### Icons not showing:
- Check `/public/icons/` directory
- Verify icon file names match manifest configuration
- Ensure icons are PNG format (not SVG)

### Standalone mode not detected:
- Verify app is installed, not just opened in browser
- Check that display mode in manifest is set to "standalone"
- Try closing and reopening the installed app

## Technical Notes

- Manifests are cached for 1 hour (`Cache-Control: public, max-age=3600`)
- Each PWA has its own service worker scope
- Apps can coexist - installing Projects doesn't affect Counter
- Uninstalling one PWA doesn't affect others
