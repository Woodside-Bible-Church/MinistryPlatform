'use client';

/**
 * Prayer Widget Main Page
 * Displays prayer requests with swipe functionality and submission form
 */

import { useState, useEffect, useMemo } from 'react';
import { PrayerList } from '@/components/prayer/PrayerList';
import { MyPrayers } from '@/components/prayer/MyPrayers';
import { PrayerForm } from '@/components/prayer/PrayerForm';
import { PrayerStats } from '@/components/prayer/PrayerStats';
import { PeoplePrayedFor } from '@/components/prayer/PeoplePrayedFor';
import { Button } from '@/components/ui/button';
import { Plus, List, Layers, User2, Heart, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { requireLogin, isLoggedIn } from '@/lib/mpLogin';
import { useWidgetData } from '@/hooks/useWidgetData';
import {
  adaptMyRequestItem,
  adaptPrayerPartnerItem,
  adaptCommunityNeedItem,
} from '@/lib/widgetDataAdapter';

// Force dynamic rendering - this page uses browser APIs (localStorage, window, etc.)
export const dynamic = 'force-dynamic';

export default function PrayerPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'stack' | 'list'>('stack');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  // Fetch unified widget data
  const { data: widgetData, isLoading: widgetLoading, error: widgetError } = useWidgetData(refreshKey);

  // Transform unified data to legacy component format
  const myRequestsData = useMemo(() => {
    if (!widgetData?.My_Requests?.Items) return [];
    return widgetData.My_Requests.Items.map(item => adaptMyRequestItem(item, widgetData.User_Info));
  }, [widgetData]);

  const prayerPartnersData = useMemo(() => {
    if (!widgetData?.Prayer_Partners?.Items) return [];
    return widgetData.Prayer_Partners.Items.map(adaptPrayerPartnerItem);
  }, [widgetData]);

  const communityNeedsData = useMemo(() => {
    if (!widgetData?.Community_Needs?.Items) return [];
    return widgetData.Community_Needs.Items.map(adaptCommunityNeedItem);
  }, [widgetData]);

  // Log unified data when it loads
  useEffect(() => {
    if (widgetData) {
      console.log('[Prayer Page] Unified widget data loaded:', {
        title: widgetData.Widget_Title,
        subtitle: widgetData.Widget_Subtitle,
        userStats: widgetData.User_Stats,
        myRequestsCount: widgetData.My_Requests.Total_Count,
        prayerPartnersCount: widgetData.Prayer_Partners.Total_Count,
        communityNeedsCount: widgetData.Community_Needs.Total_Count,
      });
      console.log('[Prayer Page] Full unified data:', widgetData);
      console.log('[Prayer Page] Transformed data:', {
        myRequests: myRequestsData,
        prayerPartners: prayerPartnersData,
        communityNeeds: communityNeedsData,
      });
    }
    if (widgetError) {
      console.error('[Prayer Page] Error loading unified data:', widgetError);
    }
  }, [widgetData, widgetError, myRequestsData, prayerPartnersData, communityNeedsData]);

  useEffect(() => {
    // Check login status on mount and when window gains focus
    const checkLogin = () => {
      const wasLoggedIn = loggedIn;
      const isNowLoggedIn = isLoggedIn();

      setLoggedIn(isNowLoggedIn);

      // If login status changed, refresh widget data
      if (wasLoggedIn !== isNowLoggedIn) {
        console.log('[Prayer Page] Login status changed:', isNowLoggedIn ? 'logged in' : 'logged out');
        setRefreshKey(prev => prev + 1);
      }
    };

    checkLogin();

    window.addEventListener('focus', checkLogin);

    // Poll for login status changes every second
    // This detects when MP login widget updates localStorage
    const pollInterval = setInterval(checkLogin, 1000);

    // Listen for auth token from parent window (when embedded as widget)
    const handleMessage = (event: MessageEvent) => {
      // TODO: Add origin verification in production
      // if (event.origin !== 'https://woodsidebible.org') return;

      if (event.data.type === 'AUTH_TOKEN') {
        if (event.data.token) {
          localStorage.setItem('mpp-widgets_AuthToken', event.data.token);
        } else {
          localStorage.removeItem('mpp-widgets_AuthToken');
        }
        checkLogin();
      }
    };

    window.addEventListener('message', handleMessage);

    // Auto-resize iframe if embedded
    const sendHeightToParent = () => {
      if (window.self !== window.top) {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({
          type: 'RESIZE',
          height: height
        }, '*');
      }
    };

    // Send initial height
    sendHeightToParent();

    // Watch for content changes and update height
    const resizeObserver = new ResizeObserver(() => {
      sendHeightToParent();
    });

    resizeObserver.observe(document.body);

    // Also check on interval as fallback
    const intervalId = setInterval(sendHeightToParent, 1000);

    return () => {
      window.removeEventListener('focus', checkLogin);
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
      resizeObserver.disconnect();
      clearInterval(intervalId);
    };
  }, [loggedIn]); // Add loggedIn to dependencies so we can compare previous state

  const handlePrayerSubmitted = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Trigger a refresh of the prayer list
  };

  const handleSubmitClick = () => {
    if (requireLogin()) {
      setShowForm(true);
    }
  };

  // Show loading state while unified data is being fetched
  if (widgetLoading) {
    return (
      <div className="bg-gradient-to-b from-background to-muted/20 min-h-screen">
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Prayer & Praise</h1>
          <p className="text-sm text-muted-foreground mt-1">Share burdens, celebrate victories</p>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading prayer data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
        {/* Simplified Header */}
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Prayer & Praise</h1>
          <p className="text-sm text-muted-foreground mt-1">Share burdens, celebrate victories</p>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 space-y-12 pb-12">
          {/* Prayer Stats - Only show if logged in */}
          {loggedIn && widgetData?.User_Stats && (
            <div className="max-w-2xl mx-auto">
              <PrayerStats stats={widgetData.User_Stats} isLoading={widgetLoading} />
            </div>
          )}

          {/* My Prayers Section - Always visible, shows login prompt if not authenticated */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <User2 className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">My Requests</h2>
              </div>

              {/* Submit Prayer Button */}
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto" onClick={handleSubmitClick}>
                    <Plus className="w-4 h-4" />
                    Submit Prayer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit a Prayer Request</DialogTitle>
                    <DialogDescription>
                      Share your prayer request with the community.
                    </DialogDescription>
                  </DialogHeader>
                  <PrayerForm
                    onSuccess={handlePrayerSubmitted}
                    onCancel={() => setShowForm(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-muted-foreground text-sm">
              Track your prayer requests and see who&apos;s lifting you up.
            </p>
            {loggedIn ? (
              <MyPrayers
                prayers={widgetLoading ? [] : myRequestsData}
                isLoading={widgetLoading}
              />
            ) : (
              <div className="text-center py-12 border border-dashed border-muted rounded-lg bg-muted/20">
                <User2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Sign in to view and manage your prayer requests</p>
                <Button onClick={() => requireLogin()} variant="default">
                  Sign In
                </Button>
              </div>
            )}
          </section>

          {/* Prayer Partners Section - Always visible, shows login prompt if not authenticated */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Prayer Partners</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              See who you&apos;ve been standing with in prayer.
            </p>
            {loggedIn ? (
              <PeoplePrayedFor
                prayers={widgetLoading ? [] : prayerPartnersData}
                isLoading={widgetLoading}
              />
            ) : (
              <div className="text-center py-12 border border-dashed border-muted rounded-lg bg-muted/20">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Sign in to see your prayer history and encouraging messages</p>
                <Button onClick={() => requireLogin()} variant="default">
                  Sign In
                </Button>
              </div>
            )}
          </section>

          {/* Prayer Wall Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Community Needs</h2>
              </div>

              {/* View Mode Toggle - Desktop Only */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'stack' ? 'list' : 'stack')}
                className="hidden sm:flex gap-2 h-8"
              >
                {viewMode === 'stack' ? (
                  <>
                    <List className="w-4 h-4" />
                    List
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    Stack
                  </>
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Join others in lifting up these requests and celebrating answered prayers.
            </p>
            <PrayerList
              mode={viewMode}
              prayers={widgetLoading ? [] : communityNeedsData}
              isLoading={widgetLoading}
            />
          </section>
        </main>
      </div>
  );
}
