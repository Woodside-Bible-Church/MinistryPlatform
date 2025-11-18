"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { CardProps, InstructionsCardConfig } from "@/types/confirmationCards";

export function InstructionsCard({ config }: CardProps<InstructionsCardConfig>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-8 w-full flex flex-col relative overflow-hidden h-full"
      style={{ backgroundColor: 'var(--theme-background)' }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}></div>

      <h3 className="text-2xl font-bold mb-8 relative" style={{ color: 'var(--theme-secondary)' }}>
        {config.title}
      </h3>

      <ul className="space-y-6 text-base relative" style={{ color: 'var(--theme-primary)', opacity: 0.9 }}>
        {config.bullets.map((bullet, index) => {
          // Dynamically get the icon component
          const IconComponent =
            LucideIcons[bullet.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

          return (
            <li key={index} className="flex items-center gap-4 group">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              >
                {IconComponent ? (
                  <IconComponent className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                ) : (
                  <span className="text-lg font-bold" style={{ color: 'var(--theme-primary)' }}>{index + 1}</span>
                )}
              </div>
              <span className="leading-relaxed">{bullet.text}</span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
