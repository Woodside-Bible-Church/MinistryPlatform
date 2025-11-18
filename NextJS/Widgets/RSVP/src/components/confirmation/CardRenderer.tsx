import { ParsedConfirmationCard, RSVPConfirmation } from "@/types/rsvp";
import { InstructionsCard } from "../rsvp/cards/InstructionsCard";
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
  card: ParsedConfirmationCard;
  rsvpData: RSVPConfirmation;
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

  // Pass the full card object and confirmation data
  // Each card component expects { card, confirmation }
  return <CardComponent card={card} confirmation={rsvpData} />;
}

interface CardListRendererProps {
  cards: ParsedConfirmationCard[];
  rsvpData: RSVPConfirmation;
}

/**
 * Renders a list of confirmation cards in order
 */
export function CardListRenderer({ cards, rsvpData }: CardListRendererProps) {
  // Sort cards by display order
  const sortedCards = [...cards].sort((a, b) => a.Display_Order - b.Display_Order);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,450px),1fr))] gap-6">
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
