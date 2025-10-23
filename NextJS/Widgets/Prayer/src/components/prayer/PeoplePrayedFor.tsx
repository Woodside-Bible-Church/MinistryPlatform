'use client';

/**
 * People I've Prayed For Component
 * Shows list of prayer requests the user has prayed for
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsPraying } from '@fortawesome/free-solid-svg-icons';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { formatDistanceToNow } from 'date-fns';

interface PrayerResponse {
  Feedback_Entry_User_Response_ID: number;
  Feedback_Entry_ID: number;
  Response_Date: string;
  Response_Text: string | null;
  Entry_Title: string;
  Description: string;
  Date_Submitted: string;
}

export function PeoplePrayedFor() {
  const [prayers, setPrayers] = useState<PrayerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrayers() {
      try {
        const response = await authenticatedFetch('/api/prayers/prayed-for');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch prayers');
        }

        const data = await response.json();
        setPrayers(data);
      } catch (err) {
        console.error('Error fetching prayers prayed for:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prayers');
      } finally {
        setLoading(false);
      }
    }

    fetchPrayers();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="flex-shrink-0 w-[400px]">
                <CardHeader>
                  <div className="animate-pulse">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show error UI, just hide the component
  }

  if (prayers.length === 0) {
    return (
      <div className="w-full">
        <Card className="max-w-2xl">
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              You haven't prayed for anyone yet. Swipe right on a prayer to start!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-sm text-muted-foreground mb-4">
        {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'}
      </div>

      {/* Horizontal Scrolling Carousel */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {prayers.map((prayer) => (
            <Card
              key={prayer.Feedback_Entry_User_Response_ID}
              className="shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-[400px]"
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-base line-clamp-2 flex-1">
                    {prayer.Entry_Title}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-normal">
                    {formatDistanceToNow(new Date(prayer.Response_Date), { addSuffix: true })}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {prayer.Description}
                </p>

                {prayer.Response_Text && (
                  <div className="bg-primary/5 rounded-md p-3 mt-2 border-l-2 border-primary/30">
                    <p className="text-xs text-muted-foreground mb-1">Your encouraging message:</p>
                    <p className="text-sm italic">"{prayer.Response_Text}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
