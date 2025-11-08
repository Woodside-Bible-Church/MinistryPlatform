# RSVP Custom Questions Schema

## Overview

This document outlines the database schema for supporting customizable RSVP questions per project/event series. Each project (e.g., Christmas Services, Easter, VBS) can have its own set of custom questions beyond the standard contact information.

## Database Tables

### 1. `Project_RSVP_Questions`
Defines the custom questions available for a specific project.

| Column | Type | Description |
|--------|------|-------------|
| `Project_RSVP_Question_ID` | INT | Primary Key |
| `Project_RSVP_ID` | INT | Foreign Key to Project_RSVPs |
| `Question_Text` | NVARCHAR(500) | The question to display (e.g., "How many people?") |
| `Question_Type_ID` | INT | Foreign Key to Question_Types |
| `Field_Order` | INT | Display order (1, 2, 3...) |
| `Is_Required` | BIT | Whether answer is required |
| `Helper_Text` | NVARCHAR(500) | Optional help text shown below question |
| `Min_Value` | INT | Minimum value for numeric types (NULL if not applicable) |
| `Max_Value` | INT | Maximum value for numeric types (NULL if not applicable) |
| `Default_Value` | NVARCHAR(255) | Default value/text |
| `Active` | BIT | Whether question is currently active |

### 2. `Question_Types` (Lookup Table)
Defines the available question field types.

| Question_Type_ID | Question_Type | Description | UI Component |
|-----------------|---------------|-------------|--------------|
| 1 | Counter | Numeric counter with +/- buttons | Plus/Minus buttons + number input |
| 2 | Checkbox | Single yes/no checkbox | Checkbox with label |
| 3 | Text | Short text input | Text input field |
| 4 | Textarea | Long text input | Textarea field |
| 5 | Dropdown | Single selection from list | Select dropdown |
| 6 | Radio | Single selection from visible options | Radio buttons |
| 7 | Multi-Checkbox | Multiple selection checkboxes | Checkbox group |
| 8 | Date | Date picker | Date input |
| 9 | Time | Time picker | Time input |
| 10 | Email | Email input with validation | Email input field |
| 11 | Phone | Phone number with formatting | Phone input field |
| 12 | Searchable Dropdown | Single selection with search/filter | Combobox with search input |
| 13 | Multi-Select Dropdown | Multiple selection with search/filter | Multi-select combobox with chips |
| 14 | Tag Input | Multiple free-text tags | Input with tag chips |
| 15 | Button Group | Single selection from button group | Segmented buttons |
| 16 | Multi-Button Group | Multiple selection from button group | Toggle buttons |
| 17 | Slider | Numeric value via slider | Range slider |
| 18 | Rating | Star/numeric rating | Star rating component |
| 19 | File Upload | Upload files/images | File input with preview |
| 20 | Color Picker | Select a color | Color picker |

### 3. `Question_Options`
For questions that need predefined options (dropdown, radio, multi-checkbox).

| Column | Type | Description |
|--------|------|-------------|
| `Question_Option_ID` | INT | Primary Key |
| `Project_RSVP_Question_ID` | INT | Foreign Key to Project_RSVP_Questions |
| `Option_Text` | NVARCHAR(255) | Display text for option |
| `Option_Value` | NVARCHAR(255) | Stored value (can be different from display text) |
| `Display_Order` | INT | Order to show options |

### 4. `Event_RSVP_Answers`
Stores the actual answers submitted by users.

| Column | Type | Description |
|--------|------|-------------|
| `Event_RSVP_Answer_ID` | INT | Primary Key |
| `Event_RSVP_ID` | INT | Foreign Key to Event_RSVPs (the submitted RSVP) |
| `Project_RSVP_Question_ID` | INT | Foreign Key to Project_RSVP_Questions |
| `Answer_Text` | NVARCHAR(MAX) | Text answer or JSON for complex types |
| `Answer_Numeric` | INT | Numeric answer (for counter, etc.) |
| `Answer_Boolean` | BIT | Boolean answer (for checkbox) |
| `Answer_Date` | DATETIME | Date/time answer |

---

## Example: Christmas Services 2024

### Questions Configuration

**Project_RSVP_Questions Table:**

| Question_ID | Project_RSVP_ID | Question_Text | Question_Type_ID | Field_Order | Is_Required | Helper_Text | Min_Value | Max_Value | Default_Value |
|------------|----------------|---------------|-----------------|------------|-------------|-------------|-----------|-----------|---------------|
| 1 | 1 | How many people? | 1 (Counter) | 1 | TRUE | NULL | 1 | 99 | 1 |
| 2 | 1 | This is my first visit to Woodside | 2 (Checkbox) | 2 | FALSE | We'd love to help you find your way and make you feel welcome. | NULL | NULL | false |

### UI Rendering

**Question 1 - Counter Type:**
```tsx
<div className="space-y-2">
  <Label>How many people? *</Label>
  <div className="flex items-center gap-4">
    <button>-</button>
    <input type="number" min={1} max={99} value={count} />
    <button>+</button>
  </div>
</div>
```

**Question 2 - Checkbox Type:**
```tsx
<div className="flex items-start space-x-3">
  <Checkbox id="q2" />
  <div>
    <Label>This is my first visit to Woodside</Label>
    <p className="text-sm text-muted">We'd love to help you find your way...</p>
  </div>
</div>
```

---

## Example: Easter Services 2025

Different questions for a different event:

| Question_ID | Project_RSVP_ID | Question_Text | Question_Type_ID | Field_Order | Is_Required |
|------------|----------------|---------------|-----------------|------------|-------------|
| 10 | 2 | How many adults? | 1 (Counter) | 1 | TRUE |
| 11 | 2 | How many children? | 1 (Counter) | 2 | TRUE |
| 12 | 2 | Will you need childcare? | 2 (Checkbox) | 3 | FALSE |
| 13 | 2 | Which service style do you prefer? | 5 (Dropdown) | 4 | FALSE |

**Question_Options for Question 13:**

| Option_ID | Project_RSVP_Question_ID | Option_Text | Option_Value | Display_Order |
|-----------|-------------------------|-------------|--------------|---------------|
| 1 | 13 | Traditional | traditional | 1 |
| 2 | 13 | Contemporary | contemporary | 2 |
| 3 | 13 | Blended | blended | 3 |
| 4 | 13 | No Preference | none | 4 |

---

## Example: Vacation Bible School (VBS) 2025

Advanced question types for a complex event:

| Question_ID | Project_RSVP_ID | Question_Text | Question_Type_ID | Field_Order | Is_Required |
|------------|----------------|---------------|-----------------|------------|-------------|
| 20 | 3 | Select your child's campus | 12 (Searchable Dropdown) | 1 | TRUE |
| 21 | 3 | Which age groups are you registering? | 13 (Multi-Select Dropdown) | 2 | TRUE |
| 22 | 3 | Any allergies or dietary restrictions? | 14 (Tag Input) | 3 | FALSE |
| 23 | 3 | T-shirt size | 15 (Button Group) | 4 | TRUE |
| 24 | 3 | Which activities interest your child? | 16 (Multi-Button Group) | 5 | FALSE |
| 25 | 3 | Child's grade level (K-6) | 17 (Slider) | 6 | TRUE |

**Question_Options for Question 20 (Searchable Dropdown):**

| Option_ID | Question_ID | Option_Text | Option_Value |
|-----------|------------|-------------|--------------|
| 1 | 20 | Troy Campus | 15 |
| 2 | 20 | Lake Orion Campus | 9 |
| 3 | 20 | Royal Oak Campus | 14 |
| 4 | 20 | Warren Campus | 16 |
| ... | ... | (all 14 campuses) | ... |

**Question_Options for Question 21 (Multi-Select Dropdown):**

| Option_ID | Question_ID | Option_Text | Option_Value |
|-----------|------------|-------------|--------------|
| 1 | 21 | Preschool (3-4 years) | preschool |
| 2 | 21 | Kindergarten | kindergarten |
| 3 | 21 | 1st-2nd Grade | grade_1_2 |
| 4 | 21 | 3rd-4th Grade | grade_3_4 |
| 5 | 21 | 5th-6th Grade | grade_5_6 |

**Question_Options for Question 23 (Button Group):**

| Option_ID | Question_ID | Option_Text | Option_Value |
|-----------|------------|-------------|--------------|
| 1 | 23 | Youth S | YS |
| 2 | 23 | Youth M | YM |
| 3 | 23 | Youth L | YL |
| 4 | 23 | Adult S | AS |
| 5 | 23 | Adult M | AM |
| 6 | 23 | Adult L | AL |
| 7 | 23 | Adult XL | AXL |

**Question_Options for Question 24 (Multi-Button Group):**

| Option_ID | Question_ID | Option_Text | Option_Value |
|-----------|------------|-------------|--------------|
| 1 | 24 | Music 🎵 | music |
| 2 | 24 | Arts & Crafts 🎨 | arts |
| 3 | 24 | Sports ⚽ | sports |
| 4 | 24 | Science 🔬 | science |
| 5 | 24 | Drama 🎭 | drama |
| 6 | 24 | Games 🎮 | games |

---

## Implementation Notes

### Question Type Mapping

Each `Question_Type_ID` maps to a specific React component:

```typescript
const QuestionComponents = {
  1: CounterQuestion,           // +/- buttons with number input
  2: CheckboxQuestion,          // Single checkbox with label
  3: TextQuestion,              // Short text input
  4: TextareaQuestion,          // Long text area
  5: DropdownQuestion,          // Select dropdown
  6: RadioQuestion,             // Radio button group
  7: MultiCheckboxQuestion,     // Multiple checkboxes
  8: DateQuestion,              // Date picker
  9: TimeQuestion,              // Time picker
  10: EmailQuestion,            // Email input with validation
  11: PhoneQuestion,            // Phone input with formatting
  12: SearchableDropdownQuestion,  // Combobox with search
  13: MultiSelectDropdownQuestion, // Multi-select combobox with chips
  14: TagInputQuestion,         // Free-text tag input
  15: ButtonGroupQuestion,      // Segmented button selection
  16: MultiButtonGroupQuestion, // Multiple toggle buttons
  17: SliderQuestion,           // Range slider
  18: RatingQuestion,           // Star rating
  19: FileUploadQuestion,       // File/image upload
  20: ColorPickerQuestion,      // Color selection
};
```

### Validation

- `Is_Required`: Form validation fails if field is empty
- `Min_Value` / `Max_Value`: Enforce numeric ranges (Counter type)
- Question-specific validation based on type (email format, phone format, etc.)

### Answer Storage

Different answer types use different columns in `Event_RSVP_Answers`:

- **Counter, Dropdown (numeric)**: `Answer_Numeric`
- **Text, Textarea, Dropdown (text)**: `Answer_Text`
- **Checkbox**: `Answer_Boolean`
- **Date, Time**: `Answer_Date`
- **Multi-Checkbox, Complex types**: `Answer_Text` as JSON

---

## API Structure

### Get Questions for Project

```
GET /api/projects/{projectRsvpId}/questions
```

Response:
```json
{
  "questions": [
    {
      "questionId": 1,
      "questionText": "How many people?",
      "questionType": "counter",
      "fieldOrder": 1,
      "isRequired": true,
      "helperText": null,
      "minValue": 1,
      "maxValue": 99,
      "defaultValue": "1",
      "options": []
    },
    {
      "questionId": 2,
      "questionText": "This is my first visit to Woodside",
      "questionType": "checkbox",
      "fieldOrder": 2,
      "isRequired": false,
      "helperText": "We'd love to help you find your way and make you feel welcome.",
      "minValue": null,
      "maxValue": null,
      "defaultValue": "false",
      "options": []
    }
  ]
}
```

### Submit RSVP with Answers

```
POST /api/rsvps
```

Request:
```json
{
  "eventId": 101,
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john@example.com",
  "phoneNumber": "(810) 555-1234",
  "answers": [
    {
      "questionId": 1,
      "numericValue": 4
    },
    {
      "questionId": 2,
      "booleanValue": true
    }
  ]
}
```

---

## Migration Path

1. **Phase 1 (Current)**: Hardcoded "How many people?" and "First visit" questions
2. **Phase 2**: Create database tables and seed with Christmas 2024 questions
3. **Phase 3**: Update widget to fetch questions dynamically from API
4. **Phase 4**: Build admin UI for creating/editing questions per project

---

## Benefits

✅ **Flexibility**: Each event can have unique questions
✅ **No Code Changes**: Add new questions without deploying widget
✅ **Reusability**: Copy questions between similar events
✅ **Data Collection**: Gather specific information needed per event
✅ **Reporting**: Query answers for insights (e.g., "How many first-time visitors?")

---

## Future Enhancements

- **Conditional Logic**: Show Question B only if Question A = X
- **Question Groups**: Organize related questions (e.g., "Adult Info", "Child Info")
- **Multi-Language**: Support translated question text
- **Answer Validation Rules**: Regex patterns, custom validation
- **Question Templates**: Pre-built sets of common questions

---

## UI Component Examples

### Type 12: Searchable Dropdown

**Use Case**: Selecting from a large list (e.g., all 14 campuses, cities, countries)

```tsx
<Combobox>
  <ComboboxTrigger>
    <ComboboxInput placeholder="Search campuses..." />
  </ComboboxTrigger>
  <ComboboxContent>
    <ComboboxEmpty>No campus found.</ComboboxEmpty>
    {filteredOptions.map(option => (
      <ComboboxItem key={option.value} value={option.value}>
        {option.text}
      </ComboboxItem>
    ))}
  </ComboboxContent>
</Combobox>
```

**Features**:
- Live search/filter as user types
- Keyboard navigation (arrow keys, enter to select)
- Shows "No results" when filter returns nothing
- Mobile-friendly with virtual scrolling for long lists

---

### Type 13: Multi-Select Dropdown

**Use Case**: Selecting multiple items from a list (e.g., age groups, interests, dietary restrictions)

```tsx
<MultiSelect value={selected} onValueChange={setSelected}>
  <MultiSelectTrigger>
    <MultiSelectValue>
      {selected.length > 0
        ? `${selected.length} selected`
        : "Select age groups..."}
    </MultiSelectValue>
  </MultiSelectTrigger>
  <MultiSelectContent>
    <MultiSelectSearch placeholder="Search..." />
    {options.map(option => (
      <MultiSelectItem key={option.value} value={option.value}>
        <Checkbox checked={selected.includes(option.value)} />
        {option.text}
      </MultiSelectItem>
    ))}
  </MultiSelectContent>
</MultiSelect>

{/* Selected items as chips */}
<div className="flex flex-wrap gap-2 mt-2">
  {selected.map(value => (
    <Chip key={value} onRemove={() => removeItem(value)}>
      {getOptionText(value)}
    </Chip>
  ))}
</div>
```

**Features**:
- Search/filter within dropdown
- Checkboxes show selected state
- Selected items displayed as removable chips below
- "X selected" summary in trigger
- Clear all button

**Stored Value**: JSON array `["preschool", "kindergarten", "grade_1_2"]`

---

### Type 14: Tag Input

**Use Case**: Free-text multiple entries (e.g., allergies, interests, skills)

```tsx
<TagInput>
  <TagInputField
    placeholder="Type and press Enter..."
    value={inputValue}
    onChange={setInputValue}
    onKeyDown={(e) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        addTag(inputValue.trim());
        setInputValue('');
      }
    }}
  />
  <div className="flex flex-wrap gap-2 mt-2">
    {tags.map(tag => (
      <Tag key={tag} onRemove={() => removeTag(tag)}>
        {tag}
      </Tag>
    ))}
  </div>
</TagInput>
```

**Features**:
- Type text and press Enter to add
- Paste comma-separated values to add multiple
- Click X on tag to remove
- Auto-complete suggestions (optional)
- Duplicate prevention

**Stored Value**: JSON array `["peanuts", "dairy", "shellfish"]`

---

### Type 15: Button Group (Single Selection)

**Use Case**: Single choice from 3-8 options (e.g., T-shirt size, service style, difficulty level)

```tsx
<ToggleGroup type="single" value={selected} onValueChange={setSelected}>
  <ToggleGroupItem value="YS">Youth S</ToggleGroupItem>
  <ToggleGroupItem value="YM">Youth M</ToggleGroupItem>
  <ToggleGroupItem value="YL">Youth L</ToggleGroupItem>
  <ToggleGroupItem value="AS">Adult S</ToggleGroupItem>
  <ToggleGroupItem value="AM">Adult M</ToggleGroupItem>
  <ToggleGroupItem value="AL">Adult L</ToggleGroupItem>
  <ToggleGroupItem value="AXL">Adult XL</ToggleGroupItem>
</ToggleGroup>
```

**Features**:
- iOS-style segmented control on desktop
- Stacked buttons on mobile
- Visual highlight on selected button
- One selection at a time
- Better UX than dropdown for < 8 options

**Stored Value**: String `"AM"`

---

### Type 16: Multi-Button Group (Multiple Selection)

**Use Case**: Multiple choices from visible options (e.g., activities, preferences, features)

```tsx
<ToggleGroup type="multiple" value={selected} onValueChange={setSelected}>
  <ToggleGroupItem value="music">
    🎵 Music
  </ToggleGroupItem>
  <ToggleGroupItem value="arts">
    🎨 Arts & Crafts
  </ToggleGroupItem>
  <ToggleGroupItem value="sports">
    ⚽ Sports
  </ToggleGroupItem>
  <ToggleGroupItem value="science">
    🔬 Science
  </ToggleGroupItem>
  <ToggleGroupItem value="drama">
    🎭 Drama
  </ToggleGroupItem>
  <ToggleGroupItem value="games">
    🎮 Games
  </ToggleGroupItem>
</ToggleGroup>
```

**Features**:
- Toggle multiple buttons on/off
- Visual state for each (selected vs unselected)
- Icons/emojis for visual appeal
- Responsive grid layout
- Can select none, some, or all

**Stored Value**: JSON array `["music", "sports", "games"]`

---

### Type 17: Slider

**Use Case**: Selecting numeric value from range (e.g., age, grade level, satisfaction rating)

```tsx
<div className="space-y-4">
  <Slider
    min={0}
    max={6}
    step={1}
    value={[grade]}
    onValueChange={([val]) => setGrade(val)}
  />
  <div className="flex justify-between text-sm text-muted-foreground">
    <span>Kindergarten</span>
    <span className="font-bold text-lg">{gradeLabels[grade]}</span>
    <span>6th Grade</span>
  </div>
</div>
```

**Features**:
- Touch-friendly slider handle
- Show current value above handle
- Min/max labels on ends
- Snap to steps
- Visual track showing selection

**Stored Value**: Integer `3` (for 3rd grade)

---

### Type 18: Rating

**Use Case**: Star ratings, satisfaction scores, experience ratings

```tsx
<div className="flex items-center gap-2">
  {[1, 2, 3, 4, 5].map(star => (
    <button
      key={star}
      type="button"
      onClick={() => setRating(star)}
      className="transition-all hover:scale-110"
    >
      <Star
        className={`w-10 h-10 ${
          star <= rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    </button>
  ))}
  <span className="ml-2 text-sm text-muted-foreground">
    {ratingLabels[rating]}
  </span>
</div>
```

**Features**:
- 1-5 star rating (configurable max)
- Hover preview
- Labels for ratings (e.g., 1="Poor", 5="Excellent")
- Half-star support (optional)
- Can be styled as hearts, thumbs, etc.

**Stored Value**: Integer `4`

---

### Type 19: File Upload

**Use Case**: Uploading documents, images, medical forms

```tsx
<FileUpload
  accept="image/*,.pdf"
  maxSize={5 * 1024 * 1024} // 5MB
  onUpload={handleUpload}
>
  <FileUploadTrigger>
    <Upload className="w-4 h-4 mr-2" />
    Choose file or drag here
  </FileUploadTrigger>
  {file && (
    <FileUploadPreview>
      {file.type.startsWith('image/') && (
        <img src={URL.createObjectURL(file)} alt="Preview" />
      )}
      <div>{file.name} ({formatBytes(file.size)})</div>
      <Button variant="ghost" onClick={removeFile}>Remove</Button>
    </FileUploadPreview>
  )}
</FileUpload>
```

**Features**:
- Drag & drop support
- File type restrictions
- File size validation
- Image preview
- Progress indicator during upload
- Multiple file support (optional)

**Stored Value**: JSON `{"url": "https://...", "filename": "form.pdf", "size": 1024}`

---

### Type 20: Color Picker

**Use Case**: Selecting team colors, theme preferences, custom branding

```tsx
<Popover>
  <PopoverTrigger>
    <div className="flex items-center gap-2 p-2 border rounded">
      <div
        className="w-10 h-10 rounded border"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono">{color}</span>
    </div>
  </PopoverTrigger>
  <PopoverContent>
    <HexColorPicker color={color} onChange={setColor} />
    <div className="mt-4 grid grid-cols-6 gap-2">
      {presetColors.map(preset => (
        <button
          key={preset}
          className="w-8 h-8 rounded border"
          style={{ backgroundColor: preset }}
          onClick={() => setColor(preset)}
        />
      ))}
    </div>
  </PopoverContent>
</Popover>
```

**Features**:
- Visual color picker
- Hex color input
- Preset color swatches
- Color preview
- Alpha/transparency support (optional)

**Stored Value**: String `"#61BC47"` (hex color)

---

## Answer Storage Strategy

| Question Type | Storage Column | Example Value |
|--------------|----------------|---------------|
| Counter, Slider, Rating | `Answer_Numeric` | `4` |
| Text, Textarea, Email, Phone | `Answer_Text` | `"john@example.com"` |
| Checkbox | `Answer_Boolean` | `true` |
| Date, Time | `Answer_Date` | `2025-12-24T14:00:00` |
| Dropdown, Radio, Button Group | `Answer_Text` | `"contemporary"` |
| Multi-Select, Multi-Checkbox, Tags, Multi-Button | `Answer_Text` (JSON) | `["music","sports"]` |
| Searchable Dropdown | `Answer_Text` | `"9"` (congregation_id) |
| File Upload | `Answer_Text` (JSON) | `{"url":"...","name":"..."}` |
| Color Picker | `Answer_Text` | `"#61BC47"` |
