import { ConfirmationCard } from "@/types/confirmationCards";
import { RSVPConfirmationResponse } from "@/types/rsvp";
import { InstructionsCard } from "./cards/InstructionsCard";
import { MapCard } from "./cards/MapCard";
import { QRCodeCard } from "./cards/QRCodeCard";
import { ShareCard } from "./cards/ShareCard";
import { AddToCalendarCard } from "./cards/AddToCalendarCard";

// Map of component names to actual components
const cardComponents = {
  InstructionsCard,
  MapCard,
  QRCodeCard,
  ShareCard,
  AddToCalendarCard,
  // Add more as they're implemented
};

interface CardRendererProps {
  card: ConfirmationCard;
  rsvpData: RSVPConfirmationResponse;
}

/**
 * Dynamically renders a confirmation card based on its component name
 */
export function CardRenderer({ card, rsvpData }: CardRendererProps) {
  const CardComponent =
    cardComponents[card.Component_Name as keyof typeof cardComponents];

  if (!CardComponent) {
    console.warn(`Unknown card component: ${card.Component_Name}`);
    return null;
  }

  return <CardComponent config={card.Configuration} rsvpData={rsvpData} />;
}

interface CardListRendererProps {
  cards: ConfirmationCard[];
  rsvpData: RSVPConfirmationResponse;
}

/**
 * Renders a list of confirmation cards in order
 */
export function CardListRenderer({ cards, rsvpData }: CardListRendererProps) {
  // Sort cards by display order
  const sortedCards = [...cards].sort((a, b) => a.Display_Order - b.Display_Order);

  return (
    <div className="space-y-6">
      {sortedCards.map((card) => (
        <CardRenderer
          key={`${card.Card_Type_ID}-${card.Display_Order}`}
          card={card}
          rsvpData={rsvpData}
        />
      ))}
    </div>
  );
}
