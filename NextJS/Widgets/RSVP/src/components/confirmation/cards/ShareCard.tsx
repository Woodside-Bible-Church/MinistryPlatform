"use client";

import { motion } from "framer-motion";
import { Share2, Mail, MessageSquare, Copy, Check } from "lucide-react";
import { CardComponentProps, ShareCardConfig } from "@/types/rsvp";
import { replaceTokens, buildEventShareUrl } from "@/types/confirmationCards";
import { useState, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";

export function ShareCard({ card, confirmation }: CardComponentProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = card.Configuration as ShareCardConfig;

  // Build share URL
  const shareUrl = config.shareUrl || buildEventShareUrl(confirmation.Event_ID);

  // Replace tokens in custom message
  const customMessage = config.customMessage
    ? replaceTokens(config.customMessage, confirmation)
    : `Join me at ${confirmation.Event_Title}!`;

  const handleNativeShare = async () => {
    // Try native share API first (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: confirmation.Event_Title,
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
        window.open(`mailto:?subject=${encodeURIComponent(confirmation.Event_Title)}&body=${encodedMessage} ${encodedUrl}`);
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
      className="p-8 w-full flex flex-col relative overflow-hidden h-full"
      style={{ backgroundColor: 'var(--theme-background)' }}
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Share2 className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
        </div>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-secondary)' }}>{config.title}</h3>
      </div>

      <p className="mb-6 relative flex-1" style={{ color: 'var(--theme-primary)', opacity: 0.9 }}>
        Invite your friends and family to join you!
      </p>

      <div className="relative mt-auto">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              onClick={handleShareClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 font-semibold rounded-lg hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--theme-secondary)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '--tw-ring-color': 'var(--theme-secondary)',
                '--tw-ring-offset-color': 'var(--theme-background)'
              } as React.CSSProperties}
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </Popover.Trigger>

          <Popover.Portal container={containerRef.current}>
            <Popover.Content
              className="border-2 rounded-lg p-3 shadow-xl backdrop-blur-md z-50"
              style={{ backgroundColor: 'var(--theme-background)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
              sideOffset={8}
              align="center"
            >
              <div className="flex items-center gap-2">
                {config.enabledMethods.includes("sms") && (
                  <button
                    onClick={() => handleShare("sms")}
                    className="w-12 h-12 flex items-center justify-center border rounded-full hover:bg-white/20 transition-all"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--theme-secondary)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    title="Text Message"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}

                {config.enabledMethods.includes("email") && (
                  <button
                    onClick={() => handleShare("email")}
                    className="w-12 h-12 flex items-center justify-center border rounded-full hover:bg-white/20 transition-all"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--theme-secondary)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
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
                        ? ''
                        : 'border hover:bg-white/20'
                    }`}
                    style={copied ? { backgroundColor: '#10b981', color: 'white' } : { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--theme-secondary)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
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
