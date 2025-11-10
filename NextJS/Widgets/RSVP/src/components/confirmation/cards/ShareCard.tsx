"use client";

import { motion } from "framer-motion";
import { Share2, Mail, MessageSquare, Copy, Check } from "lucide-react";
import { CardProps, ShareCardConfig, replaceTokens, buildEventShareUrl } from "@/types/confirmationCards";
import { useState, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";

export function ShareCard({ config, rsvpData }: CardProps<ShareCardConfig>) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build share URL
  const shareUrl = config.shareUrl || buildEventShareUrl(rsvpData.Event_ID);

  // Replace tokens in custom message
  const customMessage = config.customMessage
    ? replaceTokens(config.customMessage, rsvpData)
    : `Join me at ${rsvpData.Event_Title}!`;

  const handleNativeShare = async () => {
    // Try native share API first (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: rsvpData.Event_Title,
          text: customMessage,
          url: shareUrl,
        });
        return { success: true };
      } catch (err) {
        // User cancelled - don't show popover
        if ((err as Error).name === 'AbortError') {
          return { success: false, cancelled: true };
        }
        // Other error - could show popover as fallback
        console.error('Error sharing:', err);
        return { success: false, cancelled: false };
      }
    }
    return { success: false, cancelled: false };
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    // If native share is available, use it and prevent popover from opening
    if ('share' in navigator) {
      e.preventDefault(); // Prevent popover trigger
      const result = await handleNativeShare();
      if (result.success || result.cancelled) {
        return; // Successfully shared or user cancelled - don't open popover
      }
    }
    // If native share not available or failed, popover will open automatically
    setOpen(true);
  };

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
    setOpen(false);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full flex flex-col relative overflow-hidden h-full"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-secondary" />
        </div>
        <h3 className="text-2xl font-bold text-white">{config.title}</h3>
      </div>

      <p className="text-white/90 mb-6 relative flex-1">
        Invite your friends and family to join you!
      </p>

      <div className="relative mt-auto">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              onClick={handleShareClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white border-2 border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </Popover.Trigger>

          <Popover.Portal container={containerRef.current}>
            <Popover.Content
              className="bg-primary border-2 border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-md z-50"
              sideOffset={8}
              align="center"
            >
              <div className="flex items-center gap-2">
                {config.enabledMethods.includes("sms") && (
                  <button
                    onClick={() => handleShare("sms")}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all"
                    title="Text Message"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}

                {config.enabledMethods.includes("email") && (
                  <button
                    onClick={() => handleShare("email")}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all"
                    title="Email"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                )}

                {config.enabledMethods.includes("copy") && (
                  <button
                    onClick={() => handleShare("copy")}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                    title={copied ? 'Copied!' : 'Copy Link'}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </motion.div>
  );
}
