"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import { PinnedItemType, PinnedItemData } from "@/types/pinnedItems";
import { usePinnedItems } from "@/hooks/usePinnedItems";

interface PinButtonProps {
  itemType: PinnedItemType;
  itemId: string;
  itemData: PinnedItemData;
  route: string;
  className?: string;
}

export default function PinButton({
  itemType,
  itemId,
  itemData,
  route,
  className = "",
}: PinButtonProps) {
  const { isPinned, pinItem, unpinItem } = usePinnedItems();
  const [isProcessing, setIsProcessing] = useState(false);
  const pinned = isPinned(itemType, itemId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (pinned) {
        await unpinItem(itemType, itemId);
      } else {
        await pinItem(itemType, itemId, itemData, route);
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
        pinned
          ? "bg-[#61bc47]/10 border-[#61bc47]/50 text-[#61bc47] hover:bg-[#61bc47]/20"
          : "bg-card border-border text-muted-foreground hover:border-[#61bc47]/50 hover:text-[#61bc47]"
      } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={pinned ? "Remove from home" : "Add to home"}
    >
      <Home className="w-4 h-4" />
      <span className="text-xs font-medium">
        {pinned ? "pinned" : "home"}
      </span>
    </button>
  );
}
