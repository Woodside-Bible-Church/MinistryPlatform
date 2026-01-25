'use client';

import { cn } from '@/lib/utils';
import type { Campus } from '@/lib/types';

interface StatusSummaryProps {
  campuses: Campus[];
}

export function StatusSummary({ campuses }: StatusSummaryProps) {
  const closedCount = campuses.filter(c => c.status === 'closed').length;
  const modifiedCount = campuses.filter(c => c.status === 'modified').length;
  const openCount = campuses.filter(c => c.status === 'open').length;

  const stats = [
    {
      label: 'Closed',
      count: closedCount,
      bgColor: 'bg-status-closed-light',
      textColor: 'text-status-closed',
      borderColor: 'border-status-closed/20',
    },
    {
      label: 'Modified',
      count: modifiedCount,
      bgColor: 'bg-status-modified-light',
      textColor: 'text-status-modified',
      borderColor: 'border-status-modified/20',
    },
    {
      label: 'Open',
      count: openCount,
      bgColor: 'bg-status-open-light',
      textColor: 'text-status-open',
      borderColor: 'border-status-open/20',
    },
  ];

  return (
    <div
      className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6"
      style={{ animation: 'fadeInDown 0.5s ease-out 0.2s both' }}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            'flex items-center gap-2 px-4 py-2 border',
            stat.bgColor,
            stat.borderColor
          )}
          style={{ animation: `fadeInUp 0.4s ease-out ${0.3 + index * 0.1}s both` }}
        >
          <span className={cn('text-2xl font-bold', stat.textColor)}>
            {stat.count}
          </span>
          <span className={cn('text-sm font-medium uppercase tracking-wide', stat.textColor)}>
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
