"use client";

import { PinnedItem } from "@/types/pinnedItems";
import { Info } from "lucide-react";

interface DefaultPinnedCardProps {
  item: PinnedItem;
}

/**
 * Default fallback card for pinned item types that don't have a specific card component
 */
export function DefaultPinnedCard({ item }: DefaultPinnedCardProps) {
  const { title, subtitle } = item.item_data;

  return (
    <div className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground hover:text-[#61BC47] transition-colors">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground italic">
        Item type: {item.item_type}
      </div>
    </div>
  );
}
