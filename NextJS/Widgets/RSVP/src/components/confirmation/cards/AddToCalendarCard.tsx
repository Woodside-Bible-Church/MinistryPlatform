"use client";

import { motion } from "framer-motion";
import { Calendar, Download, X } from "lucide-react";
import { FaGoogle, FaApple, FaMicrosoft } from "react-icons/fa";
import { CardProps, AddToCalendarCardConfig, generateICSContent } from "@/types/confirmationCards";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

export function AddToCalendarCard({ config, rsvpData }: CardProps<AddToCalendarCardConfig>) {
  const [open, setOpen] = useState(false);
  const startDate = new Date(rsvpData.Event_Start_Date);
  const endDate = new Date(rsvpData.Event_End_Date);

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const location = config.location || `${rsvpData.Campus_Name}, ${rsvpData.Campus_Address_Line_1}, ${rsvpData.Campus_City}, ${rsvpData.Campus_State} ${rsvpData.Campus_Postal_Code}`;
  const description = config.eventDescription || "";

  const handleNativeShare = async () => {
    // Try native share with ICS file on mobile
    if (navigator.share && navigator.canShare) {
      try {
        const icsContent = generateICSContent(rsvpData, config);
        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const file = new File([blob], `${rsvpData.Event_Title.replace(/[^a-z0-9]/gi, "_")}.ics`, {
          type: "text/calendar",
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: rsvpData.Event_Title,
            text: "Add this event to your calendar",
          });
          return true;
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
    return false;
  };

  const handleCalendarClick = async () => {
    const shared = await handleNativeShare();
    if (!shared) {
      // Open popover if native share not available or failed
      setOpen(true);
    }
  };

  const handleAddToCalendar = (provider: string) => {
    switch (provider) {
      case "google":
        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(rsvpData.Event_Title)}&dates=${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
        window.open(googleUrl, "_blank");
        break;

      case "apple":
      case "outlook":
      case "ics":
        // Generate and download ICS file
        const icsContent = generateICSContent(rsvpData, config);
        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${rsvpData.Event_Title.replace(/[^a-z0-9]/gi, "_")}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
    }
    setOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full flex flex-col relative overflow-hidden h-full"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <Calendar className="w-6 h-6 text-secondary" />
        <h3 className="text-2xl font-bold text-white">{config.title}</h3>
      </div>

      <p className="text-white/90 mb-6 relative flex-1">
        Never forget! Add this event to your calendar.
      </p>

      <div className="relative mt-auto">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              onClick={handleCalendarClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <Calendar className="w-5 h-5" />
              <span>Add to Calendar</span>
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              className="bg-primary border-2 border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-md z-50"
              sideOffset={8}
              align="center"
            >
              <div className="flex items-center gap-2">
                {config.providers.includes("google") && (
                  <button
                    onClick={() => handleAddToCalendar("google")}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all"
                    title="Google Calendar"
                  >
                    <FaGoogle className="w-5 h-5" />
                  </button>
                )}

                {config.providers.includes("apple") && (
                  <button
                    onClick={() => handleAddToCalendar("apple")}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all"
                    title="Apple Calendar"
                  >
                    <FaApple className="w-5 h-5" />
                  </button>
                )}

                {config.providers.includes("outlook") && (
                  <button
                    onClick={() => handleAddToCalendar("outlook")}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all"
                    title="Outlook Calendar"
                  >
                    <FaMicrosoft className="w-5 h-5" />
                  </button>
                )}

                {config.providers.includes("ics") && (
                  <button
                    onClick={() => handleAddToCalendar("ics")}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all"
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
