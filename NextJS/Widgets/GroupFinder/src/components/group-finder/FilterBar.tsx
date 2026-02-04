"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { faSquareCheck, faTag } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import FilterPill from "./FilterPill";
import type { Filter } from "@/types/groupFinder";

const ALL_DAYS = ["Friday", "Monday", "Saturday", "Sunday", "Thursday", "Tuesday", "Wednesday"];

const iconMap: Record<string, IconDefinition> = {
  "fa-square-check": faSquareCheck,
  "fa-tag": faTag,
};

function resolveIcon(iconClass?: string): IconDefinition | undefined {
  if (!iconClass) return undefined;
  const clean = iconClass.replace(/^fa-solid\s+/, "").replace(/^fas\s+/, "");
  return iconMap[clean] || faTag;
}

interface FilterBarProps {
  filters: Filter[];
  loadingPill: string | null;
  onRemoveFilter: (filter: string, id: string | number) => void;
  onOpenPopover: () => void;
}

export default function FilterBar({
  filters,
  loadingPill,
  onRemoveFilter,
  onOpenPopover,
}: FilterBarProps) {
  // Check if all days are selected (hide DaysOfWeek pill)
  const dayFilter = filters.find((f) => f.Filter === "@DaysOfWeek");
  const hideDaysOfWeek = (() => {
    if (!dayFilter || !dayFilter.Selected) return false;
    const selectedDays = String(dayFilter.Selected)
      .split(",")
      .map((s) => s.trim())
      .sort();
    return (
      selectedDays.length === ALL_DAYS.length &&
      selectedDays.every((d, i) => d === ALL_DAYS[i])
    );
  })();

  // Collect all active filter pills
  const pills: {
    filter: string;
    id: string | number;
    label: string;
    prefix?: string;
    icon?: IconDefinition;
  }[] = [];

  for (const filter of filters) {
    const isDaysOfWeek = filter.Filter === "@DaysOfWeek";
    if (isDaysOfWeek && hideDaysOfWeek) continue;

    if (filter.Options && Array.isArray(filter.Options) && filter.Options.length > 0) {
      for (const option of filter.Options) {
        if (option.Selected && option.Text) {
          pills.push({
            filter: filter.Filter,
            id: option.ID ?? option.Text,
            label: option.Text,
            prefix: filter.Use_Prefix ? filter.Label : undefined,
            icon: resolveIcon(option.Icon || filter.Icon),
          });
        }
      }
    } else if (filter.Type === "Checkbox") {
      if (
        filter.Selected === true ||
        filter.Selected === 1 ||
        filter.Selected === "1"
      ) {
        pills.push({
          filter: filter.Filter,
          id: "1",
          label: filter.Label,
          icon: resolveIcon(filter.Icon || "fa-square-check"),
        });
      }
    }
  }

  return (
    <div className="filterContainer">
      <div className="left">
        <ul className="selectedFilters carousel fadeToBlue">
          {pills.map((pill) => (
            <FilterPill
              key={`${pill.filter}-${pill.id}`}
              filter={pill.filter}
              id={pill.id}
              label={pill.label}
              prefix={pill.prefix}
              icon={pill.icon}
              loading={loadingPill === `${pill.filter}-${pill.id}`}
              onRemove={onRemoveFilter}
            />
          ))}
        </ul>
      </div>
      <button
        className="right filterIconContainer"
        onClick={onOpenPopover}
        type="button"
      >
        <FontAwesomeIcon icon={faFilter} />
        <span className="filterLabel">Filter</span>
      </button>
    </div>
  );
}
