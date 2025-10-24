'use client';

/**
 * People I've Prayed For Component
 * Shows list of prayer requests the user has prayed for
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { Clock, Heart } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsPraying } from '@fortawesome/free-solid-svg-icons';

interface PrayerResponse {
  Feedback_Entry_User_Response_ID: number;
  Feedback_Entry_ID: number;
  Response_Date: string;
  Response_Text: string | null;
  Entry_Title: string;
  Description: string;
  Date_Submitted: string;
  Prayer_Count?: number | null;
  Feedback_Type_ID: number;
  Visibility_Level_ID?: number | null;
  Target_Date?: string | null;
  Ongoing_Need?: boolean | null;
  Contact_ID: number;
  Anonymous_Share?: boolean | null;
  contactImageUrl?: string | null;
  contactFirstName?: string;
  contactLastName?: string;
  contactDisplayName?: string;
}

interface PeoplePrayedForProps {
  prayers: PrayerResponse[];
  isLoading?: boolean;
  error?: string | null;
}

export function PeoplePrayedFor({ prayers, isLoading = false, error = null }: PeoplePrayedForProps) {

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

  const handlePrayAgain = (prayerId: number) => {
    // TODO: Implement pray again dialog
    console.log('Pray again for prayer:', prayerId);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto horizontal-scroll pb-4 -mx-4 px-4">
          <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="flex-shrink-0 w-[calc(100vw-3rem)] sm:w-[400px]">
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
    // Check if error is authentication-related
    const isAuthError = error.includes('authentication') ||
                       error.includes('Unauthorized') ||
                       error.includes('expired') ||
                       error.includes('Invalid token');

    if (isAuthError) {
      return (
        <div className="w-full">
          <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
            <CardContent className="py-8 text-center">
              <div className="mb-4">
                <Heart className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <h3 className="text-lg font-semibold text-foreground">Sign In to View Prayer Partners</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Please sign in to see who you&apos;ve been standing with in prayer
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
        </div>
      );
    }

    // For non-auth errors, silently hide the component
    return null;
  }

  if (prayers.length === 0) {
    return (
      <div className="w-full">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-8 text-center">
            <div className="mb-4">
              <FontAwesomeIcon icon={faHandsPraying} className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-semibold text-foreground">No Prayer Partners Yet</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Swipe right on prayers in Community Needs to pray for others and they&apos;ll appear here
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
      <div className="overflow-x-auto horizontal-scroll pb-4 -mx-4 px-4 snap-x snap-mandatory sm:snap-none">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {prayers.map((prayer) => (
            <Card key={prayer.Feedback_Entry_User_Response_ID} className="shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-[calc(100vw-3rem)] sm:w-[400px] flex flex-col overflow-hidden p-0 snap-start sm:snap-align-none">
              {/* Colored Header with Avatar, Name and Prayer Count */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b">
                {/* Left: Avatar + Requester Name (if not anonymous) */}
                {!prayer.Anonymous_Share && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {prayer.contactImageUrl && (
                      <img
                        src={prayer.contactImageUrl}
                        alt={`${prayer.contactFirstName} ${prayer.contactLastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    {prayer.contactFirstName && prayer.contactLastName && (
                      <span>{prayer.contactFirstName} {prayer.contactLastName}</span>
                    )}
                  </div>
                )}
                {prayer.Anonymous_Share && (
                  <div className="text-sm font-medium text-muted-foreground italic">
                    Anonymous
                  </div>
                )}

                {/* Right: Prayer Count */}
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4" />
                  <span>
                    {prayer.Prayer_Count ?? 0} {prayer.Prayer_Count === 1 ? 'prayer' : 'prayers'}
                  </span>
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
                {/* Your Encouraging Message */}
                {prayer.Response_Text && (
                  <div className="bg-primary/5 rounded-md p-3 border-l-2 border-primary/30">
                    <p className="text-xs text-muted-foreground mb-1">Your encouraging message:</p>
                    <p className="text-sm italic">&quot;{prayer.Response_Text}&quot;</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-2">
                  {/* Target date or Ongoing */}
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
                </div>

                {/* Spacer to push tags to bottom */}
                <div className="flex-1"></div>

                {/* Wrapping Tags */}
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
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handlePrayAgain(prayer.Feedback_Entry_ID)}
                  className="gap-2 w-full"
                >
                  <FontAwesomeIcon icon={faHandsPraying} className="w-4 h-4" />
                  Pray Again
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
