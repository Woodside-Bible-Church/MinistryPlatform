/**
 * PinnedItems Component Library
 *
 * A flexible, extensible system for displaying pinned items on the homepage.
 *
 * Usage:
 * ```tsx
 * import { PinnedItemsGrid, PinnedCardWrapper, getPinnedCardComponent } from '@/components/PinnedItems';
 *
 * <PinnedItemsGrid
 *   items={pinnedItems}
 *   isLoading={isLoading}
 *   onUnpin={unpinItem}
 *   renderCard={(item, onUnpin) => {
 *     const CardContent = getPinnedCardComponent(item.item_type);
 *     return (
 *       <PinnedCardWrapper item={item} onUnpin={onUnpin}>
 *         <CardContent item={item} />
 *       </PinnedCardWrapper>
 *     );
 *   }}
 * />
 * ```
 */

export { PinnedItemsGrid } from './PinnedItemsGrid';
export { PinnedCardWrapper } from './PinnedCardWrapper';
export {
  getPinnedCardComponent,
  registerPinnedCardComponent,
  getRegisteredItemTypes,
  type PinnedCardComponent
} from './cardRegistry';

// Export card components for direct use if needed
export { BudgetPinnedCard } from './cards/BudgetPinnedCard';
export { DefaultPinnedCard } from './cards/DefaultPinnedCard';
