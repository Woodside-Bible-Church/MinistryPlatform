import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode, useState, useEffect } from "react";

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
  const [showHint, setShowHint] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

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

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) clearTimeout(hoverTimer);
    };
  }, [hoverTimer]);

  const handleMouseEnter = () => {
    // Show hint after hovering for 500ms
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 500);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowHint(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Get cursor position relative to the card
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Drag Hint - Follows cursor position */}
      {(showHint || isDragging) && !isProcessing && (
        <div
          className="absolute text-foreground text-xs font-medium pointer-events-none z-10 whitespace-nowrap opacity-60"
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y + 20}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {isDragging ? "Repositioning..." : "Drag to reorder"}
        </div>
      )}

      {children}
    </div>
  );
}
