# PinnedItems Component Library

A flexible, extensible system for displaying pinned items on the homepage with support for multiple item types and custom card layouts.

## Features

- **Type-Safe**: Full TypeScript support with generic types
- **Extensible**: Easy to add new card types through registry pattern
- **Reusable**: Separates concerns between layout, behavior, and presentation
- **Consistent UX**: Shared wrapper provides uniform unpin behavior
- **Optimistic UI**: Immediate visual feedback when pinning/unpinning

## Architecture

### Component Hierarchy

```
PinnedItemsGrid
├── PinnedCardWrapper (per item)
│   └── [CardComponent] (type-specific)
│       └── Card Content
```

### Core Components

#### 1. `PinnedItemsGrid`
The container component that handles layout and animations.

**Props:**
- `items: T[]` - Array of pinned items
- `isLoading: boolean` - Loading state
- `onUnpin: (itemType, itemId) => Promise<boolean>` - Unpin callback
- `renderCard: (item, onUnpin) => ReactNode` - Render function for each card
- `className?: string` - Grid layout classes (default: `"grid-cols-1 md:grid-cols-2 lg:grid-cols-3"`)

#### 2. `PinnedCardWrapper`
Base wrapper that provides consistent card styling and unpin functionality.

**Props:**
- `item: PinnedItem` - The pinned item data
- `onUnpin: (itemType, itemId) => Promise<boolean>` - Unpin callback
- `children: ReactNode` - The card content

#### 3. Card Components
Type-specific components that render the content for each item type:
- `BudgetPinnedCard` - Displays project budget information
- `DefaultPinnedCard` - Fallback for unknown item types

### Card Registry

The `cardRegistry.ts` file maps item types to their card components:

```typescript
const CARD_COMPONENTS: Partial<Record<PinnedItemType, PinnedCardComponent>> = {
  'project': BudgetPinnedCard,
  // Add more types here
};
```

## Usage

### Basic Usage

```tsx
import {
  PinnedItemsGrid,
  PinnedCardWrapper,
  getPinnedCardComponent
} from '@/components/PinnedItems';
import { usePinnedItems } from '@/hooks/usePinnedItems';

export default function HomePage() {
  const { pinnedItems, isLoading, unpinItem } = usePinnedItems();

  return (
    <PinnedItemsGrid
      items={pinnedItems}
      isLoading={isLoading}
      onUnpin={unpinItem}
      renderCard={(item, onUnpin) => {
        const CardContent = getPinnedCardComponent(item.item_type);
        return (
          <PinnedCardWrapper item={item} onUnpin={onUnpin}>
            <CardContent item={item} />
          </PinnedCardWrapper>
        );
      }}
    />
  );
}
```

### Custom Grid Layout

```tsx
<PinnedItemsGrid
  items={pinnedItems}
  isLoading={isLoading}
  onUnpin={unpinItem}
  className="grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
  renderCard={...}
/>
```

## Adding New Card Types

### Step 1: Create the Card Component

Create a new file in `src/components/PinnedItems/cards/`:

```tsx
// src/components/PinnedItems/cards/EventPinnedCard.tsx
"use client";

import { PinnedItem } from "@/types/pinnedItems";
import { Calendar } from "lucide-react";

interface EventPinnedCardProps {
  item: PinnedItem;
}

export function EventPinnedCard({ item }: EventPinnedCardProps) {
  const { title, subtitle, date, attendees } = item.item_data;

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">
        {title}
      </h2>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Calendar className="w-4 h-4" />
        <span>{date}</span>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm">
          {attendees} attendees
        </p>
      </div>
    </div>
  );
}
```

### Step 2: Register the Card Component

Add it to `cardRegistry.ts`:

```tsx
import { EventPinnedCard } from './cards/EventPinnedCard';

const CARD_COMPONENTS: Partial<Record<PinnedItemType, PinnedCardComponent>> = {
  'project': BudgetPinnedCard,
  'event': EventPinnedCard,  // Add your new type
};
```

### Step 3: Update Type Definitions (if needed)

If you're adding a new `PinnedItemType`, update `src/types/pinnedItems.ts`:

```tsx
export type PinnedItemType =
  | 'project'
  | 'event'     // Add new type
  | 'person'
  | 'group';
```

That's it! The new card type will automatically be used when rendering pinned items of that type.

## Dynamic Registration

You can also register card components at runtime:

```tsx
import { registerPinnedCardComponent } from '@/components/PinnedItems';
import { MyCustomCard } from './MyCustomCard';

registerPinnedCardComponent('custom-type', MyCustomCard);
```

## API Reference

### `getPinnedCardComponent(itemType: PinnedItemType): PinnedCardComponent`
Get the card component for a given item type. Returns `DefaultPinnedCard` if no specific component is registered.

### `registerPinnedCardComponent(itemType: PinnedItemType, component: PinnedCardComponent): void`
Register a new card component for a specific item type at runtime.

### `getRegisteredItemTypes(): PinnedItemType[]`
Get an array of all registered item types.

## Styling

All components use Tailwind CSS with the project's design tokens:

- **Brand Color**: `#61BC47` (Woodside green)
- **Dark Mode**: Fully supported with `dark:` variants
- **Transitions**: Smooth animations for hover, collapse, and removal states

### Common Classes

- Card wrapper: `bg-card border border-border rounded-lg`
- Hover effects: `hover:shadow-lg transition-all duration-300`
- Text colors: `text-foreground`, `text-muted-foreground`
- Brand color: `text-[#61BC47]`, `bg-[#61bc47]`

## Best Practices

1. **Keep Cards Simple**: Card components should only handle presentation, not data fetching or business logic
2. **Use Consistent Spacing**: Follow the existing padding/margin patterns (e.g., `p-6` for card padding)
3. **Support Dark Mode**: Always include `dark:` variants for colors
4. **Provide Fallbacks**: Handle missing data gracefully (e.g., optional stats)
5. **Use Semantic HTML**: Proper heading levels, ARIA labels where needed

## Troubleshooting

### Card Not Appearing
- Check that the item type is registered in `cardRegistry.ts`
- Verify the `item_data` structure matches what your card expects
- Look for console errors in the browser

### Unpin Not Working
- Ensure `onUnpin` is properly passed from parent to `PinnedCardWrapper`
- Check that the API endpoint `/api/pinned-items` is working
- Verify optimistic update logic in `usePinnedItems` hook

### Styling Issues
- Make sure you're using the project's Tailwind configuration
- Check for conflicting CSS classes
- Verify dark mode classes are included
