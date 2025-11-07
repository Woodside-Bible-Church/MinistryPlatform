'use client';

/**
 * Prayer Card Component
 * Displays a single prayer with swipe-to-pray functionality
 */

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Clock, CheckCircle2 } from 'lucide-react';
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
    Anonymous_Share?: boolean | null;
    Contact_ID_Table?: {
      Display_Name: string;
      First_Name: string;
      Last_Name: string;
      Contact_Photo?: string | null;
    };
    Feedback_Type_ID_Table?: {
      Feedback_Type: string;
    };
  };
  onPrayedFor?: (id: number) => void;
  onDismiss?: (id: number) => void;
  showSwipeHint?: boolean;
  labels?: {
    Pray_Button?: string;
    Skip_Button?: string;
    Message_Placeholder?: string;
  };
}

export function PrayerCard({ prayer, onPrayedFor, onDismiss, showSwipeHint = false, labels }: PrayerCardProps) {
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

    // OPTIMISTIC UPDATE: Immediately increment prayer count
    const optimisticCount = prayerCount + 1;
    setPrayerCount(optimisticCount);

    // Show celebration immediately
    setShowCelebration(true);
    setExitX(1000);

    // Reset message
    const messageToSend = encouragingMessage.trim() || undefined;
    setEncouragingMessage('');

    // Wait for animation before removing card
    setTimeout(() => {
      if (onPrayedFor) {
        onPrayedFor(prayer.Feedback_Entry_ID);
      }
    }, 300);

    // Make API call in background to confirm
    try {
      const response = await authenticatedFetch(`/api/prayers/${prayer.Feedback_Entry_ID}/pray`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update with actual count from server (should match optimistic)
        setPrayerCount(data.prayer_count);
      } else {
        // Rollback on error (though card will already be gone)
        console.error('Failed to record prayer, rolling back count');
        setPrayerCount(prayerCount);
      }
    } catch (error) {
      console.error('Failed to increment prayer count:', error);
      // Rollback on error
      setPrayerCount(prayerCount);
    }
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

      <Card className="cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-shadow overflow-hidden p-0">
        {/* Colored Header with Avatar, Name and Prayer Count */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b">
          {/* Left: Avatar + Contact Name (First Last format) */}
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {prayer.Contact_ID_Table?.Contact_Photo && (
              <img
                src={prayer.Contact_ID_Table.Contact_Photo}
                alt={`${prayer.Contact_ID_Table.First_Name} ${prayer.Contact_ID_Table.Last_Name}`}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span>
              {prayer.Contact_ID_Table?.First_Name && prayer.Contact_ID_Table?.Last_Name
                ? `${prayer.Contact_ID_Table.First_Name} ${prayer.Contact_ID_Table.Last_Name}`
                : prayer.Contact_ID_Table?.Display_Name || 'Anonymous'}
            </span>
          </div>

          {/* Right: Prayer Count */}
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4" />
            <span>
              {prayerCount} {prayerCount === 1 ? 'prayer' : 'prayers'}
            </span>
          </div>
        </div>

        <CardHeader className="pb-2 pt-2 px-6 space-y-0.5">
          {/* Title - Show as-is from Entry_Title */}
          {prayer.Entry_Title && (
            <h3 className="text-xl font-semibold text-foreground">
              {prayer.Entry_Title}
            </h3>
          )}

          {/* Description */}
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {prayer.Description}
          </p>
        </CardHeader>

        <CardContent className="space-y-2 px-6">
          {/* Target Date or Ongoing */}
          {prayer.Target_Date ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              🎯 <span>{formatTargetDate(prayer.Target_Date)}</span>
            </div>
          ) : prayer.Ongoing_Need ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Ongoing Need</span>
            </div>
          ) : null}

          {/* Inline Encouraging Message Input - Always Visible */}
          <div className="pt-2">
            <Textarea
              placeholder={labels?.Message_Placeholder || 'Leave an encouraging word (optional)...'}
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

        <CardFooter className="text-xs text-muted-foreground pt-4 px-6 pb-6 border-t flex-col gap-3">
          {/* Desktop: Type Badge and Buttons in Same Row */}
          <div className="hidden sm:flex items-center justify-between w-full">
            <div>
              {badgeInfo && (
                <Badge className={`text-xs rounded-full ${badgeInfo.className}`}>
                  <FontAwesomeIcon icon={badgeInfo.icon} className="w-3 h-3 mr-1.5" />
                  {badgeInfo.label}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
                {labels?.Skip_Button || 'SKIP'}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePray}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4" />
                {labels?.Pray_Button || 'PRAY'}
              </Button>
            </div>
          </div>

          {/* Mobile: Type Badge on First Row, Buttons on Second Row */}
          <div className="flex sm:hidden flex-col gap-3 w-full">
            {/* Type Badge Row */}
            <div>
              {badgeInfo && (
                <Badge className={`text-xs rounded-full ${badgeInfo.className}`}>
                  <FontAwesomeIcon icon={badgeInfo.icon} className="w-3 h-3 mr-1.5" />
                  {badgeInfo.label}
                </Badge>
              )}
            </div>

            {/* Swipe Hint Labels (not prominent buttons) */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-between w-full gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">←</span>
                  <X className="w-3.5 h-3.5" />
                  <span>{labels?.Skip_Button || 'SKIP'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faHandsPraying} className="w-3.5 h-3.5" />
                  <span>{labels?.Pray_Button || 'PRAY'}</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">swipe</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Celebration Animation - Enhanced */}
      {showCelebration && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
        >
          <div className="relative">
            {/* Animated checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 500, damping: 20 }}
              className="bg-green-500 rounded-full p-6 shadow-2xl"
            >
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
            </motion.div>

            {/* Ripple effect */}
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 bg-green-500 rounded-full"
            />

            {/* Text below */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className="text-green-600 font-semibold text-lg drop-shadow-md">
                Prayer recorded!
              </span>
            </motion.div>
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
