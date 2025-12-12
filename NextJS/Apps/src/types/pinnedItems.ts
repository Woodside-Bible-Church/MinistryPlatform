export type PinnedItemType = 'budget-project' | 'purchase-requests-approval' | 'event' | 'custom';

export interface PinnedItemData {
  title: string;
  subtitle?: string;
  icon?: string;
  stats?: Array<{
    label: string;
    actual?: string;
    expected?: string;
    value?: string;
  }>;
  status?: string;
  budgetStatus?: 'under' | 'on-track' | 'over';
  [key: string]: any; // Allow custom fields
}

export interface PinnedItem {
  user_pinned_item_id: number;
  contact_id: number;
  item_type: PinnedItemType;
  item_id: string;
  item_data: PinnedItemData;
  route: string;
  sort_order: number;
  created_date: string;
}
