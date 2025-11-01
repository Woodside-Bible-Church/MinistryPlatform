"use client";

/**
 * Prayer Application
 * Community prayer wall for viewing and submitting prayer requests
 */

import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Heart, TrendingUp, Flame, Calendar, List, Layers } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface WidgetData {
  My_Requests?: {
    Items?: any[];
    Labels?: {
      Submit_Button?: string;
    };
  } | any[];
  Community_Needs?: {
    Items?: any[];
    Labels?: {
      Pray_Button?: string;
      Skip_Button?: string;
      Search_Placeholder?: string;
      Message_Placeholder?: string;
    };
  } | any[];
  User_Stats?: {
    Total_Prayers: number;
    Day_Streak: number;
    Today_Count: number;
  };
}

// Swipeable Prayer Card Component
interface SwipeablePrayerCardProps {
  prayer: any;
  isTop: boolean;
  reverseIndex: number;
  isAuthenticated: boolean;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

function SwipeablePrayerCard({ prayer, isTop, reverseIndex, isAuthenticated, onDragEnd }: SwipeablePrayerCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  return (
    <motion.div
      drag={isTop && isAuthenticated ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={onDragEnd}
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity,
        zIndex: reverseIndex,
      }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      initial={{ scale: 0.95 - reverseIndex * 0.05, y: reverseIndex * 10 }}
      animate={{ scale: 0.95 - reverseIndex * 0.05, y: reverseIndex * 10 }}
    >
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg h-full">
        <h3 className="font-semibold text-xl mb-3">
          {prayer.Entry_Title || prayer.title || "Prayer Request"}
        </h3>
        <p className="text-muted-foreground mb-4 line-clamp-6">
          {prayer.Description || prayer.description}
        </p>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {new Date(prayer.Date_Submitted || prayer.dateSubmitted).toLocaleDateString()}
            </span>
            <span className="text-sm font-medium" style={{ color: "#61BC47" }}>
              {prayer.Prayer_Count || prayer.prayerCount || 0} prayers
            </span>
          </div>
          {isTop && (
            <div className="flex gap-2 mt-4 text-xs text-muted-foreground justify-center">
              {isAuthenticated ? (
                <>
                  <span>← Swipe left to skip</span>
                  <span>|</span>
                  <span>Swipe right to pray →</span>
                </>
              ) : (
                <span>Sign in to pray for this request</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PrayerPage() {
  const session = useSession();
  const [prayers, setPrayers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [stats, setStats] = useState({ totalPrayers: 0, dayStreak: 0, todayCount: 0 });
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"community" | "my-requests">("community");
  const [viewMode, setViewMode] = useState<"stack" | "list">("stack");
  const [currentPrayerIndex, setCurrentPrayerIndex] = useState(0);

  // Set page title
  useEffect(() => {
    document.title = "Prayer - Ministry Apps";
  }, []);

  // Load all prayer data via stored procedure
  useEffect(() => {
    async function loadData() {
      try {
        // Call unified stored procedure endpoint
        const response = await fetch("/api/prayers/widget-data");

        if (!response.ok) throw new Error("Failed to fetch widget data");

        const data: WidgetData = await response.json();

        console.log("=== CLIENT: RECEIVED DATA ===");
        console.log("Full response:", JSON.stringify(data, null, 2));
        console.log("Community_Needs:", data.Community_Needs);
        console.log("Community_Needs.Items:", data.Community_Needs?.Items);
        console.log("My_Requests:", data.My_Requests);
        console.log("My_Requests.Items:", data.My_Requests?.Items);

        // Store full widget data including Labels
        setWidgetData(data);

        // Extract data from stored proc response
        // The stored proc returns data with Items arrays inside each section
        const communityPrayers = data.Community_Needs?.Items || data.Community_Needs || [];
        const myPrayers = data.My_Requests?.Items || data.My_Requests || [];

        console.log("Extracted communityPrayers:", communityPrayers);
        console.log("Extracted myPrayers:", myPrayers);
        console.log("communityPrayers length:", communityPrayers.length);
        console.log("myPrayers length:", myPrayers.length);

        setPrayers(communityPrayers);
        setMyRequests(myPrayers);

        if (data.User_Stats) {
          // Stats come as objects with {Label, Count} structure from stored proc
          setStats({
            totalPrayers: data.User_Stats.Total_Prayers?.Count || data.User_Stats.Total_Prayers || 0,
            dayStreak: data.User_Stats.Prayer_Streak?.Count || data.User_Stats.Day_Streak || 0,
            todayCount: data.User_Stats.Prayers_Today?.Count || data.User_Stats.Today_Count || 0,
          });
        }
      } catch (error) {
        console.error("Error loading prayer data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [session?.user]);

  // Prompt user to log in with redirect back to prayer page
  const promptLogin = () => {
    signIn(undefined, { callbackUrl: "/prayer" });
  };

  // Handle praying for a prayer
  const handlePray = async (prayerId: number) => {
    if (!session?.user) {
      promptLogin();
      return;
    }

    try {
      const response = await fetch(`/api/prayers/${prayerId}/pray`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "" }), // Can add message dialog later
      });

      if (!response.ok) throw new Error("Failed to record prayer");

      const data = await response.json();

      // Update prayer count optimistically (handle both field name formats)
      setPrayers((prev) =>
        prev.map((p: any) => {
          const id = p.Feedback_Entry_ID || p.id;
          if (id === prayerId) {
            return {
              ...p,
              Prayer_Count: data.prayerCount,
              prayerCount: data.prayerCount,
            };
          }
          return p;
        })
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalPrayers: prev.totalPrayers + 1,
        todayCount: prev.todayCount + 1,
      }));
    } catch (error) {
      console.error("Error recording prayer:", error);
    }
  };

  // Handle swipe on prayer card
  const handleDragEnd = async (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    prayer: any
  ) => {
    const swipeThreshold = 100;
    const { offset, velocity } = info;

    // Swipe right = pray
    if (offset.x > swipeThreshold || velocity.x > 500) {
      const prayerId = prayer.Feedback_Entry_ID || prayer.id;
      await handlePray(prayerId);

      // Move to next prayer in stack mode
      if (viewMode === "stack") {
        setCurrentPrayerIndex((prev) => prev + 1);
      }
    }
    // Swipe left = skip
    else if (offset.x < -swipeThreshold || velocity.x < -500) {
      // Move to next prayer in stack mode
      if (viewMode === "stack") {
        setCurrentPrayerIndex((prev) => prev + 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
            PRAYER & PRAISE
          </h1>
          <p className="text-muted-foreground">
            Share burdens, celebrate victories
          </p>
        </div>

        {/* Stats Dashboard */}
        {session?.user && !isLoading && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" style={{ color: "#61BC47" }} />
                <div className="text-2xl font-bold">{stats.totalPrayers}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Prayers</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="w-5 h-5" style={{ color: "#61BC47" }} />
                <div className="text-2xl font-bold">{stats.dayStreak}</div>
              </div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-5 h-5" style={{ color: "#61BC47" }} />
                <div className="text-2xl font-bold">{stats.todayCount}</div>
              </div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {session?.user && (
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab("community")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "community"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Community Needs
            </button>
            <button
              onClick={() => setActiveTab("my-requests")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "my-requests"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Requests
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* View Mode Toggle & Submit Button */}
          <div className="flex justify-between items-center">
            {activeTab === "community" && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "stack" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("stack")}
                  className="gap-2"
                  style={viewMode === "stack" ? { backgroundColor: "#61BC47" } : {}}
                >
                  <Layers className="w-4 h-4" />
                  Stack
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-2"
                  style={viewMode === "list" ? { backgroundColor: "#61BC47" } : {}}
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
              </div>
            )}
            {activeTab === "my-requests" && <div />}
            <Button
              className="gap-2"
              style={{ backgroundColor: "#61BC47" }}
              onClick={() => session?.user ? null : promptLogin()}
            >
              <Plus className="w-4 h-4" />
              {/* Use label from database - always show same text, trigger login on click if needed */}
              {(widgetData?.My_Requests && !Array.isArray(widgetData.My_Requests)
                ? widgetData.My_Requests.Labels?.Submit_Button
                : null) || "Submit Prayer Request"}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#61BC47" }} />
              <p className="text-muted-foreground">Loading prayers...</p>
            </div>
          ) : (
            <>
              {/* Community Needs Tab */}
              {activeTab === "community" && (
                <div>
                  {prayers.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-muted rounded-lg bg-muted/20">
                      <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No prayer requests yet. Be the first to share!
                      </p>
                    </div>
                  ) : viewMode === "stack" ? (
                    /* Stack View - Swipeable Cards */
                    <div className="relative h-[500px] flex items-center justify-center">
                      {currentPrayerIndex >= prayers.length ? (
                        <div className="text-center py-12">
                          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-2">You've gone through all prayers!</p>
                          <Button
                            onClick={() => setCurrentPrayerIndex(0)}
                            variant="outline"
                            className="gap-2"
                          >
                            Start Over
                          </Button>
                        </div>
                      ) : (
                        <div className="relative w-full max-w-md">
                          {prayers
                            .slice(currentPrayerIndex, currentPrayerIndex + 3)
                            .reverse()
                            .map((prayer: any, index: number, array: any[]) => {
                              const reverseIndex = array.length - 1 - index;
                              const isTop = reverseIndex === array.length - 1;

                              return (
                                <SwipeablePrayerCard
                                  key={prayer.Feedback_Entry_ID || prayer.id}
                                  prayer={prayer}
                                  isTop={isTop}
                                  reverseIndex={reverseIndex}
                                  isAuthenticated={!!session?.user}
                                  onDragEnd={(event, info) => isTop && handleDragEnd(event, info, prayer)}
                                />
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* List View - Original Layout */
                    <div className="grid grid-cols-1 gap-4">
                      {prayers.map((prayer: any) => (
                        <div
                          key={prayer.Feedback_Entry_ID || prayer.id}
                          className="bg-card border border-border rounded-lg p-6 shadow-sm"
                        >
                          <h3 className="font-semibold text-lg mb-2">
                            {prayer.Entry_Title || prayer.title || "Prayer Request"}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {prayer.Description || prayer.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(prayer.Date_Submitted || prayer.dateSubmitted).toLocaleDateString()}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => handlePray(prayer.Feedback_Entry_ID || prayer.id)}
                            >
                              <Heart className="w-4 h-4" style={{ color: "#61BC47" }} />
                              {/* Use label from database - always show same text, trigger login on click if needed */}
                              {(widgetData?.Community_Needs && !Array.isArray(widgetData.Community_Needs)
                                ? widgetData.Community_Needs.Labels?.Pray_Button
                                : null) || "PRAY"} ({prayer.Prayer_Count || prayer.prayerCount || 0})
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Requests Tab */}
              {activeTab === "my-requests" && (
                <div>
                  {myRequests.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-muted rounded-lg bg-muted/20">
                      <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        You haven't submitted any prayer requests yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {myRequests.map((prayer: any) => (
                        <div
                          key={prayer.Feedback_Entry_ID || prayer.id}
                          className="bg-card border border-border rounded-lg p-6 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">
                              {prayer.Entry_Title || prayer.title || "Prayer Request"}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                prayer.Approved || prayer.approved
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              }`}
                            >
                              {prayer.Approved || prayer.approved ? "Approved" : "Pending Review"}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            {prayer.Description || prayer.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(prayer.Date_Submitted || prayer.dateSubmitted).toLocaleDateString()}
                            </span>
                            <span className="text-sm font-medium" style={{ color: "#61BC47" }}>
                              {prayer.Prayer_Count || prayer.prayerCount || 0} {(prayer.Prayer_Count || prayer.prayerCount || 0) === 1 ? "prayer" : "prayers"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
