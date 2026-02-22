"use client";

import EventCard from "./EventCard";
import OpportunityCard from "./OpportunityCard";
import type { Opportunity, ServeFinderSettings } from "@/types/serveFinder";

interface ServeGridProps {
  opportunities: Opportunity[];
  settings: ServeFinderSettings;
}

export default function ServeGrid({ opportunities, settings }: ServeGridProps) {
  if (opportunities.length === 0) {
    return (
      <div className="serveFinderEmpty">
        <p>{settings.No_Opportunities_Found_Label}</p>
      </div>
    );
  }

  // Group opportunities by Event_ID
  const eventGroups = new Map<number, { title: string; image: string | null; opportunities: Opportunity[] }>();
  const standalone: Opportunity[] = [];

  for (const opp of opportunities) {
    if (opp.Event_ID && opp.Event_Title) {
      if (!eventGroups.has(opp.Event_ID)) {
        eventGroups.set(opp.Event_ID, {
          title: opp.Event_Title,
          image: opp.Event_Image_URL,
          opportunities: [],
        });
      }
      eventGroups.get(opp.Event_ID)!.opportunities.push(opp);
    } else {
      standalone.push(opp);
    }
  }

  const events = Array.from(eventGroups.entries());

  return (
    <div className="serveGrid">
      {events.map(([eventId, group]) => (
        <EventCard
          key={eventId}
          eventId={eventId}
          title={group.title}
          imageUrl={group.image}
          opportunities={group.opportunities}
          settings={settings}
        />
      ))}
      {standalone.map((opp) => (
        <OpportunityCard
          key={opp.ID}
          opportunity={opp}
          settings={settings}
        />
      ))}
    </div>
  );
}
