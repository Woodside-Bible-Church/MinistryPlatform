'use client';

/**
 * Prayer Widget Main Page
 * Displays prayer requests with swipe functionality and submission form
 */

import { useState, useEffect } from 'react';
import { PrayerList } from '@/components/prayer/PrayerList';
import { MyPrayers } from '@/components/prayer/MyPrayers';
import { PrayerForm } from '@/components/prayer/PrayerForm';
import { PrayerStats } from '@/components/prayer/PrayerStats';
import { PeoplePrayedFor } from '@/components/prayer/PeoplePrayedFor';
import { Button } from '@/components/ui/button';
import { Plus, List, Layers, User2, Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { requireLogin, isLoggedIn } from '@/lib/mpLogin';

export default function PrayerPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'stack' | 'list'>('stack');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status on mount and when window gains focus
    const checkLogin = () => setLoggedIn(isLoggedIn());
    checkLogin();

    window.addEventListener('focus', checkLogin);

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
      resizeObserver.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  const handlePrayerSubmitted = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Trigger a refresh of the prayer list
  };

  const handleSubmitClick = () => {
    if (requireLogin()) {
      setShowForm(true);
    }
  };

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
          {loggedIn && (
            <div className="max-w-2xl mx-auto">
              <PrayerStats key={refreshKey} />
            </div>
          )}

          {/* My Prayers Section - Only show if logged in */}
          {loggedIn && (
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
              <MyPrayers key={`my-${refreshKey}`} />
            </section>
          )}

          {/* People I've Prayed For Section - Only show if logged in */}
          {loggedIn && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Prayer Partners</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                See who you&apos;ve been standing with in prayer.
              </p>
              <PeoplePrayedFor key={`prayed-${refreshKey}`} />
            </section>
          )}

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
            <PrayerList key={`wall-${refreshKey}`} mode={viewMode} onlyApproved={true} />
          </section>
        </main>
      </div>
  );
}
