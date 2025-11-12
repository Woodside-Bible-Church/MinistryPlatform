"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  RotateCcw,
  Navigation,
  HelpCircle,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { FaGoogle, FaApple } from "react-icons/fa";
import {
  RSVPConfirmation,
  formatServiceTime,
  formatServiceDate,
  ParsedConfirmationCard,
  RSVPQuestion,
  RSVPAnswerValue,
} from "@/types/rsvp";
import { Button } from "@/components/ui/button";
import { CardRenderer } from "@/components/confirmation/CardRenderer";
import { useState } from "react";

interface ConfirmationViewProps {
  confirmation: RSVPConfirmation;
  confirmationCards?: ParsedConfirmationCard[];
  questions?: RSVPQuestion[];
  answers?: Record<number, RSVPAnswerValue>;
  onReset: () => void;
}

export default function ConfirmationView({
  confirmation,
  confirmationCards = [],
  questions = [],
  answers = {},
  onReset,
}: ConfirmationViewProps) {
  const startDate = new Date(confirmation.Event_Start_Date);
  const [imageError, setImageError] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);

  // Format address for Google Maps
  const fullAddress = [
    confirmation.Campus_Address,
    confirmation.Campus_City,
    confirmation.Campus_State,
    confirmation.Campus_Zip,
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

    // On mobile, use location.href to avoid blank tabs when app opens
    // On desktop, open in new tab
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, "_blank");
    }

    setShowMapSelector(false);
  };

  // Use cards from database or provide defaults
  const cards = confirmationCards.length > 0
    ? confirmationCards
    : [
        // Default cards if none configured in database
        {
          Card_ID: 1,
          Card_Type_ID: 1,
          Card_Type_Name: "Instructions" as const,
          Component_Name: "InstructionsCard",
          Icon_Name: "Info" as string | null,
          Display_Order: 1,
          Congregation_ID: null,
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

          {/* Dynamic Answers */}
          {questions.map((question) => {
            const answer = answers[question.Question_ID];
            if (answer === undefined || answer === null) return null;

            // Get the icon component dynamically (same pattern as QuestionLabel)
            const IconComponent = question.Icon_Name
              ? (LucideIcons[question.Icon_Name as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>) || HelpCircle
              : HelpCircle;

            // Format the answer for display
            let displayValue: string;
            if (typeof answer === 'boolean') {
              displayValue = answer ? 'Yes' : 'No';
            } else if (Array.isArray(answer)) {
              displayValue = answer.join(', ');
            } else {
              displayValue = String(answer);
            }

            return (
              <div key={question.Question_ID} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
                  <IconComponent className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">
                    {displayValue}
                  </p>
                  <p className="text-sm text-white/70">
                    {question.Question_Text}
                  </p>
                </div>
              </div>
            );
          })}

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMapSelector(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-primary/70 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-white/20"
            >
              <h4 className="text-2xl font-bold text-white mb-6 text-center">
                Let&apos;s go!
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => handleMapChoice("google")}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 font-semibold rounded-lg transition-all"
                >
                  <FaGoogle className="w-5 h-5" />
                  <span>Google Maps</span>
                </button>
                <button
                  onClick={() => handleMapChoice("apple")}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 font-semibold rounded-lg transition-all"
                >
                  <FaApple className="w-6 h-6" />
                  <span>Apple Maps</span>
                </button>
                <button
                  onClick={() => setShowMapSelector(false)}
                  className="w-full text-white/70 hover:text-white py-3 font-medium transition-colors"
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
