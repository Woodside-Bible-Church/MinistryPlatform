"use client";

import { motion } from "framer-motion";
import { Map, Navigation, ExternalLink } from "lucide-react";
import { CardProps, MapCardConfig } from "@/types/confirmationCards";
import { Button } from "@/components/ui/button";

export function MapCard({ config, rsvpData }: CardProps<MapCardConfig>) {
  // Use configured address or fallback to campus address
  const address = config.address || [
    rsvpData.Campus_Address_Line_1,
    rsvpData.Campus_Address_Line_2,
    rsvpData.Campus_City,
    rsvpData.Campus_State,
    rsvpData.Campus_Postal_Code,
  ]
    .filter(Boolean)
    .join(", ");

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const appleMapsUrl = `http://maps.apple.com/?q=${encodeURIComponent(address)}`;

  // Determine which map provider to use
  const mapsUrl = config.mapProvider === "apple" ? appleMapsUrl : googleMapsUrl;

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
        <Map className="w-6 h-6 text-secondary" />
        <h3 className="text-2xl font-bold text-white">{config.title}</h3>
      </div>

      <div className="space-y-4 relative">
        <p className="text-white/90 text-lg">{address}</p>

        {config.customInstructions && (
          <p className="text-white/70 text-sm">{config.customInstructions}</p>
        )}

        {config.showDirectionsLink !== false && (
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={() => window.open(googleMapsUrl, "_blank")}
              variant="secondary"
              className="btn-primary flex-1"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Google Maps
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
            <Button
              onClick={() => window.open(appleMapsUrl, "_blank")}
              variant="secondary"
              className="btn-primary flex-1"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Apple Maps
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
