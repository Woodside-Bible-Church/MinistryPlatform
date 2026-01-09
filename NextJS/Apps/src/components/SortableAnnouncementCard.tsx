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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all ${
        isProcessing ? "opacity-50 scale-[0.98] pointer-events-none" : ""
      } ${isDragging ? "z-50 shadow-2xl cursor-grabbing" : "cursor-grab"}`}
      {...attributes}
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing [&_button]:cursor-pointer [&_a]:cursor-pointer"
        onPointerDown={(e) => {
          // Prevent drag from starting when clicking on buttons or links
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) {
            e.stopPropagation();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
