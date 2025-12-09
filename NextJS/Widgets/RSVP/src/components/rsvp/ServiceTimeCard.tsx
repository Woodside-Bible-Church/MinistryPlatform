"use client";

import { motion } from "framer-motion";
import { Clock, Users, CheckCircle2, ChevronRight } from "lucide-react";
import {
  ServiceTimeResponse,
  formatServiceTime,
  getCapacityColorClass,
  getCapacityStatusText,
} from "@/types/rsvp";

interface ServiceTimeCardProps {
  serviceTime: ServiceTimeResponse;
  selected: boolean;
  onSelect: () => void;
  isCarousel?: boolean; // Whether this card is part of a carousel (multiple cards)
  backgroundColor?: string; // Dynamic background color from database
  accentColor?: string; // Dynamic accent color for checkmark
  textColor?: string; // Dynamic text color from database
}

export default function ServiceTimeCard({
  serviceTime,
  selected,
  onSelect,
  isCarousel = true,
  backgroundColor = '#1C2B39',
  accentColor = '#FFFFFF',
  textColor = '#E5E7EB',
}: ServiceTimeCardProps) {
  const startDate = new Date(serviceTime.Event_Start_Date);

  // Calculate capacity percentage locally to handle edge cases
  // Match the calculation logic from NextJS Apps
  // Use Current_RSVPs + modifier since Adjusted_RSVP_Count can be null
  const modifier = serviceTime.RSVP_Capacity_Modifier ?? 0;
  const effectiveAttendees = (serviceTime.Current_RSVPs ?? 0) + modifier;
  const capacityPercentage =
    serviceTime.Capacity && serviceTime.Capacity !== 9999
      ? Math.round((effectiveAttendees / serviceTime.Capacity) * 100)
      : 0;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`
        relative flex-1 min-w-[300px] md:flex-none md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] transition-all duration-200 text-left overflow-hidden
        ${isCarousel ? 'snap-center flex-shrink-0' : ''}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2
        ${selected ? "shadow-2xl ring-2 ring-white" : "hover:shadow-xl"}
      `}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="px-5 py-5" style={{ color: textColor }}>
        {/* Service Time Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Time */}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" style={{ color: textColor }} />
              <span className="text-3xl font-bold" style={{ color: textColor }}>
                {formatServiceTime(startDate)}
              </span>
            </div>
          </div>

          {/* Selected Indicator */}
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: accentColor }} />
            </motion.div>
          )}
        </div>

        {/* Capacity Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: `${textColor}99` }} />
              <span className="font-medium uppercase text-xs tracking-wide" style={{ color: `${textColor}CC` }}>
                {getCapacityStatusText(capacityPercentage)}
              </span>
            </div>
            <span className="font-bold text-lg" style={{ color: textColor }}>{capacityPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 overflow-hidden" style={{ backgroundColor: `${textColor}33` }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full ${getCapacityColorClass(capacityPercentage)}`}
            />
          </div>
        </div>

        {/* RSVP Call-to-Action */}
        {!selected && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${textColor}33` }}>
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-extrabold uppercase tracking-wider bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${textColor}, ${textColor}66)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Click to RSVP
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: textColor }} />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}
