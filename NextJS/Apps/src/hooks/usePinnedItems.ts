import { useState, useEffect, useCallback } from 'react';
import { PinnedItem, PinnedItemType, PinnedItemData } from '@/types/pinnedItems';

export function usePinnedItems() {
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPinnedItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pinned-items');
      if (!response.ok) {
        throw new Error('Failed to fetch pinned items');
      }
      const data = await response.json();
      setPinnedItems(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pinItem = useCallback(async (
    itemType: PinnedItemType,
    itemId: string,
    itemData: PinnedItemData,
    route: string
  ) => {
    try {
      const response = await fetch('/api/pinned-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId, itemData, route }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pin item');
      }

      await fetchPinnedItems();
      return true;
    } catch (err) {
      console.error('Error pinning item:', err);
      throw err;
    }
  }, [fetchPinnedItems]);

  const unpinItem = useCallback(async (itemType: PinnedItemType, itemId: string) => {
    // Store previous state for rollback
    let previousItems: PinnedItem[] = [];

    // Optimistically remove the item from the UI
    setPinnedItems(prevItems => {
      previousItems = prevItems;
      return prevItems.filter(item => !(item.item_type === itemType && item.item_id === itemId));
    });

    try {
      const response = await fetch(
        `/api/pinned-items?itemType=${itemType}&itemId=${encodeURIComponent(itemId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to unpin item');
      }

      return true;
    } catch (err) {
      // Rollback on error - restore the item
      console.error('Error unpinning item:', err);
      setPinnedItems(previousItems);
      throw err;
    }
  }, []);

  const isPinned = useCallback((itemType: PinnedItemType, itemId: string) => {
    return pinnedItems.some(
      item => item.item_type === itemType && item.item_id === itemId
    );
  }, [pinnedItems]);

  useEffect(() => {
    fetchPinnedItems();
  }, [fetchPinnedItems]);

  return {
    pinnedItems,
    isLoading,
    error,
    pinItem,
    unpinItem,
    isPinned,
    refetch: fetchPinnedItems,
  };
}
