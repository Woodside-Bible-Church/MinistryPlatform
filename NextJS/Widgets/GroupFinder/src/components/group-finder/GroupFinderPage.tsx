"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FilterBar from "./FilterBar";
import FilterPopover from "./FilterPopover";
import GroupList from "./GroupList";
import SkeletonLoader from "./SkeletonLoader";
import { isAuthenticated as checkAuth } from "@/lib/mpWidgetAuthClient";
import { apiFetch } from "@/lib/apiClient";
import type { GroupFinderData } from "@/types/groupFinder";

/** Cookie helpers */
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

function base64UrlDecode(str: string): string | null {
  if (!str) return null;
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  try {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  } catch {
    return null;
  }
}

function safeDecodeLocation(jwt: string | undefined): string | null {
  if (!jwt) return null;
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const decoded = JSON.parse(base64UrlDecode(parts[1]) || "{}");
    return decoded?.location_id || null;
  } catch {
    return null;
  }
}

const ALLOWED_PARAMS = [
  "CongregationID",
  "DaysOfWeek",
  "Cities",
  "Leaders",
  "GroupIDs",
  "Search",
  "LifeStageID",
  "FamilyAccommodationID",
  "IntendedAudienceID",
  "KidsWelcome",
  "GenderID",
];

export default function GroupFinderPage() {
  const [data, setData] = useState<GroupFinderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Map<string, string>>(
    new Map()
  );
  const [formState, setFormState] = useState<Map<string, string>>(new Map());
  const [loadingPill, setLoadingPill] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize params from URL
  const getInitialParams = useCallback((): Map<string, string> => {
    const params = new Map<string, string>();
    if (typeof window === "undefined") return params;

    const urlParams = new URLSearchParams(window.location.search);
    for (const key of ALLOWED_PARAMS) {
      const value = urlParams.get(`@${key}`) || urlParams.get(key);
      if (value && value.trim()) {
        params.set(key, value);
      }
    }

    // Also check data-params on the widget container
    const container = document.getElementById("group-finder-widget-root");
    if (container?.dataset.params) {
      const dataParams = container.dataset.params;
      dataParams.split("&").forEach((p) => {
        const clean = p.replace(/^@+/, "");
        const [k, v] = clean.split("=");
        if (k && v && ALLOWED_PARAMS.includes(k) && !params.has(k)) {
          params.set(k, v);
        }
      });
    }

    // Cookie fallback for CongregationID
    if (!params.has("CongregationID")) {
      const cookieJwt = getCookie("tbx-ws__selected-location");
      const fallback = safeDecodeLocation(cookieJwt);
      if (fallback) {
        params.set("CongregationID", String(fallback));
      }
    }

    return params;
  }, []);

  // Sync params to URL
  function syncParamsToUrl(params: Map<string, string>) {
    const url = new URL(window.location.href);
    // Remove all known params
    ALLOWED_PARAMS.forEach((key) => {
      url.searchParams.delete(`@${key}`);
      url.searchParams.delete(key);
    });
    // Add current params
    for (const [k, v] of params) {
      if (v) url.searchParams.set(`@${k}`, v);
    }
    history.replaceState({}, "", url);
  }

  // Fetch data
  const fetchData = useCallback(
    async (params: Map<string, string>) => {
      setLoading(true);
      try {
        const queryString = Array.from(params.entries())
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&");

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await apiFetch(`/api/groups?${queryString}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          console.error("API error response:", response.status, errorBody);
          throw new Error(`API error: ${response.status}`);
        }
        const result: GroupFinderData = await response.json();
        setData(result);

        // Initialize form state from returned filter selections
        const newFormState = new Map<string, string>();
        for (const filter of result.Filters) {
          const key = filter.Filter.replace(/^@/, "");
          if (filter.Type === "MultiSelect" || filter.Type === "Dropdown") {
            const selectedOpts = filter.Options?.filter((o) => o.Selected);
            if (selectedOpts?.length) {
              newFormState.set(
                key,
                selectedOpts.map((o) => String(o.ID)).join(",")
              );
            }
          } else if (filter.Type === "Checkbox") {
            if (
              filter.Selected === true ||
              filter.Selected === 1 ||
              filter.Selected === "1"
            ) {
              newFormState.set(key, "1");
            }
          } else if (filter.Type === "Text" && filter.Selected) {
            newFormState.set(key, String(filter.Selected));
          }
        }
        setFormState(newFormState);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        setLoading(false);
        setLoadingPill(null);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    setIsAuthed(checkAuth());
    const initial = getInitialParams();
    setSelectedFilters(initial);
    fetchData(initial);
  }, [getInitialParams, fetchData]);

  // Apply filters from popover form
  function handleApplyFilters() {
    const params = new Map(formState);

    // Carry over non-form params (e.g., GroupIDs, CongregationID)
    for (const [k, v] of selectedFilters) {
      if (!params.has(k) && v) {
        // Keep CongregationID and GroupIDs even if not in form
        if (k === "CongregationID" || k === "GroupIDs") {
          params.set(k, v);
        }
      }
    }

    // Remove empty values
    for (const [k, v] of params) {
      if (!v || !v.trim()) params.delete(k);
    }

    setSelectedFilters(params);
    syncParamsToUrl(params);
    setPopoverOpen(false);
    scrollToTop();
    fetchData(params);
  }

  // Clear filters
  function handleClearFilters() {
    const keep = new Map<string, string>();
    // Preserve CongregationID
    if (selectedFilters.has("CongregationID")) {
      keep.set("CongregationID", selectedFilters.get("CongregationID")!);
    } else {
      const cookieJwt = getCookie("tbx-ws__selected-location");
      const fallback = safeDecodeLocation(cookieJwt);
      if (fallback) keep.set("CongregationID", String(fallback));
    }

    setSelectedFilters(keep);
    setFormState(new Map(keep));
    syncParamsToUrl(keep);
    setPopoverOpen(false);
    scrollToTop();
    fetchData(keep);
  }

  // Remove a single filter (from pill or tag)
  function handleRemoveFilter(filter: string, id: string | number) {
    const filterKey = filter.replace(/^@/, "");
    const params = new Map(selectedFilters);

    // Remove the specific value from comma-separated list
    const currentValue = params.get(filterKey) || "";
    const updated = currentValue
      .split(",")
      .map((s) => s.trim())
      .filter((val) => val !== String(id));

    if (updated.length > 0) {
      params.set(filterKey, updated.join(","));
    } else {
      params.delete(filterKey);
    }

    setLoadingPill(`${filter}-${id}`);
    setSelectedFilters(params);
    syncParamsToUrl(params);
    scrollToTop();
    fetchData(params);
  }

  // Handle tag clicks on group cards
  function handleTagClick(
    filter: string,
    id: string | number,
    action: "add" | "remove"
  ) {
    const filterKey = filter.replace(/^@/, "");
    const params = new Map(selectedFilters);

    if (action === "remove") {
      const currentValue = params.get(filterKey) || "";
      const updated = currentValue
        .split(",")
        .map((s) => s.trim())
        .filter((val) => val !== String(id));
      if (updated.length) {
        params.set(filterKey, updated.join(","));
      } else {
        params.delete(filterKey);
      }
    } else {
      params.set(filterKey, String(id));
    }

    setLoadingPill(`${filter}-${id}`);
    setSelectedFilters(params);
    syncParamsToUrl(params);
    scrollToTop();
    fetchData(params);
  }

  function handleFormChange(filter: string, value: string) {
    setFormState((prev) => {
      const next = new Map(prev);
      if (value) {
        next.set(filter, value);
      } else {
        next.delete(filter);
      }
      return next;
    });
  }

  function scrollToTop() {
    const el = containerRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section
      id="groupFinder"
      className="groupFinderContainer"
      ref={containerRef}
    >
      <FilterBar
        filters={data?.Filters || []}
        loadingPill={loadingPill}
        onRemoveFilter={handleRemoveFilter}
        onOpenPopover={() => setPopoverOpen(true)}
      />

      <FilterPopover
        isOpen={popoverOpen}
        filters={data?.Filters || []}
        formState={formState}
        onFormChange={handleFormChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setPopoverOpen(false)}
      />

      {loading ? (
        <SkeletonLoader count={5} />
      ) : data ? (
        <GroupList
          groups={data.Groups || []}
          filters={data.Filters || []}
          settings={data.Settings}
          isAuthenticated={isAuthed || data.userAuthenticated}
          selectedFilters={selectedFilters}
          onTagClick={handleTagClick}
        />
      ) : (
        <div className="groupFinderEmpty">
          <p>Unable to load groups. Please try again later.</p>
        </div>
      )}
    </section>
  );
}
