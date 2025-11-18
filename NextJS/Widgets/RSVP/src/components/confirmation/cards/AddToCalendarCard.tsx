"use client";

import { motion } from "framer-motion";
import { Calendar, Download } from "lucide-react";
import { FaGoogle, FaApple, FaMicrosoft } from "react-icons/fa";
import { CardComponentProps, AddToCalendarCardConfig } from "@/types/rsvp";
import { generateICSContent } from "@/types/confirmationCards";
import { useState, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";

export function AddToCalendarCard({ card, confirmation }: CardComponentProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = card.Configuration as AddToCalendarCardConfig;
  const startDate = new Date(confirmation.Event_Start_Date);
  const endDate = new Date(confirmation.Event_End_Date);

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const location = config.location || `${confirmation.Campus_Name}, ${confirmation.Campus_Address}, ${confirmation.Campus_City}, ${confirmation.Campus_State} ${confirmation.Campus_Zip}`;
  const description = config.eventDescription || "";

  const handleCalendarClick = () => {
    // Always open popover - don't use native share for calendar
    // (Native share doesn't provide good calendar app selection on iOS)
    setOpen(true);
  };

  const handleAddToCalendar = (provider: string) => {
    switch (provider) {
      case "google":
        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(confirmation.Event_Title)}&dates=${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
        window.open(googleUrl, "_blank");
        break;

      case "apple":
      case "outlook":
      case "ics":
        // Generate and download ICS file
        const icsContent = generateICSContent(confirmation, config);
        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${confirmation.Event_Title.replace(/[^a-z0-9]/gi, "_")}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
    }
    setOpen(false);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 w-full flex flex-col relative overflow-hidden h-full"
      style={{ backgroundColor: 'var(--theme-background)' }}
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Calendar className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
        </div>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-secondary)' }}>{config.title}</h3>
      </div>

      <p className="mb-6 relative flex-1" style={{ color: 'var(--theme-primary)', opacity: 0.9 }}>
        Never forget! Add this event to your calendar.
      </p>

      <div className="relative mt-auto">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              onClick={handleCalendarClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--theme-secondary)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '--tw-ring-color': 'var(--theme-secondary)',
                '--tw-ring-offset-color': 'var(--theme-background)'
              } as React.CSSProperties}
            >
              <Calendar className="w-5 h-5" />
              <span>Add to Calendar</span>
            </button>
          </Popover.Trigger>

          <Popover.Portal container={containerRef.current}>
            <Popover.Content
              className="border-2 rounded-lg p-3 shadow-xl backdrop-blur-md z-50"
              style={{ backgroundColor: 'var(--theme-background)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
              sideOffset={8}
              align="center"
            >
              <div className="flex items-center gap-2">
                {config.providers.includes("google") && (
                  <button
                    onClick={() => handleAddToCalendar("google")}
                    className="w-12 h-12 flex items-center justify-center border rounded-full hover:bg-white/20 transition-all"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--theme-secondary)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    title="Google Calendar"
                  >
                    <FaGoogle className="w-5 h-5" />
                  </button>
                )}

                {config.providers.includes("apple") && (
                  <button
                    onClick={() => handleAddToCalendar("apple")}
                    className="w-12 h-12 flex items-center justify-center border rounded-full hover:bg-white/20 transition-all"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--theme-secondary)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    title="Apple Calendar"
                  >
                    <FaApple className="w-5 h-5" />
                  </button>
                )}

                {config.providers.includes("outlook") && (
                  <button
                    onClick={() => handleAddToCalendar("outlook")}
                    className="w-12 h-12 flex items-center justify-center border rounded-full hover:bg-white/20 transition-all"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--theme-secondary)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    title="Outlook Calendar"
                  >
                    <FaMicrosoft className="w-5 h-5" />
                  </button>
                )}

                {config.providers.includes("ics") && (
                  <button
                    onClick={() => handleAddToCalendar("ics")}
                    className="w-12 h-12 flex items-center justify-center border rounded-full hover:bg-white/20 transition-all"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--theme-secondary)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    title="Download ICS"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </motion.div>
  );
}
