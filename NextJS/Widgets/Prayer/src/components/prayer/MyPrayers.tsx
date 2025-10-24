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
import { Loader2, Calendar, CheckCircle, Clock, Edit, MessageCircle, Plus, User2 } from 'lucide-react';
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
  Anonymous?: boolean | null;
  Anonymous_Share?: boolean | null;
  Visibility_Level_ID?: number | null;
  Contact_ID_Table?: {
    Display_Name?: string;
    First_Name?: string;
    Last_Name?: string;
    Contact_Photo?: string | null;
  };
  userImageUrl?: string; // Added by API route from auth callback
}

interface MyPrayersProps {
  prayers: MyPrayer[];
  isLoading?: boolean;
  error?: string | null;
}

export function MyPrayers({ prayers: initialPrayers, isLoading = false, error = null }: MyPrayersProps) {
  const [prayers, setPrayers] = useState<MyPrayer[]>(initialPrayers);
  const [editingPrayer, setEditingPrayer] = useState<MyPrayer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  // Update local prayers when props change
  useEffect(() => {
    setPrayers(initialPrayers);
  }, [initialPrayers]);

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
    // Refresh the prayers list after edit
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

  // Get visibility level label
  const getVisibilityLabel = (levelId?: number | null) => {
    switch (levelId) {
      case 1: return 'Public';
      case 2: return 'Members Only';
      case 3: return 'Staff Only';
      default: return 'Public';
    }
  };

  // Determine badge style based on feedback type
  const getFeedbackTypeLabel = (feedbackTypeId: number) => {
    return feedbackTypeId === 1 ? 'Prayer Request' : 'Praise Report';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    // Check if error is authentication-related
    const isAuthError = error.includes('authentication') ||
                       error.includes('Unauthorized') ||
                       error.includes('expired') ||
                       error.includes('Invalid token');

    if (isAuthError) {
      return (
        <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
          <CardContent className="py-8 text-center">
            <div className="mb-4">
              <User2 className="w-12 h-12 mx-auto text-blue-500 mb-2" />
              <h3 className="text-lg font-semibold text-foreground">Sign In to View Your Requests</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in to view and manage your prayer requests
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              className="bg-blue-500 hover:bg-blue-600"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Alert className="bg-red-50 border-red-200 max-w-2xl mx-auto">
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    );
  }

  if (prayers.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8 text-center">
          <div className="mb-4">
            <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-semibold text-foreground">No Prayer Requests Yet</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Click &quot;Submit Prayer&quot; above to share your first request with the community
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="text-sm text-muted-foreground mb-4">
        {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'}
      </div>

      {/* Horizontal Scrolling Carousel */}
      <div className="overflow-x-auto horizontal-scroll pb-4 -mx-4 px-4 snap-x snap-mandatory sm:snap-none">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {prayers.map((prayer) => {
            const isPending = !prayer.Approved;

            return (
              <Card key={prayer.Feedback_Entry_ID} className="shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-[calc(100vw-3rem)] sm:w-[400px] flex flex-col overflow-hidden p-0 snap-start sm:snap-align-none">
                {/* Colored Header with Avatar, Name and Status/Prayer Count */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b">
                  {/* Left: Avatar + Your Name */}
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {prayer.Contact_ID_Table?.Contact_Photo && (
                      <img
                        src={prayer.Contact_ID_Table.Contact_Photo}
                        alt={`${prayer.Contact_ID_Table.First_Name} ${prayer.Contact_ID_Table.Last_Name}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    {prayer.Contact_ID_Table?.First_Name && prayer.Contact_ID_Table?.Last_Name && (
                      <span>{prayer.Contact_ID_Table.First_Name} {prayer.Contact_ID_Table.Last_Name}</span>
                    )}
                  </div>

                  {/* Right: Status or Prayer Count */}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {isPending ? (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Clock className="w-4 h-4" />
                        <span>Pending Review</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-primary">
                        <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4" />
                        <span>
                          {prayer.Prayer_Count ?? 0} {prayer.Prayer_Count === 1 ? 'prayer' : 'prayers'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content */}
                <CardHeader className="pb-2 pt-2 px-6">

                  {/* Title */}
                  {prayer.Entry_Title && (
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {prayer.Entry_Title.replace(/^(Prayer Request|Praise Report)\s+from\s+/i, '')}
                    </h3>
                  )}

                  {/* Description */}
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {prayer.Description}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-3 px-6">
                  {/* Metadata - at top */}
                  <div className="space-y-2">
                    {/* Submitted date - only for pending */}
                    {isPending && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted {formatDate(prayer.Date_Submitted)}</span>
                      </div>
                    )}

                    {/* Target date or Ongoing */}
                    {prayer.Target_Date ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        🎯 <span>{formatTargetDate(prayer.Target_Date)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Ongoing Need</span>
                      </div>
                    )}
                  </div>

                  {/* Spacer to push tags to bottom */}
                  <div className="flex-1"></div>

                  {/* Wrapping Tags - stuck to bottom */}
                  <div className="flex flex-wrap gap-2">
                    {/* Feedback Type */}
                    <Badge
                      variant="default"
                      className={`text-xs rounded-full ${
                        prayer.Feedback_Type_ID === 1 ? 'bg-blue-500' : 'bg-primary'
                      }`}
                    >
                      <FontAwesomeIcon icon={faHandsPraying} className="w-3 h-3 mr-1.5" />
                      {getFeedbackTypeLabel(prayer.Feedback_Type_ID)}
                    </Badge>

                    {/* Anonymous Badge */}
                    {prayer.Anonymous && (
                      <Badge variant="outline" className="text-xs rounded-full">
                        🔒 Anonymous
                      </Badge>
                    )}

                    {/* Visibility Level - Only show if NOT public (ID 1 or default) */}
                    {prayer.Visibility_Level_ID && prayer.Visibility_Level_ID !== 1 && (
                      <Badge variant="outline" className="text-xs rounded-full">
                        👁️ {getVisibilityLabel(prayer.Visibility_Level_ID)}
                      </Badge>
                    )}
                  </div>
                </CardContent>

                {/* Footer with CTA */}
                <CardFooter className="pt-3 px-6 pb-6 border-t">
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
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddUpdate(prayer.Feedback_Entry_ID)}
                        className="gap-2 flex-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Add Update
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAddUpdate(prayer.Feedback_Entry_ID)}
                        className="gap-2 flex-1"
                        style={{ backgroundColor: '#61BC47' }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Answered
                      </Button>
                    </div>
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
