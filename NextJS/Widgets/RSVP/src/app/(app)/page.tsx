"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import ServiceTimeCard from "@/components/rsvp/ServiceTimeCard";
import RSVPForm from "@/components/rsvp/RSVPForm";
import ConfirmationView from "@/components/rsvp/ConfirmationView";
import {
  mockCampuses,
  mockServiceTimes,
  simulateRSVPSubmission,
  ServiceTime,
} from "@/data/mockData";
import {
  RSVPFormInput,
  RSVPConfirmationResponse,
  ServiceTimeResponse,
} from "@/types/rsvp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewType = "services" | "form" | "confirmation";

// Extend Window interface for widget config
interface WidgetWindow extends Window {
  RSVP_WIDGET_CONFIG?: {
    apiBaseUrl?: string;
    containerId?: string;
  };
}

// WordPress location cookie structure
interface WPLocationCookie {
  user_id: number;
  location_id: number;
  location_name: string;
  location_short_name: string;
  location_url: string;
}

/**
 * Read and decode WordPress location cookie from parent page
 * Cookie name: tbx-ws__selected-location
 * Value is base64-encoded JSON
 */
function getWordPressLocationId(): number | null {
  if (typeof document === 'undefined') return null;

  try {
    // Get cookie from document.cookie (accessible from Shadow DOM)
    const cookies = document.cookie.split(';');
    const locationCookie = cookies
      .find(c => c.trim().startsWith('tbx-ws__selected-location='));

    if (!locationCookie) return null;

    // Extract value after '='
    const cookieValue = locationCookie.split('=')[1];
    if (!cookieValue) return null;

    // Decode base64
    const decoded = atob(cookieValue);
    const data: WPLocationCookie = JSON.parse(decoded);

    // Return location_id from cookie
    return data.location_id;
  } catch (error) {
    console.warn('Failed to parse WordPress location cookie:', error);
    return null;
  }
}

export default function RSVPPage() {
  // Get base URL for assets (works in both Next.js and widget contexts)
  const baseUrl = typeof window !== 'undefined' && (window as WidgetWindow).RSVP_WIDGET_CONFIG?.apiBaseUrl
    ? (window as WidgetWindow).RSVP_WIDGET_CONFIG?.apiBaseUrl
    : '';

  // Get default campus from WordPress cookie, fallback to Troy (12)
  const getInitialCampusId = (): number => {
    const wpLocationId = getWordPressLocationId();
    if (wpLocationId) {
      // WordPress location_id maps directly to our campus ID
      console.log(`WordPress location detected: ${wpLocationId}`);
      return wpLocationId;
    }
    return 12; // Default to Troy
  };

  // State
  const [currentView, setCurrentView] = useState<ViewType>("services");
  const [selectedCampusId, setSelectedCampusId] = useState<number>(getInitialCampusId());
  const [selectedServiceTime, setSelectedServiceTime] =
    useState<ServiceTimeResponse | null>(null);
  const [confirmation, setConfirmation] =
    useState<RSVPConfirmationResponse | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1); // Track form step
  const [formData, setFormData] = useState<Partial<RSVPFormInput>>({}); // Store partial form data

  // Send height updates to parent window (for iframe embedding)
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({
        type: 'rsvp-widget-height',
        height: height
      }, '*');
    };

    // Send height on mount and whenever content changes
    sendHeight();

    // Use ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(sendHeight);
    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, [currentView, formStep]);

  // Filter service times by selected campus
  const filteredServiceTimes = useMemo(() => {
    return mockServiceTimes.filter(
      (service) => service.campusId === selectedCampusId
    );
  }, [selectedCampusId]);

  // Group service times by campus for display
  const groupedServiceTimes = useMemo(() => {
    const groups: Record<string, ServiceTime[]> = {};
    filteredServiceTimes.forEach((service) => {
      if (!groups[service.campusName]) {
        groups[service.campusName] = [];
      }
      groups[service.campusName].push(service);
    });
    return groups;
  }, [filteredServiceTimes]);

  // Handlers
  const handleServiceSelect = (serviceTime: ServiceTime) => {
    const serviceTimeResponse: ServiceTimeResponse = {
      Event_ID: serviceTime.eventId,
      Event_Title: serviceTime.title,
      Event_Start_Date: serviceTime.startDate.toISOString(),
      Event_End_Date: serviceTime.endDate.toISOString(),
      Campus_Name: serviceTime.campusName,
      Congregation_ID: serviceTime.campusId,
      Max_Capacity: serviceTime.maxCapacity,
      Total_RSVPs: serviceTime.totalRSVPs,
      Total_Attendees: serviceTime.totalAttendees,
      Capacity_Percentage: serviceTime.capacityPercentage,
      Is_Available: serviceTime.isAvailable,
    };

    setSelectedServiceTime(serviceTimeResponse);
    setCurrentView("form");
  };

  const handleFormSubmit = async (data: RSVPFormInput) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate RSVP submission and get confirmation
    const mockConfirmation = simulateRSVPSubmission(data);

    setConfirmation(mockConfirmation);
    setCurrentView("confirmation");
  };

  const handleBackToServices = () => {
    setCurrentView("services");
    setSelectedServiceTime(null);
    setFormStep(1);
    setFormData({});
  };

  const handleReset = () => {
    setCurrentView("services");
    setSelectedCampusId(12); // Reset to Troy default
    setSelectedServiceTime(null);
    setConfirmation(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Background Image and Content */}
      <section className="relative text-white overflow-hidden pt-16 pb-16">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${baseUrl}/assets/BG.png')` }}
        />

        {/* Content Container */}
        <div className="relative mx-auto px-8 max-w-[1600px]">
          {/* Top Section - Header and Image */}
          <div className="flex gap-8 mb-12">
            {/* Left: Header Text + Instructions */}
            <div className="flex-1 flex flex-col justify-between">
              {/* Main Header - Aligned with top of image */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight text-white">
                  Join us for Christmas Services!
                </h1>
                <p className="text-lg md:text-xl leading-relaxed text-white opacity-90">
                  Our hope is that you, along with your friends and family, come and
                  celebrate Christmas at Woodside!
                </p>
              </div>

              {/* Dynamic Instructions + Campus Filter - Aligned with bottom of image */}
              <div className="space-y-4">
                {/* Instructions based on current view */}
                <div>
                  {currentView === "services" && (
                    <>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        Service Times & Availability
                      </h2>
                      <p className="text-base text-white opacity-80">
                        Select a service time to RSVP
                      </p>
                    </>
                  )}
                  {currentView === "form" && selectedServiceTime && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {formStep === 1 ? "Tell Us About Yourself" : "Complete Your RSVP"}
                      </h2>

                      {/* Cards Container */}
                      <div className="flex flex-wrap gap-4">
                        {/* Service Selection Card - Clickable */}
                        <button
                          onClick={handleBackToServices}
                          className="bg-primary px-4 py-3 max-w-fit text-left hover:bg-primary/90 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Back Arrow - Left Side */}
                            <ArrowLeft className="w-5 h-5 text-white/70 flex-shrink-0" />

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-white" />
                                <span className="text-xl font-bold text-white">
                                  {new Date(selectedServiceTime.Event_Start_Date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                                {new Date(selectedServiceTime.Event_Start_Date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-white/60" />
                                <span className="text-xs text-white/80 font-medium uppercase tracking-wide">
                                  {selectedServiceTime.Campus_Name} Campus
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Personal Info Card - Only show on Step 2 */}
                        {formStep === 2 && formData.firstName && (
                          <button
                            onClick={() => setFormStep(1)}
                            className="bg-primary px-4 py-3 max-w-fit text-left hover:bg-primary/90 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {/* Back Arrow - Left Side */}
                              <ArrowLeft className="w-5 h-5 text-white/70 flex-shrink-0" />

                              <div>
                                <p className="text-xl font-bold text-white mb-1">
                                  {formData.firstName} {formData.lastName}
                                </p>
                                <p className="text-xs text-white/70">
                                  {formData.emailAddress}
                                </p>
                                {formData.phoneNumber && (
                                  <p className="text-xs text-white/70 mt-1">
                                    {formData.phoneNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Progress Indicator */}
                      <div className="flex items-center gap-2 max-w-md">
                        <div className="flex-1 h-1 bg-secondary"></div>
                        <div className={`flex-1 h-1 ${formStep === 2 ? 'bg-secondary' : 'bg-white/20'}`}></div>
                      </div>
                      <p className="text-xs text-white/70 uppercase tracking-wide font-medium">Step {formStep} of 2</p>
                    </div>
                  )}
                  {currentView === "confirmation" && (
                    <div className="flex items-center gap-4">
                      {/* Success Checkmark Animation */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <div className="relative">
                          {/* Pulsing background */}
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0.2, 0.5],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="absolute inset-0 bg-secondary rounded-full"
                          />
                          {/* Check icon */}
                          <div className="relative w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Text */}
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          You&apos;re All Set!
                        </h2>
                        <p className="text-base text-white opacity-80">
                          We can&apos;t wait to see you at Christmas!
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campus Filter - Only show on services view */}
                {currentView === "services" && (
                  <div className="w-full max-w-md">
                    <Select
                      value={selectedCampusId.toString()}
                      onValueChange={(value) =>
                        setSelectedCampusId(parseInt(value))
                      }
                    >
                      <SelectTrigger className="h-12 bg-white border-2 border-white/50 hover:border-white transition-colors text-base font-semibold text-primary shadow-md">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <SelectValue placeholder="Select Campus" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {mockCampuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id.toString()} className="text-base py-3">
                            {campus.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Christmas Image */}
            <div className="hidden lg:block flex-shrink-0 w-[520px]">
              <img
                src={`${baseUrl}/assets/Christmas24_web_1480x1080.jpg`}
                alt="Christmas Service"
                className="w-full h-auto shadow-2xl"
              />
            </div>
          </div>

          {/* Main Content Section - Full Width */}
          <div>
              <AnimatePresence mode="wait">
                {/* Service Times List */}
                {currentView === "services" && (
                  <motion.div
                    key="services"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Service Times Grouped by Campus */}
                    <div className="space-y-4">
                      {Object.entries(groupedServiceTimes).map(([campusName, services]) => (
                        <div key={campusName} className="space-y-4">
                          {/* Service Time Cards - Flexible auto-flowing layout */}
                          <div className="flex flex-wrap gap-4">
                        {services.map((service) => (
                          <ServiceTimeCard
                            key={service.eventId}
                            serviceTime={{
                              Event_ID: service.eventId,
                              Event_Title: service.title,
                              Event_Start_Date: service.startDate.toISOString(),
                              Event_End_Date: service.endDate.toISOString(),
                              Campus_Name: service.campusName,
                              Congregation_ID: service.campusId,
                              Max_Capacity: service.maxCapacity,
                              Total_RSVPs: service.totalRSVPs,
                              Total_Attendees: service.totalAttendees,
                              Capacity_Percentage: service.capacityPercentage,
                              Is_Available: service.isAvailable,
                            }}
                            selected={false}
                            onSelect={() => handleServiceSelect(service)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                    {/* Helper Text */}
                    <div className="text-center pt-2">
                      <p className="text-sm text-white opacity-70">
                        <strong className="font-semibold text-white opacity-90">Note:</strong> RSVPs help us plan accordingly but don&apos;t guarantee a spot.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* RSVP Form */}
                {currentView === "form" && selectedServiceTime && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <RSVPForm
                      selectedServiceTime={selectedServiceTime}
                      onSubmit={handleFormSubmit}
                      onBack={handleBackToServices}
                      formStep={formStep}
                      onStepChange={setFormStep}
                      initialData={formData}
                      onDataChange={setFormData}
                    />
                  </motion.div>
                )}

                {/* Confirmation */}
                {currentView === "confirmation" && confirmation && (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ConfirmationView
                      confirmation={confirmation}
                      onReset={handleReset}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            Questions?{" "}
            <a
              href="https://woodsidebible.org/contact"
              className="text-primary hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
