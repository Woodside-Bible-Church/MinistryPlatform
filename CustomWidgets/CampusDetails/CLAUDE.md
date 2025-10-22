# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MinistryPlatform Custom Widget called "CampusDetails" that displays campus information including pastor details, service times, address with map links, and phone number. The widget is part of a larger CustomWidgets collection and integrates with MinistryPlatform's API system.

## Architecture

### Widget Structure
- **Entry Point**: `index.html` - Main widget container with data attributes for API integration
- **Template**: `Template/widget.html` - Liquid template for rendering campus data
- **Styling**: `Assets/widget.css` - Complete CSS styling with CSS custom properties
- **JavaScript**: Uses shared `CustomWidgets.js` framework for data fetching and template rendering
- **Stored Procedures**: `StoredProc/` folder for SQL scripts (currently documentation only)

### Data Flow
1. Widget initialized via data attributes on HTML elements:
   - `data-component="CustomWidget"`
   - `data-sp="api_Custom_CampusDetailsWidget_JSON"` (stored procedure)
   - `data-params="@CongregationID=15"` (parameters)
   - `data-template` (Liquid template path)
   - `data-host="woodsidebible"` (MinistryPlatform host)

2. CustomWidgets.js framework handles:
   - API calls to MinistryPlatform stored procedures
   - Template rendering with Liquid.js
   - Error handling and data caching

3. Template receives structured data with campus information:
   - Campus name, image, pastor details
   - Service times and days
   - Address with generated map links (Google Maps, Apple Maps, Waze)
   - Phone number

### Styling Architecture
- CSS custom properties for theming (colors, spacing, typography)
- Hero section with background image overlay
- Responsive flexbox layout for facts/information
- Special squiggly background decoration positioned relative to hero
- Brand-colored map link buttons with hover effects

## Development Commands

No build process - this is a static widget that runs directly in the browser.

### Testing
- Open `index.html` directly in browser for local testing
- Widget requires MinistryPlatform API access for full functionality
- Test with `data-debug="true"` for console logging

### Deployment
- Deploy entire folder to MinistryPlatform CustomWidgets directory
- Ensure `CustomWidgets.js` is available at `/CustomWidgets/Assets/CustomWidgets.js`
- Configure stored procedure `api_Custom_CampusDetailsWidget_JSON` in MinistryPlatform

## Widget Integration

### Data Requirements
The stored procedure should return JSON with this structure:
```json
{
  "Campus": {
    "Name": "string",
    "Image": "url",
    "Pastor": {
      "Name": "string",
      "Title": "string",
      "Image": "url"
    },
    "Services": [
      {
        "Day": "string",
        "Times": ["string array"]
      }
    ],
    "Address": {
      "Street": "string",
      "City": "string",
      "State": "string",
      "Zip": "string",
      "Links": {
        "GoogleMaps": "url",
        "AppleMaps": "url",
        "Waze": "url"
      }
    },
    "Phone": "string"
  }
}
```

### Stored Procedure Guidelines
- Include `@UserName nvarchar(75) = null` parameter as standard
- Return JSON format compatible with Liquid template
- Follow MinistryPlatform API security practices
- See `StoredProc/StoredProc.md` for implementation guidelines

## Related Components

This widget shares functionality with the Announcements widget (also embedded in index.html) and uses the shared CustomWidgets.js framework. Other similar widgets in the parent directory include GroupFinder, EventFinder, and WoodsideCafe.