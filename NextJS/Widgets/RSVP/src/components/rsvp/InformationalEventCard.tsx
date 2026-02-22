"use client";

import { motion } from "framer-motion";
import { InformationalEvent } from "@/data/mockData";
import { CarouselEvent } from "@/types/rsvp";
import { Calendar, MapPin, Heart } from "lucide-react";

// Support both mock data type and real API type
type EventCardData = InformationalEvent | CarouselEvent;

interface InformationalEventCardProps {
  event: EventCardData;
  baseUrl?: string;
}

// Type guard to check if event is from mock data
function isMockEvent(event: EventCardData): event is InformationalEvent {
  return 'eventId' in event && 'eventUrl' in event;
}

export default function InformationalEventCard({
  event,
}: InformationalEventCardProps) {
  const handleClick = () => {
    if (isMockEvent(event)) {
      window.open(event.eventUrl, "_blank");
    } else {
      // Use Event_URL from database or construct a default URL
      const url = event.Event_URL || `https://woodsidebible.org/events/${event.Event_ID}`;
      window.open(url, "_blank");
    }
  };

  // Extract common properties based on event type
  const eventTitle = isMockEvent(event) ? event.title : event.Event_Title;
  const imageUrl = isMockEvent(event) ? event.imageUrl : event.Event_Image_URL;
  const campusName = isMockEvent(event) ? event.campusName : event.Campus_Name;
  const isOpportunity = !isMockEvent(event) && event.Item_Type === 'Opportunity';

  // Parse start date (may be null for opportunities)
  const startDate = isMockEvent(event)
    ? event.startDate
    : event.Event_Start_Date ? new Date(event.Event_Start_Date) : null;

  // Format date and time (only if date exists)
  const formattedDate = startDate
    ? startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null;
  const formattedTime = startDate
    ? startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className="relative w-[340px] shrink-0 overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer bg-white group"
    >
      {/* Event Image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-200">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={eventTitle}
            className="w-full h-full object-cover"
          />
        )}
        {!imageUrl && (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {isOpportunity ? <Heart className="w-16 h-16" /> : <Calendar className="w-16 h-16" />}
          </div>
        )}

        {/* Serve badge for opportunities */}
        {isOpportunity && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
            <Heart className="w-3 h-3" />
            Serve
          </div>
        )}
      </div>

      {/* Event Info Overlay - Only visible on hover/focus */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/75 group-focus:bg-black/75 transition-all duration-300 flex items-end p-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100">
        <div className="text-left">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
            {eventTitle}
          </h3>
          <div className="flex flex-col gap-1.5 text-sm text-white/90">
            {formattedDate && formattedTime && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate} at {formattedTime}</span>
              </div>
            )}
            {campusName && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{campusName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
