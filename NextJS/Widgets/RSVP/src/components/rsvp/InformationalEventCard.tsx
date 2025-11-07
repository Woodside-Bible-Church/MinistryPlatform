"use client";

import { motion } from "framer-motion";
import { InformationalEvent } from "@/data/mockData";

interface InformationalEventCardProps {
  event: InformationalEvent;
  baseUrl?: string;
}

export default function InformationalEventCard({
  event,
  baseUrl = "",
}: InformationalEventCardProps) {
  const handleClick = () => {
    window.open(event.eventUrl, "_blank");
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className="relative flex-1 min-w-[300px] max-w-[450px] overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer"
    >
      {/* Event Image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        {event.imageUrl && (
          <img
            src={`${baseUrl}${event.imageUrl}`}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </motion.button>
  );
}
