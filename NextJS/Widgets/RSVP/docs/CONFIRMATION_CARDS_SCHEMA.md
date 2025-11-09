# Confirmation Cards Schema Plan

## Overview
Create a flexible card system for the RSVP confirmation page that allows event organizers to configure which information cards appear and in what order.

## Database Schema

### Table: `Event_Confirmation_Cards`
Stores configuration for which cards appear on each event's confirmation page.

```sql
CREATE TABLE Event_Confirmation_Cards (
    Event_Confirmation_Card_ID INT IDENTITY(1,1) PRIMARY KEY,
    Event_ID INT NOT NULL,
    Card_Type_ID INT NOT NULL,
    Display_Order INT NOT NULL,
    Is_Active BIT NOT NULL DEFAULT 1,
    Card_Configuration NVARCHAR(MAX), -- JSON for card-specific settings
    Domain_ID INT NOT NULL DEFAULT 1,
    FOREIGN KEY (Event_ID) REFERENCES Events(Event_ID),
    FOREIGN KEY (Card_Type_ID) REFERENCES Card_Types(Card_Type_ID)
);
```

### Table: `Card_Types`
Defines available card types and their properties.

```sql
CREATE TABLE Card_Types (
    Card_Type_ID INT IDENTITY(1,1) PRIMARY KEY,
    Card_Type_Name NVARCHAR(50) NOT NULL,
    Card_Type_Description NVARCHAR(255),
    Component_Name NVARCHAR(50) NOT NULL, -- React component to render
    Icon_Name NVARCHAR(50), -- Lucide icon name
    Default_Configuration NVARCHAR(MAX), -- JSON with default settings
    Requires_Configuration BIT NOT NULL DEFAULT 0,
    Is_Active BIT NOT NULL DEFAULT 1,
    Domain_ID INT NOT NULL DEFAULT 1
);
```

## Initial Card Types

### 1. Instructions Card (What to Expect)
```json
{
  "Card_Type_Name": "Instructions",
  "Component_Name": "InstructionsCard",
  "Icon_Name": "Info",
  "Default_Configuration": {
    "title": "What to Expect",
    "bullets": []
  }
}
```

### 2. Map Card
```json
{
  "Card_Type_Name": "Map",
  "Component_Name": "MapCard",
  "Icon_Name": "Map",
  "Default_Configuration": {
    "title": "Location",
    "showDirectionsLink": true,
    "mapProvider": "google" // or "apple", "embedded"
  }
}
```

### 3. Parking Information
```json
{
  "Card_Type_Name": "Parking",
  "Component_Name": "ParkingCard",
  "Icon_Name": "ParkingCircle",
  "Default_Configuration": {
    "title": "Parking Information",
    "description": "",
    "parkingLots": []
  }
}
```

### 4. QR Code Card
```json
{
  "Card_Type_Name": "QRCode",
  "Component_Name": "QRCodeCard",
  "Icon_Name": "QrCode",
  "Default_Configuration": {
    "title": "Check-In Code",
    "qrType": "checkin", // "checkin", "calendar", "custom"
    "description": "Show this code when you arrive"
  }
}
```

### 5. Share Card
```json
{
  "Card_Type_Name": "Share",
  "Component_Name": "ShareCard",
  "Icon_Name": "Share2",
  "Default_Configuration": {
    "title": "Invite a Friend",
    "enabledMethods": ["sms", "email", "facebook", "twitter"],
    "customMessage": ""
  }
}
```

### 6. Add to Calendar
```json
{
  "Card_Type_Name": "AddToCalendar",
  "Component_Name": "AddToCalendarCard",
  "Icon_Name": "Calendar",
  "Default_Configuration": {
    "title": "Add to Calendar",
    "providers": ["google", "apple", "outlook", "ics"]
  }
}
```

### 7. What to Bring
```json
{
  "Card_Type_Name": "WhatToBring",
  "Component_Name": "WhatToBringCard",
  "Icon_Name": "Backpack",
  "Default_Configuration": {
    "title": "What to Bring",
    "items": []
  }
}
```

### 8. Schedule/Agenda
```json
{
  "Card_Type_Name": "Schedule",
  "Component_Name": "ScheduleCard",
  "Icon_Name": "Clock",
  "Default_Configuration": {
    "title": "Schedule",
    "timelineItems": []
  }
}
```

### 9. Contact Information
```json
{
  "Card_Type_Name": "ContactInfo",
  "Component_Name": "ContactInfoCard",
  "Icon_Name": "Phone",
  "Default_Configuration": {
    "title": "Questions?",
    "contactName": "",
    "phone": "",
    "email": "",
    "officeHours": ""
  }
}
```

### 10. Weather Forecast
```json
{
  "Card_Type_Name": "Weather",
  "Component_Name": "WeatherCard",
  "Icon_Name": "Cloud",
  "Default_Configuration": {
    "title": "Weather Forecast",
    "showExtendedForecast": false
  }
}
```

### 11. Childcare
```json
{
  "Card_Type_Name": "Childcare",
  "Component_Name": "ChildcareCard",
  "Icon_Name": "Baby",
  "Default_Configuration": {
    "title": "Childcare Available",
    "description": "",
    "ageRange": "",
    "registrationRequired": true,
    "registrationUrl": ""
  }
}
```

### 12. Group Assignment
```json
{
  "Card_Type_Name": "GroupAssignment",
  "Component_Name": "GroupAssignmentCard",
  "Icon_Name": "Users",
  "Default_Configuration": {
    "title": "Your Group",
    "showGroupMembers": false
  }
}
```

## Card Configuration JSON Examples

### Instructions Card Config
```json
{
  "title": "What to Expect",
  "bullets": [
    {
      "icon": "Coffee",
      "text": "Coffee and refreshments available starting at 9:00 AM"
    },
    {
      "icon": "Users",
      "text": "Check in at the Welcome Desk in the main lobby"
    },
    {
      "icon": "MapPin",
      "text": "Event will be held in the Fellowship Hall"
    }
  ]
}
```

### Map Card Config
```json
{
  "title": "Find Us",
  "latitude": 42.331429,
  "longitude": -83.045753,
  "showDirectionsLink": true,
  "customInstructions": "Enter through the main entrance on Main Street"
}
```

### QR Code Card Config
```json
{
  "title": "Your Check-In Code",
  "qrType": "checkin",
  "qrData": "{rsvp_id}_{event_id}", // Tokens replaced at render
  "description": "Show this code when you arrive for faster check-in",
  "includeConfirmationNumber": true
}
```

## API Response Schema

### Stored Procedure: `api_Custom_RSVP_Confirmation_Cards_JSON`

**Parameters:**
- `@RSVP_ID INT`

**Returns:**
```json
{
  "cards": [
    {
      "Card_Type_ID": 1,
      "Card_Type_Name": "Instructions",
      "Component_Name": "InstructionsCard",
      "Icon_Name": "Info",
      "Display_Order": 1,
      "Configuration": {
        "title": "What to Expect",
        "bullets": [...]
      }
    },
    {
      "Card_Type_ID": 4,
      "Card_Type_Name": "QRCode",
      "Component_Name": "QRCodeCard",
      "Icon_Name": "QrCode",
      "Display_Order": 2,
      "Configuration": {
        "title": "Check-In Code",
        "qrData": "12345_678",
        "description": "Show this code when you arrive"
      }
    }
  ]
}
```

## Frontend Implementation

### Dynamic Card Renderer Component
```typescript
// src/components/confirmation/CardRenderer.tsx
interface ConfirmationCard {
  Card_Type_ID: number;
  Card_Type_Name: string;
  Component_Name: string;
  Icon_Name: string;
  Display_Order: number;
  Configuration: Record<string, any>;
}

const cardComponents = {
  InstructionsCard: InstructionsCard,
  MapCard: MapCard,
  QRCodeCard: QRCodeCard,
  ShareCard: ShareCard,
  AddToCalendarCard: AddToCalendarCard,
  // ... etc
};

export function CardRenderer({ card, rsvpData }: { card: ConfirmationCard, rsvpData: any }) {
  const CardComponent = cardComponents[card.Component_Name];

  if (!CardComponent) {
    console.warn(`Unknown card component: ${card.Component_Name}`);
    return null;
  }

  return <CardComponent config={card.Configuration} rsvpData={rsvpData} />;
}
```

### Card Component Interface
Each card component should accept:
```typescript
interface CardProps {
  config: Record<string, any>; // Card-specific configuration
  rsvpData: RSVPConfirmationResponse; // RSVP and event data
}
```

## Admin Interface Considerations

Future admin interface should allow:
1. **Enable/disable cards per event**
2. **Reorder cards** (drag and drop)
3. **Configure card settings** (edit JSON or form-based)
4. **Preview cards** before publishing
5. **Template cards** (save common configurations)
6. **Event series defaults** (apply to all events in series)

## Migration Strategy

1. **Phase 1**: Create tables and seed with initial card types
2. **Phase 2**: Implement dynamic card renderer in frontend
3. **Phase 3**: Create individual card components (start with Instructions, Map, QR Code)
4. **Phase 4**: Build admin interface for card configuration
5. **Phase 5**: Add remaining card types as needed

## Token Replacement System

Support dynamic tokens in configuration values:
- `{rsvp_id}` - RSVP ID
- `{event_id}` - Event ID
- `{first_name}` - Attendee first name
- `{last_name}` - Attendee last name
- `{email}` - Attendee email
- `{party_size}` - Number of attendees
- `{event_title}` - Event name
- `{event_date}` - Event date
- `{campus_name}` - Campus name

Example:
```json
{
  "customMessage": "Hi {first_name}, we're excited to see you at {event_title}!"
}
```

## Benefits

1. **Flexibility**: Event organizers can customize confirmation experience
2. **Reusability**: Common card types can be shared across events
3. **Extensibility**: Easy to add new card types without code changes
4. **Control**: Enable/disable cards per event
5. **Consistency**: Shared components ensure consistent UX

## Future Enhancements

- **Conditional Cards**: Show cards based on RSVP data (e.g., show childcare card only if party_size > 2)
- **A/B Testing**: Test different card configurations
- **Analytics**: Track which cards are most engaged with
- **Personalization**: AI-suggested cards based on event type
- **Multi-language**: Support for translated card content
