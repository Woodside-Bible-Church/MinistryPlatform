# Deep Linking & Universal Links

This document covers the implementation of deep links and universal links in the Announcements widget, specifically for handling links in embedded/in-app browser contexts.

## Problem Statement

When this widget is embedded in social media apps (Instagram, Facebook, TikTok, etc.), links open in their built-in "in-app browsers" which have limitations:
- Cannot open native apps via universal links
- Limited browser features
- Users get stuck in a degraded browsing experience

The solution: Detect these contexts and show a modal offering users options to open links in their preferred native browser or app.

## Architecture Overview

```
User clicks link in social mode
         │
         ▼
┌─────────────────────────────────────────┐
│  Is embedded mobile context?            │
│  (in-app browser OR iframe) AND mobile  │
└─────────────────────────────────────────┘
         │                    │
        YES                   NO
         │                    │
         ▼                    ▼
┌─────────────────┐   ┌────────────────────┐
│ Show Modal with │   │ Navigate directly  │
│ browser/app     │   │ window.open(url)   │
│ options         │   └────────────────────┘
└─────────────────┘
```

## Key Components

### 1. Embedded Context Detection

Located in `AnnouncementsGrid.tsx` within `useEffect`:

```typescript
const checkEmbeddedMobile = () => {
  const userAgent = navigator.userAgent || '';

  // Detect common in-app browsers by their user agent signatures
  const isInAppBrowser = /Instagram|FBAN|FBAV|Twitter|TikTok|LinkedInApp/i.test(userAgent);

  // Check if we're running inside an iframe
  const isInIframe = window.self !== window.top;

  // Only show modal on small screens (mobile)
  const isSmallScreen = window.innerWidth < 768;

  // Trigger modal if: (in-app browser OR iframe) AND small screen
  setIsEmbeddedMobile((isInAppBrowser || isInIframe) && isSmallScreen);
};
```

**User Agent Signatures:**
| App | User Agent Contains |
|-----|---------------------|
| Instagram | `Instagram` |
| Facebook | `FBAN` or `FBAV` |
| Twitter/X | `Twitter` |
| TikTok | `TikTok` |
| LinkedIn | `LinkedInApp` |

### 2. LinkOptionsModal Component

The modal presents users with options based on the URL type:
- **Bible.com links**: Shows Bible App option first, then Chrome/Firefox
- **Other links**: Shows Chrome and Firefox options

### 3. URL Scheme Handlers

Each option uses a specific URL scheme to open the native app:

```typescript
// Chrome on iOS
const chromeUrl = url
  .replace(/^https:\/\//, 'googlechromes://')  // HTTPS → googlechromes://
  .replace(/^http:\/\//, 'googlechrome://');   // HTTP → googlechrome://

// Firefox on iOS
const firefoxUrl = `firefox://open-url?url=${encodeURIComponent(url)}`;

// YouVersion Bible App (for event links)
const deepLink = `youversion://events?id=${eventId}`;
```

## Deep Link Implementations

### YouVersion Bible App

**Detection** (`isBibleLink` function):
```typescript
function isBibleLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'bible.com' || urlObj.hostname === 'www.bible.com';
  } catch {
    return false;
  }
}
```

**Conversion** (`getBibleAppDeepLink` function):
```typescript
function getBibleAppDeepLink(url: string): string {
  try {
    const urlObj = new URL(url);

    // Event URLs: bible.com/events/123456 → youversion://events?id=123456
    const eventMatch = urlObj.pathname.match(/\/events\/(\d+)/);
    if (eventMatch) {
      return `youversion://events?id=${eventMatch[1]}`;
    }

    // Other bible.com URLs (passages, etc.) - use universal link
    return url;
  } catch {
    return url;
  }
}
```

**Supported URL Patterns:**

| Web URL | Deep Link |
|---------|-----------|
| `bible.com/events/123456` | `youversion://events?id=123456` |
| `bible.com/bible/59/GEN.1` | Uses universal link (original URL) |
| `bible.com/reading-plans/...` | Uses universal link (original URL) |

### Chrome Browser

**URL Scheme:** `googlechromes://` (HTTPS) or `googlechrome://` (HTTP)

```typescript
const handleOpenInChrome = () => {
  const chromeUrl = url
    .replace(/^https:\/\//, 'googlechromes://')
    .replace(/^http:\/\//, 'googlechrome://');
  window.location.href = chromeUrl;
};
```

### Firefox Browser

**URL Scheme:** `firefox://open-url?url={encoded_url}`

```typescript
const handleOpenInFirefox = () => {
  const firefoxUrl = `firefox://open-url?url=${encodeURIComponent(url)}`;
  window.location.href = firefoxUrl;
};
```

## Adding New Deep Links

### Step 1: Create Detection Function

```typescript
// Example: YouTube detection
function isYouTubeLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
      .includes(urlObj.hostname);
  } catch {
    return false;
  }
}
```

### Step 2: Create Deep Link Converter

Research the app's URL scheme (see Resources section below), then:

```typescript
// Example: YouTube deep link
function getYouTubeDeepLink(url: string): string {
  try {
    const urlObj = new URL(url);

    // Video: youtube.com/watch?v=VIDEO_ID → youtube://VIDEO_ID
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return `youtube://${videoId}`;
    }

    // Short URL: youtu.be/VIDEO_ID → youtube://VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return `youtube://${urlObj.pathname.slice(1)}`;
    }

    // Channel, playlist, etc. - use universal link
    return url;
  } catch {
    return url;
  }
}
```

### Step 3: Add to LinkOptionsModal

1. Add the detection check:
```typescript
const isYouTubeLink = checkIsYouTubeLink(url);
```

2. Add the handler:
```typescript
const handleOpenInYouTube = () => {
  const deepLink = getYouTubeDeepLink(url);
  window.location.href = deepLink;
  onClose();
};
```

3. Add the button (conditionally rendered):
```typescript
{isYouTubeLink && (
  <button onClick={handleOpenInYouTube} className="...">
    <img src="data:image/svg+xml;base64,..." alt="YouTube" />
    <span>Open in YouTube</span>
  </button>
)}
```

### Step 4: Add Icon as Base64 Data URI

Icons must be embedded as base64 data URIs because external file paths don't work reliably in embedded widget contexts (in-app browsers, iframes, Shadow DOM).

**Convert SVG to Base64:**
```bash
# macOS/Linux
base64 -i icon.svg | tr -d '\n'

# Or use an online tool like base64encode.org
```

**Use in component:**
```typescript
<img
  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cD..."
  alt="App Name"
  className="w-7 h-7"
/>
```

## Common Deep Link Schemes

Reference for future implementations:

| App | URL Scheme | Example |
|-----|------------|---------|
| YouTube | `youtube://` | `youtube://VIDEO_ID` |
| Spotify | `spotify://` | `spotify://track/TRACK_ID` |
| Apple Music | `music://` | `music://` |
| Apple Maps | `maps://` | `maps://?q=address` |
| Google Maps | `comgooglemaps://` | `comgooglemaps://?q=address` |
| Twitter/X | `twitter://` | `twitter://status?id=TWEET_ID` |
| Instagram | `instagram://` | `instagram://user?username=NAME` |
| TikTok | `snssdk1233://` | Platform-specific |
| WhatsApp | `whatsapp://` | `whatsapp://send?text=...` |
| Telegram | `tg://` | `tg://msg?text=...` |
| Zoom | `zoomus://` | `zoomus://zoom.us/join?confno=...` |

## Styling Guidelines

### Button Colors

Match the app's brand identity:

| App | Background | Hover | Notes |
|-----|------------|-------|-------|
| Bible App | `#2B2B2B` | `#3D3D3D` | YouVersion dark theme |
| Chrome | White w/ shadow | - | Matches Chrome logo |
| Firefox | White w/ shadow | - | Matches Firefox logo |
| YouTube | `#FF0000` | `#CC0000` | YouTube red |
| Spotify | `#1DB954` | `#1AA34A` | Spotify green |

### Icon Sizing

- App icons in rounded containers: `w-10 h-10` with `rounded-lg`
- Browser icons in circular containers: `w-10 h-10` with `rounded-full`
- Inner icon: `w-7 h-7` for browsers, `w-full h-full` for apps

## Troubleshooting

### Deep link not opening app

1. **App not installed**: Deep links fail silently if the app isn't installed. Consider implementing fallback logic.
2. **Incorrect URL scheme**: Verify the URL scheme for the specific platform (iOS vs Android may differ).
3. **App restrictions**: Some apps don't register URL schemes for all features.

### Icons not displaying in embedded context

This is why we use base64 data URIs. If icons aren't showing:
1. Verify the base64 string is complete and properly formatted
2. Check that `data:image/svg+xml;base64,` prefix is present
3. Ensure SVG doesn't have XML declaration issues

### Modal not showing

Check the embedded context detection:
1. User agent detection may need new patterns for emerging apps
2. Iframe detection (`window.self !== window.top`) may be blocked by sandbox attributes
3. Screen width threshold (768px) may need adjustment

## Resources

- [Apple URL Scheme Reference](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)
- [Android Deep Links](https://developer.android.com/training/app-links/deep-linking)
- [YouVersion API](https://developers.youversion.com/) (for Bible App integration)
- [Chrome iOS URL Schemes](https://developer.chrome.com/docs/ios/links)
- [Firefox iOS URL Schemes](https://github.com/nicktmro/Firefox-iOS-Open-URL-Helper)

## Files Reference

- **Main Component**: `src/components/AnnouncementsGrid.tsx`
  - `isBibleLink()` - Line ~14
  - `getBibleAppDeepLink()` - Line ~24
  - `LinkOptionsModal` - Line ~44
  - Embedded detection - Line ~241

- **Icon Assets**: `public/assets/`
  - `chrome.svg` - Chrome logo
  - `firefox.svg` - Firefox logo
  - `bibleApp.svg` - YouVersion Bible App icon
