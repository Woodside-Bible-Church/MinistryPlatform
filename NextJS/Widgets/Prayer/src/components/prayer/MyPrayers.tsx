'use client';

/**
 * My Prayers Component
 * Displays prayers submitted by the logged-in user
 */

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Calendar, CheckCircle, Clock, Edit, MessageCircle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsPraying } from '@fortawesome/free-solid-svg-icons';
import { PrayerForm } from './PrayerForm';

interface MyPrayer {
  Feedback_Entry_ID: number;
  Entry_Title: string | null;
  Description: string;
  Date_Submitted: string;
  Ongoing_Need: boolean | null;
  Approved: boolean | null;
  Target_Date?: string | null;
  Prayer_Count?: number | null;
  Feedback_Type_ID: number;
  Feedback_Type_ID_Table?: {
    Feedback_Type: string;
  };
}

export function MyPrayers() {
  const [prayers, setPrayers] = useState<MyPrayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrayer, setEditingPrayer] = useState<MyPrayer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

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

  const formatTargetDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) return `Was ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `In ${diffInDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEdit = (prayerId: number) => {
    const prayer = prayers.find(p => p.Feedback_Entry_ID === prayerId);
    if (prayer) {
      setEditingPrayer(prayer);
      setShowEditDialog(true);
    }
  };

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    setEditingPrayer(null);
    // Refresh the prayers list
    try {
      const response = await authenticatedFetch('/api/prayers?mine=true');
      if (response.ok) {
        const data = await response.json();
        setPrayers(data);
      }
    } catch (err) {
      console.error('Error refreshing prayers:', err);
    }
  };

  const handleAddUpdate = (prayerId: number) => {
    const prayer = prayers.find(p => p.Feedback_Entry_ID === prayerId);
    if (prayer) {
      setEditingPrayer(prayer);
      setShowUpdateDialog(true);
    }
  };

  // Determine badge style based on feedback type
  const getFeedbackBadge = (feedbackTypeId: number) => {
    if (feedbackTypeId === 1) {
      return {
        label: 'Prayer Request',
        className: 'bg-blue-500 text-white',
        icon: faHandsPraying
      };
    } else if (feedbackTypeId === 2) {
      return {
        label: 'Praise Report',
        className: 'bg-primary text-white',
        icon: faHandsPraying
      };
    }
    return null;
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
    <div className="w-full">
      <div className="text-sm text-muted-foreground mb-4">
        {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'}
      </div>

      {/* Horizontal Scrolling Carousel */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {prayers.map((prayer) => {
            const badgeInfo = getFeedbackBadge(prayer.Feedback_Type_ID);
            const isPending = !prayer.Approved;

            return (
              <Card key={prayer.Feedback_Entry_ID} className="shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-[400px]">
                <CardHeader className="pb-3 relative">
                  {/* Badges in Top Right Corner */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    {/* Feedback Type Badge */}
                    {badgeInfo && (
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${badgeInfo.className}`}>
                        <FontAwesomeIcon icon={badgeInfo.icon} className="w-3 h-3" />
                        <span>{badgeInfo.label}</span>
                      </div>
                    )}

                    {/* Target Date Badge (only show if approved) */}
                    {!isPending && prayer.Target_Date && (
                      <Badge variant="outline" className="text-xs bg-primary/10 rounded-full">
                        🎯 {formatTargetDate(prayer.Target_Date)}
                      </Badge>
                    )}

                    {/* Ongoing Badge (only show if approved) */}
                    {!isPending && prayer.Ongoing_Need && !prayer.Target_Date && (
                      <Badge variant="outline" className="text-xs rounded-full">
                        Ongoing
                      </Badge>
                    )}

                    {/* Approval Status Badge */}
                    {isPending ? (
                      <Badge variant="secondary" className="gap-1 text-xs rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending Review
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1 text-xs rounded-full bg-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-32">
                    {prayer.Entry_Title && (
                      <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                        {/* Strip redundant prefix */}
                        {prayer.Entry_Title.replace(/^(Prayer Request|Praise Report)\s+from\s+/i, '')}
                      </h3>
                    )}

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {isPending ? 'Submitted' : 'Submitted on'} {formatDate(prayer.Date_Submitted)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {prayer.Description}
                  </p>

                  {/* Prayer Count - Only show if approved */}
                  {!isPending && (
                    <div className="flex items-center gap-2 text-sm pt-2 border-t">
                      <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {prayer.Prayer_Count ?? 0} {prayer.Prayer_Count === 1 ? 'prayer' : 'prayers'}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t">
                  {isPending ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(prayer.Feedback_Entry_ID)}
                      className="gap-2 w-full"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Request
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddUpdate(prayer.Feedback_Entry_ID)}
                      className="gap-2 w-full"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Add Update
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Edit Prayer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prayer Request</DialogTitle>
            <DialogDescription>
              Update your prayer request details below.
            </DialogDescription>
          </DialogHeader>
          {editingPrayer && (
            <PrayerForm
              initialData={{
                Feedback_Entry_ID: editingPrayer.Feedback_Entry_ID,
                Feedback_Type_ID: editingPrayer.Feedback_Type_ID,
                Entry_Title: editingPrayer.Entry_Title || '',
                Description: editingPrayer.Description,
                Ongoing_Need: editingPrayer.Ongoing_Need || false,
                Target_Date: editingPrayer.Target_Date || undefined,
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingPrayer(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Update Dialog - Placeholder for now */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Prayer Update</DialogTitle>
            <DialogDescription>
              Share an update or testimony about this prayer.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Update functionality coming soon!
          </div>
          <Button onClick={() => setShowUpdateDialog(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
