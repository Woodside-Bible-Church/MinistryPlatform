"use client";

import { motion } from "framer-motion";
import { Clock, Users, CheckCircle2, ChevronRight } from "lucide-react";
import {
  ServiceTimeResponse,
  formatServiceTime,
  formatServiceDate,
  getCapacityColorClass,
  getCapacityStatusText,
} from "@/types/rsvp";

interface ServiceTimeCardProps {
  serviceTime: ServiceTimeResponse;
  selected: boolean;
  onSelect: () => void;
}

export default function ServiceTimeCard({
  serviceTime,
  selected,
  onSelect,
}: ServiceTimeCardProps) {
  const startDate = new Date(serviceTime.Event_Start_Date);
  const capacityPercentage = Math.round(serviceTime.Capacity_Percentage);
  const spotsRemaining = serviceTime.Max_Capacity - serviceTime.Total_Attendees;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      disabled={!serviceTime.Is_Available}
      className={`
        relative flex-1 min-w-[300px] md:flex-none md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] transition-all duration-200 text-left overflow-hidden
        snap-center flex-shrink-0
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2
        ${
          selected
            ? "bg-primary shadow-2xl ring-2 ring-white"
            : serviceTime.Is_Available
            ? "bg-primary hover:shadow-xl"
            : "bg-primary/50 opacity-60 cursor-not-allowed"
        }
      `}
    >
      <div className="px-5 py-5">
        {/* Service Time Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Time */}
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-white" />
              <span className="text-3xl font-bold text-white">
                {formatServiceTime(startDate)}
              </span>
            </div>

            {/* Date */}
            <p className="text-sm font-medium text-white/70 uppercase tracking-wide">
              {formatServiceDate(startDate)}
            </p>
          </div>

          {/* Selected Indicator */}
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-7 h-7 text-secondary" />
            </motion.div>
          )}
        </div>

        {/* Capacity Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-white/80 font-medium uppercase text-xs tracking-wide">
                {getCapacityStatusText(capacityPercentage)}
              </span>
            </div>
            <span className="font-bold text-white text-lg">{capacityPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-white/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${capacityPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full ${getCapacityColorClass(capacityPercentage)}`}
            />
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-white/60 font-medium uppercase tracking-wide">
            <span>{serviceTime.Total_Attendees} attending</span>
            <span>
              {serviceTime.Is_Available
                ? `${spotsRemaining} spots left`
                : "Full"}
            </span>
          </div>
        </div>

        {/* RSVP Call-to-Action */}
        {serviceTime.Is_Available && !selected && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent uppercase tracking-wider">
                Click to RSVP
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Full Badge */}
      {!serviceTime.Is_Available && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-full border border-destructive/20">
          FULL
        </div>
      )}
    </motion.button>
  );
}
