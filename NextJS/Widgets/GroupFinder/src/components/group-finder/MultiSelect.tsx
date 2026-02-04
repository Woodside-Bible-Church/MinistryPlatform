"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FilterOption } from "@/types/groupFinder";

interface MultiSelectProps {
  name: string;
  label: string;
  options: FilterOption[];
  selectedIds: Set<string>;
  onChange: (selectedIds: Set<string>) => void;
}

export default function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [flipped, setFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.Text.toLowerCase().includes(searchText.toLowerCase())
  );

  const adjustPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const midpoint = window.innerHeight / 2;
    setFlipped(rect.top > midpoint);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function toggleOption(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  }

  return (
    <div className="search-select" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={`Search for a ${label.toLowerCase()}`}
        autoComplete="off"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onFocus={() => {
          adjustPosition();
          setIsOpen(true);
          setSearchText("");
        }}
      />
      <ul
        ref={dropdownRef}
        className={`search-options${!isOpen ? " hidden" : ""}${flipped ? " flipped" : ""}`}
      >
        {filteredOptions.map((opt) => (
          <li
            key={String(opt.ID)}
            className={`search-option${selectedIds.has(String(opt.ID)) ? " is-selected" : ""}`}
            data-id={opt.ID}
            data-text={opt.Text}
            onClick={() => toggleOption(String(opt.ID))}
          >
            {opt.Text}
          </li>
        ))}
      </ul>
    </div>
  );
}
