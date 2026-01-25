'use client';

import { cn } from '@/lib/utils';
import type { FilterType } from '@/lib/types';

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    affected: number;
    open: number;
  };
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const tabs: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All Campuses', count: counts.all },
    { id: 'affected', label: 'Affected Only', count: counts.affected },
    { id: 'open', label: 'Open Only', count: counts.open },
  ];

  return (
    <div
      className="flex flex-wrap justify-center gap-2 mb-8"
      style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-all duration-200',
            'border border-gray-200 hover:border-gray-300',
            activeFilter === tab.id
              ? 'bg-primary text-white border-primary hover:border-primary'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          {tab.label}
          <span
            className={cn(
              'ml-2 px-2 py-0.5 text-xs',
              activeFilter === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
