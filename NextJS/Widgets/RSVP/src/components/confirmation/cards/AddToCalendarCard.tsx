"use client";

import { motion } from "framer-motion";
import { Calendar, Download } from "lucide-react";
import { FaGoogle, FaApple, FaMicrosoft } from "react-icons/fa";
import { CardProps, AddToCalendarCardConfig, generateICSContent } from "@/types/confirmationCards";

export function AddToCalendarCard({ config, rsvpData }: CardProps<AddToCalendarCardConfig>) {
  const startDate = new Date(rsvpData.Event_Start_Date);
  const endDate = new Date(rsvpData.Event_End_Date);

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const location = config.location || `${rsvpData.Campus_Name}, ${rsvpData.Campus_Address_Line_1}, ${rsvpData.Campus_City}, ${rsvpData.Campus_State} ${rsvpData.Campus_Postal_Code}`;
  const description = config.eventDescription || "";

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

      <div className="grid grid-cols-2 gap-3 relative mt-auto">
        {config.providers.includes("google") && (
          <button
            onClick={() => handleAddToCalendar("google")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <FaGoogle className="w-5 h-5" />
            <span>Google</span>
          </button>
        )}

        {config.providers.includes("apple") && (
          <button
            onClick={() => handleAddToCalendar("apple")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <FaApple className="w-5 h-5" />
            <span>Apple</span>
          </button>
        )}

        {config.providers.includes("outlook") && (
          <button
            onClick={() => handleAddToCalendar("outlook")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <FaMicrosoft className="w-5 h-5" />
            <span>Outlook</span>
          </button>
        )}

        {config.providers.includes("ics") && (
          <button
            onClick={() => handleAddToCalendar("ics")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <Download className="w-5 h-5" />
            <span>Download</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
