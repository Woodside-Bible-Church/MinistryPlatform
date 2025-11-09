"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  RotateCcw,
} from "lucide-react";
import {
  RSVPConfirmationResponse,
  formatServiceTime,
  formatServiceDate,
} from "@/types/rsvp";
import { Button } from "@/components/ui/button";
import { CardListRenderer } from "@/components/confirmation/CardRenderer";
import { ConfirmationCard } from "@/types/confirmationCards";

interface ConfirmationViewProps {
  confirmation: RSVPConfirmationResponse;
  onReset: () => void;
}

export default function ConfirmationView({
  confirmation,
  onReset,
}: ConfirmationViewProps) {
  const startDate = new Date(confirmation.Event_Start_Date);

  // Format address for Google Maps
  const fullAddress = [
    confirmation.Campus_Address_Line_1,
    confirmation.Campus_Address_Line_2,
    confirmation.Campus_City,
    confirmation.Campus_State,
    confirmation.Campus_Postal_Code,
  ]
    .filter(Boolean)
    .join(", ");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddress
  )}`;

  // Mock card configuration - in production this would come from the database
  const cards: ConfirmationCard[] = [
    {
      Card_Type_ID: 1,
      Card_Type_Name: "Instructions",
      Component_Name: "InstructionsCard",
      Icon_Name: "Info",
      Display_Order: 1,
      Configuration: {
        title: "What to Expect",
        bullets: [
          {
            icon: "Clock",
            text: "Arrive early to find parking and get seated comfortably",
          },
          {
            icon: "Baby",
            text: "Kids programming available for all ages",
          },
          {
            icon: "Timer",
            text: "Services last approximately 60 minutes",
          },
          {
            icon: "Shirt",
            text: "Dress casually - come as you are!",
          },
        ],
      },
    },
    {
      Card_Type_ID: 2,
      Card_Type_Name: "Map",
      Component_Name: "MapCard",
      Icon_Name: "Map",
      Display_Order: 2,
      Configuration: {
        title: "Find Us",
        showDirectionsLink: true,
        mapProvider: "google",
        customInstructions: "Enter through the main entrance",
      },
    },
    {
      Card_Type_ID: 4,
      Card_Type_Name: "QRCode",
      Component_Name: "QRCodeCard",
      Icon_Name: "QrCode",
      Display_Order: 3,
      Configuration: {
        title: "Check-In Code",
        qrType: "checkin",
        qrData: "{confirmation_number}",
        description: "Show this code when you arrive for faster check-in",
        includeConfirmationNumber: true,
        size: 200,
      },
    },
    {
      Card_Type_ID: 5,
      Card_Type_Name: "Share",
      Component_Name: "ShareCard",
      Icon_Name: "Share2",
      Display_Order: 4,
      Configuration: {
        title: "Invite a Friend",
        enabledMethods: ["sms", "email", "copy"],
        customMessage: "Join me at {event_title} on {event_date}!",
      },
    },
    {
      Card_Type_ID: 6,
      Card_Type_Name: "AddToCalendar",
      Component_Name: "AddToCalendarCard",
      Icon_Name: "Calendar",
      Display_Order: 5,
      Configuration: {
        title: "Save the Date",
        providers: ["google", "apple", "outlook", "ics"],
        eventDescription: `Join us for ${confirmation.Event_Title}`,
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* RSVP Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-primary p-6 w-full flex flex-col"
      >
        {/* Personalized Greeting */}
        <div className="py-2">
          <p className="text-2xl font-bold text-white">
            {confirmation.First_Name}, we&apos;ll see you soon!
          </p>
        </div>

        {/* RSVP Details */}
        <div className="space-y-4 mb-6">
          {/* Service Time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-white/70 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-white">
                {formatServiceTime(startDate)}
              </p>
              <p className="text-sm text-white/70">
                {formatServiceDate(startDate)}
              </p>
            </div>
          </div>

          {/* Campus - Clickable for Directions */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group cursor-pointer hover:opacity-80 transition-opacity"
          >
            <MapPin className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-white">
                {confirmation.Campus_Name} Campus
              </p>
              <p className="text-sm text-white/70 underline decoration-white/30 group-hover:decoration-white/60 transition-colors">
                {fullAddress}
              </p>
            </div>
          </a>
        </div>

        {/* Action Button */}
        <div>
          <Button
            onClick={onReset}
            variant="secondary"
            className="btn-primary w-full h-12 text-base"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            RSVP Again
          </Button>
        </div>
      </motion.div>

      {/* Dynamic Cards */}
      <CardListRenderer cards={cards} rsvpData={confirmation} />
    </div>
  );
}
