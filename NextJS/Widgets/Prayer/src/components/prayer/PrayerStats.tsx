'use client';

/**
 * Prayer Stats Component
 * Displays user's prayer statistics including total prayers, streak, and today's count
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsPraying, faFire, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';

interface PrayerStatsData {
  Total_Responses: number;
  Responses_Today: number;
  Current_Streak: number;
  Last_Response_Date: string | null;
  Unique_Entries_Responded: number;
}

export function PrayerStats() {
  const [stats, setStats] = useState<PrayerStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await authenticatedFetch('/api/prayers/stats');

        if (!response.ok) {
          const errorData = await response.json();
          // If SQL not run yet, don't show error to user
          if (errorData.error === 'Stored procedure not found' || errorData.error === 'Database table not found') {
            console.warn('Prayer stats not available yet - SQL schema needs to be run');
            setStats({
              Total_Responses: 0,
              Responses_Today: 0,
              Current_Streak: 0,
              Last_Response_Date: null,
              Unique_Entries_Responded: 0,
            });
            setLoading(false);
            return;
          }
          throw new Error(errorData.message || 'Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching prayer stats:', err);
        // If stored procedure not found (404), just show zeros
        if (err instanceof Error && err.message.includes('404')) {
          console.warn('Prayer stats stored procedure not available yet - showing zeros');
          setStats({
            Total_Responses: 0,
            Responses_Today: 0,
            Current_Streak: 0,
            Last_Response_Date: null,
            Unique_Entries_Responded: 0,
          });
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load stats');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
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

  if (error || !stats) {
    return null; // Don't show error UI, just hide the component
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="py-4">
        <div className="flex items-center justify-around gap-4">
          {/* Total Prayers */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHandsPraying} className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{stats.Total_Responses}</span>
            </div>
            <span className="text-xs text-muted-foreground">Total Prayers</span>
          </div>

          {/* Current Streak */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFire} className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-foreground">{stats.Current_Streak}</span>
            </div>
            <span className="text-xs text-muted-foreground">Day Streak</span>
          </div>

          {/* Today's Prayers */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarDay} className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-foreground">{stats.Responses_Today}</span>
            </div>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
