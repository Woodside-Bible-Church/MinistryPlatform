// ===================================================================
// Instructions Card Component
// ===================================================================
// Displays "What to Expect" information with icon bullets
// Used in Christmas example for service details
// ===================================================================

'use client';

import { CardComponentProps, InstructionsCardConfig } from '@/types/rsvp';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export function InstructionsCard({ card }: CardComponentProps) {
  const config = card.Configuration as InstructionsCardConfig;

  return (
    <div
      className="flex flex-col gap-6 p-6 w-full h-full"
      style={{
        backgroundColor: 'var(--theme-background)',
      }}
    >
      {/* Title */}
      <div className="py-2 mb-4">
        <p className="text-2xl font-bold" style={{ color: 'var(--theme-secondary)' }}>
          {config.title}
        </p>
      </div>

      {/* Bullet List */}
      <div className="space-y-6 flex-1">
        {config.bullets.map((bullet, index) => (
          <div key={index} className="flex items-center gap-3">
            {bullet.icon && Icons[bullet.icon as keyof typeof Icons] && (
              (() => {
                const BulletIcon = Icons[bullet.icon as keyof typeof Icons] as LucideIcon;
                return (
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <BulletIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                );
              })()
            )}
            <div>
              <p className="text-sm" style={{ color: 'var(--theme-primary)', opacity: 0.8 }}>
                {bullet.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
