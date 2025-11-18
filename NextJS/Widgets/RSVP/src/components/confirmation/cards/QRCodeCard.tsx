"use client";

import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { CardComponentProps, QRCodeCardConfig } from "@/types/rsvp";
import { replaceTokens } from "@/types/confirmationCards";
import { QRCodeSVG } from "qrcode.react";

export function QRCodeCard({ card, confirmation }: CardComponentProps) {
  const config = card.Configuration as QRCodeCardConfig;

  // Replace tokens in QR data
  const qrData = replaceTokens(config.qrData, confirmation);
  const description = config.description ? replaceTokens(config.description, confirmation) : "";

  // Confirmation number format: RSVP_ID-EVENT_ID
  const confirmationNumber = `${confirmation.Event_RSVP_ID}-${confirmation.Event_ID}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 w-full flex flex-col relative overflow-hidden h-full"
      style={{ backgroundColor: 'var(--theme-background)' }}
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}></div>

      <div className="flex items-center gap-3 mb-6 relative w-full">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <QrCode className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
        </div>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-secondary)' }}>{config.title}</h3>
      </div>

      {description && (
        <p className="text-center mb-6 relative w-full" style={{ color: 'var(--theme-primary)', opacity: 0.9 }}>{description}</p>
      )}

      {/* QR Code with Glass Morphism */}
      <div className="backdrop-blur-md p-6 rounded-lg border-2 relative flex items-center justify-center w-full max-w-[250px] mx-auto" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
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
          <p className="text-sm mb-1" style={{ color: 'var(--theme-primary)', opacity: 0.7 }}>Confirmation Number</p>
          <p className="text-xl font-mono font-bold tracking-wider" style={{ color: 'var(--theme-secondary)' }}>
            {confirmationNumber}
          </p>
        </div>
      )}
    </motion.div>
  );
}
