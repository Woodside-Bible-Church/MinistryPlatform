"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCalendar,
  faClock,
  faMapMarkerAlt,
  faBan,
  faPause,
  faTag,
  faTrash,
  faPlus,
  faLink,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { Group, Filter, GroupFinderSettings } from "@/types/groupFinder";

// Map FA class names to icon objects
const iconMap: Record<string, IconDefinition> = {
  "fa-star": faStar,
  "fa-calendar": faCalendar,
  "fa-clock": faClock,
  "fa-map-marker-alt": faMapMarkerAlt,
  "fa-ban": faBan,
  "fa-pause": faPause,
  "fa-tag": faTag,
  "fa-trash": faTrash,
  "fa-plus": faPlus,
  "fa-link": faLink,
  "fa-envelope": faEnvelope,
};

function resolveIcon(iconClass?: string): IconDefinition {
  if (!iconClass) return faTag;
  // Try exact match first, then strip "fa-solid " prefix
  const clean = iconClass.replace(/^fa-solid\s+/, "").replace(/^fas\s+/, "");
  return iconMap[clean] || faTag;
}

interface GroupCardProps {
  group: Group;
  filters: Filter[];
  settings: GroupFinderSettings;
  isAuthenticated: boolean;
  selectedFilters: Map<string, string>;
  onTagClick: (filter: string, id: string | number, action: "add" | "remove") => void;
}

export default function GroupCard({
  group,
  filters,
  settings,
  isAuthenticated,
  selectedFilters,
  onTagClick,
}: GroupCardProps) {
  const hasSignUp = group.User_In_Group || (!group.Paused && !group.Full);

  function isTagSelected(tagFilter: string, tagId: string | number): boolean {
    const currentValue = selectedFilters.get(tagFilter.replace(/^@/, ""));
    if (!currentValue) return false;
    const values = currentValue.split(",").map((s) => s.trim());
    return values.includes(String(tagId));
  }

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?@GroupIDs=${group.ID}`;
    navigator.clipboard.writeText(url);
  }

  function handleEmailShare() {
    const url = `${window.location.origin}${window.location.pathname}?@GroupIDs=${group.ID}`;
    const subject = encodeURIComponent(`Check out this group: ${group.Title}`);
    const body = encodeURIComponent(`I wanted to share this group with you:\n\n${group.Title}\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  return (
    <div className={`groupGrid${group.Paused ? " groupPaused" : ""}`}>
      {/* Share icons */}
      <div className="gf-share-icons">
        <a className="gf-share-btn" onClick={handleShare} title="Copy link" role="button" tabIndex={0}>
          <FontAwesomeIcon icon={faLink} />
          <span className="sr-only">Copy link</span>
        </a>
        <a className="gf-share-btn" onClick={handleEmailShare} title="Share via email" role="button" tabIndex={0}>
          <FontAwesomeIcon icon={faEnvelope} />
          <span className="sr-only">Share via email</span>
        </a>
      </div>

      {/* Title */}
      <h4 className="groupTitle">
        {group.User_Is_Leader && (
          <i className="fas fa-star leaderBadge">
            <FontAwesomeIcon icon={faStar} />
          </i>
        )}
        {" "}{group.Title}
      </h4>

      {/* Meeting Details */}
      <div className="groupDetailsContainer">
        <h6>{settings?.Time_And_Location_Details_Heading ?? "RHYTHM"}</h6>
        <div className="groupDetails">
          <div className="iconContainer">
            <FontAwesomeIcon icon={faCalendar} />
          </div>
          <div>{group.Meeting_Details?.Occurrence ?? ""}</div>

          <div className="iconContainer">
            <FontAwesomeIcon icon={faClock} />
          </div>
          {isAuthenticated ? (
            <div>{group.Meeting_Details?.Time ?? ""}</div>
          ) : (
            <div className="requiresAuth">Log in for more details</div>
          )}

          <div className="iconContainer">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </div>
          <div className="cammelCase">
            {group.Meeting_Details?.City
              ? group.Meeting_Details.City.charAt(0).toUpperCase() +
                group.Meeting_Details.City.slice(1).toLowerCase()
              : ""}
          </div>
        </div>
      </div>

      {/* Leaders */}
      <div className="groupLeadersContainer">
        <h6>{settings?.Leaders_List_Heading ?? "LEADERS"}</h6>
        <div>{(group.Leaders || []).join(", ")}</div>
      </div>

      {/* About */}
      <div className="groupAboutContainer">
        <h6>{settings?.Description_Heading ?? "ABOUT US"}</h6>
        <div>{group.Description ?? ""}</div>
      </div>

      {/* Tags */}
      <div className="groupTagsContainer">
        <ul className="groupTags carousel">
          {group.Full && (
            <li>
              <a className="filterBtn tag specialTag groupFull" aria-disabled="true">
                <FontAwesomeIcon icon={faBan} style={{ marginRight: "0.4em" }} />
                <span>Group Full</span>
              </a>
            </li>
          )}
          {group.Paused && (
            <li>
              <a className="filterBtn tag specialTag groupPaused" aria-disabled="true">
                <FontAwesomeIcon icon={faPause} style={{ marginRight: "0.4em" }} />
                <span>Group Paused</span>
              </a>
            </li>
          )}
          {(group.Tags || []).map((tag, idx) => {
            const selected = isTagSelected(tag.Filter, tag.ID);
            const matchingFilter = filters.find((f) => f.Filter === tag.Filter);
            const icon = resolveIcon(tag.Icon || matchingFilter?.Icon);
            return (
              <li key={`${tag.Filter}-${tag.ID}-${idx}`}>
                <a
                  className="filterBtn tag"
                  onClick={(e) => {
                    e.preventDefault();
                    onTagClick(tag.Filter, tag.ID, selected ? "remove" : "add");
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <FontAwesomeIcon icon={icon} style={{ marginRight: "0.4em" }} />
                  <span>{tag.Text}</span>
                  <span className="blur">
                    <FontAwesomeIcon icon={selected ? faTrash : faPlus} />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sign Up Button */}
      <div className="groupSignUpBtn">
        {group.User_In_Group ? (
          <a className="btn" href={`${settings?.ViewGroupBaseURL ?? "#"}${group.ID}`}>
            {settings?.View_Group_Button_Label ?? "View"}
          </a>
        ) : hasSignUp ? (
          <a className="btn" href={`${settings?.GroupDetailsBaseURL ?? "#"}${group.ID}`}>
            {settings?.Register_Button_Label ?? "Register"}
          </a>
        ) : null}
      </div>
    </div>
  );
}
