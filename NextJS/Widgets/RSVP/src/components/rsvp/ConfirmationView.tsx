"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Users,
  Mail,
  Navigation,
  Clock,
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
    <div className="flex flex-wrap gap-4">
      {/* Left Card: RSVP Summary with Get Directions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-primary p-6 min-w-[400px] flex-1 space-y-6"
      >
        {/* RSVP Details */}
        <div className="space-y-4">
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

          {/* Campus */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-white/70 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-white">
                {confirmation.Campus_Name} Campus
              </p>
              <p className="text-sm text-white/70">{fullAddress}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20"></div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-white/70 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-white">{confirmation.Email_Address}</p>
              <p className="text-sm text-white/70">Confirmation email sent</p>
            </div>
          </div>

          {/* Party Size */}
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-white/70 mt-0.5" />
            <div>
              <p className="text-lg font-bold text-white">
                {confirmation.Party_Size} {confirmation.Party_Size === 1 ? "Person" : "People"}
              </p>
              <p className="text-sm text-white/70">Party size</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => window.open(mapsUrl, "_blank")}
            className="w-full h-12 text-base bg-secondary hover:bg-[#B09578] text-primary font-bold uppercase tracking-wide transition-colors"
          >
            <Navigation className="w-5 h-5 mr-2" />
            Get Directions
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full h-12 text-base border-2 border-secondary text-secondary hover:bg-secondary hover:text-primary bg-transparent font-bold uppercase tracking-wide transition-colors"
          >
            RSVP for Another Service
          </Button>
        </div>
      </motion.div>

      {/* Right Card: What to Expect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-primary p-6 min-w-[400px] flex-1 flex flex-col"
      >
        <h3 className="text-xl font-bold text-white mb-6">
          What to Expect
        </h3>
        <ul className="space-y-5 text-base text-white/90 flex-1 flex flex-col justify-center">
          <li className="flex items-start gap-3">
            <span className="text-secondary text-xl mt-0.5">•</span>
            <span>
              <strong className="text-white font-bold">Arrive early</strong> to find
              parking and get seated comfortably
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-secondary text-xl mt-0.5">•</span>
            <span>
              <strong className="text-white font-bold">Kids programming</strong>{" "}
              available for all ages
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-secondary text-xl mt-0.5">•</span>
            <span>
              <strong className="text-white font-bold">Services last</strong>{" "}
              approximately 60 minutes
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-secondary text-xl mt-0.5">•</span>
            <span>
              <strong className="text-white font-bold">Dress casually</strong> - come
              as you are!
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
