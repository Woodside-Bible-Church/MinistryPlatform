# MPNext
NextJS Application Integrated with MP Authentication and REST API

## Toast Notifications with Sonner

This template includes **[Sonner](https://sonner.emilkowal.ski/)**, a beautiful and accessible toast notification library. The `<Toaster />` component is already set up in the main app layout.

### Basic Usage

```typescript
import { toast } from "sonner";

// Simple success message
toast.success("Data saved successfully!");

// Error message
toast.error("Failed to save data");

// Info message
toast.info("Processing your request...");

// Warning message
toast.warning("This action cannot be undone");

// Basic message
toast("Hello World");
```

### Advanced Usage

#### Toast with Action Button
```typescript
toast("Event created", {
  action: {
    label: "View",
    onClick: () => router.push("/events/123"),
  },
});
```

#### Promise-based Toast (Automatic Loading/Success/Error)
```typescript
toast.promise(
  fetch("/api/data").then((res) => res.json()),
  {
    loading: "Saving data...",
    success: "Data saved successfully!",
    error: "Failed to save data",
  }
);
```

#### Custom Duration
```typescript
toast.success("Quick message", { duration: 2000 }); // 2 seconds
toast("Persistent message", { duration: Infinity }); // Stays until dismissed
```

#### Rich Content with Description
```typescript
toast("New message received", {
  description: "John Doe sent you a message at 2:30 PM",
});
```

### Optimistic UI Pattern

Use toast notifications with optimistic updates for the best UX:

```typescript
async function handleCreate() {
  // 1. Close modal immediately
  setIsModalOpen(false);

  // 2. Optimistically update UI
  const tempItem = { id: `temp-${Date.now()}`, ...newData };
  setItems([...items, tempItem]);

  // 3. Make API call with automatic toast states
  toast.promise(
    (async () => {
      const response = await fetch("/api/items", {
        method: "POST",
        body: JSON.stringify(newData),
      });

      if (!response.ok) throw new Error("Failed to create item");

      const created = await response.json();

      // Replace temp item with real data
      setItems(items.map(i => i.id === tempItem.id ? created : i));

      return created.name; // Return value used in success message
    })(),
    {
      loading: "Creating item...",
      success: (name) => `${name} created successfully`,
      error: (err) => {
        // Revert optimistic update on error
        setItems(items.filter(i => i.id !== tempItem.id));
        return err.message;
      },
    }
  );
}
```

### Configuration

The `<Toaster />` is configured in `src/app/(app)/layout.tsx` with:

```typescript
<Toaster
  position="top-right"  // Toast appears in top-right corner
  richColors            // Enables color-coded toasts (green=success, red=error, etc.)
/>
```

Available positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`

### Best Practices

1. **Toasts are supplementary, not primary feedback** - Always provide micro-interactions on the UI element itself (loading spinners, highlights, checkmarks) while the toast provides confirmation in peripheral vision
2. **Stack toasts for rapid actions** - Sonner stacks toasts by default, so users don't have to wait for one to finish
3. **Replace `alert()` calls** - Use `toast.error()` or `toast.warning()` instead of browser alerts
4. **Use toast.promise for async operations** - Automatically handles loading, success, and error states
5. **Implement optimistic UI** - Update UI immediately, show toast for async confirmation
6. **Keep messages concise** - Use the `description` field for additional details
7. **Return meaningful data** - When using `toast.promise()`, return data from the promise to use in success messages

### More Examples

```typescript
// Dismiss a specific toast
const toastId = toast("Processing...");
// Later:
toast.dismiss(toastId);

// Dismiss all toasts
toast.dismiss();

// Custom styling
toast.success("Saved!", {
  className: "my-custom-class",
  style: { background: "green" },
});

// Position override for specific toast
toast("Important!", { position: "top-center" });
```

For complete documentation, visit [sonner.emilkowal.ski](https://sonner.emilkowal.ski/)
