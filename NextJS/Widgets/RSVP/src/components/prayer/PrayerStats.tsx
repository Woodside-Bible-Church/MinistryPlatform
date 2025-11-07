'use client';

/**
 * Prayer Stats Component
 * Displays user's prayer statistics including total prayers, streak, and today's count
 * Now powered by unified widget data endpoint
 */

import { Card, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsPraying, faFire, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import type { UserStats } from '@/types/widgetData';

interface PrayerStatsProps {
  stats: UserStats | null;
  isLoading?: boolean;
}

export function PrayerStats({ stats, isLoading = false }: PrayerStatsProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-8">
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null; // Don't show if no stats available
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="py-4">
        <div className="flex items-center justify-around gap-4">
          {/* Total Prayers */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHandsPraying} className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{stats.Total_Prayers.Count}</span>
            </div>
            <span className="text-xs text-muted-foreground">{stats.Total_Prayers.Label}</span>
          </div>

          {/* Current Streak */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFire} className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-foreground">{stats.Prayer_Streak.Count}</span>
            </div>
            <span className="text-xs text-muted-foreground">{stats.Prayer_Streak.Label}</span>
          </div>

          {/* Today's Prayers */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarDay} className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-foreground">{stats.Prayers_Today.Count}</span>
            </div>
            <span className="text-xs text-muted-foreground">{stats.Prayers_Today.Label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
