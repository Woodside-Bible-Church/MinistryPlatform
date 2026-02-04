"use client";

import GroupCard from "./GroupCard";
import type { Group, Filter, GroupFinderSettings } from "@/types/groupFinder";

interface GroupListProps {
  groups: Group[];
  filters: Filter[];
  settings: GroupFinderSettings;
  isAuthenticated: boolean;
  selectedFilters: Map<string, string>;
  onTagClick: (filter: string, id: string | number, action: "add" | "remove") => void;
}

export default function GroupList({
  groups,
  filters,
  settings,
  isAuthenticated,
  selectedFilters,
  onTagClick,
}: GroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="noResultsFound">
        <span>{settings?.No_Groups_Found_Label ?? "No groups found."}</span>
        {settings?.GroupInquiryFormBaseURL && (
          <a className="btn" href={settings.GroupInquiryFormBaseURL}>
            {settings?.joinAGroupFormRedirectButton ?? "Find a Group"}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="groups">
      {groups.map((group) => (
        <GroupCard
          key={group.ID}
          group={group}
          filters={filters}
          settings={settings}
          isAuthenticated={isAuthenticated}
          selectedFilters={selectedFilters}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}
