"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faTag,
  faClock,
  faHandsHelping,
} from "@fortawesome/free-solid-svg-icons";
import { ResponsiveSheet } from "./ResponsiveSheet";
import OpportunityCard from "./OpportunityCard";
import type { Opportunity, ServeFinderSettings } from "@/types/serveFinder";

interface EventCardProps {
  eventId: number;
  title: string;
  imageUrl: string | null;
  opportunities: Opportunity[];
  settings: ServeFinderSettings;
}

export default function EventCard({
  title,
  imageUrl,
  opportunities,
  settings,
}: EventCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const first = opportunities[0];
  const campus = first?.Congregation_Name ?? "";
  const ministry = first?.Ministry_Name ?? "";
  const time = first?.Time ?? "";
  const totalVolunteers = opportunities.reduce(
    (sum, o) => sum + (o.Volunteers_Needed ?? 0),
    0
  );

  const sheetHeader = (
    <div className="sf-event-sheet-header">
      <img
        className="sf-event-sheet-hero"
        src={imageUrl || "https://picsum.photos/seed/fallback/800/450"}
        alt={title}
      />
      <div className="sf-event-sheet-hero-overlay">
        <h3 className="sf-event-sheet-title">{title}</h3>
        <div className="sf-event-sheet-meta">
          <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {campus}</span>
          {ministry && <span><FontAwesomeIcon icon={faTag} /> {ministry}</span>}
          {time && <span><FontAwesomeIcon icon={faClock} /> {time}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Grid card — same visual as standalone OpportunityCard */}
      <div className="opportunityCard" onClick={() => setSheetOpen(true)} role="button" tabIndex={0}>
        <div className="opportunityCardImageWrap">
          <img
            className="opportunityCardImage"
            src={imageUrl || "https://picsum.photos/seed/fallback/800/450"}
            alt={title}
            loading="lazy"
          />
          {/* Badge showing role count */}
          <span className="volunteerBadge">
            <FontAwesomeIcon icon={faHandsHelping} />
            {opportunities.length} role{opportunities.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="opportunityCardContent">
          <h4 className="opportunityTitle">{title}</h4>
          <div className="opportunityMeta">
            <span className="metaItem">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              {campus}
            </span>
            <span className="metaItem">
              <FontAwesomeIcon icon={faClock} />
              {time}
            </span>
            <span className="metaItem">
              <FontAwesomeIcon icon={faTag} />
              {ministry}
            </span>
          </div>
          <p className="opportunityDescription">
            {totalVolunteers > 0
              ? `${totalVolunteers} volunteers needed across ${opportunities.length} serving roles.`
              : `${opportunities.length} serving roles available.`
            }
          </p>
          <div className="opportunityAction">
            <span className="btn">View Opportunities</span>
          </div>
        </div>
      </div>

      {/* Sheet with all opportunities */}
      <ResponsiveSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        header={sheetHeader}
        panelClassName="sf-event-sheet-panel"
      >
        <div className="sf-event-sheet-body">
          <div className="sf-event-sheet-list">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.ID}
                opportunity={opp}
                settings={settings}
                compact
              />
            ))}
          </div>
        </div>
      </ResponsiveSheet>
    </>
  );
}
