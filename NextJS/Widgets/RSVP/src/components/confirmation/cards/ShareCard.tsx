"use client";

import { motion } from "framer-motion";
import { Share2, Mail, MessageSquare, Copy, Check } from "lucide-react";
import { CardProps, ShareCardConfig, replaceTokens, buildEventShareUrl } from "@/types/confirmationCards";
import { useState } from "react";

export function ShareCard({ config, rsvpData }: CardProps<ShareCardConfig>) {
  const [copied, setCopied] = useState(false);

  // Build share URL
  const shareUrl = config.shareUrl || buildEventShareUrl(rsvpData.Event_ID);

  // Replace tokens in custom message
  const customMessage = config.customMessage
    ? replaceTokens(config.customMessage, rsvpData)
    : `Join me at ${rsvpData.Event_Title}!`;

  const handleShare = (method: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedMessage = encodeURIComponent(customMessage);

    switch (method) {
      case "sms":
        window.open(`sms:?body=${encodedMessage} ${encodedUrl}`);
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent(rsvpData.Event_Title)}&body=${encodedMessage} ${encodedUrl}`);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(`${customMessage} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full flex flex-col relative overflow-hidden h-full"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <Share2 className="w-6 h-6 text-secondary" />
        <h3 className="text-2xl font-bold text-white">{config.title}</h3>
      </div>

      <p className="text-white/90 mb-6 relative flex-1">
        Invite your friends and family to join you!
      </p>

      <div className="grid grid-cols-2 gap-3 relative mt-auto">
        {config.enabledMethods.includes("sms") && (
          <button
            onClick={() => handleShare("sms")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Text</span>
          </button>
        )}

        {config.enabledMethods.includes("email") && (
          <button
            onClick={() => handleShare("email")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <Mail className="w-5 h-5" />
            <span>Email</span>
          </button>
        )}

        {config.enabledMethods.includes("copy") && (
          <button
            onClick={() => handleShare("copy")}
            className={`col-span-2 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary ${
              copied
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
