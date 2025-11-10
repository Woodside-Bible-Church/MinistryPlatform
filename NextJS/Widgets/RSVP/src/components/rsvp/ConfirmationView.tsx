"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  RotateCcw,
  Navigation,
} from "lucide-react";
import {
  RSVPConfirmationResponse,
  formatServiceTime,
  formatServiceDate,
} from "@/types/rsvp";
import { Button } from "@/components/ui/button";
import { CardRenderer } from "@/components/confirmation/CardRenderer";
import { ConfirmationCard } from "@/types/confirmationCards";
import { useState } from "react";

interface ConfirmationViewProps {
  confirmation: RSVPConfirmationResponse;
  onReset: () => void;
}

export default function ConfirmationView({
  confirmation,
  onReset,
}: ConfirmationViewProps) {
  const startDate = new Date(confirmation.Event_Start_Date);
  const [imageError, setImageError] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);

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

  const appleMapsUrl = `http://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`;

  // Google Maps Static API
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const center = encodeURIComponent(fullAddress);
  const staticMapUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=15&size=600x300&markers=color:red%7C${center}&key=${apiKey}&scale=2`
    : null;

  const handleMapClick = () => {
    setShowMapSelector(true);
  };

  const handleMapChoice = (provider: "google" | "apple") => {
    const url = provider === "google" ? mapsUrl : appleMapsUrl;
    window.open(url, "_blank");
    setShowMapSelector(false);
  };

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
      Card_Type_ID: 4,
      Card_Type_Name: "QRCode",
      Component_Name: "QRCodeCard",
      Icon_Name: "QrCode",
      Display_Order: 2,
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
      Display_Order: 3,
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
      Display_Order: 4,
      Configuration: {
        title: "Save the Date",
        providers: ["google", "apple", "outlook", "ics"],
        eventDescription: `Join us for ${confirmation.Event_Title}`,
      },
    },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,450px),1fr))] gap-6">
      {/* RSVP Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-primary p-6 w-full flex flex-col h-full"
      >
        {/* Personalized Greeting */}
        <div className="py-2 mb-4">
          <p className="text-2xl font-bold text-white">
            {confirmation.First_Name}, we&apos;ll see you soon!
          </p>
        </div>

        {/* RSVP Details */}
        <div className="space-y-6 flex-1">
          {/* Service Time */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {formatServiceTime(startDate)}
              </p>
              <p className="text-sm text-white/70">
                {formatServiceDate(startDate)}
              </p>
            </div>
          </div>

          {/* Campus Location */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
              <MapPin className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-white">
                {confirmation.Campus_Name} Campus
              </p>
              <p className="text-sm text-white/70">
                {fullAddress}
              </p>
              <p className="text-xs text-white/60 mt-1">Enter through the main entrance</p>
            </div>
          </div>

          {/* Static Map Image */}
          {staticMapUrl && !imageError && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img
                src={staticMapUrl}
                alt="Map location"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {/* Clickable overlay */}
              <div
                onClick={handleMapClick}
                className="absolute inset-0 bg-transparent cursor-pointer group"
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="text-primary font-bold text-sm">Get Directions</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Selector Modal */}
        {showMapSelector && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowMapSelector(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-sm w-full"
            >
              <h4 className="text-xl font-bold text-primary mb-4">
                Choose Your Map App
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => handleMapChoice("google")}
                  className="w-full btn-primary h-12 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" />
                  Google Maps
                </button>
                <button
                  onClick={() => handleMapChoice("apple")}
                  className="w-full btn-secondary h-12 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" />
                  Apple Maps
                </button>
                <button
                  onClick={() => setShowMapSelector(false)}
                  className="w-full text-gray-600 hover:text-gray-800 py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
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
      {cards.sort((a, b) => a.Display_Order - b.Display_Order).map((card) => (
        <CardRenderer
          key={`${card.Card_Type_ID}-${card.Display_Order}`}
          card={card}
          rsvpData={confirmation}
        />
      ))}
    </div>
  );
}
