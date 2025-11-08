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

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Left Card: RSVP Summary with Get Directions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-primary p-6 w-full md:min-w-[400px] md:flex-1 flex flex-col"
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

        {/* Action Button - Pushed to bottom */}
        <div className="mt-auto">
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

      {/* Right Card: What to Expect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full md:min-w-[400px] md:flex-1 flex flex-col relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

        <h3 className="text-2xl font-bold text-white mb-8 relative">
          What to Expect
        </h3>
        <ul className="space-y-6 text-base text-white/90 relative">
          <li className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5 group-hover:bg-secondary/30 transition-colors">
              <span className="text-secondary text-lg font-bold">1</span>
            </div>
            <span className="leading-relaxed">
              <strong className="text-white font-bold">Arrive early</strong> to find
              parking and get seated comfortably
            </span>
          </li>
          <li className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5 group-hover:bg-secondary/30 transition-colors">
              <span className="text-secondary text-lg font-bold">2</span>
            </div>
            <span className="leading-relaxed">
              <strong className="text-white font-bold">Kids programming</strong>{" "}
              available for all ages
            </span>
          </li>
          <li className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5 group-hover:bg-secondary/30 transition-colors">
              <span className="text-secondary text-lg font-bold">3</span>
            </div>
            <span className="leading-relaxed">
              <strong className="text-white font-bold">Services last</strong>{" "}
              approximately 60 minutes
            </span>
          </li>
          <li className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5 group-hover:bg-secondary/30 transition-colors">
              <span className="text-secondary text-lg font-bold">4</span>
            </div>
            <span className="leading-relaxed">
              <strong className="text-white font-bold">Dress casually</strong> - come
              as you are!
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
