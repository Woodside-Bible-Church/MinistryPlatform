'use client';

/**
 * Prayer Widget Main Page
 * Displays prayer requests with swipe functionality and submission form
 */

import { useState, useEffect } from 'react';
import { PrayerList } from '@/components/prayer/PrayerList';
import { MyPrayers } from '@/components/prayer/MyPrayers';
import { PrayerForm } from '@/components/prayer/PrayerForm';
import { Button } from '@/components/ui/button';
import { Plus, List, Layers, User2, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireLogin, isLoggedIn } from '@/lib/mpLogin';

export default function PrayerPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'stack' | 'list'>('stack');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('wall');
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

    return () => {
      window.removeEventListener('focus', checkLogin);
      window.removeEventListener('message', handleMessage);
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

  const handleMyPrayersClick = (value: string) => {
    if (value === 'mine') {
      if (requireLogin()) {
        setActiveTab('mine');
      }
    } else {
      setActiveTab(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Prayer Wall</h1>
                <p className="text-sm text-muted-foreground">Share and pray for one another</p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'stack' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('stack')}
                    className="h-8"
                  >
                    <Layers className="w-4 h-4 mr-1" />
                    Stack
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8"
                  >
                    <List className="w-4 h-4 mr-1" />
                    List
                  </Button>
                </div>

                {/* Submit Prayer Button */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={handleSubmitClick}>
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Submit Prayer</span>
                      <span className="sm:hidden">Submit</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Submit a Prayer Request</DialogTitle>
                      <DialogDescription>
                        Share your prayer request with the community. Your request will be reviewed before being posted.
                      </DialogDescription>
                    </DialogHeader>
                    <PrayerForm
                      onSuccess={handlePrayerSubmitted}
                      onCancel={() => setShowForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={handleMyPrayersClick} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="wall" className="gap-2">
                  <Layers className="w-4 h-4" />
                  Prayer Wall
                </TabsTrigger>
                <TabsTrigger value="mine" className="gap-2">
                  {!loggedIn && <LogIn className="w-4 h-4" />}
                  {loggedIn && <User2 className="w-4 h-4" />}
                  My Prayers
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="wall" className="mt-0">
              <div className="mb-6 text-center">
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Swipe right to pray for a request, or swipe left to see the next one.
                  Join us in lifting up our community in prayer.
                </p>
              </div>

              <PrayerList key={refreshKey} mode={viewMode} onlyApproved={true} />
            </TabsContent>

            <TabsContent value="mine" className="mt-0">
              <div className="mb-6 text-center">
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  View all your submitted prayer requests and see how many people have prayed for them.
                </p>
              </div>

              <MyPrayers key={refreshKey} />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>Prayer requests are reviewed before posting</p>
            <p className="mt-1">Made with ❤️ for ministry</p>
          </div>
        </footer>
      </div>
  );
}
