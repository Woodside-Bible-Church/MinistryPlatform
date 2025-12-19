"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import { PinnedItemType, PinnedItemData } from "@/types/pinnedItems";

interface PinButtonProps {
  itemType: PinnedItemType;
  itemId: string;
  itemData: PinnedItemData;
  route: string;
  isPinned: boolean;
  onPin: (itemType: PinnedItemType, itemId: string, itemData: PinnedItemData, route: string) => Promise<boolean>;
  onUnpin: (itemType: PinnedItemType, itemId: string) => Promise<boolean>;
  className?: string;
  iconOnly?: boolean;
}

export default function PinButton({
  itemType,
  itemId,
  itemData,
  route,
  isPinned,
  onPin,
  onUnpin,
  className = "",
  iconOnly = false,
}: PinButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isPinned) {
        await onUnpin(itemType, itemId);
      } else {
        await onPin(itemType, itemId, itemData, route);
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (iconOnly) {
    return (
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
          isPinned
            ? "bg-[#61bc47]/10 border-[#61bc47]/50 text-[#61bc47] hover:bg-[#61bc47]/20"
            : "bg-card border-border text-muted-foreground hover:border-[#61bc47]/50 hover:text-[#61bc47]"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        title={isPinned ? "Remove from home" : "Add to home"}
      >
        <Home className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
        isPinned
          ? "bg-[#61bc47]/10 border-[#61bc47]/50 text-[#61bc47] hover:bg-[#61bc47]/20"
          : "bg-card border-border text-muted-foreground hover:border-[#61bc47]/50 hover:text-[#61bc47]"
      } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={isPinned ? "Remove from home" : "Add to home"}
    >
      <Home className="w-4 h-4" />
      <span className="text-xs font-medium">
        {isPinned ? "pinned" : "home"}
      </span>
    </button>
  );
}
