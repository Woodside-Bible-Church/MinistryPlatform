"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { PinnedItem, PinnedItemType } from "@/types/pinnedItems";

interface PinnedCardWrapperProps {
  item: PinnedItem;
  onUnpin: (itemType: PinnedItemType, itemId: string) => Promise<boolean>;
  children: React.ReactNode;
}

export function PinnedCardWrapper({ item, onUnpin, children }: PinnedCardWrapperProps) {
  const [isUnpinning, setIsUnpinning] = useState(false);

  const handleUnpin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUnpinning) return;

    setIsUnpinning(true);
    try {
      await onUnpin(item.item_type, item.item_id);
    } catch (error) {
      console.error('Failed to unpin item:', error);
      setIsUnpinning(false);
    }
  };

  return (
    <div className="relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <button
        onClick={handleUnpin}
        disabled={isUnpinning}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-card border border-border opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 transition-all"
        title="Unpin from homepage"
        aria-label="Unpin from homepage"
      >
        <X className="w-4 h-4 text-muted-foreground hover:text-red-600 dark:hover:text-red-400" />
      </button>
      <Link href={item.route} className="block">
        {children}
      </Link>
    </div>
  );
}
