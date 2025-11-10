"use client";

import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { CardProps, QRCodeCardConfig, replaceTokens } from "@/types/confirmationCards";
import { QRCodeSVG } from "qrcode.react";

export function QRCodeCard({ config, rsvpData }: CardProps<QRCodeCardConfig>) {
  // Replace tokens in QR data
  const qrData = replaceTokens(config.qrData, rsvpData);
  const description = config.description ? replaceTokens(config.description, rsvpData) : "";

  // Confirmation number format: RSVP_ID-EVENT_ID
  const confirmationNumber = `${rsvpData.Event_RSVP_ID}-${rsvpData.Event_ID}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full flex flex-col relative overflow-hidden h-full"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-3 mb-6 relative w-full">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
          <QrCode className="w-5 h-5 text-secondary" />
        </div>
        <h3 className="text-2xl font-bold text-white">{config.title}</h3>
      </div>

      {description && (
        <p className="text-white/90 text-center mb-6 relative w-full">{description}</p>
      )}

      {/* QR Code with Glass Morphism */}
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border-2 border-white/20 relative flex items-center justify-center w-full max-w-[250px] mx-auto">
        <QRCodeSVG
          value={qrData}
          size={config.size || 200}
          level="H"
          fgColor="#FFFFFF"
          bgColor="transparent"
        />
      </div>

      {/* Confirmation Number */}
      {config.includeConfirmationNumber && (
        <div className="mt-6 text-center relative">
          <p className="text-white/70 text-sm mb-1">Confirmation Number</p>
          <p className="text-white text-xl font-mono font-bold tracking-wider">
            {confirmationNumber}
          </p>
        </div>
      )}
    </motion.div>
  );
}
