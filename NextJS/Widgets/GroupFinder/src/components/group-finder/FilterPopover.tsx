"use client";

import { useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUndo, faCheck } from "@fortawesome/free-solid-svg-icons";
import MultiSelect from "./MultiSelect";
import type { Filter } from "@/types/groupFinder";

interface FilterPopoverProps {
  isOpen: boolean;
  filters: Filter[];
  formState: Map<string, string>;
  onFormChange: (filter: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

export default function FilterPopover({
  isOpen,
  filters,
  formState,
  onFormChange,
  onApply,
  onClear,
  onClose,
}: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (
        (e.key === "Enter" || e.key === "NumpadEnter") &&
        isOpen
      ) {
        const tag = (e.target as HTMLElement).tagName?.toLowerCase();
        if (tag === "textarea") return;
        // Don't submit if multiselect dropdown is open
        const ms = (e.target as HTMLElement).closest?.(".search-select");
        const openDropdown = ms?.querySelector(".search-options:not(.hidden)");
        if (openDropdown) return;

        e.preventDefault();
        onApply();
      }
    },
    [isOpen, onClose, onApply]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Focus first field on open
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      const first = popoverRef.current.querySelector<HTMLElement>(
        ".search-input, .filterSelect, .filterSearch, button, input, select"
      );
      if (first) first.focus({ preventScroll: true });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply();
  }

  return (
    <div
      ref={popoverRef}
      className="filterPopover is-open"
      id="filterMenu"
      role="dialog"
      aria-modal="true"
      aria-label="Filter groups"
    >
      <button
        className="popoverClose"
        onClick={onClose}
        aria-label="Close filters"
        title="Close"
        type="button"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>

      <form
        id="filtersForm"
        className="filterFields"
        noValidate
        onSubmit={handleSubmit}
      >
        {filters.map((filter) => {
          if (!filter.Type) return null;
          const filterKey = filter.Filter.replace(/^@/, "");
          const currentValue = formState.get(filterKey) || "";

          return (
            <div
              key={filter.Filter}
              className="filterGroup"
              data-filter={filter.Filter}
              data-type={filter.Type}
            >
              <h6>{filter.Label}</h6>

              {filter.Type === "Text" && (
                <input
                  type="text"
                  className="filterSearch"
                  name={filter.Filter}
                  placeholder="Type to search..."
                  value={currentValue}
                  onChange={(e) => onFormChange(filterKey, e.target.value)}
                />
              )}

              {filter.Type === "Dropdown" && (
                <select
                  className="filterSelect"
                  name={filter.Filter}
                  value={currentValue}
                  onChange={(e) => onFormChange(filterKey, e.target.value)}
                >
                  <option value="">{filter.Placeholder}</option>
                  {(filter.Options || []).map((option) => (
                    <option key={String(option.ID)} value={String(option.ID)}>
                      {option.Text}
                    </option>
                  ))}
                </select>
              )}

              {filter.Type === "MultiSelect" && (
                <MultiSelect
                  name={filter.Filter}
                  label={filter.Label}
                  options={filter.Options}
                  selectedIds={new Set(
                    currentValue
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )}
                  onChange={(ids) =>
                    onFormChange(filterKey, Array.from(ids).join(","))
                  }
                />
              )}

              {filter.Type === "Checkbox" && (
                <>
                  <label className="filterCheckboxLabel">{filter.Label}</label>
                  <input
                    type="checkbox"
                    className="filterCheckbox"
                    checked={currentValue === "1"}
                    onChange={(e) =>
                      onFormChange(filterKey, e.target.checked ? "1" : "")
                    }
                  />
                </>
              )}
            </div>
          );
        })}

        <div className="filterActions">
          <button
            type="button"
            className="btn secondaryBtn clearFilters"
            onClick={onClear}
          >
            <FontAwesomeIcon icon={faUndo} style={{ marginRight: "0.4em" }} />
            Clear Filters
          </button>
          <button type="submit" className="btn applyFilters">
            <FontAwesomeIcon icon={faCheck} style={{ marginRight: "0.4em" }} />
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}
