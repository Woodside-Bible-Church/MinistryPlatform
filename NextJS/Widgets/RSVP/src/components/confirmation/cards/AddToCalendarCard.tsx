"use client";

import { motion } from "framer-motion";
import { Calendar, Download } from "lucide-react";
import { CardProps, AddToCalendarCardConfig, generateICSContent } from "@/types/confirmationCards";
import { Button } from "@/components/ui/button";

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
      className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full flex flex-col relative overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <Calendar className="w-6 h-6 text-secondary" />
        <h3 className="text-2xl font-bold text-white">{config.title}</h3>
      </div>

      <p className="text-white/90 mb-6 relative">
        Never forget! Add this event to your calendar.
      </p>

      <div className="grid grid-cols-2 gap-3 relative">
        {config.providers.includes("google") && (
          <Button
            onClick={() => handleAddToCalendar("google")}
            variant="secondary"
            className="btn-primary"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Google
          </Button>
        )}

        {config.providers.includes("apple") && (
          <Button
            onClick={() => handleAddToCalendar("apple")}
            variant="secondary"
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Apple
          </Button>
        )}

        {config.providers.includes("outlook") && (
          <Button
            onClick={() => handleAddToCalendar("outlook")}
            variant="secondary"
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Outlook
          </Button>
        )}

        {config.providers.includes("ics") && (
          <Button
            onClick={() => handleAddToCalendar("ics")}
            variant="secondary"
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download ICS
          </Button>
        )}
      </div>
    </motion.div>
  );
}
