# Universal Link Router App

## Overview

A lightweight iOS/Android app that acts as a URL router, enabling links shared in social media apps (Instagram, Facebook, TikTok, etc.) to open in the user's preferred browser instead of the in-app browser.

## The Problem

When users click links inside social media in-app browsers:
- Links open within the app's embedded WebView
- JavaScript cannot escape this sandbox (`window.open`, `target="_blank"` are intercepted)
- Users are stuck in a degraded browser experience
- iOS "Default Browser" setting is ignored (only applies to system-level URL handling)

## The Solution: Universal Links

Universal Links (iOS) and App Links (Android) allow a native app to claim ownership of specific URLs. When a user taps a link that matches, the OS opens the native app instead of a browser.

### How It Works

1. User taps `https://link.woodsidebible.org/go?url=https://woodsidebible.org/events`
2. iOS/Android recognizes this domain is claimed by the Router app
3. Router app opens and reads the `url` parameter
4. Router app immediately opens the destination URL in the system's default browser
5. App closes or goes to background

The in-app browser never gets a chance to intercept because the OS handles Universal Links before the WebView.

## Implementation

### iOS App

**Minimum Requirements:**
- Xcode project with Swift
- Apple Developer account ($99/year)
- Domain you control for hosting the `apple-app-site-association` file

**Key Components:**

1. **apple-app-site-association file** (hosted at `https://link.woodsidebible.org/.well-known/apple-app-site-association`):
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.org.woodsidebible.linkrouter",
        "paths": ["/go", "/go/*"]
      }
    ]
  }
}
```

2. **App Entitlements** (in Xcode):
   - Add "Associated Domains" capability
   - Add `applinks:link.woodsidebible.org`

3. **SceneDelegate.swift** or **AppDelegate.swift**:
```swift
func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let incomingURL = userActivity.webpageURL,
          let components = URLComponents(url: incomingURL, resolvingAgainstBaseURL: true),
          let destinationParam = components.queryItems?.first(where: { $0.name == "url" })?.value,
          let destinationURL = URL(string: destinationParam) else {
        return
    }

    // Open in default browser
    UIApplication.shared.open(destinationURL, options: [:], completionHandler: nil)
}
```

### Android App

**Minimum Requirements:**
- Android Studio project with Kotlin/Java
- Google Play Developer account ($25 one-time)
- Domain you control for hosting the `assetlinks.json` file

**Key Components:**

1. **assetlinks.json** (hosted at `https://link.woodsidebible.org/.well-known/assetlinks.json`):
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "org.woodsidebible.linkrouter",
    "sha256_cert_fingerprints": ["YOUR_APP_SIGNING_CERT_FINGERPRINT"]
  }
}]
```

2. **AndroidManifest.xml**:
```xml
<activity android:name=".MainActivity">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="link.woodsidebible.org" android:pathPrefix="/go" />
    </intent-filter>
</activity>
```

3. **MainActivity.kt**:
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    intent?.data?.let { uri ->
        uri.getQueryParameter("url")?.let { destination ->
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(destination))
            startActivity(browserIntent)
        }
    }
    finish()
}
```

## Domain Setup

You'll need a subdomain dedicated to the router (e.g., `link.woodsidebible.org`).

### DNS
- Point `link.woodsidebible.org` to your hosting (Vercel, Cloudflare, etc.)

### Web Fallback
Create a simple web page at `link.woodsidebible.org/go` that:
1. Reads the `url` query parameter
2. Redirects to the destination (for users without the app)
3. Optionally shows "Get the app for a better experience"

```typescript
// Next.js API route or page
export default function GoPage({ searchParams }: { searchParams: { url?: string } }) {
  const destination = searchParams.url;

  if (destination) {
    redirect(destination);
  }

  return <div>Invalid link</div>;
}
```

## Usage in Social Mode Widget

Once the router app exists, update the social mode links:

```typescript
const routerBaseUrl = 'https://link.woodsidebible.org/go?url=';

// In AnnouncementsGrid.tsx social mode
<a
  href={`${routerBaseUrl}${encodeURIComponent(hasLink)}`}
  // ... rest of props
>
```

Users with the app installed: Link opens in their default browser
Users without the app: Falls back to web redirect (still in Instagram browser, but no worse than before)

## App Store Considerations

### iOS App Store
- App must provide value beyond just redirecting (Apple may reject "thin" apps)
- Consider adding: saved links, link history, QR scanner, or church-specific features
- Privacy policy required

### Google Play Store
- Similar requirements for app utility
- App must comply with Play Store policies

## Alternative: PWA + TWA (Android Only)

For Android, you could use a Trusted Web Activity (TWA) which wraps a PWA and can claim App Links without building a full native app. However, this still opens in Chrome (or the TWA browser), not necessarily the user's default browser.

## Estimated Effort

| Task | Effort |
|------|--------|
| iOS app (minimal) | 2-4 hours |
| Android app (minimal) | 2-4 hours |
| Domain/hosting setup | 1-2 hours |
| App Store submissions | 2-4 hours (plus review wait time) |
| Adding features to pass review | 4-8 hours |

## Resources

- [Apple Universal Links Documentation](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content)
- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [AASA Validator](https://branch.io/resources/aasa-validator/)
- [Android App Links Verification](https://developers.google.com/digital-asset-links/tools/generator)

## Future Possibilities

Once the router app exists, it could be extended for:
- **QR Code Scanner** - Scan codes at events, open in proper browser
- **Deep Links to MP** - Route to specific MinistryPlatform pages/actions
- **Push Notifications** - Send links that open correctly
- **Offline Link Queue** - Save links to open later
- **Analytics** - Track which links are being clicked from social
