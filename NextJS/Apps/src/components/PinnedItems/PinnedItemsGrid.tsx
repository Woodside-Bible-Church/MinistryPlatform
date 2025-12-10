"use client";

import { PinnedItem, PinnedItemType } from "@/types/pinnedItems";

interface PinnedItemsGridProps<T extends PinnedItem> {
  items: T[];
  isLoading: boolean;
  onUnpin: (itemType: PinnedItemType, itemId: string) => Promise<boolean>;
  renderCard: (item: T, onUnpin: PinnedItemsGridProps<T>['onUnpin']) => React.ReactNode;
  className?: string;
}

export function PinnedItemsGrid<T extends PinnedItem>({
  items,
  isLoading,
  onUnpin,
  renderCard,
  className = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
}: PinnedItemsGridProps<T>) {
  return (
    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
      !isLoading && items.length > 0
        ? 'max-h-[2000px] opacity-100'
        : 'max-h-0 opacity-0'
    }`}>
      {!isLoading && items.length > 0 && (
        <div className="pt-8 pb-6">
          <div className={`grid ${className} gap-6 mb-8 transition-all duration-300`}>
            {items.map((item) => (
              <div key={item.user_pinned_item_id}>
                {renderCard(item, onUnpin)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
