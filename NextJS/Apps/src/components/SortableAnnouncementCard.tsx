import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";

interface SortableAnnouncementCardProps {
  id: number;
  children: ReactNode;
  isProcessing?: boolean;
}

export function SortableAnnouncementCard({
  id,
  children,
  isProcessing = false,
}: SortableAnnouncementCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    // Disable dragging when clicking on buttons or links
    disabled: isProcessing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Create listeners that filter out button/link clicks
  const filteredListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      // Don't start drag if clicking on interactive elements
      if (target.closest('button') || target.closest('a') || target.closest('input')) {
        return;
      }
      // Call the original listener
      listeners?.onPointerDown?.(e as any);
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing ${
        isProcessing ? "opacity-50 scale-[0.98] pointer-events-none" : ""
      } ${isDragging ? "z-50 shadow-2xl !cursor-grabbing" : ""}`}
      {...attributes}
      {...filteredListeners}
    >
      {children}
    </div>
  );
}
