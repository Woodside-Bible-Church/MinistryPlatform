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
      className="bg-gradient-to-br from-primary to-primary/90 p-8 w-full flex flex-col relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>

      <h3 className="text-2xl font-bold text-white mb-8 relative">
        {config.title}
      </h3>

      <ul className="space-y-6 text-base text-white/90 relative">
        {config.bullets.map((bullet, index) => {
          // Dynamically get the icon component
          const IconComponent =
            LucideIcons[bullet.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;

          return (
            <li key={index} className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5 group-hover:bg-secondary/30 transition-colors">
                {IconComponent ? (
                  <IconComponent className="w-5 h-5 text-secondary" />
                ) : (
                  <span className="text-secondary text-lg font-bold">{index + 1}</span>
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
