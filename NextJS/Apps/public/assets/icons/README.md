# Icon Assets

## Required Files

### 1. **woodside-logo.svg** (Primary - Used in Header)
The main logo used in the header navigation.

**Format**: SVG (Scalable Vector Graphics)
**Why SVG?**
- Infinitely scalable (perfect for any screen size)
- Can be styled/animated with CSS
- Color changes for theming (dark mode, hover effects)
- Smaller file size than PNG
- Crisp on all displays

**Current Implementation**: The header includes a subtle scale-up on hover. You can easily add more effects later!

### 2. Favicons (PNG/ICO format)
Browser tab icons and PWA app icons:

- **favicon-196.png** - 196x196px favicon for desktop browsers
- **favicon.ico** - Standard ICO format (16x16, 32x32, 48x48 sizes)
- **icon-192x192.png** - 192x192px app icon for PWA
- **android-chrome-192x192.png** - 192x192px Android Chrome icon
- **apple-icon-180.png** - 180x180px Apple Touch icon

## Creating Your Icons

### Step 1: Export SVG
Export your Woodside "W" circular logo as SVG from your design tool (Illustrator, Figma, etc.)
- Ensure paths are outlined (no fonts)
- Use Woodside brand colors: `#61BC47` (green), `#1C2B39` (blue)
- Save as `woodside-logo.svg`

### Step 2: Generate PNG Icons
Use https://realfavicongenerator.net/ to create all favicon sizes:
1. Upload your SVG or a 512x512 PNG export
2. Download generated icon pack
3. Place all PNG/ICO files here

## Future Animation Ideas

With SVG, you can easily add effects like:

```css
/* Rotate on hover */
.logo:hover {
  transform: rotate(360deg);
  transition: transform 0.6s ease;
}

/* Color change on hover */
.logo:hover svg path {
  fill: #1C2B39; /* Change green to blue */
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.logo { animation: pulse 2s infinite; }
```

## Current Status

⚠️ **Missing** - Icon files are not yet present.

Place your files here and they'll work immediately:
- `woodside-logo.svg` → Shows in header with hover effect
- PNG/ICO files → Shows as favicon in browser tabs
