'use client';

/**
 * My Prayers Component
 * Displays prayers submitted by the logged-in user
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Calendar, Clock, Edit, MessageCircle, Plus, User2, CheckCircle, Trash2, Undo2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsPraying } from '@fortawesome/free-solid-svg-icons';
import { PrayerForm } from './PrayerForm';
import { PrayerUpdateForm } from './PrayerUpdateForm';

interface PrayerUpdate {
  Feedback_Entry_Update_ID: number;
  Update_Text: string;
  Update_Date: string;
  Is_Answered: boolean;
}

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
  Updates?: PrayerUpdate[]; // Updates from Feedback_Entry_Updates table
}

interface MyPrayersProps {
  prayers: MyPrayer[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function MyPrayers({ prayers: initialPrayers, isLoading = false, error = null, onRefresh }: MyPrayersProps) {
  const [prayers, setPrayers] = useState<MyPrayer[]>(initialPrayers);
  const [editingPrayer, setEditingPrayer] = useState<MyPrayer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [deletedPrayer, setDeletedPrayer] = useState<{ prayer: MyPrayer; timeoutId: NodeJS.Timeout } | null>(null);

  // Update local prayers when props change
  useEffect(() => {
    setPrayers(initialPrayers);
  }, [initialPrayers]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (deletedPrayer?.timeoutId) {
        clearTimeout(deletedPrayer.timeoutId);
      }
    };
  }, [deletedPrayer]);

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

  const handleEditSuccess = async (editedData?: {
    Entry_Title: string;
    Description: string;
    Feedback_Type_ID: number;
    Target_Date?: string | null;
    Ongoing_Need: boolean;
    Anonymous_Share: boolean;
  }) => {
    // Close dialog immediately
    setShowEditDialog(false);
    const prayerId = editingPrayer?.Feedback_Entry_ID;
    setEditingPrayer(null);

    // OPTIMISTIC UPDATE: Apply edits immediately to local state
    if (prayerId && editedData) {
      setPrayers(prevPrayers =>
        prevPrayers.map(prayer =>
          prayer.Feedback_Entry_ID === prayerId
            ? {
                ...prayer,
                Entry_Title: editedData.Entry_Title,
                Description: editedData.Description,
                Feedback_Type_ID: editedData.Feedback_Type_ID,
                Target_Date: editedData.Target_Date,
                Ongoing_Need: editedData.Ongoing_Need,
                Anonymous_Share: editedData.Anonymous_Share,
              }
            : prayer
        )
      );
    }

    // Refresh from server in background to get full data (optional)
    // This ensures we have the latest data from the database
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

  const handleUpdateSuccess = async (newUpdate?: { Update_Text: string; Is_Answered: boolean }) => {
    setShowUpdateDialog(false);
    const prayerId = editingPrayer?.Feedback_Entry_ID;
    setEditingPrayer(null);

    // Optimistically add the update to the UI (at the end, since we show oldest to newest)
    if (prayerId && newUpdate) {
      setPrayers(prevPrayers =>
        prevPrayers.map(prayer =>
          prayer.Feedback_Entry_ID === prayerId
            ? {
                ...prayer,
                Updates: [
                  ...(prayer.Updates || []),
                  {
                    Feedback_Entry_Update_ID: Date.now(), // Temporary ID
                    Update_Text: newUpdate.Update_Text,
                    Update_Date: new Date().toISOString(),
                    Is_Answered: newUpdate.Is_Answered,
                  },
                ],
              }
            : prayer
        )
      );

      // Refresh from server after 2 seconds to get real update data
      setTimeout(() => {
        if (onRefresh) {
          onRefresh();
        }
      }, 2000);
    }
  };

  const handleDelete = async (prayerId: number) => {
    const prayer = prayers.find(p => p.Feedback_Entry_ID === prayerId);
    if (!prayer) return;

    // OPTIMISTIC UPDATE: Remove prayer immediately with animation
    setPrayers(prevPrayers => prevPrayers.filter(p => p.Feedback_Entry_ID !== prayerId));

    // Set up undo timeout (5 seconds)
    const timeoutId = setTimeout(async () => {
      // After 5 seconds, actually delete from server
      try {
        const response = await authenticatedFetch(`/api/prayers/${prayerId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete prayer');
        }

        // Clear deleted prayer state
        setDeletedPrayer(null);
      } catch (error) {
        console.error('Failed to delete prayer:', error);
        // Restore prayer on error
        setPrayers(prevPrayers => [...prevPrayers, prayer].sort((a, b) =>
          new Date(b.Date_Submitted).getTime() - new Date(a.Date_Submitted).getTime()
        ));
        setDeletedPrayer(null);
        alert('Failed to delete prayer. It has been restored.');
      }
    }, 5000);

    // Store deleted prayer for undo
    setDeletedPrayer({ prayer, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!deletedPrayer) return;

    // Cancel deletion
    clearTimeout(deletedPrayer.timeoutId);

    // Restore prayer
    setPrayers(prevPrayers => [...prevPrayers, deletedPrayer.prayer].sort((a, b) =>
      new Date(b.Date_Submitted).getTime() - new Date(a.Date_Submitted).getTime()
    ));

    // Clear deleted state
    setDeletedPrayer(null);
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
      {/* Undo Delete Toast */}
      {deletedPrayer && (
        <Alert className="mb-4 bg-amber-50 border-amber-200 animate-in slide-in-from-top-2">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span className="text-amber-900 font-medium">
                Prayer deleted
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoDelete}
              className="gap-2 bg-white hover:bg-amber-100 border-amber-300"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground mb-4">
        {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'}
      </div>

      {/* Horizontal Scrolling Carousel */}
      <div className="overflow-x-auto horizontal-scroll pb-4 -mx-4 px-4 snap-x snap-mandatory sm:snap-none">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          <AnimatePresence mode="popLayout">
            {prayers.map((prayer) => {
              const isPending = !prayer.Approved;

              return (
                <motion.div
                  key={prayer.Feedback_Entry_ID}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0, x: -100 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  layout
                  className="flex-shrink-0"
                >
                  <Card
                    className={`shadow-sm hover:shadow-md transition-all flex-shrink-0 w-[calc(100vw-3rem)] sm:w-[400px] flex flex-col overflow-hidden p-0 snap-start sm:snap-align-none ${
                      isPending ? 'ring-2 ring-amber-400/50 relative' : ''
                    }`}
                  >
                    {/* Shimmer effect for pending prayers */}
                    {isPending && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 to-transparent pointer-events-none"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}
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

                {/* Updates Section */}
                {prayer.Updates && prayer.Updates.length > 0 && (
                  <div className="px-6 py-3 bg-green-50/50 border-y border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-green-900">
                        Updates {prayer.Updates.some(u => u.Is_Answered) && '✓ Answered'}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {prayer.Updates.map((update) => {
                        // Check if this is a pending update (has temp ID)
                        const isPending = update.Feedback_Entry_Update_ID > 1000000000000;

                        return (
                          <motion.div
                            key={update.Feedback_Entry_Update_ID}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs relative ${isPending ? 'opacity-60' : ''}`}
                          >
                            {/* Shimmer effect for pending updates */}
                            {isPending && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
                                animate={{
                                  x: ['-100%', '100%'],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'linear',
                                }}
                              />
                            )}
                            <div className="flex items-start gap-2">
                              {update.Is_Answered && (
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                  {update.Update_Text}
                                </p>
                                <p className="text-muted-foreground mt-1">
                                  {isPending ? 'Saving...' : formatDate(update.Update_Date)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                <CardFooter className="pt-3 px-6 pb-6 border-t gap-2">
                  {isPending ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(prayer.Feedback_Entry_ID)}
                        className="gap-2 flex-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prayer.Feedback_Entry_ID)}
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
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
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prayer.Feedback_Entry_ID)}
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
          </AnimatePresence>
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

      {/* Add Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Prayer Update</DialogTitle>
            <DialogDescription>
              Share an update or testimony about this prayer.
            </DialogDescription>
          </DialogHeader>
          {editingPrayer && (
            <PrayerUpdateForm
              prayerId={editingPrayer.Feedback_Entry_ID}
              prayerTitle={editingPrayer.Entry_Title || editingPrayer.Description.substring(0, 100) + '...'}
              onSuccess={handleUpdateSuccess}
              onCancel={() => {
                setShowUpdateDialog(false);
                setEditingPrayer(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
