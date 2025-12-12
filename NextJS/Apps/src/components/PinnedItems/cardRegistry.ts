import { PinnedItemType, PinnedItem } from '@/types/pinnedItems';
import { BudgetPinnedCard } from './cards/BudgetPinnedCard';
import { PurchaseRequestsApprovalPinnedCard } from './cards/PurchaseRequestsApprovalPinnedCard';
import { DefaultPinnedCard } from './cards/DefaultPinnedCard';

/**
 * Type for a card component that can render a pinned item
 */
export type PinnedCardComponent = React.ComponentType<{ item: PinnedItem }>;

/**
 * Registry mapping item types to their specific card components
 * To add a new card type:
 * 1. Create a new card component in ./cards/
 * 2. Import it here
 * 3. Add it to the CARD_COMPONENTS object
 */
const CARD_COMPONENTS: Partial<Record<PinnedItemType, PinnedCardComponent>> = {
  'budget-project': BudgetPinnedCard,
  'purchase-requests-approval': PurchaseRequestsApprovalPinnedCard,
  // Add more card types here as they're implemented:
  // 'event': EventPinnedCard,
  // 'custom': CustomPinnedCard,
};

/**
 * Get the appropriate card component for a given item type
 * Falls back to DefaultPinnedCard if no specific component is registered
 */
export function getPinnedCardComponent(itemType: PinnedItemType): PinnedCardComponent {
  return CARD_COMPONENTS[itemType] || DefaultPinnedCard;
}

/**
 * Register a new card component for a specific item type
 * Useful for plugins or dynamic registration
 */
export function registerPinnedCardComponent(
  itemType: PinnedItemType,
  component: PinnedCardComponent
): void {
  CARD_COMPONENTS[itemType] = component;
}

/**
 * Get all registered item types
 */
export function getRegisteredItemTypes(): PinnedItemType[] {
  return Object.keys(CARD_COMPONENTS) as PinnedItemType[];
}
