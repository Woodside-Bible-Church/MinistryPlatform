'use client';

/**
 * My Prayers Component
 * Displays prayers submitted by the logged-in user
 */

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Heart, CheckCircle, Clock } from 'lucide-react';

interface MyPrayer {
  Feedback_Entry_ID: number;
  Entry_Title: string | null;
  Description: string;
  Date_Submitted: string;
  Ongoing_Need: boolean | null;
  Approved: boolean | null;
  Prayer_Count?: number | null;
  Feedback_Type_ID_Table?: {
    Feedback_Type: string;
  };
}

export function MyPrayers() {
  const [prayers, setPrayers] = useState<MyPrayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyPrayers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch('/api/prayers?mine=true');

        if (!response.ok) {
          throw new Error('Failed to fetch your prayers');
        }

        const data = await response.json();
        setPrayers(data);
      } catch (err) {
        console.error('Error fetching my prayers:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyPrayers();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  if (prayers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-2">You haven&apos;t submitted any prayer requests yet</p>
        <p className="text-sm text-muted-foreground">
          Click &quot;Submit Prayer&quot; above to share your first request
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'}
      </div>

      {prayers.map((prayer) => (
        <Card key={prayer.Feedback_Entry_ID} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {prayer.Entry_Title && (
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                    {prayer.Entry_Title}
                  </h3>
                )}

                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(prayer.Date_Submitted)}</span>
                  </div>

                  {prayer.Approved ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Review
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {prayer.Feedback_Type_ID_Table && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {prayer.Feedback_Type_ID_Table.Feedback_Type}
                  </Badge>
                )}

                {prayer.Ongoing_Need && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    Ongoing
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed mb-4">
              {prayer.Description}
            </p>

            <div className="flex items-center gap-2 text-sm text-primary">
              <Heart className="w-4 h-4 fill-primary" />
              <span className="font-medium">
                {prayer.Prayer_Count ?? 0} {prayer.Prayer_Count === 1 ? 'person has' : 'people have'} prayed for this
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
