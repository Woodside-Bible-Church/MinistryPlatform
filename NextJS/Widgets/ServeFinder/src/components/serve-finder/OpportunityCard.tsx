"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faClock,
  faTag,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { Opportunity, ServeFinderSettings } from "@/types/serveFinder";

interface OpportunityCardProps {
  opportunity: Opportunity;
  settings: ServeFinderSettings;
  compact?: boolean;
}

export default function OpportunityCard({
  opportunity,
  settings,
  compact = false,
}: OpportunityCardProps) {
  return (
    <div className={`opportunityCard${compact ? " opportunityCard--compact" : ""}`}>
      {/* Image */}
      <div className="opportunityCardImageWrap">
        <img
          className="opportunityCardImage"
          src={opportunity.Image_URL || "https://picsum.photos/seed/default/800/450"}
          alt={opportunity.Title}
          loading="lazy"
        />
        {opportunity.Volunteers_Needed && (
          <span className="volunteerBadge">
            <FontAwesomeIcon icon={faUsers} />
            {opportunity.Volunteers_Needed} needed
          </span>
        )}
      </div>

      {/* Content */}
      <div className="opportunityCardContent">
        <h4 className="opportunityTitle">{opportunity.Title}</h4>

        <div className="opportunityMeta">
          {!compact && (
            <span className="metaItem">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              {opportunity.Congregation_Name}
            </span>
          )}
          <span className="metaItem">
            <FontAwesomeIcon icon={faClock} />
            {opportunity.Time}
          </span>
          <span className="metaItem">
            <FontAwesomeIcon icon={faTag} />
            {opportunity.Ministry_Name}
          </span>
        </div>

        <p className="opportunityDescription">{opportunity.Description}</p>

        <div className="opportunityAction">
          <a
            className="btn"
            href={opportunity.Sign_Up_URL || `${settings.Details_Base_URL}${opportunity.ID}`}
          >
            {settings.Details_Button_Label ?? "See Details"}
          </a>
        </div>
      </div>
    </div>
  );
}
