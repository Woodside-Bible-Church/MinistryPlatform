// ===================================================================
// Instructions Card Component
// ===================================================================
// Displays "What to Expect" information with icon bullets
// Used in Christmas example for service details
// ===================================================================

'use client';

import { CardComponentProps, InstructionsCardConfig } from '@/types/rsvp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export function InstructionsCard({ card }: CardComponentProps) {
  const config = card.Configuration as InstructionsCardConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {card.Icon_Name && Icons[card.Icon_Name as keyof typeof Icons] && (
            (() => {
              const Icon = Icons[card.Icon_Name as keyof typeof Icons] as LucideIcon;
              return <Icon className="h-5 w-5" />;
            })()
          )}
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {config.bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3">
              {bullet.icon && Icons[bullet.icon as keyof typeof Icons] && (
                (() => {
                  const BulletIcon = Icons[bullet.icon as keyof typeof Icons] as LucideIcon;
                  return (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <BulletIcon className="h-4 w-4 text-primary" />
                    </div>
                  );
                })()
              )}
              <p className="flex-1 text-sm text-muted-foreground">{bullet.text}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
