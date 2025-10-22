'use client';

/**
 * Prayer Card Component
 * Displays a single prayer with swipe-to-pray functionality
 */

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, X, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { requireLogin } from '@/lib/mpLogin';

interface PrayerCardProps {
  prayer: {
    Feedback_Entry_ID: number;
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
  };
  onPrayedFor?: (id: number) => void;
  onDismiss?: (id: number) => void;
  showSwipeHint?: boolean;
}

export function PrayerCard({ prayer, onPrayedFor, onDismiss, showSwipeHint = false }: PrayerCardProps) {
  const [exitX, setExitX] = useState(0);
  const [showHint, setShowHint] = useState(showSwipeHint);
  const [prayerCount, setPrayerCount] = useState(prayer.Prayer_Count ?? 0);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setShowHint(false);

    // Swipe right = Prayed for
    if (info.offset.x > 100) {
      // Require login before praying
      if (!requireLogin()) {
        return; // Will redirect to login
      }

      setExitX(1000);

      // Increment prayer count via API
      try {
        const response = await authenticatedFetch(`/api/prayers/${prayer.Feedback_Entry_ID}/pray`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          setPrayerCount(data.prayer_count);
        }
      } catch (error) {
        console.error('Failed to increment prayer count:', error);
      }

      if (onPrayedFor) {
        onPrayedFor(prayer.Feedback_Entry_ID);
      }
    }
    // Swipe left = Dismiss/Skip (no login required)
    else if (info.offset.x < -100) {
      setExitX(-1000);
      if (onDismiss) {
        onDismiss(prayer.Feedback_Entry_ID);
      }
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
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {prayer.Entry_Title && (
                <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                  {prayer.Entry_Title}
                </h3>
              )}

              <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                {prayer.Contact_ID_Table && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{prayer.Contact_ID_Table.First_Name}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(prayer.Date_Submitted)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {prayer.Feedback_Type_ID_Table && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
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
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {prayer.Description}
          </p>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary fill-primary" />
              <span className="font-medium text-foreground">
                {prayerCount} {prayerCount === 1 ? 'prayer' : 'prayers'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-red-500">
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Skip</span>
              </div>
              <div className="flex items-center gap-2 text-green-500">
                <span className="hidden sm:inline">Pray</span>
                <Heart className="w-4 h-4" />
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Swipe indicators */}
      <motion.div
        className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-start pl-8 pointer-events-none"
        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
      >
        <Heart className="w-16 h-16 text-green-600" />
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
