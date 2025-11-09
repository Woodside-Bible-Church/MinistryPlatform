"use client";

import { motion } from "framer-motion";
import { Map, Navigation } from "lucide-react";
import { CardProps, MapCardConfig } from "@/types/confirmationCards";
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { useState } from "react";

export function MapCard({ config, rsvpData }: CardProps<MapCardConfig>) {
  const [showMapSelector, setShowMapSelector] = useState(false);

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

  // Get coordinates from config or use default (will be replaced by geocoding in production)
  const center = config.latitude && config.longitude
    ? { lat: config.latitude, lng: config.longitude }
    : { lat: 42.331429, lng: -83.045753 }; // Default to Woodside Bible Church

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const handleMapClick = () => {
    setShowMapSelector(true);
  };

  const handleMapChoice = (provider: "google" | "apple") => {
    const url = provider === "google" ? googleMapsUrl : appleMapsUrl;
    window.open(url, "_blank");
    setShowMapSelector(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full flex flex-col relative overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <Map className="w-6 h-6 text-secondary" />
        <h3 className="text-2xl font-bold text-white">{config.title}</h3>
      </div>

      <div className="space-y-4 relative z-10">
        <p className="text-white/90 text-lg">{address}</p>

        {config.customInstructions && (
          <p className="text-white/70 text-sm">{config.customInstructions}</p>
        )}

        {/* Embedded Google Map with clickable overlay */}
        <div className="relative w-full h-64 rounded-lg overflow-hidden mt-4">
          {apiKey && (
            <APIProvider apiKey={apiKey}>
              <GoogleMap
                center={center}
                zoom={15}
                gestureHandling="none"
                disableDefaultUI={true}
                mapId="rsvp-map"
              >
                <Marker position={center} />
              </GoogleMap>
            </APIProvider>
          )}

          {/* Clickable overlay */}
          <div
            onClick={handleMapClick}
            className="absolute inset-0 bg-transparent cursor-pointer group"
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-6 py-3 rounded-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold">Get Directions</span>
              </div>
            </div>
          </div>
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
      </div>
    </motion.div>
  );
}
