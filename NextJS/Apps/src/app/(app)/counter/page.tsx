"use client";

// Counter app - track event metrics
import { useState, useEffect, useRef } from "react";
import {
  format,
  addDays,
  subDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay
} from "date-fns";
import {
  Calendar,
  Activity,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Hash,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberSpinner } from "@/components/ui/number-spinner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { useCampus } from "@/contexts/CampusContext";

type Event = {
  Event_ID: number;
  Event_Title: string;
};

type Metric = {
  Metric_ID: number;
  Metric_Title: string;
  Is_Headcount: boolean;
};

type EventMetric = {
  Event_Metric_ID: number;
  Event_ID: number;
  Metric_ID: number;
  Numerical_Value: number;
  Group_ID?: number | null;
};

export default function CounterPage() {
  const { selectedCampus } = useCampus();

  // Set page title
  useEffect(() => {
    document.title = "Counter - Ministry Apps";
  }, []);

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [count, setCount] = useState(0);

  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [existingMetrics, setExistingMetrics] = useState<EventMetric[]>([]);

  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingExistingMetrics, setIsLoadingExistingMetrics] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState<number | null>(null);

  // Refs for auto-scrolling
  const eventSectionRef = useRef<HTMLDivElement>(null);
  const existingMetricsRef = useRef<HTMLDivElement>(null);
  const metricSectionRef = useRef<HTMLDivElement>(null);

  // Ref to track previous metrics data for comparison
  const previousMetricsRef = useRef<string>("");

  // State for calendar dialog
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Poll for updates every 5 seconds when viewing metrics
  useEffect(() => {
    if (!selectedEvent) return;

    console.log(`🔄 Starting polling for Event ${selectedEvent.Event_ID}...`);

    // Initial fetch is already done in loadExistingMetrics effect
    // Set up interval for subsequent polls
    const interval = setInterval(async () => {
      try {
        console.log(`📡 Polling for updates to Event ${selectedEvent.Event_ID}...`);
        const response = await fetch(
          `/api/counter/event-metrics/${selectedEvent.Event_ID}`
        );
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const data = await response.json();

        // Compare with previous data
        const dataString = JSON.stringify(data);
        if (dataString !== previousMetricsRef.current) {
          console.log("✅ New metrics detected:", data);
          previousMetricsRef.current = dataString;
          setExistingMetrics(data);
        }
      } catch (error) {
        console.error("Error polling metrics:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log(`🛑 Stopped polling for Event ${selectedEvent.Event_ID}`);
      clearInterval(interval);
    };
  }, [selectedEvent]);

  // Load metrics on mount
  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch("/api/counter/metrics");
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Error loading metrics:", error);
      } finally {
        setIsLoadingMetrics(false);
      }
    }
    loadMetrics();
  }, []);

  // Load events when date or campus changes
  useEffect(() => {
    if (!selectedDate || !selectedCampus) {
      setEvents([]);
      setSelectedEvent(null);
      return;
    }

    async function loadEvents() {
      if (!selectedCampus) return;

      setIsLoadingEvents(true);
      try {
        // Omit congregationId for Church Wide (Congregation_ID = 1) to get all congregations
        const url =
          selectedCampus.Congregation_ID === 1
            ? `/api/counter/events?date=${selectedDate}`
            : `/api/counter/events?date=${selectedDate}&congregationId=${selectedCampus.Congregation_ID}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error loading events:", error);
        setEvents([]);
      } finally {
        setIsLoadingEvents(false);
      }
    }

    loadEvents();
  }, [selectedDate, selectedCampus]);

  // Load existing metrics when event is selected
  useEffect(() => {
    if (!selectedEvent) {
      setExistingMetrics([]);
      setIsAdding(false);
      setEditingMetricId(null);
      setSelectedMetric(null);
      setCount(0);
      return;
    }

    async function loadExistingMetrics() {
      if (!selectedEvent) return;

      setIsLoadingExistingMetrics(true);
      try {
        const response = await fetch(
          `/api/counter/event-metrics/${selectedEvent.Event_ID}`
        );
        if (!response.ok) throw new Error("Failed to fetch existing metrics");
        const data = await response.json();
        setExistingMetrics(data);

        // Automatically set isAdding based on whether metrics exist
        // If no metrics, enter "adding" mode; if metrics exist, show them
        setIsAdding(data.length === 0);
      } catch (error) {
        console.error("Error loading existing metrics:", error);
        setExistingMetrics([]);
      } finally {
        setIsLoadingExistingMetrics(false);
      }
    }

    loadExistingMetrics();
  }, [selectedEvent]);

  // Auto-scroll to event section when events are loaded
  useEffect(() => {
    if (events.length > 0 && eventSectionRef.current) {
      setTimeout(() => {
        eventSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 300);
    }
  }, [events]);

  // Auto-scroll to existing metrics when loaded
  useEffect(() => {
    if (
      existingMetrics.length > 0 &&
      existingMetricsRef.current &&
      !isAdding &&
      !editingMetricId
    ) {
      setTimeout(() => {
        existingMetricsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 300);
    }
  }, [existingMetrics, isAdding, editingMetricId]);

  // Auto-scroll to metric section when adding or editing
  useEffect(() => {
    if ((isAdding || editingMetricId) && metricSectionRef.current) {
      setTimeout(() => {
        metricSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 300);
    }
  }, [isAdding, editingMetricId]);

  const handleSubmit = async () => {
    if (!selectedEvent || !selectedMetric || count === 0) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      if (editingMetricId) {
        // Update existing metric
        const response = await fetch(
          `/api/counter/event-metrics/${selectedEvent.Event_ID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventMetricId: editingMetricId,
              data: {
                Metric_ID: selectedMetric.Metric_ID,
                Numerical_Value: count
              }
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          throw new Error(errorData.error || "Failed to update metric");
        }
      } else {
        // Create new metric
        const response = await fetch("/api/counter/event-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Event_ID: selectedEvent.Event_ID,
            Metric_ID: selectedMetric.Metric_ID,
            Numerical_Value: count
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          throw new Error(errorData.error || "Failed to submit metric");
        }
      }

      // Success!
      setSubmitSuccess(true);

      // Reload existing metrics
      const metricsResponse = await fetch(
        `/api/counter/event-metrics/${selectedEvent.Event_ID}`
      );
      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setExistingMetrics(data);
      }

      // Reset form after 1 second
      setTimeout(() => {
        setIsAdding(false);
        setEditingMetricId(null);
        setSelectedMetric(null);
        setCount(0);
        setSubmitSuccess(false);
      }, 1000);
    } catch (error) {
      console.error("Error submitting metric:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit metric. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (em: EventMetric) => {
    setIsAdding(false);
    setEditingMetricId(em.Event_Metric_ID);
    const metric = metrics.find((m) => m.Metric_ID === em.Metric_ID);
    if (metric) {
      setSelectedMetric(metric);
      setCount(em.Numerical_Value);
    }
  };

  const handleDelete = async (eventMetricId: number) => {
    if (!confirm("Are you sure you want to delete this metric?")) return;

    if (!selectedEvent) return;

    try {
      const response = await fetch(
        `/api/counter/event-metrics/${selectedEvent.Event_ID}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventMetricId })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete metric");
      }

      // Reload existing metrics
      const metricsResponse = await fetch(
        `/api/counter/event-metrics/${selectedEvent.Event_ID}`
      );
      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setExistingMetrics(data);
        // Reset form if we're editing the metric that was just deleted
        if (editingMetricId === eventMetricId) {
          setEditingMetricId(null);
          setSelectedMetric(null);
          setCount(0);
        }
      }
    } catch (error) {
      console.error("Error deleting metric:", error);
      alert("Failed to delete metric. Please try again.");
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingMetricId(null);
    setSelectedMetric(null);
    setCount(0);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setEditingMetricId(null);
    setSelectedMetric(null);
    setCount(0);
  };

  const getMetricName = (metricId: number) => {
    return (
      metrics.find((m) => m.Metric_ID === metricId)?.Metric_Title ||
      "Unknown Metric"
    );
  };

  const canSubmit = selectedEvent && selectedMetric && count > 0;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary dark:text-foreground mb-2">
            COUNTER
          </h1>
          <p className="text-muted-foreground">
            Track event metrics in real-time
          </p>
        </div>

        {/* Selection Steps */}
        <div className="space-y-6">
          {/* Step 1: Date Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#61bc47]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">DATE</h3>
                <p className="text-sm text-muted-foreground">
                  When did this occur?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  const newDate = format(
                    subDays(parseISO(selectedDate), 1),
                    "yyyy-MM-dd"
                  );
                  setSelectedDate(newDate);
                  setSelectedEvent(null);
                }}
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-base font-medium"
                  >
                    {format(parseISO(selectedDate), "MMM d, yyyy")}
                  </Button>
                </DialogTrigger>
                <DialogPortal>
                  <DialogOverlay className="" />
                  <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] h-100 flex justify-center items-center">
                    <DialogTitle className="sr-only">Select Date</DialogTitle>
                    <div className="h-full w-full flex justify-center items-center">
                      <CalendarComponent
                        mode="single"
                        selected={parseISO(selectedDate)}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(format(date, "yyyy-MM-dd"));
                            setSelectedEvent(null);
                            setIsCalendarOpen(false);
                          }
                        }}
                        initialFocus
                        className="h-full"
                      />
                    </div>
                  </DialogContent>
                </DialogPortal>
              </Dialog>

              <Button
                onClick={() => {
                  const newDate = format(
                    addDays(parseISO(selectedDate), 1),
                    "yyyy-MM-dd"
                  );
                  setSelectedDate(newDate);
                  setSelectedEvent(null);
                }}
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Step 2: Event Selection */}
          <AnimatePresence>
            {selectedCampus && (
              <motion.div
                ref={eventSectionRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#61bc47]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">EVENT</h3>
                    <p className="text-sm text-muted-foreground">
                      What happened?
                    </p>
                  </div>
                </div>
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events found for this date and campus
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {events.map((event) => (
                      <button
                        key={event.Event_ID}
                        onClick={() => setSelectedEvent(event)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedEvent?.Event_ID === event.Event_ID
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50 hover:shadow-sm"
                        }`}
                      >
                        <p className="font-semibold">{event.Event_Title}</p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Existing Metrics Display */}
          <AnimatePresence>
            {selectedEvent &&
              !isLoadingExistingMetrics &&
              existingMetrics.length > 0 &&
              !isAdding &&
              !editingMetricId && (
                <motion.div
                  ref={existingMetricsRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-[#61bc47]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          EXISTING METRICS
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Current counts for this event
                        </p>
                      </div>
                    </div>
                    <Button onClick={startAdding} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Metric
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {existingMetrics.map((em) => (
                      <div
                        key={em.Event_Metric_ID}
                        className="p-4 rounded-lg border border-border bg-background flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {getMetricName(em.Metric_ID)}
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {em.Numerical_Value}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(em)}
                            className="hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(em.Event_Metric_ID)}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Step 4: Add/Edit Metric Form */}
          <AnimatePresence>
            {selectedEvent &&
              (isAdding ||
                editingMetricId ||
                (existingMetrics.length === 0 &&
                  !isLoadingExistingMetrics)) && (
                <motion.div
                  ref={metricSectionRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-[#61bc47]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {editingMetricId
                            ? "EDIT METRIC"
                            : existingMetrics.length === 0
                            ? "ADD FIRST METRIC"
                            : "ADD METRIC"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {editingMetricId
                            ? "Update the count"
                            : "What are you counting?"}
                        </p>
                      </div>
                    </div>
                    {(existingMetrics.length > 0 || editingMetricId) && (
                      <Button
                        onClick={cancelAdding}
                        size="sm"
                        variant="ghost"
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Metric Selection */}
                  {!selectedMetric ? (
                    <>
                      {isLoadingMetrics ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {metrics.map((metric) => (
                            <button
                              key={metric.Metric_ID}
                              onClick={() => setSelectedMetric(metric)}
                              className="p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
                            >
                              <p className="font-semibold">
                                {metric.Metric_Title}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Count Input */
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Selected Metric
                          </p>
                          <p className="font-semibold text-lg">
                            {selectedMetric.Metric_Title}
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedMetric(null);
                            setCount(0);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          Change
                        </Button>
                      </div>

                      <div className="text-center">
                        <h4 className="font-semibold text-foreground text-xl mb-2">
                          HOW MANY?
                        </h4>
                        <p className="text-sm text-muted-foreground mb-6">
                          Enter the count for {selectedMetric.Metric_Title}
                        </p>
                        <div className="flex justify-center mb-6">
                          <NumberSpinner
                            value={count}
                            onChange={setCount}
                            min={0}
                            max={9999}
                            step={1}
                            onEnter={handleSubmit}
                          />
                        </div>
                        <Button
                          onClick={handleSubmit}
                          disabled={!canSubmit || isSubmitting || submitSuccess}
                          className="w-full h-14 text-lg font-semibold"
                          size="lg"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {editingMetricId
                                ? "Updating..."
                                : "Submitting..."}
                            </>
                          ) : submitSuccess ? (
                            <>
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              {editingMetricId ? "Updated!" : "Submitted!"}
                            </>
                          ) : (
                            <>
                              {editingMetricId ? "Update" : "Submit"}
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
