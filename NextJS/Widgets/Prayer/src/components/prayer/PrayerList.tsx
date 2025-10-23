'use client';

/**
 * Prayer List Component
 * Displays a list or stack of prayers with filtering options
 */

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { apiFetch } from '@/lib/apiClient';
import { PrayerCard } from './PrayerCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Prayer {
  Feedback_Entry_ID: number;
  Feedback_Type_ID: number;
  Entry_Title: string | null;
  Description: string;
  Date_Submitted: string;
  Ongoing_Need: boolean | null;
  Prayer_Count?: number | null;
  Contact_ID_Table?: {
    Display_Name: string;
    First_Name: string;
  };
  Feedback_Type_ID_Table?: {
    Feedback_Type: string;
  };
}

interface PrayerListProps {
  mode?: 'stack' | 'list';
  onlyApproved?: boolean;
  showMyPrayers?: boolean;
}

export function PrayerList({ mode = 'stack', onlyApproved = true, showMyPrayers = false }: PrayerListProps) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<Prayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalPrayed, setTotalPrayed] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch prayers
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch prayers - use authenticated fetch only for "My Prayers"
        const prayersUrl = `/api/prayers?${onlyApproved ? 'approved=true&' : ''}${showMyPrayers ? 'mine=true' : ''}`;
        const prayersResponse = showMyPrayers
          ? await authenticatedFetch(prayersUrl)
          : await apiFetch(prayersUrl);

        if (!prayersResponse.ok) {
          throw new Error('Failed to fetch prayers');
        }

        const prayersData = await prayersResponse.json();
        setPrayers(prayersData);
        setFilteredPrayers(prayersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [onlyApproved, showMyPrayers]);

  // Apply search filter
  useEffect(() => {
    let filtered = [...prayers];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.Description.toLowerCase().includes(term) ||
          (p.Entry_Title?.toLowerCase().includes(term) ?? false)
      );
    }

    setFilteredPrayers(filtered);
    setCurrentIndex(0);
  }, [prayers, searchTerm]);

  const handlePrayedFor = (id: number) => {
    // Show celebration
    setTotalPrayed(prev => prev + 1);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);

    // Remove the prayer from the list
    setFilteredPrayers(prev => prev.filter(p => p.Feedback_Entry_ID !== id));
  };

  const handleDismiss = (id: number) => {
    // Remove the prayer from the list
    setFilteredPrayers(prev => prev.filter(p => p.Feedback_Entry_ID !== id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prayers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredPrayers.length} {filteredPrayers.length === 1 ? 'prayer' : 'prayers'} found
        </div>
      </div>

      {/* Prayer Display */}
      {filteredPrayers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">No prayers found</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? 'Try a different search term'
              : 'Be the first to submit a prayer request'}
          </p>
        </div>
      ) : mode === 'stack' ? (
        <div className="relative">
          {/* Stack mode: Show one prayer at a time */}
          <div className="relative min-h-[400px]">
            {filteredPrayers.slice(currentIndex, currentIndex + 3).map((prayer, index) => (
              <div
                key={prayer.Feedback_Entry_ID}
                className="absolute inset-0"
                style={{
                  zIndex: 3 - index,
                  transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
                  opacity: index === 0 ? 1 : 0.6,
                  pointerEvents: index === 0 ? 'auto' : 'none',
                }}
              >
                <PrayerCard
                  prayer={prayer}
                  onPrayedFor={handlePrayedFor}
                  onDismiss={handleDismiss}
                  showSwipeHint={currentIndex === 0 && index === 0}
                />
              </div>
            ))}
          </div>

          {/* Prayer Counter - Always Visible */}
          {totalPrayed > 0 && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{totalPrayed}</span>
                <span>{totalPrayed === 1 ? 'prayer' : 'prayers'} today</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* List mode: Show all prayers */}
          {filteredPrayers.map((prayer) => (
            <PrayerCard
              key={prayer.Feedback_Entry_ID}
              prayer={prayer}
              onPrayedFor={handlePrayedFor}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
