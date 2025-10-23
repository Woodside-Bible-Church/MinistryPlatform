'use client';

/**
 * Prayer Card Component
 * Displays a single prayer with swipe-to-pray functionality
 */

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsPraying } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { requireLogin } from '@/lib/mpLogin';

interface PrayerCardProps {
  prayer: {
    Feedback_Entry_ID: number;
    Feedback_Type_ID: number;
    Entry_Title: string | null;
    Description: string;
    Date_Submitted: string;
    Ongoing_Need: boolean | null;
    Target_Date?: string | null;
    Prayer_Count?: number | null;
    Contact_ID_Table?: {
      Display_Name: string;
      First_Name: string;
    };
    Feedback_Type_ID_Table?: {
      Feedback_Type: string;
    };
  };
  onPrayedFor?: (id: number) => void;
  onDismiss?: (id: number) => void;
  showSwipeHint?: boolean;
}

export function PrayerCard({ prayer, onPrayedFor, onDismiss, showSwipeHint = false }: PrayerCardProps) {
  const [exitX, setExitX] = useState(0);
  const [showHint, setShowHint] = useState(showSwipeHint);
  const [prayerCount, setPrayerCount] = useState(prayer.Prayer_Count ?? 0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [encouragingMessage, setEncouragingMessage] = useState('');

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Determine badge style based on feedback type
  const getFeedbackBadge = () => {
    if (prayer.Feedback_Type_ID === 1) {
      // Prayer Request - Blue badge with praying hands
      return {
        label: 'Prayer Request',
        className: 'bg-blue-500 text-white',
        icon: faHandsPraying
      };
    } else if (prayer.Feedback_Type_ID === 2) {
      // Praise Report - Green badge with celebration
      return {
        label: 'Praise Report',
        className: 'bg-primary text-white',
        icon: faHandsPraying // Could use a different icon for praise
      };
    }
    return null;
  };

  const badgeInfo = getFeedbackBadge();

  const handlePray = async () => {
    // Require login before praying
    if (!requireLogin()) {
      return; // Will redirect to login
    }

    // Submit prayer directly (message is optional and already captured in state)
    setShowCelebration(true);
    setExitX(1000);

    // Increment prayer count via API
    try {
      const response = await authenticatedFetch(`/api/prayers/${prayer.Feedback_Entry_ID}/pray`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: encouragingMessage.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrayerCount(data.prayer_count);
      }
    } catch (error) {
      console.error('Failed to increment prayer count:', error);
    }

    // Reset message
    setEncouragingMessage('');

    // Wait for animation before removing card
    setTimeout(() => {
      if (onPrayedFor) {
        onPrayedFor(prayer.Feedback_Entry_ID);
      }
    }, 300);
  };

  const handleSkip = () => {
    setExitX(-1000);
    setTimeout(() => {
      if (onDismiss) {
        onDismiss(prayer.Feedback_Entry_ID);
      }
    }, 300);
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setShowHint(false);

    // Swipe right = Prayed for
    if (info.offset.x > 100) {
      handlePray();
    }
    // Swipe left = Dismiss/Skip (no login required)
    else if (info.offset.x < -100) {
      handleSkip();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  return (
    <motion.div
      className="relative"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {showHint && (
        <div className="absolute -top-12 left-0 right-0 text-center text-sm text-muted-foreground animate-pulse">
          ← Swipe to dismiss • Swipe to pray →
        </div>
      )}

      <Card className="cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3 relative">
          {/* Badges in Top Right Corner */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {badgeInfo && (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${badgeInfo.className}`}>
                <FontAwesomeIcon icon={badgeInfo.icon} className="w-3 h-3" />
                <span>{badgeInfo.label}</span>
              </div>
            )}
            {prayer.Target_Date && (
              <Badge variant="outline" className="text-xs bg-primary/10 rounded-full">
                🎯 {formatTargetDate(prayer.Target_Date)}
              </Badge>
            )}
            {prayer.Ongoing_Need && !prayer.Target_Date && (
              <Badge variant="outline" className="text-xs rounded-full">
                Ongoing
              </Badge>
            )}
          </div>

          <div className="space-y-2 pr-20">
            {/* Show contact name as subtitle if Entry_Title exists, otherwise in title */}
            {prayer.Entry_Title ? (
              <>
                <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                  {/* Strip redundant "Prayer Request from" or "Praise Report from" prefix */}
                  {prayer.Entry_Title.replace(/^(Prayer Request|Praise Report)\s+from\s+/i, '')}
                </h3>
                {prayer.Contact_ID_Table && (
                  <p className="text-sm text-muted-foreground">
                    {prayer.Contact_ID_Table.First_Name}
                  </p>
                )}
              </>
            ) : (
              prayer.Contact_ID_Table && (
                <h3 className="text-xl font-semibold text-foreground">
                  {prayer.Contact_ID_Table.First_Name}
                </h3>
              )
            )}

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(prayer.Date_Submitted)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {prayer.Description}
          </p>

          {/* Inline Encouraging Message Input - Always Visible */}
          <div className="pt-2 border-t">
            <Textarea
              placeholder="Leave an encouraging word (optional)..."
              value={encouragingMessage}
              onChange={(e) => setEncouragingMessage(e.target.value)}
              className="min-h-[80px] text-sm"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {encouragingMessage.length}/500 characters
            </p>
          </div>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground pt-4 border-t flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {prayerCount} {prayerCount === 1 ? 'prayer' : 'prayers'}
              </span>
            </div>

            {/* Desktop: Clickable Buttons, Mobile: Swipe Indicators */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="hidden sm:flex gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
                Skip
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePray}
                className="hidden sm:flex gap-2 bg-primary hover:bg-primary/90"
              >
                <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4" />
                Pray
              </Button>

              {/* Mobile: Swipe Hints */}
              <div className="flex sm:hidden items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <X className="w-3 h-3" />
                  <span>Swipe</span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <span>Swipe</span>
                  <FontAwesomeIcon icon={faHandsPraying} className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Celebration Animation - Subtle */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20"
        >
          <div className="bg-primary text-white px-4 py-2 shadow-lg text-sm font-medium flex items-center gap-2">
            <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4" />
            <span>Prayer added</span>
          </div>
        </motion.div>
      )}

      {/* Swipe indicators */}
      <motion.div
        className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-start pl-8 pointer-events-none"
        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
      >
        <FontAwesomeIcon icon={faHandsPraying} className="w-16 h-16 text-green-600" />
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-end pr-8 pointer-events-none"
        style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
      >
        <X className="w-16 h-16 text-red-600" />
      </motion.div>

    </motion.div>
  );
}
