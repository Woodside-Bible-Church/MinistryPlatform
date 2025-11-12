// ===================================================================
// Dynamic Confirmation Card Renderer
// ===================================================================
// Renders confirmation cards dynamically based on Component_Name from database
// Matches Card_Types from seed-lookup-tables.sql
// ===================================================================

'use client';

import { CardComponentProps } from '@/types/rsvp';
import { InstructionsCard } from './InstructionsCard';
import { QRCodeCard } from './QRCodeCard';
import { ShareCard } from './ShareCard';
import { AddToCalendarCard } from './AddToCalendarCard';
import { MapCard } from './MapCard';

/**
 * Dynamic card renderer component
 *
 * Routes to appropriate card component based on Component_Name
 * All card components receive the same props interface
 */
export function DynamicCard(props: CardComponentProps) {
  const { card } = props;

  // Map component names to React components
  const componentMap: Record<string, React.ComponentType<CardComponentProps>> = {
    InstructionsCard,
    QRCodeCard,
    ShareCard,
    AddToCalendarCard,
    MapCard,
    // TODO: Implement remaining card types:
    // ParkingCard,
    // ChildcareCard,
    // ContactInfoCard,
    // ScheduleCard,
    // WeatherCard,
    // WhatToBringCard,
    // GroupAssignmentCard,
  };

  const CardComponent = componentMap[card.Component_Name];

  if (!CardComponent) {
    // Fallback for unimplemented card types
    return (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
        <p className="text-sm text-yellow-600">
          Card type <code className="font-mono">{card.Component_Name}</code> is not yet implemented.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Card: {card.Card_Type_Name}
        </p>
      </div>
    );
  }

  return <CardComponent {...props} />;
}
