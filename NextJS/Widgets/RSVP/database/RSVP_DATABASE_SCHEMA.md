# RSVP Widget Database Schema

## Overview
This document defines the complete database schema for the dynamic RSVP system that integrates with the Projects table. This system supports:
- Project-level RSVP configuration
- Dynamic custom questions per project
- Configurable confirmation cards
- Multiple events per project via `Project_Events`
- Event participant record creation

## Key Design Principles
1. **Separate from MP's Custom_Forms** - We cannot modify MP's built-in Custom_Forms table
2. **Project-Centric** - Everything links to Projects (not individual Events)
3. **Dynamic & Configurable** - All questions and cards defined in database, not code
4. **Domain_ID on all tables** - Multi-tenant support
5. **Nested JSON responses** - Stored procedures return rich data structures

---

## Table Relationships Diagram

```
Projects (existing)
    │
    ├──< Project_Events (existing, enhanced)
    │         │
    │         └──> Events (MP built-in)
    │
    ├──< Project_RSVPs (new)
    │         │
    │         ├──< Project_RSVP_Questions (new)
    │         │         │
    │         │         └──< Question_Options (new)
    │         │
    │         └──< Project_Confirmation_Cards (new)
    │                   │
    │                   └──> Card_Types (new, lookup)
    │
    └──< Event_RSVPs (new - actual submissions)
              │
              ├──< Event_RSVP_Answers (new)
              │
              └──> Event_Participants (MP built-in, created via API)
```

---

## New Tables

### 1. `Project_RSVPs`
**Purpose**: Stores RSVP configuration for each project. One project can have one RSVP configuration.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Project_RSVP_ID` | INT | No | Primary Key (auto-increment) |
| `Project_ID` | INT | No | FK to Projects table |
| `RSVP_Title` | NVARCHAR(255) | No | Display title (e.g., "Christmas Services 2024") |
| `RSVP_Description` | NVARCHAR(MAX) | Yes | Rich text description shown on widget |
| `Header_Image_URL` | NVARCHAR(500) | Yes | Background image URL |
| `Start_Date` | DATETIME | Yes | When RSVPs open |
| `End_Date` | DATETIME | Yes | When RSVPs close |
| `Is_Active` | BIT | No | Whether RSVP is currently accepting submissions |
| `Require_Contact_Lookup` | BIT | No | If true, require user to find themselves in MP |
| `Allow_Guest_Submission` | BIT | No | If true, allow non-MP contacts to RSVP |
| `Confirmation_Email_Template_ID` | INT | Yes | FK to Communication_Templates (MP) |
| `Domain_ID` | INT | No | FK to dp_Domains |

**Notes:**
- One-to-one relationship with Projects
- Controls global RSVP behavior
- `Require_Contact_Lookup = true` means user must select themselves from MP Contacts
- `Allow_Guest_Submission = true` creates new Contact record if not found

---

### 2. `Project_RSVP_Questions`
**Purpose**: Custom questions shown in the RSVP form for this project.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Project_RSVP_Question_ID` | INT | No | Primary Key |
| `Project_RSVP_ID` | INT | No | FK to Project_RSVPs |
| `Question_Text` | NVARCHAR(500) | No | The question to display |
| `Question_Type_ID` | INT | No | FK to Question_Types (lookup) |
| `Field_Order` | INT | No | Display order (1, 2, 3...) |
| `Is_Required` | BIT | No | Whether answer is required |
| `Helper_Text` | NVARCHAR(500) | Yes | Optional help text |
| `Min_Value` | INT | Yes | Min for numeric types |
| `Max_Value` | INT | Yes | Max for numeric types |
| `Default_Value` | NVARCHAR(255) | Yes | Default value |
| `Placeholder_Text` | NVARCHAR(255) | Yes | Placeholder for inputs |
| `Active` | BIT | No | Whether question is active |
| `Domain_ID` | INT | No | FK to dp_Domains |

---

### 3. `Question_Types` (Lookup Table)
**Purpose**: Defines available question field types.

| Column | Type | Description |
|--------|------|-------------|
| `Question_Type_ID` | INT | Primary Key |
| `Question_Type_Name` | NVARCHAR(50) | Type name (e.g., "counter", "checkbox") |
| `Component_Name` | NVARCHAR(50) | React component to render |
| `Description` | NVARCHAR(255) | Human-readable description |
| `Requires_Options` | BIT | Whether this type needs Question_Options |

**Seed Data:**
- 1: Counter (numeric with +/- buttons)
- 2: Checkbox (single yes/no)
- 3: Text (short text input)
- 4: Textarea (long text)
- 5: Dropdown (select from options)
- 6: Radio (radio buttons)
- 7: Multi-Checkbox (multiple checkboxes)
- 8: Date
- 9: Time
- 10: Email
- 11: Phone
- 12: Searchable Dropdown (combobox)
- 13: Multi-Select Dropdown
- 14: Tag Input
- 15: Button Group (single select)
- 16: Multi-Button Group (multi select)
- 17: Slider
- 18: Rating (stars)
- 19: File Upload
- 20: Color Picker

---

### 4. `Question_Options`
**Purpose**: Predefined options for dropdown/radio/checkbox questions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Question_Option_ID` | INT | No | Primary Key |
| `Project_RSVP_Question_ID` | INT | No | FK to Project_RSVP_Questions |
| `Option_Text` | NVARCHAR(255) | No | Display text |
| `Option_Value` | NVARCHAR(255) | No | Stored value |
| `Display_Order` | INT | No | Sort order |
| `Domain_ID` | INT | No | FK to dp_Domains |

---

### 5. `Event_RSVPs`
**Purpose**: Stores actual RSVP submissions from users.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Event_RSVP_ID` | INT | No | Primary Key |
| `Event_ID` | INT | No | FK to Events (which service time) |
| `Project_RSVP_ID` | INT | No | FK to Project_RSVPs |
| `Contact_ID` | INT | Yes | FK to Contacts (null if guest) |
| `First_Name` | NVARCHAR(50) | No | User's first name |
| `Last_Name` | NVARCHAR(50) | No | User's last name |
| `Email_Address` | NVARCHAR(100) | No | User's email |
| `Phone_Number` | NVARCHAR(25) | Yes | User's phone |
| `Submission_Date` | DATETIME | No | When RSVP was submitted |
| `Confirmation_Code` | NVARCHAR(20) | No | Unique code for check-in (generated) |
| `Is_Guest` | BIT | No | Whether this is a guest RSVP |
| `Event_Participant_ID` | INT | Yes | FK to Event_Participants (created after submission) |
| `Domain_ID` | INT | No | FK to dp_Domains |

**Notes:**
- `Contact_ID` can be null if `Allow_Guest_Submission = true`
- `Confirmation_Code` is auto-generated (e.g., "46739-1201")
- `Event_Participant_ID` links to the MP Event_Participants record created by API

---

### 6. `Event_RSVP_Answers`
**Purpose**: Stores user answers to custom questions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Event_RSVP_Answer_ID` | INT | No | Primary Key |
| `Event_RSVP_ID` | INT | No | FK to Event_RSVPs |
| `Project_RSVP_Question_ID` | INT | No | FK to Project_RSVP_Questions |
| `Answer_Text` | NVARCHAR(MAX) | Yes | Text answer or JSON |
| `Answer_Numeric` | INT | Yes | Numeric answer |
| `Answer_Boolean` | BIT | Yes | Boolean answer |
| `Answer_Date` | DATETIME | Yes | Date/time answer |
| `Domain_ID` | INT | No | FK to dp_Domains |

**Notes:**
- Different columns used based on Question_Type
- Multi-select answers stored as JSON in `Answer_Text`
- Example JSON: `["music", "sports", "games"]`

---

### 7. `Card_Types` (Lookup Table)
**Purpose**: Defines available confirmation card types.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Card_Type_ID` | INT | No | Primary Key |
| `Card_Type_Name` | NVARCHAR(50) | No | Type name (e.g., "Instructions") |
| `Component_Name` | NVARCHAR(50) | No | React component name |
| `Icon_Name` | NVARCHAR(50) | Yes | Lucide icon name |
| `Description` | NVARCHAR(255) | Yes | What this card does |
| `Default_Configuration` | NVARCHAR(MAX) | Yes | Default JSON config |
| `Requires_Configuration` | BIT | No | Whether config is required |

**Seed Data:**
1. Instructions ("What to Expect")
2. Map (Google Maps with directions)
3. QR Code (check-in code)
4. Share (invite friends)
5. Add to Calendar
6. Parking Information
7. Childcare
8. Contact Info
9. Schedule
10. Weather

---

### 8. `Project_Confirmation_Cards`
**Purpose**: Configures which cards appear on confirmation page per project.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Project_Confirmation_Card_ID` | INT | No | Primary Key |
| `Project_RSVP_ID` | INT | No | FK to Project_RSVPs |
| `Card_Type_ID` | INT | No | FK to Card_Types |
| `Display_Order` | INT | No | Sort order |
| `Is_Active` | BIT | No | Whether card is shown |
| `Card_Configuration` | NVARCHAR(MAX) | Yes | JSON configuration |
| `Congregation_ID` | INT | Yes | FK to Congregations (campus-specific card) |
| `Domain_ID` | INT | No | FK to dp_Domains |

**Notes:**
- If `Congregation_ID` is NULL, card shows for all campuses
- If `Congregation_ID` is set, card only shows for that campus
- Enables campus-specific parking instructions, maps, etc.

---

## Enhancements to Existing Tables

### `Project_Events` (Existing Table - Add Columns)
**Purpose**: Links events to projects (already exists in Project Budgets app)

**New Columns to Add:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Include_In_RSVP` | BIT | No | Whether this event should show in RSVP widget (default 1) |
| `RSVP_Capacity_Override` | INT | Yes | Override event capacity for RSVP purposes |

**Existing Columns (reference):**
- `Project_Event_ID` (PK)
- `Project_ID` (FK to Projects)
- `Event_ID` (FK to Events)
- `Domain_ID`

---

## Stored Procedures

### 1. `api_Custom_RSVP_Project_Data_JSON`
**Purpose**: Fetch all data needed to render the RSVP widget for a project.

**Parameters:**
- `@Project_RSVP_ID INT`
- `@Congregation_ID INT` (optional, for filtering events by campus)

**Returns:** Nested JSON
```json
{
  "Project_RSVP": {
    "Project_RSVP_ID": 1,
    "Project_ID": 15,
    "RSVP_Title": "Christmas Services 2024",
    "RSVP_Description": "...",
    "Header_Image_URL": "https://...",
    "Is_Active": true
  },
  "Events": [
    {
      "Event_ID": 101,
      "Event_Title": "Christmas Eve - Troy",
      "Event_Start_Date": "2024-12-24T14:00:00",
      "Event_End_Date": "2024-12-24T15:00:00",
      "Congregation_ID": 15,
      "Congregation_Name": "Troy",
      "Capacity": 650,
      "Current_RSVPs": 98,
      "Capacity_Percentage": 15
    }
  ],
  "Questions": [
    {
      "Question_ID": 1,
      "Question_Text": "How many people?",
      "Question_Type": "counter",
      "Component_Name": "CounterQuestion",
      "Field_Order": 1,
      "Is_Required": true,
      "Min_Value": 1,
      "Max_Value": 99,
      "Default_Value": "1",
      "Options": []
    },
    {
      "Question_ID": 2,
      "Question_Text": "This is my first visit to Woodside",
      "Question_Type": "checkbox",
      "Component_Name": "CheckboxQuestion",
      "Field_Order": 2,
      "Is_Required": false,
      "Helper_Text": "We'd love to help you find your way...",
      "Options": []
    }
  ],
  "Confirmation_Cards": [
    {
      "Card_Type_ID": 1,
      "Card_Type_Name": "Instructions",
      "Component_Name": "InstructionsCard",
      "Icon_Name": "Info",
      "Display_Order": 1,
      "Configuration": {
        "title": "What to Expect",
        "bullets": [
          {"icon": "Clock", "text": "Arrive early to find parking"},
          {"icon": "Baby", "text": "Kids programming available"}
        ]
      }
    }
  ]
}
```

---

### 2. `api_Custom_RSVP_Submit_JSON`
**Purpose**: Submit an RSVP with answers and create Event_Participant record.

**Parameters:**
- `@Event_ID INT`
- `@Project_RSVP_ID INT`
- `@Contact_ID INT` (nullable)
- `@First_Name NVARCHAR(50)`
- `@Last_Name NVARCHAR(50)`
- `@Email_Address NVARCHAR(100)`
- `@Phone_Number NVARCHAR(25)`
- `@Answers NVARCHAR(MAX)` (JSON array of answers)

**Answers JSON Format:**
```json
[
  {
    "Question_ID": 1,
    "Numeric_Value": 4
  },
  {
    "Question_ID": 2,
    "Boolean_Value": true
  }
]
```

**Process:**
1. Insert into `Event_RSVPs`
2. Generate `Confirmation_Code`
3. Insert answers into `Event_RSVP_Answers`
4. Create `Event_Participants` record via MP API (use party size from answers)
5. Update `Event_RSVP_ID` with `Event_Participant_ID`
6. Return confirmation data

**Returns:**
```json
{
  "Event_RSVP_ID": 12345,
  "Confirmation_Code": "46739-1201",
  "Event_Participant_ID": 98765,
  "Event": {
    "Event_Title": "Christmas Eve - Troy",
    "Event_Start_Date": "2024-12-24T14:00:00",
    "Congregation_Name": "Troy",
    "Address": "400 E. Long Lake Rd",
    "City": "Troy",
    "State": "MI",
    "Zip": "48085"
  }
}
```

---

## Event Participant Creation

When RSVP is submitted, the stored procedure must call MP's REST API to create an `Event_Participants` record:

**POST to `/api/tables/Event_Participants`**
```json
{
  "Event_ID": 101,
  "Participant_ID": 228155,  // Contact_ID
  "Participation_Status_ID": 2,  // "Registered" or similar
  "Notes": "RSVP from widget",
  "Group_Name": null,
  "Room_ID": null,
  "Domain_ID": 1
}
```

**Handling Party Size:**
- If "How many people?" answer is > 1, create multiple Event_Participants records
- OR create single record with custom field indicating party size
- Store relationship in RSVP answers

---

## Campus-Specific Cards Example

**Scenario**: Troy campus has different parking instructions than other campuses.

**Project_Confirmation_Cards Table:**
| Card_ID | Project_RSVP_ID | Card_Type_ID | Congregation_ID | Configuration |
|---------|----------------|-------------|-----------------|---------------|
| 1 | 1 | 3 (QR Code) | NULL | `{"title": "Check-In Code"}` |
| 2 | 1 | 6 (Parking) | 15 (Troy) | `{"instructions": "Park in the north lot"}` |
| 3 | 1 | 6 (Parking) | 9 (Lake Orion) | `{"instructions": "Park in the main lot"}` |

**Result**:
- All campuses see QR Code card
- Troy users see Troy-specific parking card
- Lake Orion users see Lake Orion-specific parking card

---

## Migration Plan

### Phase 1: Schema Creation
1. Create all new tables
2. Seed `Question_Types` and `Card_Types` lookup tables
3. Add new columns to `Project_Events`

### Phase 2: Sample Data
1. Create a `Project_RSVPs` record for Christmas 2024
2. Add 2 questions (party size, first visit)
3. Add 3 confirmation cards (instructions, map, QR)
4. Link events via `Project_Events` with `Include_In_RSVP = 1`

### Phase 3: Stored Procedures
1. Create `api_Custom_RSVP_Project_Data_JSON`
2. Create `api_Custom_RSVP_Submit_JSON`
3. Test with Postman/Insomnia

### Phase 4: Widget Integration
1. Update TypeScript types
2. Create API routes in Next.js
3. Build dynamic question renderer
4. Build dynamic card renderer
5. Replace mock data with API calls

---

## Security & Permissions

**Page Security:**
- `Project_RSVPs` page - who can create/edit RSVP configs?
- `Event_RSVPs` page - who can view submissions?

**API Security:**
- Widget submission endpoint should be publicly accessible (CORS)
- Admin endpoints require authentication

---

## Indexes for Performance

```sql
-- Event_RSVPs
CREATE INDEX IX_Event_RSVPs_Event_ID ON Event_RSVPs(Event_ID);
CREATE INDEX IX_Event_RSVPs_Contact_ID ON Event_RSVPs(Contact_ID);
CREATE INDEX IX_Event_RSVPs_Project_RSVP_ID ON Event_RSVPs(Project_RSVP_ID);

-- Event_RSVP_Answers
CREATE INDEX IX_Event_RSVP_Answers_Event_RSVP_ID ON Event_RSVP_Answers(Event_RSVP_ID);

-- Project_RSVP_Questions
CREATE INDEX IX_Project_RSVP_Questions_Project_RSVP_ID ON Project_RSVP_Questions(Project_RSVP_ID);

-- Project_Confirmation_Cards
CREATE INDEX IX_Project_Confirmation_Cards_Project_RSVP_ID ON Project_Confirmation_Cards(Project_RSVP_ID);
CREATE INDEX IX_Project_Confirmation_Cards_Congregation_ID ON Project_Confirmation_Cards(Congregation_ID);
```

---

## Future Enhancements

1. **Conditional Questions**: Show Question B only if Question A = X
2. **Question Groups**: Organize related questions
3. **Multi-Language**: Translated question text
4. **A/B Testing**: Test different card configurations
5. **Analytics**: Track completion rates, drop-off points
6. **Waitlist**: Auto-create waitlist when capacity reached
7. **Group RSVPs**: Allow registering multiple people with separate info
